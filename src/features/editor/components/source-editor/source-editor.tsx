import { useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { EditorView, keymap, highlightActiveLineGutter, lineNumbers } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { html } from '@codemirror/lang-html';
import { oneDark } from '@codemirror/theme-one-dark';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { foldGutter, foldKeymap, indentOnInput, bracketMatching } from '@codemirror/language';
import { highlightActiveLine } from '@codemirror/view';

import { formatHtml } from './formatters/html-formatter';
import './source-editor.css';

interface SourceEditorProps {
  content: string;
  onChange: (content: string) => void;
  readOnly?: boolean;
  onToggleView?: () => void;
}

export interface SourceEditorRef {
  focusAndPositionAtEnd: () => void;
}

export const SourceEditor = forwardRef<SourceEditorRef, SourceEditorProps>(({
  content,
  onChange,
  readOnly = false,
  onToggleView
}, ref) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  // Method to focus editor and position cursor at end
  const focusAndPositionAtEnd = useCallback(() => {
    if (viewRef.current) {
      const view = viewRef.current;
      const doc = view.state.doc;
      const endPos = doc.length;

      view.dispatch({
        selection: { anchor: endPos, head: endPos }
      });
      view.focus();
    }
  }, []);

  useImperativeHandle(ref, () => ({
    focusAndPositionAtEnd
  }), [focusAndPositionAtEnd]);

  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: formatHtml(content || ''),
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        foldGutter(),
        history(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        keymap.of([
          {
            key: 'Mod-Shift-s',
            run: () => {
              if (onToggleView) {
                onToggleView();
                return true;
              }
              return false;
            }
          },
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
        ]),
        html(),
        oneDark,
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !readOnly) {
            onChange(update.state.doc.toString());
          }
        }),
        EditorState.readOnly.of(readOnly)
      ]
    });

    const view = new EditorView({
      state,
      parent: editorRef.current
    });

        viewRef.current = view;

    // Store view reference on DOM element for external access
    setTimeout(() => {
      if (editorRef.current) {
        const cmEditor = editorRef.current.querySelector('.cm-editor') as any;
        if (cmEditor) {
          cmEditor.cmView = view;
        }
      }
    }, 0);

    // Only focus on empty content, don't position cursor automatically
    if (!content || content.trim() === '') {
      setTimeout(() => {
        view.focus();
      }, 0);
    }

    return () => {
      view.destroy();
    };
  }, [readOnly]); // Removed onToggleView from dependencies

  // Update content when it changes externally
  useEffect(() => {
    if (!viewRef.current) return;

    const currentContent = viewRef.current.state.doc.toString();
    const formattedContent = formatHtml(content || '');

    if (currentContent !== formattedContent && content !== undefined) {
      // Store current selection to preserve cursor position
      const currentSelection = viewRef.current.state.selection;

      const transaction = viewRef.current.state.update({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: formattedContent
        },
        // Preserve selection position if possible
        selection: {
          anchor: Math.min(currentSelection.main.anchor, formattedContent.length),
          head: Math.min(currentSelection.main.head, formattedContent.length)
        }
      });

      viewRef.current.dispatch(transaction);
    }
  }, [content]);

  return (
    <div className="source-editor">
      <div
        ref={editorRef}
        className="source-editor-container"
        // style={{ height: '100%', minHeight: '100%' }}
      />
    </div>
  );
});