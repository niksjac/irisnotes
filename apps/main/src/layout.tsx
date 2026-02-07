import type React from "react";
import { useEffect } from "react";
import { useAtom, useSetAtom } from "jotai";
import {
	ActivityBar,
	SidebarResizer,
	Sidebar,
	PaneContainer,
	NoteLocationDialog,
	QuickSearchDialog,
	StatusBar,
} from "@/components";
import { QuickHotkeysModal } from "@/components/dialogs/quick-hotkeys-modal";
import { quickHotkeysOpenAtom, hideQuickHotkeysAtom } from "@/atoms";
import {
	useLayout,
	useAppHotkeys,
	useHotkeyHandlers,
	useAppPersistence,
	useLayoutPersistence,
	useTabPersistence,
	loadTabState,
	useTheme,
	useNoteActions,
	useEditorSettings,
	useKeyTips,
	useQuickAppListener,
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
	const {
		isLocationDialogOpen,
		closeLocationDialog,
		createNoteWithLocation,
	} = useNoteActions();

	// Quick hotkeys modal state
	const [isQuickHotkeysOpen] = useAtom(quickHotkeysOpenAtom);
	const hideQuickHotkeys = useSetAtom(hideQuickHotkeysAtom);

	// Apply theme (adds .dark class to document)
	useTheme();

	// Listen for signals from quick app to open notes
	useQuickAppListener();

	// Apply editor settings (cursor, fonts, etc.) at startup
	useEditorSettings();

	// Initialize KeyTips system (Alt+key shortcuts)
	useKeyTips();

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

			{/* Status Bar */}
			<StatusBar />

			{/* Note Location Dialog */}
			<NoteLocationDialog
				isOpen={isLocationDialogOpen}
				onClose={closeLocationDialog}
				onCreateNote={createNoteWithLocation}
			/>

			{/* Quick Search Dialog */}
			<QuickSearchDialog />

			{/* Quick Hotkeys Modal */}
			<QuickHotkeysModal isOpen={isQuickHotkeysOpen} onClose={hideQuickHotkeys} />
		</div>
	);
};
