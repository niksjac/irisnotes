import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { useSingleStorageNotes as useNotes, useCategoryManagement } from '../features/notes/hooks';
import { useTheme } from '../features/theme';
import { useLayout, useFocusManagement } from '../features/layout';
import { useLineWrapping } from '../features/editor/hooks/use-line-wrapping';
import { useFontSize } from '../features/editor';
import { useConfig } from '../hooks/use-config';

import {
  notesAtom,
  categoriesAtom,
  selectedNoteIdAtom,
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
  notesForPaneAtom,
  noteCategoriesAtom
} from './index';

// Hook to integrate existing feature hooks with Jotai atoms
export const useAtomIntegration = () => {
  const { config, loading: configLoading } = useConfig();

  // Get all the existing hooks
  const notesData = useNotes();
  const themeData = useTheme();
  const layoutData = useLayout();
  const lineWrappingData = useLineWrapping();
  const { config: fontSizeConfig, ...fontSizeData } = useFontSize();

  const categoryManagement = useCategoryManagement({
    storageManager: notesData.storageManager,
    isLoading: notesData.isLoading,
    notesLength: notesData.notes.length
  });

  const focusManagement = useFocusManagement({
    onFocusChange: () => {},
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

  // Get atom setters
  const setNotes = useSetAtom(notesAtom);
  const setCategories = useSetAtom(categoriesAtom);
  const setNoteCategories = useSetAtom(noteCategoriesAtom);
  const setSelectedNoteId = useSetAtom(selectedNoteIdAtom);
  const setSidebarCollapsed = useSetAtom(sidebarCollapsedAtom);
  const setActivityBarVisible = useSetAtom(activityBarVisibleAtom);
  const setConfigViewActive = useSetAtom(configViewActiveAtom);
  const setHotkeysViewActive = useSetAtom(hotkeysViewActiveAtom);
  const setDatabaseStatusVisible = useSetAtom(databaseStatusVisibleAtom);
  const setIsDualPaneMode = useSetAtom(isDualPaneModeAtom);
  const setActivePaneId = useSetAtom(activePaneIdAtom);
  const setToolbarVisible = useSetAtom(toolbarVisibleAtom);
  const setIsWrapping = useSetAtom(isWrappingAtom);
  const setFontSize = useSetAtom(fontSizeAtom);
  const setFocusManagement = useSetAtom(focusManagementAtom);
  const setNotesForPane = useSetAtom(notesForPaneAtom);

  // Sync notes data
  useEffect(() => {
    if (notesData.notes) {
      setNotes(notesData.notes);
    }
  }, [notesData.notes, setNotes]);

  // Sync categories
  useEffect(() => {
    if (categoryManagement.categories) {
      setCategories(categoryManagement.categories);
    }
  }, [categoryManagement.categories, setCategories]);

  // Sync note categories - using categoryManagement.noteCategories
  useEffect(() => {
    if (categoryManagement.noteCategories) {
      setNoteCategories(categoryManagement.noteCategories);
    }
  }, [categoryManagement.noteCategories, setNoteCategories]);

  // Sync selected note ID
  useEffect(() => {
    if (notesData.selectedNoteId !== undefined) {
      setSelectedNoteId(notesData.selectedNoteId);
    }
  }, [notesData.selectedNoteId, setSelectedNoteId]);

  // Sync layout state
  useEffect(() => {
    setSidebarCollapsed(layoutData.sidebarCollapsed);
  }, [layoutData.sidebarCollapsed, setSidebarCollapsed]);

  useEffect(() => {
    setActivityBarVisible(layoutData.activityBarVisible);
  }, [layoutData.activityBarVisible, setActivityBarVisible]);

  useEffect(() => {
    setConfigViewActive(layoutData.configViewActive);
  }, [layoutData.configViewActive, setConfigViewActive]);

  useEffect(() => {
    setHotkeysViewActive(layoutData.hotkeysViewActive);
  }, [layoutData.hotkeysViewActive, setHotkeysViewActive]);

  useEffect(() => {
    setDatabaseStatusVisible(layoutData.databaseStatusVisible);
  }, [layoutData.databaseStatusVisible, setDatabaseStatusVisible]);

  useEffect(() => {
    setIsDualPaneMode(layoutData.isDualPaneMode);
  }, [layoutData.isDualPaneMode, setIsDualPaneMode]);

  useEffect(() => {
    setActivePaneId(layoutData.activePaneId);
  }, [layoutData.activePaneId, setActivePaneId]);

  useEffect(() => {
    setToolbarVisible(layoutData.toolbarVisible);
  }, [layoutData.toolbarVisible, setToolbarVisible]);

  // Sync editor state
  useEffect(() => {
    setIsWrapping(lineWrappingData.isWrapping);
  }, [lineWrappingData.isWrapping, setIsWrapping]);

  useEffect(() => {
    setFontSize(fontSizeData.fontSize);
  }, [fontSizeData.fontSize, setFontSize]);

  // Sync focus management
  useEffect(() => {
    if (focusManagement && typeof focusManagement.getFocusClasses === 'function') {
      setFocusManagement(focusManagement);
    }
  }, [focusManagement, setFocusManagement]);

  // Sync notes for pane
  useEffect(() => {
    if (notesData.getSelectedNoteForPane) {
      const notesForPane = {
        left: notesData.getSelectedNoteForPane('left') || null,
        right: notesData.getSelectedNoteForPane('right') || null
      };
      setNotesForPane(notesForPane);
    }
  }, [notesData.getSelectedNoteForPane, setNotesForPane]);

  return {
    notesData,
    categoryManagement,
    themeData,
    layoutData,
    lineWrappingData,
    fontSizeData,
    focusManagement,
    config,
    configLoading
  };
};