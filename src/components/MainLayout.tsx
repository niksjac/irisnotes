import React from 'react';
import { ActivityBar } from '../features/activity-bar';
import { ResizableSidebar } from '../features/sidebar';
import { DatabaseStatusView } from '../features/editor/components/database-status-view';
import { useAppContext } from '../contexts/AppContext';
import { AppSidebar } from './AppSidebar';
import { AppMainContent } from './AppMainContent';

export const MainLayout: React.FC = () => {
  const {
    sidebarCollapsed,
    activityBarVisible,
    configViewActive,
    hotkeysViewActive,
    databaseStatusVisible,
    isDualPaneMode,
    isWrapping,
    fontSize,
    toggleSidebar,
    handleSidebarCollapsedChange,
    toggleConfigView,
    toggleHotkeysView,
    toggleDatabaseStatus,
    toggleDualPaneMode,
    toggleToolbar,
    toggleLineWrapping,
    focusManagement,
    toolbarVisible
  } = useAppContext();

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