import type React from 'react';
import { ActivityBar } from '@/features/activity-bar';
import { ResizableSidebar, Sidebar } from '@/features/sidebar';
import { useLayout, useAppHotkeys } from '@/hooks';
import { Content } from './content';

export const Layout: React.FC = () => {
	const { sidebar, panes, views } = useLayout();

	// Centralized app hotkeys
	useAppHotkeys({
		onToggleSidebar: sidebar.toggle,
		onToggleDualPane: panes.toggleDualMode,
		onToggleActivityBar: views.toggleActivityBar,
	});

	return (
		<div className='flex flex-col h-screen w-screen'>
			<div className='flex-1 overflow-hidden'>
				<div className='overflow-hidden h-full flex md:flex-row flex-col __3'>
					{/* Activity Bar */}
					<ActivityBar />

					{/* Resizable Sidebar */}
					<ResizableSidebar
						isCollapsed={sidebar.collapsed}
						onCollapsedChange={sidebar.setCollapsed}
						minWidth={200}
						maxWidth={600}
						defaultWidth={300}
						autoCollapseOnResize={false}
					>
						<Sidebar />
					</ResizableSidebar>

					{/* Main Content Area */}
					<div className='flex-1 flex flex-col overflow-hidden __4'>
						{panes.isDualMode ? (
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
		</div>
	);
};
