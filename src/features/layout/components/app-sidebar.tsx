import React from 'react';
import { SidebarContent } from '../../sidebar';
import {
  useNotesData,
  useNotesSelection,
  useNotesActions,
  useNotesNavigation,
  useNotesInitialization,
  useCategoryManagement,
  useAppHandlers
} from '../../notes/hooks';
import { usePaneState } from '../hooks';
import { useNotesStorage } from '../../notes/hooks';

export const AppSidebar: React.FC = () => {
  // Notes data - focused hooks
  const { notes } = useNotesData();
  const { selectedNoteId } = useNotesSelection();
  const { storageManager, isInitialized } = useNotesStorage();

  // Initialize notes when storage is ready
  useNotesInitialization();

  // Get layout state for pane management
  const { isDualPaneMode, activePaneId } = usePaneState();

  // Get notes navigation and actions
  const { openNoteInPane, setSelectedNoteId } = useNotesNavigation();
  const {
    createNewNote,
    updateNoteTitle: renameNote
  } = useNotesActions();

  // Category management - get storage manager from notes
  const {
    categories,
    noteCategories,
    handleCreateFolder,
    handleMoveNote,
    handleDeleteCategory,
    handleRenameCategory
  } = useCategoryManagement({
    storageManager,
    isLoading: !isInitialized,
    notesLength: notes.length
  });

  // Get current selection state for folders
  const [selectedItem, setSelectedItem] = React.useState<{
    id: string | null;
    type: 'note' | 'category' | null;
  }>({
    id: null,
    type: null
  });

  // App handlers for integrated actions
  const {
    handleNoteClick,
    handleItemSelect,
    handleCreateNote,
    handleDeleteNote,
    handleRenameNote
  } = useAppHandlers({
    storageManager,
    isDualPaneMode,
    activePaneId,
    openNoteInPane,
    setSelectedNoteId,
    updateNoteTitle: renameNote,
    updateNoteContent: () => {}, // Not needed in sidebar
    createNewNote,
    loadAllNotes: () => Promise.resolve(), // Handled by initialization
    loadNoteCategories: () => Promise.resolve([]),
    focusElement: () => {} // No-op since focus management is handled at main layout level
  });

  return (
    <SidebarContent
      notes={notes}
      categories={categories}
      selectedNoteId={selectedNoteId}
      selectedItemId={selectedItem.id}
      selectedItemType={selectedItem.type}
      onNoteSelect={handleNoteClick}
      onItemSelect={(itemId: string, itemType: 'note' | 'category') => {
        setSelectedItem({ id: itemId, type: itemType });
        handleItemSelect(itemId, itemType);
      }}
      onCreateNote={handleCreateNote}
      onCreateFolder={handleCreateFolder}
      onMoveNote={handleMoveNote}
      onDeleteNote={handleDeleteNote}
      onDeleteCategory={handleDeleteCategory}
      onRenameNote={handleRenameNote}
      onRenameCategory={handleRenameCategory}
      noteCategories={noteCategories}
      registerElement={() => {}} // No-op since focus management is handled at main layout level
      getFocusClasses={() => ({})} // Return empty since focus management is handled at main layout level
      focusElement={() => {}} // No-op since focus management is handled at main layout level
      setFocusFromClick={() => {}} // No-op since focus management is handled at main layout level
    />
  );
};