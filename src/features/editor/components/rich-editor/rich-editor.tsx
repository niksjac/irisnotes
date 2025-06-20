import { RichEditorProps } from './types';
import { editorSchema } from './schema';
import { useEditorView } from './hooks/use-editor-view';
import './rich-editor.css';

export function RichEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  readOnly = false,
  onToggleView
}: RichEditorProps) {
  const { editorRef } = useEditorView({
    content,
    onChange,
    readOnly,
    onToggleView,
    schema: editorSchema
  });

  return (
    <div className="rich-editor">
      <div
        ref={editorRef}
        className="rich-editor-container"
        data-placeholder={placeholder}
      />
    </div>
  );
}