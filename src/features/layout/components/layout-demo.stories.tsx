import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { useLayout } from '../hooks/use-layout';
import { Button } from '../../../shared/components/button';

// Layout Demo Component
const LayoutDemo = () => {
  const layout = useLayout();

  return (
    <div className='w-full h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden'>
      {/* Control Panel */}
      <div className='bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4'>
        <h1 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>Layout System Demo</h1>

        <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
          <Button variant={layout.sidebarCollapsed ? 'primary' : 'secondary'} size='sm' onClick={layout.toggleSidebar}>
            {layout.sidebarCollapsed ? 'Show' : 'Hide'} Sidebar
          </Button>

          <Button
            variant={layout.activityBarVisible ? 'secondary' : 'primary'}
            size='sm'
            onClick={layout.toggleActivityBar}
          >
            {layout.activityBarVisible ? 'Hide' : 'Show'} Activity Bar
          </Button>

          <Button
            variant={layout.isDualPaneMode ? 'secondary' : 'primary'}
            size='sm'
            onClick={layout.toggleDualPaneMode}
          >
            {layout.isDualPaneMode ? 'Single' : 'Dual'} Pane
          </Button>

          <Button variant={layout.toolbarVisible ? 'secondary' : 'primary'} size='sm' onClick={layout.toggleToolbar}>
            {layout.toolbarVisible ? 'Hide' : 'Show'} Toolbar
          </Button>
        </div>

        <div className='grid grid-cols-2 md:grid-cols-3 gap-3 mt-3'>
          <Button variant={layout.configViewActive ? 'secondary' : 'ghost'} size='sm' onClick={layout.toggleConfigView}>
            Config View
          </Button>

          <Button
            variant={layout.hotkeysViewActive ? 'secondary' : 'ghost'}
            size='sm'
            onClick={layout.toggleHotkeysView}
          >
            Hotkeys View
          </Button>

          <Button
            variant={layout.databaseStatusVisible ? 'secondary' : 'ghost'}
            size='sm'
            onClick={layout.toggleDatabaseStatus}
          >
            Database Status
          </Button>
        </div>

        {layout.isDualPaneMode && (
          <div className='flex gap-3 mt-3'>
            <Button
              variant={layout.activePaneId === 'left' ? 'primary' : 'ghost'}
              size='sm'
              onClick={() => layout.setActivePane('left')}
            >
              Left Pane Active
            </Button>
            <Button
              variant={layout.activePaneId === 'right' ? 'primary' : 'ghost'}
              size='sm'
              onClick={() => layout.setActivePane('right')}
            >
              Right Pane Active
            </Button>
          </div>
        )}
      </div>

      {/* Layout Display */}
      <div className='flex h-full'>
        {/* Activity Bar */}
        {layout.activityBarVisible && (
          <div className='w-12 bg-gray-800 dark:bg-gray-900 border-r border-gray-700'>
            <div className='flex flex-col items-center py-4 space-y-3'>
              <div className='w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-sm font-medium'>
                📁
              </div>
              <div className='w-8 h-8 bg-gray-600 rounded flex items-center justify-center text-white text-sm font-medium'>
                🔍
              </div>
              <div className='w-8 h-8 bg-gray-600 rounded flex items-center justify-center text-white text-sm font-medium'>
                ⚙️
              </div>
            </div>
          </div>
        )}

        {/* Sidebar */}
        {!layout.sidebarCollapsed && (
          <div className='w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col'>
            <div className='p-4 border-b border-gray-200 dark:border-gray-700'>
              <h2 className='text-sm font-medium text-gray-900 dark:text-white'>Explorer</h2>
            </div>
            <div className='flex-1 p-4'>
              <div className='space-y-2'>
                <div className='flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300'>
                  <span>📄</span>
                  <span>README.md</span>
                </div>
                <div className='flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300'>
                  <span>📄</span>
                  <span>package.json</span>
                </div>
                <div className='flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300'>
                  <span>📁</span>
                  <span>src/</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className='flex-1 flex flex-col'>
          {/* Toolbar */}
          {layout.toolbarVisible && (
            <div className='h-10 bg-gray-200 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600 flex items-center px-4'>
              <div className='flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300'>
                <button className='px-2 py-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded'>File</button>
                <button className='px-2 py-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded'>Edit</button>
                <button className='px-2 py-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded'>View</button>
              </div>
            </div>
          )}

          {/* Editor Area */}
          <div className='flex-1 flex'>
            {layout.isDualPaneMode ? (
              <>
                {/* Left Pane */}
                <div
                  className={`flex-1 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 ${
                    layout.activePaneId === 'left' ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <div className='p-6'>
                    <div className='flex items-center justify-between mb-4'>
                      <h3 className='text-lg font-medium text-gray-900 dark:text-white'>Left Pane</h3>
                      {layout.activePaneId === 'left' && (
                        <span className='px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded'>
                          Active
                        </span>
                      )}
                    </div>
                    <div className='space-y-3'>
                      <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4'></div>
                      <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2'></div>
                      <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6'></div>
                    </div>
                  </div>
                </div>

                {/* Right Pane */}
                <div
                  className={`flex-1 bg-white dark:bg-gray-900 ${
                    layout.activePaneId === 'right' ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <div className='p-6'>
                    <div className='flex items-center justify-between mb-4'>
                      <h3 className='text-lg font-medium text-gray-900 dark:text-white'>Right Pane</h3>
                      {layout.activePaneId === 'right' && (
                        <span className='px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded'>
                          Active
                        </span>
                      )}
                    </div>
                    <div className='space-y-3'>
                      <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3'></div>
                      <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5'></div>
                      <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3'></div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Single Pane */
              <div className='flex-1 bg-white dark:bg-gray-900'>
                <div className='p-6'>
                  <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-4'>Single Pane Editor</h3>
                  <div className='space-y-3'>
                    <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-full'></div>
                    <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4'></div>
                    <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2'></div>
                    <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6'></div>
                    <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3'></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Special Views */}
          {layout.configViewActive && (
            <div className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
              <div className='bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4'>
                <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-4'>Configuration View</h3>
                <p className='text-gray-600 dark:text-gray-300 mb-4'>
                  This overlay shows when the config view is active. Only one special view can be active at a time.
                </p>
                <Button onClick={layout.toggleConfigView}>Close</Button>
              </div>
            </div>
          )}

          {layout.hotkeysViewActive && (
            <div className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
              <div className='bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4'>
                <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-4'>Hotkeys View</h3>
                <p className='text-gray-600 dark:text-gray-300 mb-4'>
                  This overlay shows when the hotkeys view is active. It automatically deactivates the config view.
                </p>
                <Button onClick={layout.toggleHotkeysView}>Close</Button>
              </div>
            </div>
          )}

          {/* Database Status */}
          {layout.databaseStatusVisible && (
            <div className='absolute bottom-4 right-4 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-lg p-3'>
              <div className='flex items-center space-x-2'>
                <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                <span className='text-sm text-green-800 dark:text-green-200'>Database Connected</span>
                <button
                  onClick={layout.toggleDatabaseStatus}
                  className='text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200'
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Information */}
      <div className='absolute top-20 left-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-lg'>
        <h4 className='text-sm font-medium text-gray-900 dark:text-white mb-2'>Layout State</h4>
        <div className='space-y-1 text-xs text-gray-600 dark:text-gray-300'>
          <div>Sidebar: {layout.sidebarCollapsed ? 'Collapsed' : 'Expanded'}</div>
          <div>Activity Bar: {layout.activityBarVisible ? 'Visible' : 'Hidden'}</div>
          <div>Toolbar: {layout.toolbarVisible ? 'Visible' : 'Hidden'}</div>
          <div>Mode: {layout.isDualPaneMode ? 'Dual Pane' : 'Single Pane'}</div>
          {layout.isDualPaneMode && <div>Active Pane: {layout.activePaneId}</div>}
          <div>Special Views:</div>
          <div className='ml-2'>
            <div>Config: {layout.configViewActive ? 'Active' : 'Inactive'}</div>
            <div>Hotkeys: {layout.hotkeysViewActive ? 'Active' : 'Inactive'}</div>
            <div>DB Status: {layout.databaseStatusVisible ? 'Visible' : 'Hidden'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const meta = {
  title: 'Features/Layout/Demo',
  component: LayoutDemo,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Interactive demonstration of the layout system with sidebar, dual-pane editor, activity bar, and various views.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LayoutDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default layout demo
export const Default: Story = {};

// Specific layout configurations
export const CollapsedSidebar: Story = {
  render: () => {
    const Demo = () => {
      const layout = useLayout();

      // Auto-collapse sidebar on mount
      React.useEffect(() => {
        if (!layout.sidebarCollapsed) {
          layout.toggleSidebar();
        }
      }, []);

      return <LayoutDemo />;
    };

    return <Demo />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Layout demo with sidebar collapsed by default.',
      },
    },
  },
};

export const DualPaneMode: Story = {
  render: () => {
    const Demo = () => {
      const layout = useLayout();

      // Auto-enable dual pane on mount
      React.useEffect(() => {
        if (!layout.isDualPaneMode) {
          layout.toggleDualPaneMode();
        }
      }, []);

      return <LayoutDemo />;
    };

    return <Demo />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Layout demo with dual-pane editor mode enabled.',
      },
    },
  },
};

export const MinimalLayout: Story = {
  render: () => {
    const Demo = () => {
      const layout = useLayout();

      // Minimize the layout on mount
      React.useEffect(() => {
        if (!layout.sidebarCollapsed) layout.toggleSidebar();
        if (layout.activityBarVisible) layout.toggleActivityBar();
        if (layout.toolbarVisible) layout.toggleToolbar();
      }, []);

      return <LayoutDemo />;
    };

    return <Demo />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Minimal layout with sidebar, activity bar, and toolbar hidden.',
      },
    },
  },
};
