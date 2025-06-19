import { useState, useCallback } from 'react';
import { RichEditor } from './rich-editor/rich-editor';
import { SourceEditor } from './source-editor/source-editor';

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
      <SourceEditor
        content={content}
        onChange={onChange}
        readOnly={readOnly}
        onToggleView={toggleView}
      />
    );
  }

  return (
    <RichEditor
      content={content}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
      onToggleView={toggleView}
    />
  );
}