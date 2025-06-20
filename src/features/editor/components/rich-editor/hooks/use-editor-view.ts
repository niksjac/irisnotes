import { useEffect, useRef } from 'react';
import { EditorView } from 'prosemirror-view';
import { EditorState, Transaction } from 'prosemirror-state';
import { Schema } from 'prosemirror-model';

import { parseHtmlContent, serializeToHtml } from '../utils/content-parser';
import { createEditorState } from '../utils/editor-state';

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
    const state = createEditorState({ doc, schema, onToggleView });

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
      }
    });

    viewRef.current = view;
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