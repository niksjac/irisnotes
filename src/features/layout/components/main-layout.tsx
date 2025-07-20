import React, { memo } from 'react';
import { ActivityBar } from '../../activity-bar';
import { ResizableSidebar } from '../../sidebar';
import { DatabaseStatusView } from '../../editor/components/database-status-view';
import {
  useSidebarState,
  useSidebarActions,
  useViewState,
  usePaneActions
} from '../hooks';
import { useEditorActions } from '../../editor';
import { useShortcuts } from '../../shortcuts';
import { AppSidebar } from './app-sidebar';
import { AppMainContent } from './app-main-content';
import { LAYOUT_CONFIG, LAYOUT_CLASSES } from '../../../shared/constants/layout';

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
  const { databaseStatusVisible } = useViewState();
  const { toggleDualPaneMode } = usePaneActions();
  const { toggleLineWrapping, increaseFontSize, decreaseFontSize } = useEditorActions();

  // Wire up global shortcuts - single instance to avoid conflicts
  useShortcuts({
    onToggleSidebar: () => {}, // Handled by ActivityBar directly
    onToggleActivityBar: () => {}, // Activity bar toggle handled via buttons for now
    onToggleDualPane: toggleDualPaneMode,
    onToggleLineWrapping: toggleLineWrapping,
    onIncreaseFontSize: increaseFontSize,
    onDecreaseFontSize: decreaseFontSize,
    // onReloadNote: undefined // No reload functionality currently
  });

  return (
    <div className={LAYOUT_CLASSES.CONTAINER}>
      <div className={LAYOUT_CLASSES.MAIN_CONTENT}>
        <div className={LAYOUT_CLASSES.CONTENT_WRAPPER}>
          {/* Activity Bar - self-managing, no props needed */}
          <ActivityBar />

          {/* Resizable Sidebar - self-managing, no props needed */}
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