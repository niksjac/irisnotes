import { useEffect, useRef, useState } from 'react';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema, DOMParser, DOMSerializer } from 'prosemirror-model';
import { schema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { keymap } from 'prosemirror-keymap';
import { history } from 'prosemirror-history';
import { baseKeymap } from 'prosemirror-commands';
import { dropCursor } from 'prosemirror-dropcursor';
import { gapCursor } from 'prosemirror-gapcursor';
import { inputRules, InputRule } from 'prosemirror-inputrules';

import { colorMark, colorKeymap } from './plugins/color-plugin';
import { createBaseKeymap } from './plugins/keyboard-plugin';
import { currentLineHighlightPlugin } from './plugins/line-highlight-plugin';
import './rich-editor.css';

// Create extended schema with lists and color
const mySchema = new Schema({
  nodes: addListNodes(schema.spec.nodes, 'paragraph block*', 'block'),
  marks: schema.spec.marks.addToEnd('color', colorMark)
});

// URL input rule
const urlInputRule = new InputRule(
  /(?:^|\s)((?:https?:\/\/|www\.)[^\s]+)(\s|\n|$)/,
  (state, match, start, end) => {
    const url = match[1];
    const href = url.startsWith('www.') ? `https://${url}` : url;
    const linkMark = mySchema.marks.link.create({ href });
    const textNode = mySchema.text(url, [linkMark]);
    const tr = state.tr.replaceWith(start + match[0].indexOf(url), end - (match[2] ? 1 : 0), textNode);
    return tr;
  }
);

interface RichEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  onToggleView?: () => void;
}

export function RichEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  readOnly = false,
  onToggleView
}: RichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [lineWrapping, setLineWrapping] = useState(false);

  useEffect(() => {
    if (!editorRef.current) return;

    // Parse initial content or create empty document
    let doc;
    if (content && content.trim()) {
      try {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        doc = DOMParser.fromSchema(mySchema).parse(tempDiv);
      } catch (error) {
        console.warn('Failed to parse content, using empty document:', error);
        doc = mySchema.nodes.doc.create(mySchema.nodes.paragraph.create());
      }
    } else {
      doc = mySchema.nodes.doc.create(mySchema.nodes.paragraph.create());
    }

    // Create keymap with plugins
    const myKeymap = keymap({
      ...baseKeymap,
      ...createBaseKeymap(mySchema, colorKeymap(mySchema), onToggleView || (() => {}))
    });

    // Create editor state
    const state = EditorState.create({
      doc,
      plugins: [
        inputRules({ rules: [urlInputRule] }),
        myKeymap,
        history({ newGroupDelay: 20 }),
        dropCursor(),
        gapCursor(),
        currentLineHighlightPlugin
      ]
    });

    // Create editor view
    const view = new EditorView(editorRef.current, {
      state,
      editable: () => !readOnly,
      dispatchTransaction: (transaction: Transaction) => {
        const newState = view.state.apply(transaction);
        view.updateState(newState);

        // Convert to HTML and call onChange
        if (transaction.docChanged) {
          try {
            const serializer = DOMSerializer.fromSchema(mySchema);
            const fragment = serializer.serializeFragment(newState.doc.content);
            const div = document.createElement('div');
            div.appendChild(fragment);
            onChange(div.innerHTML);
          } catch (error) {
            console.warn('Failed to serialize content:', error);
          }
        }
      },
      attributes: {
        class: 'iris-editor-content',
        spellcheck: 'true'
      }
    });

    viewRef.current = view;

    // Focus the editor after creation
    setTimeout(() => view.focus(), 0);

    // Add Alt+Z hotkey for toggling line wrapping
    const altZHandler = (event: KeyboardEvent) => {
      if (event.altKey && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        setLineWrapping(w => !w);
      }
    };
    window.addEventListener('keydown', altZHandler);

    return () => {
      view.destroy();
      window.removeEventListener('keydown', altZHandler);
    };
  }, [readOnly, onToggleView]);

  // Update content when it changes externally
  useEffect(() => {
    if (!viewRef.current) return;

    const currentContent = getCurrentContent();
    if (currentContent !== content && content !== undefined) {
      try {
        let doc;
        if (content && content.trim()) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = content;
          doc = DOMParser.fromSchema(mySchema).parse(tempDiv);
        } else {
          doc = mySchema.nodes.doc.create(mySchema.nodes.paragraph.create());
        }

        const newState = EditorState.create({
          doc,
          plugins: viewRef.current.state.plugins,
          selection: viewRef.current.state.selection
        });

        viewRef.current.updateState(newState);
      } catch (error) {
        console.warn('Failed to update editor content:', error);
      }
    }
  }, [content]);

  const getCurrentContent = (): string => {
    if (!viewRef.current) return '';
    try {
      const serializer = DOMSerializer.fromSchema(mySchema);
      const fragment = serializer.serializeFragment(viewRef.current.state.doc.content);
      const div = document.createElement('div');
      div.appendChild(fragment);
      return div.innerHTML;
    } catch {
      return '';
    }
  };

  return (
    <div className="iris-editor">
      <div
        ref={editorRef}
        className="iris-editor-container"
        data-placeholder={placeholder}
        style={{
          minHeight: '100%',
          whiteSpace: lineWrapping ? 'pre-wrap' : 'pre',
          overflowX: lineWrapping ? 'auto' : 'scroll'
        }}
      />
    </div>
  );
}