import { useState, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { RichEditor, RichEditorRef } from './rich-editor/rich-editor';
import { SourceEditor, SourceEditorRef } from './source-editor/source-editor';
import { Code, FileText } from 'lucide-react';

interface EditorContainerProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  defaultView?: 'rich' | 'source';
  toolbarVisible?: boolean;
}

export interface EditorContainerRef {
  focusAndPositionAtEnd: () => void;
}

export const EditorContainer = forwardRef<EditorContainerRef, EditorContainerProps>(({
  content,
  onChange,
  placeholder = "Start writing...",
  readOnly = false,
  defaultView = 'rich',
  toolbarVisible = true
}, ref) => {
  const [showSourceView, setShowSourceView] = useState(defaultView === 'source');
  const richEditorRef = useRef<RichEditorRef>(null);
  const sourceEditorRef = useRef<SourceEditorRef>(null);

  const toggleView = useCallback(() => {
    setShowSourceView(prev => !prev);
  }, []);

  const focusAndPositionAtEnd = useCallback(() => {
    if (showSourceView) {
      sourceEditorRef.current?.focusAndPositionAtEnd();
    } else {
      richEditorRef.current?.focusAndPositionAtEnd();
    }
  }, [showSourceView]);

  useImperativeHandle(ref, () => ({
    focusAndPositionAtEnd
  }), [focusAndPositionAtEnd]);

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
        backgroundColor: showSourceView ? 'var(--bg-secondary)' : 'var(--primary-alpha)',
        border: `1px solid ${showSourceView ? 'var(--border)' : 'var(--primary)'}`,
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: '500',
        color: showSourceView ? 'var(--text-3)' : 'var(--primary)',
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
          ref={sourceEditorRef}
          content={content}
          onChange={onChange}
          readOnly={readOnly}
          onToggleView={toggleView}
        />
      ) : (
        <RichEditor
          ref={richEditorRef}
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
});

EditorContainer.displayName = 'EditorContainer';