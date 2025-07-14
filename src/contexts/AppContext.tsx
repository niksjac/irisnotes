import { useAppStore } from '../hooks/useAppStore';

interface AppContextType {
  // State
  notes: any[];
  categories: any[];
  noteCategories: any[];
  selectedNote: any;
  selectedNoteId: string | null;
  selectedItem: {
    id: string | null;
    type: 'note' | 'category' | null;
  };
  selectedFolder: any;
  notesForPane: {
    left: any;
    right: any;
  };
  sidebarCollapsed: boolean;
  activityBarVisible: boolean;
  configViewActive: boolean;
  hotkeysViewActive: boolean;
  databaseStatusVisible: boolean;
  isDualPaneMode: boolean;
  activePaneId: any;
  toolbarVisible: boolean;
  isWrapping: boolean;
  fontSize: number;
  focusManagement: any;

  // Actions
  handleNoteClick: (noteId: string) => void;
  handleTitleChange: (noteId: string, title: string) => void;
  handleContentChange: (noteId: string, content: string) => void;
  handleCreateNote: () => void;
  handleDeleteNote: (noteId: string) => void;
  handleRenameNote: (noteId: string, newTitle: string) => void;
  handleItemSelectWithState: (itemId: string, itemType: 'note' | 'category') => void;
  handleFolderSelectWithState: (folderId: string) => void;
  handleCreateFolder: () => void;
  handleMoveNote: (noteId: string, categoryId: string | null) => void;
  handleDeleteCategory: (categoryId: string) => void;
  handleRenameCategory: (categoryId: string, newName: string) => void;

  // Layout actions
  toggleSidebar: () => void;
  handleSidebarCollapsedChange: (collapsed: boolean) => void;
  toggleActivityBar: () => void;
  toggleConfigView: () => void;
  toggleHotkeysView: () => void;
  toggleDatabaseStatus: () => void;
  toggleDualPaneMode: () => void;
  setActivePane: (paneId: any) => void;
  toggleToolbar: () => void;
  toggleLineWrapping: () => void;
}

// This hook now uses Jotai instead of React Context
// but maintains the same interface for backwards compatibility
export const useAppContext = (): AppContextType => {
  return useAppStore();
};