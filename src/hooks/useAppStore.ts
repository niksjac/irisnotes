import { useAtom, useSetAtom, useAtomValue } from 'jotai';
import { useSingleStorageNotes as useNotes, useCategoryManagement } from '../features/notes/hooks';
import {
  selectedItemAtom,
  selectedNoteIdAtom,
  selectedNoteAtom,
  selectedFolderAtom,
  notesAtom,
  categoriesAtom,
  noteCategoriesAtom,
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
  focusManagementAtom,
  notesForPaneAtom
} from '../atoms';

import {
  handleNoteClickAtom,
  handleTitleChangeAtom,
  handleContentChangeAtom,
  handleDeleteNoteAtom,
  handleDeleteCategoryAtom,
  handleRenameCategoryAtom,
  selectItemAtom,
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

// This hook provides the same interface as the previous AppContext
export const useAppStore = () => {
  // Get data from feature hooks for actions
  const notesData = useNotes();
  const categoryManagement = useCategoryManagement({
    storageManager: notesData.storageManager,
    isLoading: notesData.isLoading,
    notesLength: notesData.notes.length
  });

  // State atoms
  const [notes] = useAtom(notesAtom);
  const [categories] = useAtom(categoriesAtom);
  const [noteCategories] = useAtom(noteCategoriesAtom);
  const [selectedItem] = useAtom(selectedItemAtom);
  const [selectedNoteId] = useAtom(selectedNoteIdAtom);
  const [sidebarCollapsed] = useAtom(sidebarCollapsedAtom);
  const [activityBarVisible] = useAtom(activityBarVisibleAtom);
  const [configViewActive] = useAtom(configViewActiveAtom);
  const [hotkeysViewActive] = useAtom(hotkeysViewActiveAtom);
  const [databaseStatusVisible] = useAtom(databaseStatusVisibleAtom);
  const [isDualPaneMode] = useAtom(isDualPaneModeAtom);
  const [activePaneId] = useAtom(activePaneIdAtom);
  const [toolbarVisible] = useAtom(toolbarVisibleAtom);
  const [isWrapping] = useAtom(isWrappingAtom);
  const [fontSize] = useAtom(fontSizeAtom);
  const [focusManagement] = useAtom(focusManagementAtom);
  const [notesForPane] = useAtom(notesForPaneAtom);

  // Derived state atoms
  const selectedNote = useAtomValue(selectedNoteAtom);
  const selectedFolder = useAtomValue(selectedFolderAtom);

  // Action setters
  const handleNoteClick = useSetAtom(handleNoteClickAtom);
  const handleTitleChange = useSetAtom(handleTitleChangeAtom);
  const handleContentChange = useSetAtom(handleContentChangeAtom);
  const handleDeleteNote = useSetAtom(handleDeleteNoteAtom);
  const handleDeleteCategory = useSetAtom(handleDeleteCategoryAtom);
  const handleRenameCategory = useSetAtom(handleRenameCategoryAtom);
  const handleItemSelectWithState = useSetAtom(selectItemAtom);
  const toggleSidebar = useSetAtom(toggleSidebarAtom);
  const toggleActivityBar = useSetAtom(toggleActivityBarAtom);
  const toggleConfigView = useSetAtom(toggleConfigViewAtom);
  const toggleHotkeysView = useSetAtom(toggleHotkeysViewAtom);
  const toggleDatabaseStatus = useSetAtom(toggleDatabaseStatusAtom);
  const toggleDualPaneMode = useSetAtom(toggleDualPaneModeAtom);
  const setActivePane = useSetAtom(setActivePaneAtom);
  const toggleToolbar = useSetAtom(toggleToolbarAtom);
  const toggleLineWrapping = useSetAtom(toggleLineWrappingAtom);
  const handleSidebarCollapsedChange = useSetAtom(handleSidebarCollapsedChangeAtom);

  // Wrapped action functions to match the original interface
  const wrappedHandleNoteClick = (noteId: string) => handleNoteClick(noteId);
  const wrappedHandleTitleChange = (noteId: string, title: string) =>
    handleTitleChange({ noteId, title });
  const wrappedHandleContentChange = (noteId: string, content: string) =>
    handleContentChange({ noteId, content });
  const wrappedHandleDeleteNote = (noteId: string) => handleDeleteNote(noteId);
  const wrappedHandleDeleteCategory = (categoryId: string) => handleDeleteCategory(categoryId);
  const wrappedHandleRenameCategory = (categoryId: string, newName: string) =>
    handleRenameCategory({ categoryId, newName });
  const wrappedHandleItemSelectWithState = (itemId: string, itemType: 'note' | 'category') =>
    handleItemSelectWithState({ itemId, itemType });

  // Use actual implementations from the feature hooks
  const handleCreateNote = notesData.createNewNote;
  const handleRenameNote = notesData.updateNoteTitle;
  const handleFolderSelectWithState = (folderId: string) => {
    wrappedHandleItemSelectWithState(folderId, 'category');
  };
  const handleCreateFolder = categoryManagement.handleCreateFolder;
  const handleMoveNote = categoryManagement.handleMoveNote;

  return {
    // State
    notes,
    categories,
    noteCategories,
    selectedNote,
    selectedNoteId,
    selectedItem,
    selectedFolder,
    notesForPane,
    sidebarCollapsed,
    activityBarVisible,
    configViewActive,
    hotkeysViewActive,
    databaseStatusVisible,
    isDualPaneMode,
    activePaneId,
    toolbarVisible,
    isWrapping,
    fontSize,
    focusManagement,

    // Actions
    handleNoteClick: wrappedHandleNoteClick,
    handleTitleChange: wrappedHandleTitleChange,
    handleContentChange: wrappedHandleContentChange,
    handleCreateNote,
    handleDeleteNote: wrappedHandleDeleteNote,
    handleRenameNote,
    handleItemSelectWithState: wrappedHandleItemSelectWithState,
    handleFolderSelectWithState,
    handleCreateFolder,
    handleMoveNote,
    handleDeleteCategory: wrappedHandleDeleteCategory,
    handleRenameCategory: wrappedHandleRenameCategory,

    // Layout actions
    toggleSidebar,
    handleSidebarCollapsedChange,
    toggleActivityBar,
    toggleConfigView,
    toggleHotkeysView,
    toggleDatabaseStatus,
    toggleDualPaneMode,
    setActivePane,
    toggleToolbar,
    toggleLineWrapping,
  };
};