import { RichEditorProps } from './types';
import { editorSchema } from './schema';
import { useEditorView } from './hooks/use-editor-view';
import { useConfig } from '../../../../hooks/use-config';
import 'prosemirror-view/style/prosemirror.css';
import './rich-editor.css';

export function RichEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  readOnly = false,
  onToggleView
}: RichEditorProps) {
  const { config, loading } = useConfig();
  const { editorRef } = useEditorView({
    content,
    onChange,
    readOnly: readOnly || false,
    onToggleView: onToggleView || (() => {}),
    schema: editorSchema
  });

  return (
    <div className="rich-editor">
      <div
        ref={editorRef}
        className="rich-editor-container"
        data-placeholder={placeholder}
        data-line-wrapping={!loading && config.editor.lineWrapping ? 'true' : 'false'}
      />
    </div>
  );
}