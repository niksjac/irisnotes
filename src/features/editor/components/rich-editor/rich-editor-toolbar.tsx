import { EditorView } from 'prosemirror-view';
import { toggleMark, setBlockType, wrapIn } from 'prosemirror-commands';
import { wrapInList } from 'prosemirror-schema-list';
import { toggleColor, clearColor } from './plugins/color-plugin';
import './rich-editor-toolbar.css';

interface RichEditorToolbarProps {
  editorView: EditorView | null;
  schema: any;
}

export function RichEditorToolbar({ editorView, schema }: RichEditorToolbarProps) {
  if (!editorView || !schema) return null;

  const executeCommand = (command: any) => {
    return () => {
      const { state, dispatch } = editorView;
      if (command(state, dispatch)) {
        editorView.focus();
      }
    };
  };

  const formatButtons = [
    {
      label: 'Bold',
      shortcut: 'Ctrl+B',
      command: toggleMark(schema.marks.strong),
      className: 'toolbar-bold'
    },
    {
      label: 'Italic',
      shortcut: 'Ctrl+I',
      command: toggleMark(schema.marks.em),
      className: 'toolbar-italic'
    },
    {
      label: 'Code',
      shortcut: 'Ctrl+`',
      command: toggleMark(schema.marks.code),
      className: 'toolbar-code'
    },
  ];

  const blockButtons = [
    {
      label: 'H1',
      command: setBlockType(schema.nodes.heading, { level: 1 }),
      className: 'toolbar-h1'
    },
    {
      label: 'H2',
      command: setBlockType(schema.nodes.heading, { level: 2 }),
      className: 'toolbar-h2'
    },
    {
      label: 'H3',
      command: setBlockType(schema.nodes.heading, { level: 3 }),
      className: 'toolbar-h3'
    },
    {
      label: 'Paragraph',
      command: setBlockType(schema.nodes.paragraph),
      className: 'toolbar-paragraph'
    },
  ];

  const listButtons = [
    {
      label: 'Bullet List',
      command: wrapInList(schema.nodes.bullet_list),
      className: 'toolbar-bullet-list'
    },
    {
      label: 'Ordered List',
      command: wrapInList(schema.nodes.ordered_list),
      className: 'toolbar-ordered-list'
    },
    {
      label: 'Blockquote',
      command: wrapIn(schema.nodes.blockquote),
      className: 'toolbar-blockquote'
    },
  ];

  const colorButtons = [
    {
      label: 'Red',
      command: toggleColor('#e74c3c', schema),
      className: 'toolbar-color-red',
      style: { color: '#e74c3c' }
    },
    {
      label: 'Green',
      command: toggleColor('#27ae60', schema),
      className: 'toolbar-color-green',
      style: { color: '#27ae60' }
    },
    {
      label: 'Blue',
      command: toggleColor('#3498db', schema),
      className: 'toolbar-color-blue',
      style: { color: '#3498db' }
    },
    {
      label: 'Clear',
      command: clearColor(schema),
      className: 'toolbar-color-clear'
    },
  ];

  return (
    <div className="iris-editor-toolbar">
      <div className="toolbar-group">
        {formatButtons.map((button) => (
          <button
            key={button.label}
            className={`toolbar-button ${button.className}`}
            onClick={executeCommand(button.command)}
            title={`${button.label} (${button.shortcut || ''})`}
          >
            {button.label}
          </button>
        ))}
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        {blockButtons.map((button) => (
          <button
            key={button.label}
            className={`toolbar-button ${button.className}`}
            onClick={executeCommand(button.command)}
            title={button.label}
          >
            {button.label}
          </button>
        ))}
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        {listButtons.map((button) => (
          <button
            key={button.label}
            className={`toolbar-button ${button.className}`}
            onClick={executeCommand(button.command)}
            title={button.label}
          >
            {button.label}
          </button>
        ))}
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        {colorButtons.map((button) => (
          <button
            key={button.label}
            className={`toolbar-button ${button.className}`}
            onClick={executeCommand(button.command)}
            title={button.label}
            style={button.style}
          >
            {button.label}
          </button>
        ))}
      </div>
    </div>
  );
}