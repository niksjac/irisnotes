import React, { createContext, useContext, ReactNode } from 'react';
import { useAppState } from '../hooks/useAppState';
import { useAppActions } from '../hooks/useAppActions';

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

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const appState = useAppState();
  const appActions = useAppActions(appState);

  const contextValue: AppContextType = {
    // State
    notes: appState.notes,
    categories: appState.categories,
    noteCategories: appState.noteCategories,
    selectedNote: appState.selectedNote,
    selectedNoteId: appState.selectedNoteId,
    selectedItem: appState.selectedItem,
    selectedFolder: appState.selectedFolder,
    notesForPane: appState.notesForPane,
    sidebarCollapsed: appState.sidebarCollapsed,
    activityBarVisible: appState.activityBarVisible,
    configViewActive: appState.configViewActive,
    hotkeysViewActive: appState.hotkeysViewActive,
    databaseStatusVisible: appState.databaseStatusVisible,
    isDualPaneMode: appState.isDualPaneMode,
    activePaneId: appState.activePaneId,
    toolbarVisible: appState.toolbarVisible,
    isWrapping: appState.isWrapping,
    fontSize: appState.fontSize,
    focusManagement: appState.focusManagement,

    // Actions
    handleNoteClick: appActions.handleNoteClick,
    handleTitleChange: appActions.handleTitleChange,
    handleContentChange: appActions.handleContentChange,
    handleCreateNote: appActions.handleCreateNote,
    handleDeleteNote: appActions.handleDeleteNote,
    handleRenameNote: appActions.handleRenameNote,
    handleItemSelectWithState: appActions.handleItemSelectWithState,
    handleFolderSelectWithState: appActions.handleFolderSelectWithState,
    handleCreateFolder: appState.handleCreateFolder,
    handleMoveNote: appState.handleMoveNote,
    handleDeleteCategory: appState.handleDeleteCategory,
    handleRenameCategory: appState.handleRenameCategory,

    // Layout actions
    toggleSidebar: appState.toggleSidebar,
    handleSidebarCollapsedChange: appState.handleSidebarCollapsedChange,
    toggleActivityBar: appState.toggleActivityBar,
    toggleConfigView: appState.toggleConfigView,
    toggleHotkeysView: appState.toggleHotkeysView,
    toggleDatabaseStatus: appState.toggleDatabaseStatus,
    toggleDualPaneMode: appState.toggleDualPaneMode,
    setActivePane: appState.setActivePane,
    toggleToolbar: appState.toggleToolbar,
    toggleLineWrapping: appState.toggleLineWrapping,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};