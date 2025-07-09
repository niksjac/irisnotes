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
  const memoizedCreateState = useMemo(() => {
    return (doc: any) => createEditorState({
      doc,
      schema,
      onToggleView: onToggleView || (() => {})
    });
  }, [schema, onToggleView]);

  // Memoize the editor configuration
  const editorConfig = useMemo(() => ({
    editable: () => !readOnly,
    attributes: {
      class: 'rich-editor-view',
      spellcheck: 'false'
    },
    handleClickOn: optimizedLinkClick
  }), [readOnly]);

  // Optimize transaction handling
  const dispatchTransaction = useCallback((transaction: Transaction) => {
    if (!viewRef.current) return;

    const view = viewRef.current;
    const newState = view.state.apply(transaction);
    view.updateState(newState);

    // Only serialize if content actually changed
    if (transaction.docChanged) {
      const html = serializeToHtml(newState.doc, schema);
      // Only call onChange if content is different
      if (html !== contentRef.current) {
        debouncedOnChange(html);
      }
    }
  }, [schema, debouncedOnChange]);

  // Initialize editor view with proper cleanup
  useEffect(() => {
    if (!editorRef.current) return;

    const doc = parseHtmlContent(content, schema);
    const state = memoizedCreateState(doc);

    const view = new EditorView(editorRef.current, {
      state,
      ...editorConfig,
      dispatchTransaction
    });

    viewRef.current = view;

    // Add custom keymap
    const customKeymap = keymap({
      'Mod-Enter': (state: any, dispatch: any) => openLinkAtCursor(state, dispatch, view)
    });

    const newState = view.state.reconfigure({
      plugins: [customKeymap, ...view.state.plugins]
    });

    view.updateState(newState);

    // Focus the editor and position cursor at end
    setTimeout(() => {
      view.focus();
      // Set cursor to end of document
      const endPos = view.state.doc.content.size;
      const tr = view.state.tr.setSelection(TextSelection.near(view.state.doc.resolve(endPos)));
      view.dispatch(tr);
    }, 0);

    // Cleanup function
    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, [memoizedCreateState, editorConfig, dispatchTransaction]);

  // Handle content updates more efficiently
  useEffect(() => {
    if (!viewRef.current) return;

    const view = viewRef.current;
    const doc = parseHtmlContent(content, schema);

    // Check if the new content is different from what's currently in the editor
    const currentHtml = serializeToHtml(view.state.doc, schema);

    // Only update if the content is actually different from what's currently displayed
    // This prevents cursor jumping when the content update comes from user typing
    if (content !== currentHtml && !doc.eq(view.state.doc)) {
      // Create new state with updated document
      const newState = memoizedCreateState(doc);
      view.updateState(newState);
    }
  }, [content, schema, memoizedCreateState]);

  return { editorRef, editorView: viewRef.current };
}