import { useState, useCallback } from 'react';
import { RichEditor } from './rich-editor/rich-editor';
import { SourceEditor } from './source-editor/source-editor';
import { Code, FileText } from 'lucide-react';

interface EditorContainerProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  defaultView?: 'rich' | 'source';
  toolbarVisible?: boolean;
}

export function EditorContainer({
  content,
  onChange,
  placeholder = "Start writing...",
  readOnly = false,
  defaultView = 'rich',
  toolbarVisible = true
}: EditorContainerProps) {
  const [showSourceView, setShowSourceView] = useState(defaultView === 'source');

  const toggleView = useCallback(() => {
    setShowSourceView(prev => !prev);
  }, []);

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      {/* View Mode Indicator */}
      <div style={{
        position: 'absolute',
        top: '8px',
        right: '8px',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        backgroundColor: showSourceView ? 'var(--iris-bg-secondary)' : 'var(--iris-primary-alpha)',
        border: `1px solid ${showSourceView ? 'var(--iris-border)' : 'var(--iris-primary)'}`,
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: '500',
        color: showSourceView ? 'var(--iris-text-muted)' : 'var(--iris-primary)',
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'all 0.2s ease'
      }}
      onClick={toggleView}
      title={`Switch to ${showSourceView ? 'rich' : 'source'} editor (Ctrl+Shift+S)`}
      >
        {showSourceView ? <Code size={12} /> : <FileText size={12} />}
        {showSourceView ? 'Source' : 'Rich'}
      </div>

      {/* Editor Content */}
      {showSourceView ? (
        <SourceEditor
          content={content}
          onChange={onChange}
          readOnly={readOnly}
          onToggleView={toggleView}
        />
      ) : (
        <RichEditor
          content={content}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          onToggleView={toggleView}
          toolbarVisible={toolbarVisible}
        />
      )}
    </div>
  );
}