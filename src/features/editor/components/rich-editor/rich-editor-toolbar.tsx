import { EditorView } from 'prosemirror-view';
import { toggleMark, setBlockType, wrapIn } from 'prosemirror-commands';
import { undo, redo } from 'prosemirror-history';
import { wrapInList } from 'prosemirror-schema-list';
import { toggleColor, clearColor } from './plugins/color-plugin';
import {
  toggleFontFamily,
  toggleFontSize,
  toggleBackgroundColor,
  toggleSuperscript,
  toggleSubscript
} from './plugins/formatting-marks';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Superscript,
  Subscript,
  Heading1,
  Heading2,
  Heading3,
  Type,
  List,
  ListOrdered,
  Quote,
  Palette,
  PaintBucket,
  Settings,
  Plus,
  Minus,
  Undo2,
  Redo2,
  X
} from 'lucide-react';
import './rich-editor-toolbar.css';

interface RichEditorToolbarProps {
  editorView: EditorView | null;
  schema: any;
}

export function RichEditorToolbar({ editorView, schema }: RichEditorToolbarProps) {
  const executeCommand = (command: any) => {
    return () => {
      if (!editorView) return;
      const { state, dispatch } = editorView;
      if (command(state, dispatch)) {
        editorView.focus();
      }
    };
  };

  const allButtons = !schema ? [] : [
    // Basic formatting
    {
      icon: Bold,
      label: 'Bold',
      shortcut: 'Ctrl+B',
      command: toggleMark(schema.marks.strong),
      className: 'toolbar-bold',
      group: 'format'
    },
    {
      icon: Italic,
      label: 'Italic',
      shortcut: 'Ctrl+I',
      command: toggleMark(schema.marks.em),
      className: 'toolbar-italic',
      group: 'format'
    },
    {
      icon: Underline,
      label: 'Underline',
      shortcut: 'Ctrl+U',
      command: toggleMark(schema.marks.underline),
      className: 'toolbar-underline',
      group: 'format'
    },
    {
      icon: Strikethrough,
      label: 'Strikethrough',
      shortcut: 'Ctrl+Shift+X',
      command: toggleMark(schema.marks.strikethrough),
      className: 'toolbar-strikethrough',
      group: 'format'
    },
    {
      icon: Code,
      label: 'Code',
      shortcut: 'Ctrl+`',
      command: toggleMark(schema.marks.code),
      className: 'toolbar-code',
      group: 'format'
    },
    {
      icon: Superscript,
      label: 'Superscript',
      shortcut: 'Ctrl+Shift+=',
      command: toggleSuperscript(schema),
      className: 'toolbar-superscript',
      group: 'format'
    },
    {
      icon: Subscript,
      label: 'Subscript',
      shortcut: 'Ctrl+=',
      command: toggleSubscript(schema),
      className: 'toolbar-subscript',
      group: 'format'
    },

    // Block formatting
    {
      icon: Heading1,
      label: 'Heading 1',
      shortcut: 'Ctrl+Shift+1',
      command: setBlockType(schema.nodes.heading, { level: 1 }),
      className: 'toolbar-h1',
      group: 'block'
    },
    {
      icon: Heading2,
      label: 'Heading 2',
      shortcut: 'Ctrl+Shift+2',
      command: setBlockType(schema.nodes.heading, { level: 2 }),
      className: 'toolbar-h2',
      group: 'block'
    },
    {
      icon: Heading3,
      label: 'Heading 3',
      shortcut: 'Ctrl+Shift+3',
      command: setBlockType(schema.nodes.heading, { level: 3 }),
      className: 'toolbar-h3',
      group: 'block'
    },
    {
      icon: Type,
      label: 'Paragraph',
      shortcut: 'Ctrl+Shift+0',
      command: setBlockType(schema.nodes.paragraph),
      className: 'toolbar-paragraph',
      group: 'block'
    },

    // Lists
    {
      icon: List,
      label: 'Bullet List',
      shortcut: 'Ctrl+Shift+8',
      command: wrapInList(schema.nodes.bullet_list),
      className: 'toolbar-bullet-list',
      group: 'list'
    },
    {
      icon: ListOrdered,
      label: 'Ordered List',
      shortcut: 'Ctrl+Shift+9',
      command: wrapInList(schema.nodes.ordered_list),
      className: 'toolbar-ordered-list',
      group: 'list'
    },
    {
      icon: Quote,
      label: 'Blockquote',
      shortcut: 'Ctrl+Shift+.',
      command: wrapIn(schema.nodes.blockquote),
      className: 'toolbar-blockquote',
      group: 'list'
    },

    // Colors
    {
      icon: () => <Palette style={{ color: '#e74c3c' }} />,
      label: 'Red Text',
      shortcut: 'Ctrl+Shift+R',
      command: toggleColor('#e74c3c', schema),
      className: 'toolbar-color-red',
      group: 'color'
    },
    {
      icon: () => <Palette style={{ color: '#27ae60' }} />,
      label: 'Green Text',
      shortcut: 'Ctrl+Shift+G',
      command: toggleColor('#27ae60', schema),
      className: 'toolbar-color-green',
      group: 'color'
    },
    {
      icon: () => <Palette style={{ color: '#3498db' }} />,
      label: 'Blue Text',
      shortcut: 'Ctrl+Shift+L',
      command: toggleColor('#3498db', schema),
      className: 'toolbar-color-blue',
      group: 'color'
    },
    {
      icon: () => <Palette style={{ color: '#f39c12' }} />,
      label: 'Yellow Text',
      shortcut: 'Ctrl+Shift+Y',
      command: toggleColor('#f39c12', schema),
      className: 'toolbar-color-yellow',
      group: 'color'
    },
    {
      icon: () => <Palette style={{ color: '#9b59b6' }} />,
      label: 'Purple Text',
      shortcut: 'Ctrl+Shift+P',
      command: toggleColor('#9b59b6', schema),
      className: 'toolbar-color-purple',
      group: 'color'
    },
    {
      icon: () => <X style={{ color: '#666' }} />,
      label: 'Clear Color',
      shortcut: 'Ctrl+Shift+C',
      command: clearColor(schema),
      className: 'toolbar-color-clear',
      group: 'color'
    },

    // Fonts
    {
      icon: Settings,
      label: 'Arial Font',
      command: toggleFontFamily('Arial', schema),
      className: 'toolbar-font-arial',
      group: 'font'
    },
    {
      icon: Settings,
      label: 'Times Font',
      command: toggleFontFamily('Times New Roman', schema),
      className: 'toolbar-font-times',
      group: 'font'
    },
    {
      icon: Settings,
      label: 'Monospace Font',
      command: toggleFontFamily('Consolas', schema),
      className: 'toolbar-font-consolas',
      group: 'font'
    },

    // Font sizes
    {
      icon: Minus,
      label: '10px Font Size',
      command: toggleFontSize('10px', schema),
      className: 'toolbar-size-10',
      group: 'size'
    },
    {
      icon: Type,
      label: '14px Font Size',
      command: toggleFontSize('14px', schema),
      className: 'toolbar-size-14',
      group: 'size'
    },
    {
      icon: Plus,
      label: '18px Font Size',
      command: toggleFontSize('18px', schema),
      className: 'toolbar-size-18',
      group: 'size'
    },

    // Background colors
    {
      icon: () => <PaintBucket style={{ color: '#f39c12' }} />,
      label: 'Yellow Background',
      command: toggleBackgroundColor('#fff3cd', schema),
      className: 'toolbar-bg-yellow',
      group: 'background'
    },
    {
      icon: () => <PaintBucket style={{ color: '#27ae60' }} />,
      label: 'Green Background',
      command: toggleBackgroundColor('#d4edda', schema),
      className: 'toolbar-bg-green',
      group: 'background'
    },
    {
      icon: () => <PaintBucket style={{ color: '#3498db' }} />,
      label: 'Blue Background',
      command: toggleBackgroundColor('#d1ecf1', schema),
      className: 'toolbar-bg-blue',
      group: 'background'
    },

    // Utility
    {
      icon: Undo2,
      label: 'Undo',
      shortcut: 'Ctrl+Z',
      command: undo,
      className: 'toolbar-undo',
      group: 'utility'
    },
    {
      icon: Redo2,
      label: 'Redo',
      shortcut: 'Ctrl+Y',
      command: redo,
      className: 'toolbar-redo',
      group: 'utility'
    },
  ];

  if (!editorView || !schema) return null;

  return (
    <div className="iris-editor-toolbar">
      <div className="toolbar-buttons-container">
        {allButtons.map((button, index) => {
          const IconComponent = button.icon;
          return (
            <button
              key={index}
              className={`toolbar-button ${button.className}`}
              onClick={executeCommand(button.command)}
              title={`${button.label} ${button.shortcut ? `(${button.shortcut})` : ''}`}
            >
              <IconComponent size={16} />
            </button>
          );
        })}
      </div>
    </div>
  );
}