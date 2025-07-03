import { useEffect, useRef, useMemo } from 'react';
import { EditorView } from 'prosemirror-view';
import { EditorState, Transaction } from 'prosemirror-state';
import { Schema } from 'prosemirror-model';
import { keymap } from 'prosemirror-keymap';

import { parseHtmlContent, serializeToHtml } from '../utils/content-parser';
import { createEditorState } from '../utils/editor-state';
import { openLinkAtCursor } from '../plugins/keyboard-plugin';

interface UseEditorViewOptions {
  content: string;
  onChange: (content: string) => void;
  readOnly: boolean;
  onToggleView?: () => void;
  schema: Schema;
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: number | null = null;

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

  // Keep the onChange callback ref up to date
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Create debounced onChange callback
  const debouncedOnChange = useMemo(() => {
    return debounce((content: string) => {
      onChangeRef.current(content);
    }, 150); // 150ms debounce delay
  }, []);

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedOnChange.cancel();
    };
  }, [debouncedOnChange]);

  // Memoize the editor state creation to prevent unnecessary re-initialization
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
    handleClickOn: (view: EditorView, pos: number, _node: any, _nodePos: number, event: Event) => {
      // Handle link clicks
      const resolvedPos = view.state.doc.resolve(pos);
      const linkMark = resolvedPos.marks().find((mark: any) => mark.type.name === 'link');

      if (linkMark) {
        event.preventDefault();

        // Use ProseMirror's mark range utilities for O(1) boundary detection
        const doc = view.state.doc;
        const linkMarkType = view.state.schema.marks.link;

        // Find the exact range of this specific link mark
        let linkStart = pos;
        let linkEnd = pos;

        // Use ProseMirror's efficient mark range detection
        const searchRange = 1000; // Reasonable limit for link length

        // Find start by checking mark ranges
        doc.nodesBetween(
          Math.max(0, pos - searchRange),
          pos + 1,
          (node, nodeStart) => {
            if (node.isText) {
              const marks = node.marks.filter(mark =>
                mark.type === linkMarkType && mark.attrs.href === linkMark.attrs.href
              );
              if (marks.length > 0) {
                // This text node contains our link mark
                linkStart = Math.min(linkStart, nodeStart);

                // Check if this is the start of the link
                if (nodeStart < pos) {
                  linkStart = nodeStart;
                }
              }
            }
            return false; // Don't descend into child nodes
          }
        );

        // Find end by checking mark ranges
        doc.nodesBetween(
          pos,
          Math.min(doc.content.size, pos + searchRange),
          (node, nodeStart) => {
            if (node.isText) {
              const marks = node.marks.filter(mark =>
                mark.type === linkMarkType && mark.attrs.href === linkMark.attrs.href
              );
              if (marks.length > 0) {
                // This text node contains our link mark
                linkEnd = Math.max(linkEnd, nodeStart + node.nodeSize);
              }
            }
            return false; // Don't descend into child nodes
          }
        );

        // Trigger visual effect
        import('../plugins/link-click-plugin').then(({ triggerLinkClickEffect }) => {
          triggerLinkClickEffect(view, linkStart, linkEnd);
        });

        // Open the URL
        import('@tauri-apps/plugin-opener').then(({ openUrl }) => {
          openUrl(linkMark.attrs.href).catch(console.error);
        });

        return true;
      }

      return false;
    }
  }), [readOnly]);

  // Initialize editor view
  useEffect(() => {
    if (!editorRef.current) return;

    const doc = parseHtmlContent(content, schema);
    const state = memoizedCreateState(doc);

    const view = new EditorView(editorRef.current, {
      state,
      ...editorConfig,
      dispatchTransaction: (transaction: Transaction) => {
        const newState = view.state.apply(transaction);
        view.updateState(newState);

        if (transaction.docChanged) {
          const html = serializeToHtml(newState.doc, schema);
          debouncedOnChange(html);
        }
      }
    });

    viewRef.current = view;

    // Add custom keymap with view context for Ctrl+Enter link opening
    const customKeymap = keymap({
      'Mod-Enter': (state: any, dispatch: any) => openLinkAtCursor(state, dispatch, view)
    });

    // Update the view with the custom keymap
    const newState = view.state.reconfigure({
      plugins: [customKeymap, ...view.state.plugins]
    });
    view.updateState(newState);

    setTimeout(() => view.focus(), 0);

    return () => {
      view.destroy();
    };
  }, [memoizedCreateState, editorConfig, schema, debouncedOnChange]);

  // Update content when it changes externally
  useEffect(() => {
    if (!viewRef.current) return;

    const currentContent = serializeToHtml(viewRef.current.state.doc, schema);
    if (currentContent !== content && content !== undefined) {
      const doc = parseHtmlContent(content, schema);
      const newState = EditorState.create({
        doc,
        plugins: viewRef.current.state.plugins,
        selection: viewRef.current.state.selection
      });

      viewRef.current.updateState(newState);
    }
  }, [content, schema]);

  return {
    editorRef,
    viewRef
  };
}