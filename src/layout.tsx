import type React from "react";
import { useEffect } from "react";
import { useSetAtom } from "jotai";
import {
	ActivityBar,
	SidebarResizer,
	Sidebar,
	PaneContainer,
} from "@/components";
import {
	useLayout,
	useAppHotkeys,
	useHotkeyHandlers,
	useAppPersistence,
	useLayoutPersistence,
	useTabPersistence,
	loadTabState,
} from "@/hooks";
import { mapHotkeyHandlers } from "@/utils/hotkey-mapping";
import {
	pane0TabsAtom,
	pane1TabsAtom,
	pane0ActiveTabAtom,
	pane1ActiveTabAtom,
} from "@/atoms/panes";

export const Layout: React.FC = () => {
	const { sidebar, views } = useLayout();
	const hotkeyHandlers = useHotkeyHandlers();

	// Persist app state
	useAppPersistence();
	useLayoutPersistence();
	useTabPersistence();

	// Load tab state from localStorage on mount
	const setPane0Tabs = useSetAtom(pane0TabsAtom);
	const setPane1Tabs = useSetAtom(pane1TabsAtom);
	const setPane0ActiveTab = useSetAtom(pane0ActiveTabAtom);
	const setPane1ActiveTab = useSetAtom(pane1ActiveTabAtom);

	useEffect(() => {
		const savedState = loadTabState();
		if (savedState) {
			setPane0Tabs(savedState.pane0Tabs);
			setPane1Tabs(savedState.pane1Tabs);
			setPane0ActiveTab(savedState.pane0ActiveTab);
			setPane1ActiveTab(savedState.pane1ActiveTab);
		}
	}, [setPane0Tabs, setPane1Tabs, setPane0ActiveTab, setPane1ActiveTab]);

	// Fixed hotkey setup with proper name mapping
	useAppHotkeys(mapHotkeyHandlers(sidebar, views, hotkeyHandlers));

	return (
		<div className="flex flex-col h-screen w-screen">
			<div className="flex-1 overflow-hidden">
				{/* Responsive layout using CSS-only approach */}
				<div className="overflow-hidden h-full flex flex-col md:flex-row">
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
					<div className="flex-1 flex flex-col overflow-hidden">
						<PaneContainer />
					</div>
				</div>
			</div>
		</div>
	);
};
