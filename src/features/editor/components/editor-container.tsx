import { useState, useCallback } from 'react';
import { RichTextEditor } from './rich-editor/rich-editor';
import { SourceView } from './source-editor/source-editor';

interface EditorContainerProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  defaultView?: 'rich' | 'source';
}

export function EditorContainer({
  content,
  onChange,
  placeholder = "Start writing...",
  readOnly = false,
  defaultView = 'rich'
}: EditorContainerProps) {
  const [showSourceView, setShowSourceView] = useState(defaultView === 'source');

  const toggleView = useCallback(() => {
    setShowSourceView(prev => !prev);
  }, []);

  if (showSourceView) {
    return (
      <SourceView
        content={content}
        onChange={onChange}
        readOnly={readOnly}
        onToggleView={toggleView}
      />
    );
  }

  return (
    <RichTextEditor
      content={content}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
      onToggleView={toggleView}
    />
  );
}