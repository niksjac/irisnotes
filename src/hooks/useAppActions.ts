import { useCallback, useEffect } from 'react';
import { useAppHandlers } from '../features/notes/hooks';
import { useShortcuts } from '../features/shortcuts';
import { useHotkeySequences, createAppConfigSequences } from '../features/hotkeys';

interface AppActionsProps {
  // State from useAppState
  storageManager: any;
  isDualPaneMode: boolean;
  activePaneId: any;
  openNoteInPane: any;
  setSelectedNoteId: any;
  updateNoteTitle: any;
  updateNoteContent: any;
  createNewNote: any;
  loadAllNotes: any;
  loadNoteCategories: any;
  focusManagement: any;
  selectedNoteId: string | null;
  selectedItem: { id: string | null; type: 'note' | 'category' | null };
  setSelectedItem: any;
  config: any;
  configLoading: boolean;
  loadUserTheme: any;
  toggleSidebar: any;
  toggleActivityBar: any;
  toggleDualPaneMode: any;
  toggleLineWrapping: any;
  increaseFontSize: any;
  decreaseFontSize: any;
}

export const useAppActions = (props: AppActionsProps) => {
  const {
    storageManager,
    isDualPaneMode,
    activePaneId,
    openNoteInPane,
    setSelectedNoteId,
    updateNoteTitle,
    updateNoteContent,
    createNewNote,
    loadAllNotes,
    loadNoteCategories,
    focusManagement,
    selectedNoteId,
    selectedItem,
    setSelectedItem,
    config,
    configLoading,
    loadUserTheme,
    toggleSidebar,
    toggleActivityBar,
    toggleDualPaneMode,
    toggleLineWrapping,
    increaseFontSize,
    decreaseFontSize
  } = props;

  // App handlers
  const appHandlers = useAppHandlers({
    storageManager,
    isDualPaneMode,
    activePaneId,
    openNoteInPane,
    setSelectedNoteId,
    updateNoteTitle,
    updateNoteContent,
    createNewNote,
    loadAllNotes,
    loadNoteCategories,
    focusElement: focusManagement.focusElement
  });

  // Enhanced handlers with unified state management
  const handleItemSelectWithState = useCallback((itemId: string, itemType: 'note' | 'category') => {
    setSelectedItem({ id: itemId, type: itemType });
    appHandlers.handleItemSelect(itemId, itemType);
  }, [setSelectedItem, appHandlers.handleItemSelect]);

  const handleFolderSelectWithState = useCallback((folderId: string) => {
    setSelectedItem({ id: folderId, type: 'category' });
    appHandlers.handleFolderSelect(folderId);
  }, [setSelectedItem, appHandlers.handleFolderSelect]);

  // Shortcuts configuration
  const shortcutsConfig = {
    onToggleSidebar: toggleSidebar,
    onToggleActivityBar: toggleActivityBar,
    onToggleDualPane: toggleDualPaneMode,
    onReloadNote: loadAllNotes,
    onToggleLineWrapping: toggleLineWrapping,
    onIncreaseFontSize: increaseFontSize,
    onDecreaseFontSize: decreaseFontSize
  };

  // Hotkey sequences
  const hotkeySequences = createAppConfigSequences();

  // Effects
  // Initialize app after config loads
  useEffect(() => {
    if (configLoading) return;

    const initializeApp = async () => {
      try {
        // Initialize app and load user theme
        await loadUserTheme();
      } catch (error) {
        console.error("Failed to initialize app:", error);
      }
    };

    initializeApp();
  }, [configLoading, config, loadUserTheme]);

  // Sync selection state when note is selected through other means
  useEffect(() => {
    if (selectedNoteId && selectedItem.id !== selectedNoteId) {
      setSelectedItem({ id: selectedNoteId, type: 'note' });
    }
  }, [selectedNoteId, selectedItem.id, setSelectedItem]);

  // Setup keyboard shortcuts
  useShortcuts(shortcutsConfig);

  // Setup hotkey sequences
  useHotkeySequences({
    sequences: hotkeySequences
  });

  return {
    ...appHandlers,
    handleItemSelectWithState,
    handleFolderSelectWithState,
  };
};