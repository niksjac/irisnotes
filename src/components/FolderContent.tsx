import React from 'react';
import { FolderContentView } from '../features/editor';
import type { Note, Category } from '../types/database';

interface FolderContentProps {
  selectedFolder: Category;
  notes: Note[];
  categories: Category[];
  noteCategories: { noteId: string; categoryId: string }[];
  onNoteSelect: (noteId: string) => void;
  onFolderSelect: (folderId: string) => void;
  onCreateNote: () => void;
  onCreateFolder: () => void;
}

export const FolderContent = React.memo(({
  selectedFolder,
  notes,
  categories,
  noteCategories,
  onNoteSelect,
  onFolderSelect,
  onCreateNote,
  onCreateFolder
}: FolderContentProps) => (
  <FolderContentView
    selectedFolder={selectedFolder}
    notes={notes}
    categories={categories}
    noteCategories={noteCategories}
    onNoteSelect={onNoteSelect}
    onFolderSelect={onFolderSelect}
    onCreateNote={onCreateNote}
    onCreateFolder={onCreateFolder}
  />
));

FolderContent.displayName = 'FolderContent';