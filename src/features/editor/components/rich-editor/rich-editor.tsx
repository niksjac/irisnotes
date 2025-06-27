import { useEffect } from 'react';
import { RichEditorProps } from './types';
import { editorSchema } from './schema';
import { useEditorView } from './hooks/use-editor-view';
import { useConfig } from '../../../../hooks/use-config';
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

  // Apply line wrapping classes when config changes or editor is ready
  useEffect(() => {
    if (!loading && editorRef.current) {
      const richEditorView = editorRef.current.querySelector('.rich-editor-view');
      if (richEditorView) {
        console.log('Applying line wrapping from config:', config.editor.lineWrapping);
        if (config.editor.lineWrapping) {
          richEditorView.classList.remove('no-line-wrapping');
          richEditorView.classList.add('line-wrapping');
        } else {
          richEditorView.classList.remove('line-wrapping');
          richEditorView.classList.add('no-line-wrapping');
        }
        console.log('Rich editor classes:', richEditorView.className);
      }
    }
  }, [config.editor.lineWrapping, loading, editorRef]);

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