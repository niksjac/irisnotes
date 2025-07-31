import type React from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
// import { ActivityBar } from '../../activity-bar';
import { ResizableSidebar, Sidebar } from '@/features/sidebar';
import {
	// useViewState,
	// useViewActions,
	usePaneActions,
	usePaneState,
	useSidebarActions,
	useSidebarState,
} from '@/hooks';
// import { useEditorActions } from '../../editor';
// import { useLineWrapping } from '../../editor';
// import { useUnifiedShortcuts } from '../../hotkeys/hooks/use-unified-shortcuts';
import { useAppPersistence } from '@/hooks/use-app-persistence';
import { Content } from './content';

export const Layout: React.FC = () => {
	const { sidebarCollapsed } = useSidebarState();
	const { handleSidebarCollapsedChange, toggleSidebar } = useSidebarActions();
	const { isDualPaneMode } = usePaneState();
	// const { databaseStatusVisible } = useViewState();
	// const { toggleActivityBar } = useViewActions();
	const { toggleDualPaneMode } = usePaneActions();
	// const { increaseFontSize, decreaseFontSize } = useEditorActions();
	// const { toggleLineWrapping } = useLineWrapping();

	// Handle app persistence on shutdown
	useAppPersistence();

	// DEBUG: Simple hotkey for toggle sidebar only (Ctrl+B)
	useHotkeys('ctrl+b', toggleSidebar, {
		preventDefault: true,
		enableOnContentEditable: false,
		enableOnFormTags: false,
	});

	// Hotkey to toggle dual pane mode (Ctrl+D)
	useHotkeys('ctrl+d', toggleDualPaneMode, {
		preventDefault: true,
		enableOnContentEditable: false,
		enableOnFormTags: false,
	});

	return (
		<div className='flex flex-col h-screen w-screen'>
			<div className='flex-1 overflow-hidden'>
				<div className='overflow-hidden h-full flex md:flex-row flex-col __3'>
					{/* Activity Bar */}
					{/* <ActivityBar /> */}

					{/* Resizable Sidebar */}
					<ResizableSidebar
						isCollapsed={sidebarCollapsed}
						onCollapsedChange={handleSidebarCollapsedChange}
						minWidth={200}
						maxWidth={600}
						defaultWidth={300}
						autoCollapseOnResize={false}
					>
						<Sidebar />
					</ResizableSidebar>

					{/* Main Content Area */}
					<div className='flex-1 flex flex-col overflow-hidden __4'>
						{isDualPaneMode ? (
							/* Dual Pane Mode */
							<div className='flex h-full'>
								{/* Left Pane */}
								<div className='flex-1 border-r border-gray-300 dark:border-gray-600'>
									<Content paneId='left' />
								</div>
								{/* Right Pane */}
								<div className='flex-1'>
									<Content paneId='right' />
								</div>
							</div>
						) : (
							/* Single Pane Mode */
							<Content />
						)}
					</div>
				</div>
			</div>

			{/* Database Status View - Positioned overlay */}
			{/* {databaseStatusVisible && <DatabaseStatusView />} */}
		</div>
	);
};
