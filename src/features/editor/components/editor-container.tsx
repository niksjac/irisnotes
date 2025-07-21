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

export const EditorContainer = forwardRef<EditorContainerRef, EditorContainerProps>(
  (
    {
      content,
      onChange,
      placeholder = 'Start writing...',
      readOnly = false,
      defaultView = 'rich',
      toolbarVisible = true,
    },
    ref
  ) => {
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

    useImperativeHandle(
      ref,
      () => ({
        focusAndPositionAtEnd,
      }),
      [focusAndPositionAtEnd]
    );

    return (
      <div className='relative h-full'>
        {/* View Mode Indicator */}
        <div
          className={`absolute top-2 right-2 z-[1000] flex items-center gap-1 px-2 py-1 text-xs font-medium cursor-pointer select-none rounded transition-all duration-200 border ${
            showSourceView
              ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
              : 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
          }`}
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
  }
);

EditorContainer.displayName = 'EditorContainer';
