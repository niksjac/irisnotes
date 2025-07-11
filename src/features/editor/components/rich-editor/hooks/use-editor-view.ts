import { useEffect, useRef, useMemo, useCallback } from 'react';
import { EditorView } from 'prosemirror-view';
import { Transaction, TextSelection } from 'prosemirror-state';
import { Schema, Node } from 'prosemirror-model';
import { keymap } from 'prosemirror-keymap';

import { parseHtmlContent, serializeToHtml } from '../utils/content-parser';
import { createEditorState } from '../utils/editor-state';
import { openLinkAtCursor } from '../plugins/keyboard-plugin';
import { triggerLinkClickEffect } from '../plugins/link-click-plugin';
import { openUrl } from '@tauri-apps/plugin-opener';

interface UseEditorViewOptions {
  content: string;
  onChange: (content: string) => void;
  readOnly: boolean;
  onToggleView?: () => void;
  schema: Schema;
}

// Debounce utility function with better typing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debouncedFunc = ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  }) as T & { cancel: () => void };

  debouncedFunc.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debouncedFunc;
}

// Optimize link click handling with correct signature
const optimizedLinkClick = (
  view: EditorView,
  pos: number,
  _node: Node,
  _nodePos: number,
  event: MouseEvent,
  _direct: boolean
): boolean => {
  const resolvedPos = view.state.doc.resolve(pos);
  const linkMark = resolvedPos.marks().find((mark: any) => mark.type.name === 'link');

  if (linkMark) {
    event.preventDefault();

    // More efficient link range detection
    const $pos = resolvedPos;
    const linkMarkType = view.state.schema.marks.link;
    const href = linkMark.attrs.href;

    // Use ProseMirror's built-in range detection
    let linkStart = pos;
    let linkEnd = pos;

    // Find link boundaries more efficiently
    const parent = $pos.parent;
    const index = $pos.index();

    // Search backwards for link start
    for (let i = index; i >= 0; i--) {
      const textNode = parent.child(i);
      if (textNode.isText && textNode.marks.some(mark =>
        mark.type === linkMarkType && mark.attrs.href === href
      )) {
        linkStart = $pos.start() + parent.child(i).nodeSize;
      } else {
        break;
      }
    }

    // Search forwards for link end
    for (let i = index; i < parent.childCount; i++) {
      const textNode = parent.child(i);
      if (textNode.isText && textNode.marks.some(mark =>
        mark.type === linkMarkType && mark.attrs.href === href
      )) {
        linkEnd = $pos.start() + parent.child(i).nodeSize;
      } else {
        break;
      }
    }

    // Use static imports for better performance
    triggerLinkClickEffect(view, linkStart, linkEnd);
    openUrl(href).catch(console.error);

    return true;
  }
  return false;
};

export function useEditorView({
  content,
  onChange,
  readOnly,
  onToggleView,
  schema
}: UseEditorViewOptions) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const contentRef = useRef(content);
  const isInternalChangeRef = useRef(false);

  // Keep refs up to date without triggering re-renders
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // Optimize debounced onChange - reduce delay for better UX
  const debouncedOnChange = useMemo(() => {
    return debounce((content: string) => {
      onChangeRef.current(content);
    }, 100); // Reduced from 150ms to 100ms
  }, []);

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedOnChange.cancel();
    };
  }, [debouncedOnChange]);

  // Memoize the editor state creation
  const memoizedCreateState = useCallback((doc: any) => {
    return createEditorState({
      doc,
      schema,
      onToggleView: onToggleView || (() => {})
    });
  }, [schema]); // Removed onToggleView dependency to prevent re-renders

  // Memoize the editor configuration
  const editorConfig = useMemo(() => ({
    editable: () => !readOnly,
    attributes: {
      class: 'rich-editor-view',
      spellcheck: 'false'
    },
    handleClickOn: optimizedLinkClick
  }), [readOnly]);



  // Initialize editor view with proper cleanup
  useEffect(() => {
    if (!editorRef.current) return;

    const doc = parseHtmlContent(content, schema);
    const state = memoizedCreateState(doc);

    // Create dispatchTransaction locally to avoid dependency issues
    const localDispatchTransaction = (transaction: Transaction) => {
      if (!viewRef.current) return;

      const view = viewRef.current;
      const newState = view.state.apply(transaction);
      view.updateState(newState);

      // Only serialize if content actually changed
      if (transaction.docChanged) {
        const html = serializeToHtml(newState.doc, schema);
        // Only call onChange if content is different
        if (html !== contentRef.current) {
          // Mark that this change is coming from internal editor activity
          isInternalChangeRef.current = true;
          debouncedOnChange(html);
        }
      }
    };

    const view = new EditorView(editorRef.current, {
      state,
      ...editorConfig,
      dispatchTransaction: localDispatchTransaction
    });

        viewRef.current = view;

    // Store view reference on DOM element for external access
    setTimeout(() => {
      if (editorRef.current) {
        const proseMirrorEl = editorRef.current.querySelector('.ProseMirror') as any;
        if (proseMirrorEl) {
          proseMirrorEl.pmView = view;
        }
      }
    }, 0);

    // Add custom keymap
    const customKeymap = keymap({
      'Mod-Enter': (state: any, dispatch: any) => openLinkAtCursor(state, dispatch, view)
    });

    const newState = view.state.reconfigure({
      plugins: [customKeymap, ...view.state.plugins]
    });

    view.updateState(newState);

    // Only focus and position cursor on first initialization, not on re-renders
    if (content === '' || !content) {
      setTimeout(() => {
        view.focus();
      }, 0);
    }

    // Cleanup function
    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, [schema]); // Only schema dependency - others are stable

  // Handle content updates more efficiently
  useEffect(() => {
    if (!viewRef.current) return;

    // Skip update if this content change originated from internal editor activity
    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false;
      return;
    }

    const view = viewRef.current;
    const doc = parseHtmlContent(content, schema);

    // Check if the new content is different from what's currently in the editor
    const currentHtml = serializeToHtml(view.state.doc, schema);

    // Only update if the content is actually different from what's currently displayed
    // This prevents cursor jumping when the content update comes from user typing
    if (content !== currentHtml && !doc.eq(view.state.doc)) {
      // Store current selection to preserve cursor position
      const currentSelection = view.state.selection;

      // Instead of recreating the entire state, just update the document using a transaction
      // This preserves all plugins, history, and other state while updating content
      try {
        const tr = view.state.tr.replaceWith(0, view.state.doc.content.size, doc.content);

        // Preserve cursor position if possible
        const maxPos = tr.doc.content.size;
        const preservedPos = Math.min(currentSelection.from, maxPos);
        const newSelection = TextSelection.near(tr.doc.resolve(preservedPos));

        tr.setSelection(newSelection);
        view.dispatch(tr);
      } catch (error) {
        // Fallback: only if transaction approach fails, recreate state
        console.warn('Failed to update content via transaction, falling back to state recreation:', error);
        const newState = memoizedCreateState(doc);

        try {
          const maxPos = newState.doc.content.size;
          const preservedPos = Math.min(currentSelection.from, maxPos);
          const newSelection = TextSelection.near(newState.doc.resolve(preservedPos));

          const stateWithSelection = newState.apply(
            newState.tr.setSelection(newSelection)
          );

          view.updateState(stateWithSelection);
        } catch (fallbackError) {
          view.updateState(newState);
        }
      }
    }
  }, [content, schema]); // Removed memoizedCreateState dependency

  // Method to focus editor and position cursor at end
  const focusAndPositionAtEnd = useCallback(() => {
    if (viewRef.current) {
      const view = viewRef.current;
      view.focus();

      // Position cursor at the end of the document
      const doc = view.state.doc;
      const endPos = doc.content.size;
      try {
        const selection = TextSelection.near(doc.resolve(endPos));
        const tr = view.state.tr.setSelection(selection);
        view.dispatch(tr);
      } catch (error) {
        console.warn('Failed to position cursor at end:', error);
        // Fallback: just focus without positioning
      }
    }
  }, []);

  return { editorRef, editorView: viewRef.current, focusAndPositionAtEnd };
}