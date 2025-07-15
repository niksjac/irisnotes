import React from 'react';
import { EditorWrapper, EditorContainer, WelcomeScreen } from '../features/editor';
import type { Note } from '../types/database';

interface SinglePaneContentProps {
  selectedNote: Note | null;
  onTitleChange: (noteId: string, title: string) => void;
  onContentChange: (noteId: string, content: string) => void;
  onCreateNote: () => void;
  onCreateFolder: () => void;
  onFocusSearch: () => void;
  toolbarVisible: boolean;
  focusClasses: Record<string, boolean>;
  onRegisterElement: (ref: HTMLElement | null) => void;
  onSetFocusFromClick: () => void;
}

export const SinglePaneContent = React.memo(({
  selectedNote,
  onTitleChange,
  onContentChange,
  onCreateNote,
  onCreateFolder,
  onFocusSearch,
  toolbarVisible,
  focusClasses,
  onRegisterElement,
  onSetFocusFromClick
}: SinglePaneContentProps) => (
  <EditorWrapper
    focusClasses={focusClasses}
    onRegisterElement={onRegisterElement}
    onSetFocusFromClick={onSetFocusFromClick}
  >
    {selectedNote ? (
      <>
        <div className="h-[50px] flex items-center px-4 bg-[var(--iris-editor-bg)]">
          <input
            className="w-full border-0 bg-transparent text-lg font-semibold outline-none py-2 text-[var(--iris-text)] placeholder:text-[var(--iris-text-3)] placeholder:italic"
            type="text"
            value={selectedNote.title}
            onChange={(e) => onTitleChange(selectedNote.id, e.target.value)}
            placeholder="Untitled Note"
          />
        </div>

        <div className="flex flex-col flex-1">
          <EditorContainer
            content={selectedNote.content}
            onChange={(content) => onContentChange(selectedNote.id, content)}
            placeholder="Start writing your note..."
            toolbarVisible={toolbarVisible}
          />
        </div>
      </>
    ) : (
      <WelcomeScreen
        onCreateNote={onCreateNote}
        onCreateFolder={onCreateFolder}
        onFocusSearch={onFocusSearch}
      />
    )}
  </EditorWrapper>
));

SinglePaneContent.displayName = 'SinglePaneContent';