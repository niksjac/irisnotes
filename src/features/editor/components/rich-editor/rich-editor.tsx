import { forwardRef, useImperativeHandle } from 'react';
import { RichEditorProps } from './types';
import { editorSchema } from './schema';
import { useEditorView } from './hooks/use-editor-view';
import { useConfig } from '../../../../hooks/use-config';
import { RichEditorToolbar } from './rich-editor-toolbar';
import 'prosemirror-view/style/prosemirror.css';
import './rich-editor.css';

export interface RichEditorRef {
  focusAndPositionAtEnd: () => void;
}

export const RichEditor = forwardRef<RichEditorRef, RichEditorProps>(({
  content,
  onChange,
  placeholder = "Start writing...",
  readOnly = false,
  onToggleView,
  toolbarVisible = true
}, ref) => {
  const { config, loading } = useConfig();
  const { editorRef, editorView, focusAndPositionAtEnd } = useEditorView({
    content,
    onChange,
    readOnly: readOnly || false,
    onToggleView: onToggleView || (() => {}),
    schema: editorSchema
  });

  useImperativeHandle(ref, () => ({
    focusAndPositionAtEnd
  }), [focusAndPositionAtEnd]);

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
});