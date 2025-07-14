// Re-export atoms and actions for easy importing
export {
  // State atoms
  notesAtom,
  categoriesAtom,
  noteCategoriesAtom,
  selectedItemAtom,
  selectedNoteIdAtom,
  selectedNoteAtom,
  selectedFolderAtom,
  notesForPaneAtom,
  sidebarCollapsedAtom,
  activityBarVisibleAtom,
  configViewActiveAtom,
  hotkeysViewActiveAtom,
  databaseStatusVisibleAtom,
  isDualPaneModeAtom,
  activePaneIdAtom,
  toolbarVisibleAtom,
  isWrappingAtom,
  fontSizeAtom,
  focusManagementAtom
} from '../atoms';

export {
  // Action atoms
  selectItemAtom,
  selectNoteAtom,
  handleNoteClickAtom,
  handleTitleChangeAtom,
  handleContentChangeAtom,
  handleDeleteNoteAtom,
  handleDeleteCategoryAtom,
  handleRenameCategoryAtom,
  toggleSidebarAtom,
  toggleActivityBarAtom,
  toggleConfigViewAtom,
  toggleHotkeysViewAtom,
  toggleDatabaseStatusAtom,
  toggleDualPaneModeAtom,
  setActivePaneAtom,
  toggleToolbarAtom,
  toggleLineWrappingAtom,
  handleSidebarCollapsedChangeAtom
} from '../atoms/actions';

// Convenience hooks for common patterns
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useSingleStorageNotes as useNotes, useCategoryManagement } from '../features/notes/hooks';
import {
  notesAtom,
  selectedNoteIdAtom,
  sidebarCollapsedAtom,
  isDualPaneModeAtom
} from '../atoms';
import {
  toggleSidebarAtom,
  handleNoteClickAtom
} from '../atoms/actions';

// Common combinations that many components use
export const useNotesState = () => {
  const notes = useAtomValue(notesAtom);
  const selectedNoteId = useAtomValue(selectedNoteIdAtom);
  const handleNoteClick = useSetAtom(handleNoteClickAtom);

  return { notes, selectedNoteId, handleNoteClick };
};

export const useLayoutState = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useAtom(sidebarCollapsedAtom);
  const [isDualPaneMode, setIsDualPaneMode] = useAtom(isDualPaneModeAtom);
  const toggleSidebar = useSetAtom(toggleSidebarAtom);

  return {
    sidebarCollapsed,
    setSidebarCollapsed,
    isDualPaneMode,
    setIsDualPaneMode,
    toggleSidebar
  };
};

// Feature hooks integration (for actions that need the underlying data)
export const useNotesActions = () => {
  const notesData = useNotes();
  const categoryManagement = useCategoryManagement({
    storageManager: notesData.storageManager,
    isLoading: notesData.isLoading,
    notesLength: notesData.notes.length
  });

  return {
    createNote: notesData.createNewNote,
    updateNoteTitle: notesData.updateNoteTitle,
    updateNoteContent: notesData.updateNoteContent,
    deleteNote: notesData.deleteNote,
    createFolder: categoryManagement.handleCreateFolder,
    deleteCategory: categoryManagement.handleDeleteCategory,
    renameCategory: categoryManagement.handleRenameCategory,
    moveNote: categoryManagement.handleMoveNote,
  };
};