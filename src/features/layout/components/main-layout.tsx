import React, { memo, useMemo } from 'react';
import { ActivityBar } from '../../activity-bar';
import { ResizableSidebar } from '../../sidebar';
import { DatabaseStatusView } from '../../editor/components/database-status-view';
import {
  useSidebarState,
  useSidebarActions,
  useViewState,
  useViewActions,
  usePaneState,
  usePaneActions,
  useEditorLayout,
  useFocusManagement
} from '../hooks';
import { useEditorState, useEditorActions } from '../../editor';
import { useShortcuts } from '../../shortcuts';
import { AppSidebar } from './app-sidebar';
import { AppMainContent } from './app-main-content';
import { LAYOUT_CONFIG, LAYOUT_CLASSES } from '../../../shared/constants/layout';

// Custom hook to manage ActivityBar props and reduce props drilling
const useActivityBarProps = () => {
  // Layout state
  const { sidebarCollapsed } = useSidebarState();
  const {
    activityBarVisible,
    configViewActive,
    hotkeysViewActive,
    databaseStatusVisible
  } = useViewState();
  const { isDualPaneMode } = usePaneState();

  // Layout actions
  const { toggleSidebar } = useSidebarActions();
  const {
    toggleConfigView,
    toggleHotkeysView,
    toggleDatabaseStatus
  } = useViewActions();
  const { toggleDualPaneMode } = usePaneActions();
  const { toolbarVisible, toggleToolbar } = useEditorLayout();

  // Editor state and actions
  const { isWrapping, fontSize } = useEditorState();
  const { toggleLineWrapping } = useEditorActions();

  return useMemo(() => ({
    isVisible: activityBarVisible,
    sidebarCollapsed,
    configViewActive,
    hotkeysViewActive,
    databaseStatusVisible,
    onToggleSidebar: toggleSidebar,
    onToggleConfigView: toggleConfigView,
    onToggleHotkeysView: toggleHotkeysView,
    onToggleDatabaseStatus: toggleDatabaseStatus,
    isDualPaneMode,
    onToggleDualPane: toggleDualPaneMode,
    isLineWrapping: isWrapping,
    onToggleLineWrapping: toggleLineWrapping,
    isToolbarVisible: toolbarVisible,
    onToggleToolbar: toggleToolbar,
    fontSize,
    // Focus management props will be added by the main component
    focusClasses: {},
    onRegisterElement: () => {},
    onSetFocusFromClick: () => {}
  }), [
    activityBarVisible,
    sidebarCollapsed,
    configViewActive,
    hotkeysViewActive,
    databaseStatusVisible,
    toggleSidebar,
    toggleConfigView,
    toggleHotkeysView,
    toggleDatabaseStatus,
    isDualPaneMode,
    toggleDualPaneMode,
    isWrapping,
    toggleLineWrapping,
    toolbarVisible,
    toggleToolbar,
    fontSize
  ]);
};

// Memoized sidebar component to prevent unnecessary re-renders
const MemoizedSidebar = memo(() => {
  const { sidebarCollapsed } = useSidebarState();
  const { handleSidebarCollapsedChange } = useSidebarActions();

  return (
    <ResizableSidebar
      isCollapsed={sidebarCollapsed}
      onCollapsedChange={handleSidebarCollapsedChange}
      minWidth={LAYOUT_CONFIG.SIDEBAR.MIN_WIDTH}
      maxWidth={LAYOUT_CONFIG.SIDEBAR.MAX_WIDTH}
      defaultWidth={LAYOUT_CONFIG.SIDEBAR.DEFAULT_WIDTH}
    >
      <AppSidebar />
    </ResizableSidebar>
  );
});

MemoizedSidebar.displayName = 'MemoizedSidebar';

// Memoized main content to prevent unnecessary re-renders
const MemoizedMainContent = memo(() => (
  <div className={LAYOUT_CLASSES.MAIN_AREA}>
    <AppMainContent />
  </div>
));

MemoizedMainContent.displayName = 'MemoizedMainContent';

export const MainLayout: React.FC = memo(() => {
  const { sidebarCollapsed } = useSidebarState();
  const { activityBarVisible, databaseStatusVisible } = useViewState();
  const { toggleSidebar } = useSidebarActions();
  const { toggleDualPaneMode } = usePaneActions();
  const { toggleLineWrapping, increaseFontSize, decreaseFontSize } = useEditorActions();

  // Centralized focus management - single instance for the entire app
  const focusManagement = useFocusManagement({
    onFocusChange: () => {
      // Focus change callback
    },
    onToggleSidebar: () => {
      if (sidebarCollapsed) {
        toggleSidebar();
      }
    },
    onToggleActivityBar: () => {
      // Activity bar toggle if needed
    },
    sidebarCollapsed,
    activityBarVisible
  });

  // Wire up global shortcuts - single instance to avoid conflicts
  useShortcuts({
    onToggleSidebar: toggleSidebar,
    onToggleActivityBar: () => {}, // Activity bar toggle handled via buttons for now
    onToggleDualPane: toggleDualPaneMode,
    onToggleLineWrapping: toggleLineWrapping,
    onIncreaseFontSize: increaseFontSize,
    onDecreaseFontSize: decreaseFontSize,
    // onReloadNote: undefined // No reload functionality currently
  });

  const activityBarProps = useActivityBarProps();

  // Add focus management props to activity bar
  const activityBarPropsWithFocus = useMemo(() => ({
    ...activityBarProps,
    focusClasses: focusManagement.getFocusClasses(LAYOUT_CONFIG.FOCUS.ACTIVITY_BAR_ID),
    onRegisterElement: (ref: HTMLElement | null) => focusManagement.registerElement(LAYOUT_CONFIG.FOCUS.ACTIVITY_BAR_ID, ref),
    onSetFocusFromClick: () => focusManagement.setFocusFromClick(LAYOUT_CONFIG.FOCUS.ACTIVITY_BAR_ID)
  }), [activityBarProps, focusManagement]);

  return (
    <div className={LAYOUT_CLASSES.CONTAINER}>
      <div className={LAYOUT_CLASSES.MAIN_CONTENT}>
        <div className={LAYOUT_CLASSES.CONTENT_WRAPPER}>
          {/* Activity Bar with focus management */}
          <ActivityBar {...activityBarPropsWithFocus} />

          {/* Resizable Sidebar */}
          <MemoizedSidebar />

          {/* Main Content Area */}
          <MemoizedMainContent />
        </div>
      </div>

      {/* Database Status View - Positioned overlay */}
      {databaseStatusVisible && <DatabaseStatusView />}
    </div>
  );
});

MainLayout.displayName = 'MainLayout';