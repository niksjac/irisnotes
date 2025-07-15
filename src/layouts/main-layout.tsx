import React from 'react';
import { ActivityBar } from '../features/activity-bar';
import { ResizableSidebar } from '../features/sidebar';
import { DatabaseStatusView } from '../features/editor/components/database-status-view';
import {
  useSidebarState,
  useSidebarActions,
  useViewState,
  useViewActions,
  usePaneState,
  usePaneActions,
  useEditorLayout,
  useFocusManagement
} from '../features/layout';
import { useEditorState, useEditorActions } from '../features/editor';
import { AppSidebar } from './AppSidebar';
import { AppMainContent } from './AppMainContent';

export const MainLayout: React.FC = () => {
  // Layout state - focused hooks
  const { sidebarCollapsed } = useSidebarState();
  const {
    activityBarVisible,
    configViewActive,
    hotkeysViewActive,
    databaseStatusVisible
  } = useViewState();
  const { isDualPaneMode } = usePaneState();

  // Layout actions - focused hooks
  const { toggleSidebar, handleSidebarCollapsedChange } = useSidebarActions();
  const {
    toggleConfigView,
    toggleHotkeysView,
    toggleDatabaseStatus
  } = useViewActions();
  const { toggleDualPaneMode } = usePaneActions();
  const { toolbarVisible, toggleToolbar } = useEditorLayout();

  // Editor state and actions - focused hooks
  const { isWrapping, fontSize } = useEditorState();
  const { toggleLineWrapping } = useEditorActions();

  // Focus management - existing focused hook
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

  return (
    <div className="flex flex-col h-screen w-screen">
      <div className="flex-1 overflow-hidden">
        <div className="overflow-hidden h-full flex md:flex-row flex-col">
          {/* Activity Bar */}
          <ActivityBar
            isVisible={activityBarVisible}
            sidebarCollapsed={sidebarCollapsed}
            configViewActive={configViewActive}
            hotkeysViewActive={hotkeysViewActive}
            databaseStatusVisible={databaseStatusVisible}
            onToggleSidebar={toggleSidebar}
            onToggleConfigView={toggleConfigView}
            onToggleHotkeysView={toggleHotkeysView}
            onToggleDatabaseStatus={toggleDatabaseStatus}
            isDualPaneMode={isDualPaneMode}
            onToggleDualPane={toggleDualPaneMode}
            isLineWrapping={isWrapping}
            onToggleLineWrapping={toggleLineWrapping}
            isToolbarVisible={toolbarVisible}
            onToggleToolbar={toggleToolbar}
            fontSize={fontSize}
            focusClasses={focusManagement.getFocusClasses('activity-bar')}
            onRegisterElement={(ref) => focusManagement.registerElement('activity-bar', ref)}
            onSetFocusFromClick={() => focusManagement.setFocusFromClick('activity-bar')}
          />

          {/* Resizable Sidebar */}
          <ResizableSidebar
            isCollapsed={sidebarCollapsed}
            onCollapsedChange={handleSidebarCollapsedChange}
            minWidth={200}
            maxWidth={600}
            defaultWidth={300}
          >
            <AppSidebar />
          </ResizableSidebar>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <AppMainContent />
          </div>
        </div>
      </div>

      {/* Database Status View - Positioned overlay */}
      {databaseStatusVisible && <DatabaseStatusView />}
    </div>
  );
};