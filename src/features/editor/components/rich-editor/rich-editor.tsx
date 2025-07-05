import { RichEditorProps } from './types';
import { editorSchema } from './schema';
import { useEditorView } from './hooks/use-editor-view';
import { useConfig } from '../../../../hooks/use-config';
import { RichEditorToolbar } from './rich-editor-toolbar';
import 'prosemirror-view/style/prosemirror.css';
import './rich-editor.css';

export function RichEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  readOnly = false,
  onToggleView,
  toolbarVisible = true
}: RichEditorProps) {
  const { config, loading } = useConfig();
  const { editorRef, editorView } = useEditorView({
    content,
    onChange,
    readOnly: readOnly || false,
    onToggleView: onToggleView || (() => {}),
    schema: editorSchema
  });

  return (
    <div className="rich-editor">
      {toolbarVisible && (
        <RichEditorToolbar
          editorView={editorView}
          schema={editorSchema}
        />
      )}
      <div
        ref={editorRef}
        className="rich-editor-container"
        data-placeholder={placeholder}
        data-line-wrapping={!loading && config.editor.lineWrapping ? 'true' : 'false'}
      />
    </div>
  );
}