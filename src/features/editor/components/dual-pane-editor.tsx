import { useState, useCallback } from 'react';
import { EditorContainer } from './editor-container';
import { Note } from '../../../types';
import type { PaneId } from '../../layout/hooks/use-layout';
import './dual-pane-editor.css';

interface DualPaneEditorProps {
  leftNote: Note | null;
  rightNote: Note | null;
  activePaneId: PaneId;
  onNoteContentChange: (noteId: string, content: string) => void;
  onNoteTitleChange: (noteId: string, title: string) => void;
  onPaneClick: (paneId: PaneId) => void;
  toolbarVisible?: boolean;
}

export function DualPaneEditor({
  leftNote,
  rightNote,
  activePaneId,
  onNoteContentChange,
  onNoteTitleChange,
  onPaneClick,
  toolbarVisible = true
}: DualPaneEditorProps) {
  const [leftPaneWidth, setLeftPaneWidth] = useState(50); // percentage

  const handleResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();

    const handleMouseMove = (e: MouseEvent) => {
      const container = document.querySelector('.dual-pane-container');
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      const clampedWidth = Math.max(20, Math.min(80, newWidth));
      setLeftPaneWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [leftPaneWidth]);

  return (
    <div className="dual-pane-container">
      {/* Left Pane */}
      <div
        className={`editor-pane left-pane ${activePaneId === 'left' ? 'active' : ''}`}
        style={{ width: `${leftPaneWidth}%` }}
        onClick={() => onPaneClick('left')}
      >
        <div className="pane-header">
          {leftNote && (
            <input
              className="title-input"
              type="text"
              value={leftNote.title}
              onChange={(e) => onNoteTitleChange(leftNote.id, e.target.value)}
              placeholder="Untitled Note"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
        <div className="pane-content">
          {leftNote ? (
            <EditorContainer
              content={leftNote.content}
              onChange={(content) => onNoteContentChange(leftNote.id, content)}
              placeholder="Start writing your note..."
              toolbarVisible={toolbarVisible}
            />
          ) : (
            <div className="empty-pane">
              <p>No note selected</p>
            </div>
          )}
        </div>
      </div>

      {/* Resize Handle */}
      <div
        className="resize-handle"
        onMouseDown={handleResize}
      />

      {/* Right Pane */}
      <div
        className={`editor-pane right-pane ${activePaneId === 'right' ? 'active' : ''}`}
        style={{ width: `${100 - leftPaneWidth}%` }}
        onClick={() => onPaneClick('right')}
      >
        <div className="pane-header">
          {rightNote && (
            <input
              className="title-input"
              type="text"
              value={rightNote.title}
              onChange={(e) => onNoteTitleChange(rightNote.id, e.target.value)}
              placeholder="Untitled Note"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
        <div className="pane-content">
          {rightNote ? (
            <EditorContainer
              content={rightNote.content}
              onChange={(content) => onNoteContentChange(rightNote.id, content)}
              placeholder="Start writing your note..."
              toolbarVisible={toolbarVisible}
            />
          ) : (
            <div className="empty-pane">
              <p>No note selected</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}