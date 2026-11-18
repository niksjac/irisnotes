import { useMemo } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import * as Icons from "lucide-react";
import {
	appToolbarVisibleAtom,
	paneStateAtom,
	pane0TabsAtom,
	pane1TabsAtom,
	pane0ActiveTabAtom,
	pane1ActiveTabAtom,
} from "@/atoms";
import { openTopNotesTabAtom } from "@/atoms/panes";
import { useSidebar, useLineWrapping } from "@/hooks";
import { useHotkeyHandlers } from "@/hooks/use-hotkey-handlers";
import { useHotkeyLabel } from "@/hooks/use-hotkey-label";
import type { ViewType } from "@/types";
import { ToolbarButton, ToolbarSeparator, withHotkey } from "./toolbar-button";
import { SyncIndicatorButton } from "./sync-indicator-button";
import { LayoutMenu } from "./layout-menu";

/**
 * App toolbar under the title bar, in groups: sidebar | create | find |
 * panes & wrapping, then sync, settings and the More menu on the right.
 */
export function AppToolbar() {
	const visible = useAtomValue(appToolbarVisibleAtom);
	const handlers = useHotkeyHandlers();
	const { sidebarCollapsed, toggleSidebar } = useSidebar();
	const { isWrapping, toggleLineWrapping } = useLineWrapping();
	const openTopNotes = useSetAtom(openTopNotesTabAtom);

	const paneState = useAtomValue(paneStateAtom);
	const pane0Tabs = useAtomValue(pane0TabsAtom);
	const pane1Tabs = useAtomValue(pane1TabsAtom);
	const pane0ActiveTab = useAtomValue(pane0ActiveTabAtom);
	const pane1ActiveTab = useAtomValue(pane1ActiveTabAtom);

	// View types shown in either pane's active tab (drives active button states)
	const activeViews = useMemo(() => {
		const views = new Set<ViewType>();
		const active0 = pane0Tabs.find((t) => t.id === pane0ActiveTab);
		const active1 = pane1Tabs.find((t) => t.id === pane1ActiveTab);
		if (active0) views.add(active0.viewType);
		if (active1) views.add(active1.viewType);
		return views;
	}, [pane0Tabs, pane1Tabs, pane0ActiveTab, pane1ActiveTab]);

	const labels = {
		sidebar: useHotkeyLabel("toggleSidebar"),
		newNote: useHotkeyLabel("newNote"),
		newBook: useHotkeyLabel("newBook"),
		newSection: useHotkeyLabel("newSection"),
		quickSearch: useHotkeyLabel("quickSearch"),
		fullTextSearch: useHotkeyLabel("fullTextSearch"),
		dualPane: useHotkeyLabel("toggleDualPane"),
		wrap: useHotkeyLabel("toggleLineWrapping"),
		settings: useHotkeyLabel("openSettings"),
	};

	if (!visible) return null;

	return (
		<div className="flex-shrink-0 h-9 px-1.5 flex items-center gap-0.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 select-none">
			<ToolbarButton
				icon={Icons.PanelLeft}
				title={withHotkey("Notes sidebar", labels.sidebar)}
				onClick={toggleSidebar}
				isActive={!sidebarCollapsed}
			/>

			<ToolbarSeparator />
			<ToolbarButton icon={Icons.FilePlus} title={withHotkey("New note", labels.newNote)} onClick={handlers.createNoteInRoot} />
			<ToolbarButton icon={Icons.BookPlus} title={withHotkey("New book", labels.newBook)} onClick={handlers.openNewBookDialog} />
			<ToolbarButton icon={Icons.FolderPlus} title={withHotkey("New section", labels.newSection)} onClick={handlers.openNewSectionDialog} />

			<ToolbarSeparator />
			<ToolbarButton icon={Icons.Search} title={withHotkey("Quick search", labels.quickSearch)} onClick={handlers.openQuickSearch} />
			<ToolbarButton icon={Icons.FileSearch} title={withHotkey("Full-text search", labels.fullTextSearch)} onClick={handlers.openSearchSidebar} />
			<ToolbarButton
				icon={Icons.TrendingUp}
				title="Top notes — most viewed, recent, oldest"
				onClick={() => openTopNotes()}
				isActive={activeViews.has("top-notes-view")}
			/>

			<ToolbarSeparator />
			<ToolbarButton
				icon={Icons.Columns2}
				title={withHotkey(paneState.count === 1 ? "Split into two panes" : "Merge to single pane", labels.dualPane)}
				onClick={handlers.toggleDualPane}
				isActive={paneState.count === 2}
			/>
			<ToolbarButton
				icon={Icons.WrapText}
				title={withHotkey(isWrapping ? "Disable line wrapping" : "Enable line wrapping", labels.wrap)}
				onClick={toggleLineWrapping}
				isActive={isWrapping}
			/>

			<div className="flex-1" />

			<SyncIndicatorButton isActive={activeViews.has("sync-view")} />
			<ToolbarButton
				icon={Icons.Settings}
				title={withHotkey("Settings", labels.settings)}
				onClick={handlers.openSettings}
				isActive={activeViews.has("config-view")}
			/>
			<LayoutMenu
				actions={[
					{ id: "toggleZenMode", label: "Zen mode", icon: Icons.Sparkles, run: handlers.toggleZenMode },
					{ id: "openHotkeys", label: "Keyboard shortcuts", icon: Icons.Keyboard, run: handlers.openHotkeys },
					{ id: "openBranding", label: "About IrisNotes", icon: Icons.Info, run: handlers.openBranding },
				]}
			/>
		</div>
	);
}
