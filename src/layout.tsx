import type React from "react";
import { ActivityBar, SidebarResizer, Sidebar, PaneContainer } from "@/components";
import { useLayout, useAppHotkeys, useHotkeyHandlers } from "@/hooks";

export const Layout: React.FC = () => {
	const { sidebar, views } = useLayout();
	const hotkeyHandlers = useHotkeyHandlers();

	// Centralized app hotkeys
	useAppHotkeys({
		// Layout hotkeys
		onToggleSidebar: sidebar.toggle,
		onToggleActivityBar: views.toggleActivityBar,
		// Tab hotkeys
		onCloseTab: hotkeyHandlers.closeActiveTab,
		onNewTab: hotkeyHandlers.newTabInActivePane,
		onMoveTabLeft: hotkeyHandlers.moveActiveTabLeft,
		onMoveTabRight: hotkeyHandlers.moveActiveTabRight,
		// Pane hotkeys
		onToggleDualPane: hotkeyHandlers.toggleDualPane,
		onPaneResizeLeft: hotkeyHandlers.resizePaneLeft,
		onPaneResizeRight: hotkeyHandlers.resizePaneRight,
		// Sidebar resizing hotkeys
		onSidebarResizeLeft: hotkeyHandlers.resizeSidebarLeft,
		onSidebarResizeRight: hotkeyHandlers.resizeSidebarRight,
		// Pane focus hotkeys
		onFocusPane1: hotkeyHandlers.focusPane1,
		onFocusPane2: hotkeyHandlers.focusPane2,
		// Tab movement between panes hotkeys
		onMoveTabToPaneLeft: hotkeyHandlers.moveTabToPaneLeft,
		onMoveTabToPaneRight: hotkeyHandlers.moveTabToPaneRight,
		// Tab focus by number hotkeys
		onFocusTab1: hotkeyHandlers.focusTab1,
		onFocusTab2: hotkeyHandlers.focusTab2,
		onFocusTab3: hotkeyHandlers.focusTab3,
		onFocusTab4: hotkeyHandlers.focusTab4,
		onFocusTab5: hotkeyHandlers.focusTab5,
		onFocusTab6: hotkeyHandlers.focusTab6,
		onFocusTab7: hotkeyHandlers.focusTab7,
		onFocusTab8: hotkeyHandlers.focusTab8,
		onFocusTab9: hotkeyHandlers.focusTab9,
		// Tab navigation hotkeys
		onFocusNextTab: hotkeyHandlers.focusNextTab,
		onFocusPreviousTab: hotkeyHandlers.focusPreviousTab,
	});

	return (
		<div className="flex flex-col h-screen w-screen">
			<div className="flex-1 overflow-hidden">
				{/* Desktop Layout */}
				<div className="overflow-hidden h-full hidden md:flex flex-row __3">
					{/* Activity Bar */}
					<ActivityBar />

					{/* Resizable Sidebar */}
					<SidebarResizer
						isCollapsed={sidebar.collapsed}
						onCollapsedChange={sidebar.setCollapsed}
						minWidth={200}
						maxWidth={600}
						defaultWidth={300}
						autoCollapseOnResize={false}
					>
						<Sidebar />
					</SidebarResizer>

					{/* Main Content Area */}
					<div className="flex-1 flex flex-col overflow-hidden __4">
						<PaneContainer />
					</div>
				</div>

				{/* Mobile Layout */}
				<div className="overflow-hidden h-full flex md:hidden flex-col __3">
					{/* Activity Bar at Top */}
					<ActivityBar />

					{/* Mobile Sidebar Below Activity Bar */}
					<SidebarResizer
						isCollapsed={sidebar.collapsed}
						onCollapsedChange={sidebar.setCollapsed}
						minWidth={200}
						maxWidth={600}
						defaultWidth={300}
						autoCollapseOnResize={false}
						isMobile={true}
					>
						<Sidebar />
					</SidebarResizer>

					{/* Main Content Area */}
					<div className="flex-1 flex flex-col overflow-hidden __4">
						<PaneContainer />
					</div>
				</div>
			</div>
		</div>
	);
};
