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
      className: 'font-black font-serif',
      group: 'format'
    },
    {
      icon: Italic,
      label: 'Italic',
      shortcut: 'Ctrl+I',
      command: toggleMark(schema.marks.em),
      className: 'italic font-serif',
      group: 'format'
    },
    {
      icon: Underline,
      label: 'Underline',
      shortcut: 'Ctrl+U',
      command: toggleMark(schema.marks.underline),
      className: 'underline font-serif',
      group: 'format'
    },
    {
      icon: Strikethrough,
      label: 'Strikethrough',
      shortcut: 'Ctrl+Shift+X',
      command: toggleMark(schema.marks.strikethrough),
      className: 'line-through font-serif',
      group: 'format'
    },
    {
      icon: Code,
      label: 'Code',
      shortcut: 'Ctrl+`',
      command: toggleMark(schema.marks.code),
      className: 'font-mono text-sm',
      group: 'format'
    },
    {
      icon: Superscript,
      label: 'Superscript',
      shortcut: 'Ctrl+Shift+=',
      command: toggleSuperscript(schema),
      className: 'font-serif text-sm',
      group: 'format'
    },
    {
      icon: Subscript,
      label: 'Subscript',
      shortcut: 'Ctrl+=',
      command: toggleSubscript(schema),
      className: 'font-serif text-sm',
      group: 'format'
    },

    // Block formatting
    {
      icon: Heading1,
      label: 'Heading 1',
      shortcut: 'Ctrl+Shift+1',
      command: setBlockType(schema.nodes.heading, { level: 1 }),
      className: 'font-bold font-serif text-lg',
      group: 'block'
    },
    {
      icon: Heading2,
      label: 'Heading 2',
      shortcut: 'Ctrl+Shift+2',
      command: setBlockType(schema.nodes.heading, { level: 2 }),
      className: 'font-bold font-serif',
      group: 'block'
    },
    {
      icon: Heading3,
      label: 'Heading 3',
      shortcut: 'Ctrl+Shift+3',
      command: setBlockType(schema.nodes.heading, { level: 3 }),
      className: 'font-bold font-serif text-sm',
      group: 'block'
    },
    {
      icon: Type,
      label: 'Paragraph',
      shortcut: 'Ctrl+Shift+0',
      command: setBlockType(schema.nodes.paragraph),
      className: 'text-xl',
      group: 'block'
    },

    // Lists
    {
      icon: List,
      label: 'Bullet List',
      shortcut: 'Ctrl+Shift+8',
      command: wrapInList(schema.nodes.bullet_list),
      className: 'font-semibold',
      group: 'list'
    },
    {
      icon: ListOrdered,
      label: 'Ordered List',
      shortcut: 'Ctrl+Shift+9',
      command: wrapInList(schema.nodes.ordered_list),
      className: 'font-semibold',
      group: 'list'
    },
    {
      icon: Quote,
      label: 'Blockquote',
      shortcut: 'Ctrl+Shift+.',
      command: wrapIn(schema.nodes.blockquote),
      className: 'font-serif text-lg',
      group: 'list'
    },

    // Colors
    {
      icon: () => <Palette style={{ color: '#e74c3c' }} />,
      label: 'Red Text',
      shortcut: 'Ctrl+Shift+R',
      command: toggleColor('#e74c3c', schema),
      className: 'text-lg',
      group: 'color'
    },
    {
      icon: () => <Palette style={{ color: '#27ae60' }} />,
      label: 'Green Text',
      shortcut: 'Ctrl+Shift+G',
      command: toggleColor('#27ae60', schema),
      className: 'text-lg',
      group: 'color'
    },
    {
      icon: () => <Palette style={{ color: '#3498db' }} />,
      label: 'Blue Text',
      shortcut: 'Ctrl+Shift+L',
      command: toggleColor('#3498db', schema),
      className: 'text-lg',
      group: 'color'
    },
    {
      icon: () => <Palette style={{ color: '#f39c12' }} />,
      label: 'Yellow Text',
      shortcut: 'Ctrl+Shift+Y',
      command: toggleColor('#f39c12', schema),
      className: 'text-lg',
      group: 'color'
    },
    {
      icon: () => <Palette style={{ color: '#9b59b6' }} />,
      label: 'Purple Text',
      shortcut: 'Ctrl+Shift+P',
      command: toggleColor('#9b59b6', schema),
      className: 'text-lg',
      group: 'color'
    },
    {
      icon: () => <X style={{ color: '#666' }} />,
      label: 'Clear Color',
      shortcut: 'Ctrl+Shift+C',
      command: clearColor(schema),
      className: 'text-lg',
      group: 'color'
    },

    // Fonts
    {
      icon: Settings,
      label: 'Arial Font',
      command: toggleFontFamily('Arial', schema),
      className: 'font-semibold',
      group: 'font',
      style: { fontFamily: 'Arial, sans-serif' }
    },
    {
      icon: Settings,
      label: 'Times Font',
      command: toggleFontFamily('Times New Roman', schema),
      className: 'font-semibold',
      group: 'font',
      style: { fontFamily: 'Times New Roman, serif' }
    },
    {
      icon: Settings,
      label: 'Monospace Font',
      command: toggleFontFamily('Consolas', schema),
      className: 'font-semibold font-mono',
      group: 'font'
    },

    // Font sizes
    {
      icon: Minus,
      label: '10px Font Size',
      command: toggleFontSize('10px', schema),
      className: 'font-semibold font-mono',
      group: 'size'
    },
    {
      icon: Type,
      label: '14px Font Size',
      command: toggleFontSize('14px', schema),
      className: 'font-semibold font-mono',
      group: 'size'
    },
    {
      icon: Plus,
      label: '18px Font Size',
      command: toggleFontSize('18px', schema),
      className: 'font-semibold font-mono',
      group: 'size'
    },

    // Background colors
    {
      icon: () => <PaintBucket style={{ color: '#f39c12' }} />,
      label: 'Yellow Background',
      command: toggleBackgroundColor('#fff3cd', schema),
      className: 'text-lg',
      group: 'background'
    },
    {
      icon: () => <PaintBucket style={{ color: '#27ae60' }} />,
      label: 'Green Background',
      command: toggleBackgroundColor('#d4edda', schema),
      className: 'text-lg',
      group: 'background'
    },
    {
      icon: () => <PaintBucket style={{ color: '#3498db' }} />,
      label: 'Blue Background',
      command: toggleBackgroundColor('#d1ecf1', schema),
      className: 'text-lg',
      group: 'background'
    },

    // Utility
    {
      icon: Undo2,
      label: 'Undo',
      shortcut: 'Ctrl+Z',
      command: undo,
      className: 'text-xl font-semibold',
      group: 'utility'
    },
    {
      icon: Redo2,
      label: 'Redo',
      shortcut: 'Ctrl+Y',
      command: redo,
      className: 'text-xl font-semibold',
      group: 'utility'
    },
  ];

  if (!editorView || !schema) return null;

  return (
    <div className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-800 overflow-hidden min-h-[40px]">
      <div className="flex items-center gap-1 flex-1 flex-wrap">
        {allButtons.map((button, index) => {
          const IconComponent = button.icon;
          return (
            <button
              key={index}
              className={`inline-flex items-center justify-center w-8 h-8 flex-shrink-0 border border-transparent rounded-sm bg-transparent text-gray-600 dark:text-gray-400 font-medium cursor-pointer transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-900 dark:hover:text-gray-100 active:translate-y-px border-black ${button.className}`}
              onClick={executeCommand(button.command)}
              title={`${button.label} ${button.shortcut ? `(${button.shortcut})` : ''}`}
              style={button.style}
            >
              <IconComponent size={16} />
            </button>
          );
        })}
      </div>
    </div>
  );
}