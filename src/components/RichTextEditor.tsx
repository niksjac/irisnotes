import { useEffect, useRef, useState } from 'react';
import { EditorState, Transaction, Plugin } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema, DOMParser, DOMSerializer, MarkSpec } from 'prosemirror-model';
import { schema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { keymap } from 'prosemirror-keymap';
import { history, undo, redo } from 'prosemirror-history';
import { baseKeymap, toggleMark, setBlockType, wrapIn, splitBlock } from 'prosemirror-commands';
import { wrapInList, splitListItem, liftListItem, sinkListItem } from 'prosemirror-schema-list';
import { dropCursor } from 'prosemirror-dropcursor';
import { gapCursor } from 'prosemirror-gapcursor';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { openUrl } from '@tauri-apps/plugin-opener';

// Define color mark
const colorMark: MarkSpec = {
  attrs: {
    color: { default: null }
  },
  parseDOM: [
    {
      tag: 'span[style*="color"]',
      getAttrs: (node: any) => {
        const style = node.getAttribute('style');
        const match = style.match(/color:\s*([^;]+)/);
        return match ? { color: match[1].trim() } : false;
      }
    }
  ],
  toDOM: (mark) => [
    'span',
    { style: `color: ${mark.attrs.color}` },
    0
  ]
};

// Create extended schema with lists and color
const mySchema = new Schema({
  nodes: addListNodes(schema.spec.nodes, 'paragraph block*', 'block'),
  marks: schema.spec.marks.addToEnd('color', colorMark)
});

// Helper function to toggle color mark
const toggleColor = (color: string) => (state: any, dispatch: any) => {
  const { from, to } = state.selection;

  if (dispatch) {
    // Check if the selection already has this exact color
    const hasColor = state.doc.rangeHasMark(from, to, mySchema.marks.color);
    const existingMark = hasColor && state.doc.resolve(from).marks().find((m: any) => m.type === mySchema.marks.color);

    if (existingMark && existingMark.attrs.color === color) {
      // Remove the color if it's the same dispatch(state.tr.removeMark(from, to, mySchema.marks.color));
    } else {
      // Remove any existing color marks first, then add the new one
      const tr = state.tr.removeMark(from, to, mySchema.marks.color);
      const mark = mySchema.marks.color.create({ color });
      dispatch(tr.addMark(from, to, mark));
    }
  }
  return true;
};

// Helper function to clear all color marks
const clearColor = (state: any, dispatch: any) => {
  const { from, to } = state.selection;
  if (dispatch) {
    dispatch(state.tr.removeMark(from, to, mySchema.marks.color));
  }
  return true;
};

// Move block up
const moveLineUp = (state: any, dispatch: any) => {
  const { selection, tr } = state;
  const { $from } = selection;
  const depth = $from.depth;
  const parent = $from.node(depth - 1);
  const index = $from.index(depth - 1);

  if (index === 0) return false; // Already at top

  const blockPos = $from.before(depth);
  const prevBlock = parent.child(index - 1);
  const currBlock = parent.child(index);

  if (!prevBlock || !currBlock) return false;

  const prevBlockStart = blockPos - prevBlock.nodeSize;
  const currBlockStart = blockPos;
  const currBlockEnd = currBlockStart + currBlock.nodeSize;

  if (dispatch) {
    let t = tr
      .delete(prevBlockStart, currBlockStart)
      .insert(currBlockEnd - prevBlock.nodeSize, prevBlock.copy(prevBlock.content));
    dispatch(t.scrollIntoView());
  }
  return true;
};

// Move block down
const moveLineDown = (state: any, dispatch: any) => {
  const { selection, tr } = state;
  const { $from } = selection;
  const depth = $from.depth;
  const parent = $from.node(depth - 1);
  const index = $from.index(depth - 1);

  if (index >= parent.childCount - 1) return false; // Already at bottom

  const blockPos = $from.before(depth);
  const currBlock = parent.child(index);
  const nextBlock = parent.child(index + 1);

  if (!currBlock || !nextBlock) return false;

  const currBlockStart = blockPos;
  const currBlockEnd = currBlockStart + currBlock.nodeSize;
  const nextBlockEnd = currBlockEnd + nextBlock.nodeSize;

  if (dispatch) {
    let t = tr
      .delete(currBlockEnd, nextBlockEnd)
      .insert(currBlockStart, nextBlock.copy(nextBlock.content));
    dispatch(t.scrollIntoView());
  }
  return true;
};

// Current line highlight plugin
const currentLineHighlightPlugin = new Plugin({
  state: {
    init() {
      return DecorationSet.empty;
    },
    apply(tr, decorationSet) {
      // Update decorations on selection change
      if (tr.selectionSet || tr.docChanged) {
        const { selection } = tr;
        const { $from } = selection;

        // Find the current block position
        let blockStart = $from.start($from.depth);
        let blockEnd = $from.end($from.depth);

        // For block-level nodes, use their full range
        if ($from.parent.isBlock) {
          blockStart = $from.before($from.depth);
          blockEnd = $from.after($from.depth);
        }

        // Create decoration for the current block
        const decoration = Decoration.node(blockStart, blockEnd, {
          class: 'iris-current-line-highlight'
        });

        return DecorationSet.create(tr.doc, [decoration]);
      }

      // Map existing decorations through the transaction
      return decorationSet.map(tr.mapping, tr.doc);
    }
  },
  props: {
    decorations(state) {
      return this.getState(state);
    }
  }
});

// Open hyperlink at cursor position
const openLinkAtCursor = (state: any, _dispatch: any) => {
  const { selection } = state;
  const { $from } = selection;

  // Check if cursor is inside a link mark
  const linkMark = $from.marks().find((mark: any) => mark.type.name === 'link');

  if (linkMark && linkMark.attrs.href) {
    // Open the URL in system browser
    openUrl(linkMark.attrs.href).catch(console.error);
    return true;
  }

  return false;
};

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  readOnly = false
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [lineWrapping, setLineWrapping] = useState(false); // default: no wrapping

  // Toggle line wrapping handler
  const toggleLineWrapping = () => setLineWrapping(w => !w);

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

    // Enhanced Enter key handler for natural behavior
    const handleEnter = (state: any, dispatch: any) => {
      const { selection, schema } = state;
      const { $from } = selection;

      // If we're in a list item, use list-specific behavior
      if ($from.parent.type === schema.nodes.list_item) {
        return splitListItem(schema.nodes.list_item)(state, dispatch);
      }

      // For regular content, create new paragraph (natural behavior)
      return splitBlock(state, dispatch);
    };

    // Create comprehensive keymap with natural Enter behavior
    const myKeymap = keymap({
      ...baseKeymap,

      // Natural Enter behavior
      'Enter': handleEnter,

      // Shift+Enter for line breaks (like Word/OneNote)
      'Shift-Enter': (state, dispatch) => {
        if (dispatch) {
          dispatch(state.tr.replaceSelectionWith(mySchema.nodes.hard_break.create()).scrollIntoView());
        }
        return true;
      },

      // Formatting shortcuts
      'Mod-b': toggleMark(mySchema.marks.strong),
      'Mod-i': toggleMark(mySchema.marks.em),
      'Mod-`': toggleMark(mySchema.marks.code),

      // Color shortcuts
      'Mod-Shift-r': toggleColor('#e74c3c'), // Red
      'Mod-Shift-g': toggleColor('#27ae60'), // Green
      'Mod-Shift-l': toggleColor('#3498db'), // Blue (changed from 'b' to avoid conflict with bold)
      'Mod-Shift-y': toggleColor('#f39c12'), // Yellow/Orange
      'Mod-Shift-p': toggleColor('#9b59b6'), // Purple
      'Mod-Shift-c': clearColor, // Clear color (remove color mark)

      // Heading shortcuts
      'Mod-Shift-1': setBlockType(mySchema.nodes.heading, { level: 1 }),
      'Mod-Shift-2': setBlockType(mySchema.nodes.heading, { level: 2 }),
      'Mod-Shift-3': setBlockType(mySchema.nodes.heading, { level: 3 }),
      'Mod-Shift-4': setBlockType(mySchema.nodes.heading, { level: 4 }),
      'Mod-Shift-5': setBlockType(mySchema.nodes.heading, { level: 5 }),
      'Mod-Shift-6': setBlockType(mySchema.nodes.heading, { level: 6 }),
      'Mod-Shift-0': setBlockType(mySchema.nodes.paragraph),

      // List shortcuts
      'Mod-Shift-8': wrapInList(mySchema.nodes.bullet_list),
      'Mod-Shift-9': wrapInList(mySchema.nodes.ordered_list),
      'Mod-[': liftListItem(mySchema.nodes.list_item),
      'Mod-]': sinkListItem(mySchema.nodes.list_item),

      // Blockquote
      'Mod-Shift-.': wrapIn(mySchema.nodes.blockquote),

      // History
      'Mod-z': undo,
      'Mod-y': redo,
      'Mod-Shift-z': redo,

      // Move line/block up
      'Shift-Alt-ArrowUp': moveLineUp,
      'Shift-Alt-ArrowDown': moveLineDown,
      'Alt-Shift-ArrowUp': moveLineUp,
      'Alt-Shift-ArrowDown': moveLineDown,
      'Alt-ArrowUp': moveLineUp,
      'Alt-ArrowDown': moveLineDown,

      // Open hyperlink at cursor
      'Mod-Enter': openLinkAtCursor
    });

    // Create editor state
    const state = EditorState.create({
      doc,
      plugins: [
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

    // Add Alt+Z hotkey for toggling line wrapping
    const altZHandler = (event: KeyboardEvent) => {
      if (event.altKey && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        toggleLineWrapping();
      }
    };
    window.addEventListener('keydown', altZHandler);

    return () => {
      view.destroy();
      window.removeEventListener('keydown', altZHandler);
    };
  }, [readOnly]);

  // Update content when it changes externally (but avoid infinite loops)
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