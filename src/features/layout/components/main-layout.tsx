import React from 'react';
import { ActivityBar } from '../../activity-bar';
import { ResizableSidebar, AppSidebar } from '../../sidebar';
import { DatabaseStatusView } from '../../editor/components/database-status-view';
import { useSidebarState, useSidebarActions, useViewState, useViewActions, usePaneActions } from '../hooks';
import { useEditorActions } from '../../editor';
import { useLineWrapping } from '../../editor';
import { useShortcuts } from '../../shortcuts';
import { useAppPersistence } from '../../../hooks/use-app-persistence';
import { AppMainContent } from './app-main-content';

export const MainLayout: React.FC = () => {
  const { sidebarCollapsed } = useSidebarState();
  const { handleSidebarCollapsedChange, toggleSidebar } = useSidebarActions();
  const { databaseStatusVisible } = useViewState();
  const { toggleActivityBar } = useViewActions();
  const { toggleDualPaneMode } = usePaneActions();
  const { increaseFontSize, decreaseFontSize } = useEditorActions();
  const { toggleLineWrapping } = useLineWrapping();

  // Handle app persistence on shutdown
  useAppPersistence();

  // Wire up global shortcuts
  useShortcuts({
    onToggleSidebar: toggleSidebar,
    onToggleActivityBar: toggleActivityBar,
    onToggleDualPane: toggleDualPaneMode,
    onToggleLineWrapping: toggleLineWrapping,
    onIncreaseFontSize: increaseFontSize,
    onDecreaseFontSize: decreaseFontSize,
  });

  return (
    <div className='flex flex-col h-screen w-screen'>
      <div className='flex-1 overflow-hidden'>
        <div className='overflow-hidden h-full flex md:flex-row flex-col __3'>
          {/* Activity Bar */}
          <ActivityBar />

          {/* Resizable Sidebar */}
          <ResizableSidebar
            isCollapsed={sidebarCollapsed}
            onCollapsedChange={handleSidebarCollapsedChange}
            // minWidth={200}
            // maxWidth={600}
            // defaultWidth={300}
          >
            <AppSidebar />
          </ResizableSidebar>

          {/* Main Content Area */}
          <div className='flex-1 flex flex-col overflow-hidden __4'>
            <AppMainContent />
          </div>
        </div>
      </div>

      {/* Database Status View - Positioned overlay */}
      {databaseStatusVisible && <DatabaseStatusView />}
    </div>
  );
};
