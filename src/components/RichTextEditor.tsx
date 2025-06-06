import { useEffect, useRef } from 'react';
import { EditorState, Transaction } from 'prosemirror-state';
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
      // Remove the color if it's the same
      dispatch(state.tr.removeMark(from, to, mySchema.marks.color));
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

// Move cursor up by one visual line using coordinate-based positioning
const moveSelectionUpVisualLine = (state: any, dispatch: any, view?: EditorView) => {
  const { selection } = state;

  console.log('moveSelectionUpVisualLine called', { view: !!view, selection });

  // If view is available, try coordinate-based positioning
  if (view) {
    try {
      // Get current cursor coordinates
      const coords = view.coordsAtPos(selection.from);
      const lineHeight = 20; // Approximate line height in pixels
      const targetY = coords.top - lineHeight;

      // Find position at target coordinates
      const pos = view.posAtCoords({ left: coords.left, top: targetY });

      if (pos && pos.pos >= 0 && pos.pos !== selection.from) {
        if (dispatch) {
          const tr = state.tr;
          tr.setSelection(state.selection.constructor.near(state.doc.resolve(pos.pos)));
          dispatch(tr);
        }
        return true;
      }
    } catch (error) {
      console.log('Coordinate-based movement failed:', error);
    }
  }

  // Fallback: move to beginning of previous block
  const { from } = selection;
  const $from = state.doc.resolve(from);

  // Find start of current block
  const blockStart = $from.start($from.depth);

  if (blockStart > 0) {
    // Move to previous block
    const prevPos = Math.max(0, blockStart - 1);
    const $prev = state.doc.resolve(prevPos);
    const prevBlockStart = $prev.start($prev.depth);

    if (dispatch) {
      const tr = state.tr;
      tr.setSelection(state.selection.constructor.near(state.doc.resolve(prevBlockStart)));
      dispatch(tr);
    }
    return true;
  }

  return false;
};

// Move cursor down by one visual line using coordinate-based positioning
const moveSelectionDownVisualLine = (state: any, dispatch: any, view?: EditorView) => {
  const { selection } = state;

  console.log('moveSelectionDownVisualLine called', { view: !!view, selection });

  // If view is available, try coordinate-based positioning
  if (view) {
    try {
      // Get current cursor coordinates
      const coords = view.coordsAtPos(selection.from);
      const lineHeight = 20; // Approximate line height in pixels
      const targetY = coords.top + lineHeight;

      // Find position at target coordinates
      const pos = view.posAtCoords({ left: coords.left, top: targetY });

      if (pos && pos.pos <= state.doc.content.size && pos.pos !== selection.from) {
        if (dispatch) {
          const tr = state.tr;
          tr.setSelection(state.selection.constructor.near(state.doc.resolve(pos.pos)));
          dispatch(tr);
        }
        return true;
      }
    } catch (error) {
      console.log('Coordinate-based movement failed:', error);
    }
  }

  // Fallback: move to beginning of next block
  const { from } = selection;
  const $from = state.doc.resolve(from);

  // Find end of current block
  const blockEnd = $from.end($from.depth);

  if (blockEnd < state.doc.content.size) {
    // Move to next block
    const nextPos = Math.min(state.doc.content.size, blockEnd + 1);
    const $next = state.doc.resolve(nextPos);
    const nextBlockStart = $next.start($next.depth);

    if (dispatch) {
      const tr = state.tr;
      tr.setSelection(state.selection.constructor.near(state.doc.resolve(nextBlockStart)));
      dispatch(tr);
    }
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

      // Move cursor up and down by visual lines (instead of moving blocks)
      'Alt-ArrowUp': (state: any, dispatch: any, view?: EditorView) => {
        console.log('Alt-ArrowUp pressed');
        return moveSelectionUpVisualLine(state, dispatch, view);
      },
      'Alt-ArrowDown': (state: any, dispatch: any, view?: EditorView) => {
        console.log('Alt-ArrowDown pressed');
        return moveSelectionDownVisualLine(state, dispatch, view);
      },

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
      'Mod-Shift-z': redo
    });

    // Create editor state
    const state = EditorState.create({
      doc,
      plugins: [
        myKeymap,
        history(),
        dropCursor(),
        gapCursor()
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

    return () => {
      view.destroy();
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
        style={{ minHeight: '100%' }}
      />
    </div>
  );
}