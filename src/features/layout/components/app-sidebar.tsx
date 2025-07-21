import React from 'react';
import { SidebarContent, useSidebarFocus } from '../../sidebar';
import {
  useNotesData,
  useNotesSelection,
  useNotesActions,
  useNotesNavigation,
  useNotesInitialization,
  useCategoryManagement,
  useAppHandlers,
} from '../../notes/hooks';
import { usePaneState } from '../hooks';
import { useNotesStorage } from '../../notes/hooks';

// AppSidebar now has zero props - manages everything internally
interface AppSidebarProps {}

export const AppSidebar: React.FC<AppSidebarProps> = ({}) => {
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
  const { createNewNote, updateNoteTitle: renameNote } = useNotesActions();

  // Category management - get storage manager from notes
  const { categories, noteCategories, handleCreateFolder, handleMoveNote, handleDeleteCategory, handleRenameCategory } =
    useCategoryManagement({
      storageManager,
      isLoading: !isInitialized,
      notesLength: notes.length,
    });

  // Get current selection state for folders
  const [selectedItem, setSelectedItem] = React.useState<{
    id: string | null;
    type: 'note' | 'category' | null;
  }>({
    id: null,
    type: null,
  });

  // Focus management via dedicated hook
  const { registerElement, getFocusClasses, focusElement, setFocusFromClick } = useSidebarFocus();

  // App handlers for integrated actions
  const { handleNoteClick, handleItemSelect, handleCreateNote, handleDeleteNote, handleRenameNote } = useAppHandlers({
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
    focusElement, // Pass the focus management function from our hook
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
      registerElement={registerElement}
      getFocusClasses={getFocusClasses}
      focusElement={focusElement}
      setFocusFromClick={setFocusFromClick}
    />
  );
};
