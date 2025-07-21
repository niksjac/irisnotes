import { useState, useCallback } from 'react';
import { SidebarButtons } from './sidebar-buttons';
import { SidebarSearch } from './sidebar-search';
import { NotesTreeView } from '../../notes-tree-view';
import type { Note, Category } from '../../../types/database';
import type { FocusableElement } from '../../layout';

interface SidebarContentProps {
  notes: Note[];
  categories: Category[];
  selectedNoteId?: string | null;
  selectedItemId?: string | null;
  selectedItemType?: 'note' | 'category' | null;
  onNoteSelect: (noteId: string) => void;
  onItemSelect?: (itemId: string, itemType: 'note' | 'category') => void;
  onCreateNote: (parentCategoryId?: string) => void;
  onCreateFolder: (parentCategoryId?: string) => void;
  onMoveNote: (noteId: string, newCategoryId: string | null) => void;
  onDeleteNote: (noteId: string) => void;
  onDeleteCategory: (categoryId: string) => void;
  onRenameNote: (noteId: string, newTitle: string) => void;
  onRenameCategory: (categoryId: string, newName: string) => void;
  noteCategories?: { noteId: string; categoryId: string }[];

  // Focus management
  registerElement: (element: FocusableElement, ref: HTMLElement | null) => void;
  getFocusClasses: (element: FocusableElement) => Record<string, boolean>;
  focusElement: (element: FocusableElement) => void;
  setFocusFromClick: (element: FocusableElement) => void;
}

export function SidebarContent({
  notes,
  categories,
  selectedNoteId,
  selectedItemId,
  selectedItemType,
  onNoteSelect,
  onItemSelect,
  onCreateNote,
  onCreateFolder,
  onMoveNote,
  onDeleteNote,
  onDeleteCategory,
  onRenameNote,
  onRenameCategory,
  noteCategories,
  registerElement,
  getFocusClasses,
  focusElement,
  setFocusFromClick,
}: SidebarContentProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Handle focus search functionality
  const handleFocusSearch = useCallback(() => {
    focusElement('sidebar-search');
  }, [focusElement]);

  return (
    <div className='sidebar-content-wrapper'>
      {/* Sidebar Buttons */}
      <SidebarButtons
        onCreateNote={() => onCreateNote()}
        onCreateFolder={() => onCreateFolder()}
        onFocusSearch={handleFocusSearch}
        focusClasses={getFocusClasses('sidebar-buttons')}
        onRegisterElement={ref => registerElement('sidebar-buttons', ref)}
        onSetFocusFromClick={() => setFocusFromClick('sidebar-buttons')}
      />

      {/* Search Field */}
      <SidebarSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        focusClasses={getFocusClasses('sidebar-search')}
        onRegisterElement={ref => registerElement('sidebar-search', ref)}
        onSetFocusFromClick={() => setFocusFromClick('sidebar-search')}
      />

      {/* Notes Tree View */}
      <NotesTreeView
        notes={notes}
        categories={categories}
        selectedNoteId={selectedNoteId || null}
        selectedItemId={selectedItemId || null}
        selectedItemType={selectedItemType || null}
        onNoteSelect={onNoteSelect}
        onItemSelect={onItemSelect || (() => {})}
        onCreateNote={onCreateNote}
        onCreateFolder={onCreateFolder}
        onMoveNote={onMoveNote}
        onDeleteNote={onDeleteNote}
        onDeleteCategory={onDeleteCategory}
        onRenameNote={onRenameNote}
        onRenameCategory={onRenameCategory}
        noteCategories={noteCategories || []}
        searchQuery={searchQuery}
        focusClasses={getFocusClasses('sidebar-tree')}
        onRegisterElement={ref => registerElement('sidebar-tree', ref)}
        onSetFocusFromClick={() => setFocusFromClick('sidebar-tree')}
      />
    </div>
  );
}
