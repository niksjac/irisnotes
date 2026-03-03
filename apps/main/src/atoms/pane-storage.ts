/**
 * Pane/Tab state persistence — loaded synchronously at module init.
 * Separate file to avoid circular dependency between index.ts and panes.ts.
 */
import type { PaneState, Tab } from "@/types";

export const PANE_STORAGE_KEY = "irisnotes-pane-state";

export interface PaneStorageState {
	paneState: PaneState;
	pane0Tabs: Tab[];
	pane1Tabs: Tab[];
	pane0ActiveTab: string | null;
	pane1ActiveTab: string | null;
	tabBarVisible: boolean;
}

const DEFAULT_PANE_STATE: PaneStorageState = {
	paneState: { count: 1, activePane: 0, splitDirection: "horizontal" },
	pane0Tabs: [],
	pane1Tabs: [],
	pane0ActiveTab: null,
	pane1ActiveTab: null,
	tabBarVisible: true,
};

const loadInitialPaneState = (): PaneStorageState => {
	try {
		const stored = localStorage.getItem(PANE_STORAGE_KEY);
		if (stored) {
			return { ...DEFAULT_PANE_STATE, ...JSON.parse(stored) };
		}
	} catch {
		// Ignore errors during initial load
	}
	return DEFAULT_PANE_STATE;
};

export const initialPaneStorage = loadInitialPaneState();
