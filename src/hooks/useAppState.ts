import { useState, useMemo } from 'react';
import { useSingleStorageNotes as useNotes, useCategoryManagement } from '../features/notes/hooks';
import { useTheme } from '../features/theme';
import { useLayout, useFocusManagement } from '../features/layout';
import { useLineWrapping } from '../features/editor/hooks/use-line-wrapping';
import { useFontSize } from '../features/editor';
import { useConfig } from './use-config';

interface SelectionState {
  id: string | null;
  type: 'note' | 'category' | null;
}

export const useAppState = () => {
  const { config, loading: configLoading } = useConfig();

  // Core data hooks
  const notesData = useNotes();
  const themeData = useTheme();
  const layoutData = useLayout();
  const lineWrappingData = useLineWrapping();
  const { config: fontSizeConfig, ...fontSizeData } = useFontSize();

  // Selection state - single source of truth
  const [selectedItem, setSelectedItem] = useState<SelectionState>({
    id: null,
    type: null
  });

  // Category management
  const categoryManagement = useCategoryManagement({
    storageManager: notesData.storageManager,
    isLoading: notesData.isLoading,
    notesLength: notesData.notes.length
  });

  // Focus management
  const focusManagement = useFocusManagement({
    onFocusChange: () => {
      // Focus change callback - could be used for analytics or debugging
    },
    onToggleSidebar: () => {
      if (layoutData.sidebarCollapsed) {
        layoutData.toggleSidebar();
      }
    },
    onToggleActivityBar: () => {
      if (!layoutData.activityBarVisible) {
        layoutData.toggleActivityBar();
      }
    },
    sidebarCollapsed: layoutData.sidebarCollapsed,
    activityBarVisible: layoutData.activityBarVisible
  });

  // Derived state
  const selectedFolder = useMemo(() => {
    if (selectedItem.type === 'category' && selectedItem.id) {
      return categoryManagement.categories.find(cat => cat.id === selectedItem.id) || null;
    }
    return null;
  }, [selectedItem.type, selectedItem.id, categoryManagement.categories]);

  const notesForPane = {
    left: notesData.getSelectedNoteForPane('left') || null,
    right: notesData.getSelectedNoteForPane('right') || null
  };

  return {
    // Config
    config,
    configLoading,

    // Core data
    ...notesData,
    ...themeData,
    ...layoutData,
    ...lineWrappingData,
    ...fontSizeData,
    fontSizeConfig,
    ...categoryManagement,

    // Focus management
    focusManagement,

    // Selection state
    selectedItem,
    setSelectedItem,
    selectedFolder,

    // Derived state
    notesForPane,
  };
};