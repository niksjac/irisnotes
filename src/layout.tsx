import type React from "react";
import { ActivityBar, SidebarResizer, Sidebar, PaneContainer } from "@/components";
import { useLayout, useAppHotkeys } from "@/hooks";
import { useSetAtom } from "jotai";
import {
	closeActiveTabAtom,
	newTabInActivePaneAtom,
	moveActiveTabLeftAtom,
	moveActiveTabRightAtom,
	toggleDualPaneModeAtom,
	resizePaneLeftAtom,
	resizePaneRightAtom,
	resizeSidebarLeftAtom,
	resizeSidebarRightAtom,
	focusPane1Atom,
	focusPane2Atom,
	moveTabToPaneLeftAtom,
	moveTabToPaneRightAtom,
	focusTab1Atom,
	focusTab2Atom,
	focusTab3Atom,
	focusTab4Atom,
	focusTab5Atom,
	focusTab6Atom,
	focusTab7Atom,
	focusTab8Atom,
	focusTab9Atom
} from "@/atoms";

export const Layout: React.FC = () => {
	const { sidebar, views } = useLayout();

	// Hotkey action atoms
	const closeActiveTab = useSetAtom(closeActiveTabAtom);
	const newTabInActivePane = useSetAtom(newTabInActivePaneAtom);
	const moveActiveTabLeft = useSetAtom(moveActiveTabLeftAtom);
	const moveActiveTabRight = useSetAtom(moveActiveTabRightAtom);
	const toggleDualPane = useSetAtom(toggleDualPaneModeAtom);
	const resizePaneLeft = useSetAtom(resizePaneLeftAtom);
	const resizePaneRight = useSetAtom(resizePaneRightAtom);
	const resizeSidebarLeft = useSetAtom(resizeSidebarLeftAtom);
	const resizeSidebarRight = useSetAtom(resizeSidebarRightAtom);
	const focusPane1 = useSetAtom(focusPane1Atom);
	const focusPane2 = useSetAtom(focusPane2Atom);
	const moveTabToPaneLeft = useSetAtom(moveTabToPaneLeftAtom);
	const moveTabToPaneRight = useSetAtom(moveTabToPaneRightAtom);
	const focusTab1 = useSetAtom(focusTab1Atom);
	const focusTab2 = useSetAtom(focusTab2Atom);
	const focusTab3 = useSetAtom(focusTab3Atom);
	const focusTab4 = useSetAtom(focusTab4Atom);
	const focusTab5 = useSetAtom(focusTab5Atom);
	const focusTab6 = useSetAtom(focusTab6Atom);
	const focusTab7 = useSetAtom(focusTab7Atom);
	const focusTab8 = useSetAtom(focusTab8Atom);
	const focusTab9 = useSetAtom(focusTab9Atom);

	// Centralized app hotkeys
	useAppHotkeys({
		// Layout hotkeys
		onToggleSidebar: sidebar.toggle,
		onToggleActivityBar: views.toggleActivityBar,
		// Tab hotkeys
		onCloseTab: closeActiveTab,
		onNewTab: newTabInActivePane,
		onMoveTabLeft: moveActiveTabLeft,
		onMoveTabRight: moveActiveTabRight,
		// Pane hotkeys
		onToggleDualPane: toggleDualPane,
		onPaneResizeLeft: resizePaneLeft,
		onPaneResizeRight: resizePaneRight,
		// Sidebar resizing hotkeys
		onSidebarResizeLeft: resizeSidebarLeft,
		onSidebarResizeRight: resizeSidebarRight,
		// Pane focus hotkeys
		onFocusPane1: focusPane1,
		onFocusPane2: focusPane2,
		// Tab movement between panes hotkeys
		onMoveTabToPaneLeft: moveTabToPaneLeft,
		onMoveTabToPaneRight: moveTabToPaneRight,
		// Tab focus by number hotkeys
		onFocusTab1: focusTab1,
		onFocusTab2: focusTab2,
		onFocusTab3: focusTab3,
		onFocusTab4: focusTab4,
		onFocusTab5: focusTab5,
		onFocusTab6: focusTab6,
		onFocusTab7: focusTab7,
		onFocusTab8: focusTab8,
		onFocusTab9: focusTab9,
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
