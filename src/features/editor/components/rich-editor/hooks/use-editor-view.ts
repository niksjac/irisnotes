import { useEffect, useRef } from 'react';
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

export function useEditorView({
  content,
  onChange,
  readOnly,
  onToggleView,
  schema
}: UseEditorViewOptions) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  // Initialize editor view
  useEffect(() => {
    if (!editorRef.current) return;

    const doc = parseHtmlContent(content, schema);
    const state = createEditorState({ doc, schema, onToggleView: onToggleView || (() => {}) });

    const view = new EditorView(editorRef.current, {
      state,
      editable: () => !readOnly,
      dispatchTransaction: (transaction: Transaction) => {
        const newState = view.state.apply(transaction);
        view.updateState(newState);

        if (transaction.docChanged) {
          const html = serializeToHtml(newState.doc, schema);
          onChange(html);
        }
      },
      attributes: {
        class: 'rich-editor-view',
        spellcheck: 'false'
      },
      handleClickOn: (view, pos, node, nodePos, event) => {
        // Handle link clicks
        const resolvedPos = view.state.doc.resolve(pos);
        const linkMark = resolvedPos.marks().find((mark: any) => mark.type.name === 'link');

        if (linkMark) {
          event.preventDefault();

          // Find the full extent of the link
          let linkStart = pos;
          let linkEnd = pos;

          // Find start of link
          while (linkStart > nodePos) {
            const prevPos = view.state.doc.resolve(linkStart - 1);
            const hasLinkMark = prevPos.marks().find((mark: any) =>
              mark.type.name === 'link' && mark.attrs.href === linkMark.attrs.href
            );
            if (!hasLinkMark) break;
            linkStart--;
          }

          // Find end of link
          while (linkEnd < nodePos + node.nodeSize) {
            const nextPos = view.state.doc.resolve(linkEnd);
            const hasLinkMark = nextPos.marks().find((mark: any) =>
              mark.type.name === 'link' && mark.attrs.href === linkMark.attrs.href
            );
            if (!hasLinkMark) break;
            linkEnd++;
          }

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
  }, [readOnly, onToggleView, schema]);

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