import { atom } from "jotai";
import type { PaneState, Tab } from "@/types";
import { sidebarWidth, sidebarCollapsed, focusAreaAtom } from "./index";

// Pane configuration
export const paneStateAtom = atom<PaneState>({
	count: 1,
	activePane: 0,
	splitDirection: "horizontal",
});

// Tab bar visibility
export const tabBarVisibleAtom = atom<boolean>(true);

// Toggle tab bar visibility
export const toggleTabBarAtom = atom(null, (get, set) => {
	set(tabBarVisibleAtom, !get(tabBarVisibleAtom));
});

// Tab state per pane
export const pane0TabsAtom = atom<Tab[]>([]);
export const pane1TabsAtom = atom<Tab[]>([]);

// Recently closed tabs stack (for Ctrl+Shift+T reopen)
interface ClosedTabEntry {
	tab: Tab;
	paneIndex: 0 | 1;
}
export const recentlyClosedTabsAtom = atom<ClosedTabEntry[]>([]);
const MAX_RECENTLY_CLOSED = 20; // Keep at most 20 recently closed tabs

// Active tab per pane
export const pane0ActiveTabAtom = atom<string | null>(null);
export const pane1ActiveTabAtom = atom<string | null>(null);

// Helper derived atoms
export const activePaneTabsAtom = atom((get) => {
	const paneState = get(paneStateAtom);
	return paneState.activePane === 0 ? get(pane0TabsAtom) : get(pane1TabsAtom);
});

export const activePaneActiveTabAtom = atom((get) => {
	const paneState = get(paneStateAtom);
	return paneState.activePane === 0
		? get(pane0ActiveTabAtom)
		: get(pane1ActiveTabAtom);
});

// Get active tab object
export const activeTabAtom = atom((get) => {
	const tabs = get(activePaneTabsAtom);
	const activeTabId = get(activePaneActiveTabAtom);
	return tabs.find((tab) => tab.id === activeTabId) || null;
});

// Open or focus a special view tab (Settings, Hotkeys, etc.)
// If tab already exists, switch to it. Otherwise create a new one.
export const openSettingsTabAtom = atom(null, (get, set) => {
	const pane0Tabs = get(pane0TabsAtom);
	const pane1Tabs = get(pane1TabsAtom);

	// Check if settings tab already exists in either pane
	const existingInPane0 = pane0Tabs.find((tab) => tab.viewType === "config-view");
	const existingInPane1 = pane1Tabs.find((tab) => tab.viewType === "config-view");

	if (existingInPane0) {
		// Switch to existing tab in pane 0
		set(pane0ActiveTabAtom, existingInPane0.id);
		set(paneStateAtom, (prev) => ({ ...prev, activePane: 0 }));
		set(focusAreaAtom, "pane-0");
		return;
	}

	if (existingInPane1) {
		// Switch to existing tab in pane 1
		set(pane1ActiveTabAtom, existingInPane1.id);
		set(paneStateAtom, (prev) => ({ ...prev, activePane: 1 }));
		set(focusAreaAtom, "pane-1");
		return;
	}

	// Create new settings tab in active pane
	const paneState = get(paneStateAtom);
	const newTab: Tab = {
		id: "settings-tab",
		title: "Settings",
		viewType: "config-view",
		openedAt: Date.now(),
	};

	if (paneState.activePane === 0) {
		set(pane0TabsAtom, (prev) => [...prev, newTab]);
		set(pane0ActiveTabAtom, newTab.id);
		set(focusAreaAtom, "pane-0");
	} else {
		set(pane1TabsAtom, (prev) => [...prev, newTab]);
		set(pane1ActiveTabAtom, newTab.id);
		set(focusAreaAtom, "pane-1");
	}
});

export const openHotkeysTabAtom = atom(null, (get, set) => {
	const pane0Tabs = get(pane0TabsAtom);
	const pane1Tabs = get(pane1TabsAtom);

	// Check if hotkeys tab already exists in either pane
	const existingInPane0 = pane0Tabs.find((tab) => tab.viewType === "hotkeys-view");
	const existingInPane1 = pane1Tabs.find((tab) => tab.viewType === "hotkeys-view");

	if (existingInPane0) {
		set(pane0ActiveTabAtom, existingInPane0.id);
		set(paneStateAtom, (prev) => ({ ...prev, activePane: 0 }));
		set(focusAreaAtom, "pane-0");
		return;
	}

	if (existingInPane1) {
		set(pane1ActiveTabAtom, existingInPane1.id);
		set(paneStateAtom, (prev) => ({ ...prev, activePane: 1 }));
		set(focusAreaAtom, "pane-1");
		return;
	}

	// Create new hotkeys tab in active pane
	const paneState = get(paneStateAtom);
	const newTab: Tab = {
		id: "hotkeys-tab",
		title: "Keyboard Shortcuts",
		viewType: "hotkeys-view",
		openedAt: Date.now(),
	};

	if (paneState.activePane === 0) {
		set(pane0TabsAtom, (prev) => [...prev, newTab]);
		set(pane0ActiveTabAtom, newTab.id);
		set(focusAreaAtom, "pane-0");
	} else {
		set(pane1TabsAtom, (prev) => [...prev, newTab]);
		set(pane1ActiveTabAtom, newTab.id);
		set(focusAreaAtom, "pane-1");
	}
});

export const moveActiveTabLeftAtom = atom(null, (get, set) => {
	const paneState = get(paneStateAtom);
	const paneIndex = paneState.activePane;
	const tabs = paneIndex === 0 ? get(pane0TabsAtom) : get(pane1TabsAtom);
	const activeTabId =
		paneIndex === 0 ? get(pane0ActiveTabAtom) : get(pane1ActiveTabAtom);
	const setTabs = paneIndex === 0 ? pane0TabsAtom : pane1TabsAtom;

	if (!activeTabId || tabs.length <= 1) return;

	const currentIndex = tabs.findIndex((tab) => tab.id === activeTabId);
	if (currentIndex <= 0) return; // Already at leftmost position

	const newTabs = [...tabs];
	const temp = newTabs[currentIndex - 1];
	const current = newTabs[currentIndex];
	if (temp && current) {
		newTabs[currentIndex - 1] = current;
		newTabs[currentIndex] = temp;
	}
	set(setTabs, newTabs);
});

export const moveActiveTabRightAtom = atom(null, (get, set) => {
	const paneState = get(paneStateAtom);
	const paneIndex = paneState.activePane;
	const tabs = paneIndex === 0 ? get(pane0TabsAtom) : get(pane1TabsAtom);
	const activeTabId =
		paneIndex === 0 ? get(pane0ActiveTabAtom) : get(pane1ActiveTabAtom);
	const setTabs = paneIndex === 0 ? pane0TabsAtom : pane1TabsAtom;

	if (!activeTabId || tabs.length <= 1) return;

	const currentIndex = tabs.findIndex((tab) => tab.id === activeTabId);
	if (currentIndex >= tabs.length - 1) return; // Already at rightmost position

	const newTabs = [...tabs];
	const temp = newTabs[currentIndex];
	const next = newTabs[currentIndex + 1];
	if (temp && next) {
		newTabs[currentIndex] = next;
		newTabs[currentIndex + 1] = temp;
	}
	set(setTabs, newTabs);
});

export const toggleDualPaneModeAtom = atom(null, (get, set) => {
	const paneState = get(paneStateAtom);
	const newCount = paneState.count === 1 ? 2 : 1;
	
	// When closing dual pane mode, merge pane1 tabs into pane0
	if (newCount === 1 && paneState.count === 2) {
		const pane1Tabs = get(pane1TabsAtom);
		const pane1ActiveTab = get(pane1ActiveTabAtom);
		
		if (pane1Tabs.length > 0) {
			// Merge tabs from pane1 to pane0
			set(pane0TabsAtom, (prev) => [...prev, ...pane1Tabs]);
			// Clear pane1 tabs
			set(pane1TabsAtom, []);
			// If pane1 had an active tab, make it active in pane0
			if (pane1ActiveTab) {
				set(pane0ActiveTabAtom, pane1ActiveTab);
			}
			set(pane1ActiveTabAtom, null);
		}
		
		// Reset focus area to pane-0 when closing dual mode
		const focusArea = get(focusAreaAtom);
		if (focusArea === "pane-1") {
			set(focusAreaAtom, "pane-0");
		}
	}
	
	set(paneStateAtom, { ...paneState, count: newCount, activePane: 0 });
});

// Pane resizing actions
export const resizePaneLeftAtom = atom(null, (get) => {
	const paneState = get(paneStateAtom);
	if (paneState.count !== 2) return; // Only works in dual pane mode

	// Get current widths from CSS custom properties
	const leftWidth =
		parseFloat(
			getComputedStyle(document.documentElement).getPropertyValue(
				"--pane-left-width"
			)
		) || 50;

	// Decrease left pane by 5%, increase right pane
	const newLeftWidth = Math.max(20, leftWidth - 5); // Min 20%
	const newRightWidth = 100 - newLeftWidth;

	document.documentElement.style.setProperty(
		"--pane-left-width",
		`${newLeftWidth}%`
	);
	document.documentElement.style.setProperty(
		"--pane-right-width",
		`${newRightWidth}%`
	);
});

export const resizePaneRightAtom = atom(null, (get) => {
	const paneState = get(paneStateAtom);
	if (paneState.count !== 2) return; // Only works in dual pane mode

	// Get current widths from CSS custom properties
	const leftWidth =
		parseFloat(
			getComputedStyle(document.documentElement).getPropertyValue(
				"--pane-left-width"
			)
		) || 50;

	// Increase left pane by 5%, decrease right pane
	const newLeftWidth = Math.min(80, leftWidth + 5); // Max 80%
	const newRightWidth = 100 - newLeftWidth;

	document.documentElement.style.setProperty(
		"--pane-left-width",
		`${newLeftWidth}%`
	);
	document.documentElement.style.setProperty(
		"--pane-right-width",
		`${newRightWidth}%`
	);
});

// Sidebar resizing actions
export const resizeSidebarLeftAtom = atom(null, (get, set) => {
	const isCollapsed = get(sidebarCollapsed);
	if (isCollapsed) return; // Don't resize when collapsed

	const currentWidth = get(sidebarWidth);
	const newWidth = Math.max(200, currentWidth - 20); // Min 200px, decrease by 20px
	set(sidebarWidth, newWidth);
});

export const resizeSidebarRightAtom = atom(null, (get, set) => {
	const isCollapsed = get(sidebarCollapsed);
	if (isCollapsed) return; // Don't resize when collapsed

	const currentWidth = get(sidebarWidth);
	const newWidth = Math.min(600, currentWidth + 20); // Max 600px, increase by 20px
	set(sidebarWidth, newWidth);
});

// Helper to focus the editor inside a pane
const focusEditorInPane = (paneIndex: 0 | 1) => {
	const paneElement = document.querySelector(`[data-pane-index="${paneIndex}"]`) as HTMLElement | null;
	if (!paneElement) return;
	
	// Try to find and focus the editor (CodeMirror or ProseMirror)
	const cmEditor = paneElement.querySelector('.cm-editor .cm-content') as HTMLElement | null;
	const pmEditor = paneElement.querySelector('.ProseMirror') as HTMLElement | null;
	const anyFocusable = paneElement.querySelector('[contenteditable="true"], textarea, input') as HTMLElement | null;
	
	if (cmEditor) {
		cmEditor.focus();
	} else if (pmEditor) {
		pmEditor.focus();
	} else if (anyFocusable) {
		anyFocusable.focus();
	} else {
		// Fallback to pane itself
		paneElement.focus();
	}
};

// Pane focus actions
export const focusPane1Atom = atom(null, (get, set) => {
	const paneState = get(paneStateAtom);
	if (paneState.count === 2) {
		set(paneStateAtom, { ...paneState, activePane: 0 });
		set(focusAreaAtom, "pane-0");
		// Focus the editor inside the pane
		setTimeout(() => focusEditorInPane(0), 0);
	}
});

export const focusPane2Atom = atom(null, (get, set) => {
	const paneState = get(paneStateAtom);
	if (paneState.count === 2) {
		set(paneStateAtom, { ...paneState, activePane: 1 });
		set(focusAreaAtom, "pane-1");
		// Focus the editor inside the pane
		setTimeout(() => focusEditorInPane(1), 0);
	}
});

// Tab movement between panes actions
export const moveTabToPaneLeftAtom = atom(null, (get, set) => {
	const paneState = get(paneStateAtom);
	if (paneState.count !== 2) return; // Only works in dual pane mode

	const currentPane = paneState.activePane;
	const targetPane = currentPane === 1 ? 0 : null; // Can only move from right to left

	if (targetPane === null) return; // Already in leftmost pane or invalid

	const sourceTabs = get(pane1TabsAtom);
	const sourceActiveTab = get(pane1ActiveTabAtom);

	if (!sourceActiveTab || sourceTabs.length === 0) return;

	const tabToMove = sourceTabs.find((tab) => tab.id === sourceActiveTab);
	if (!tabToMove) return;

	// Remove from source pane
	const newSourceTabs = sourceTabs.filter((tab) => tab.id !== sourceActiveTab);
	set(pane1TabsAtom, newSourceTabs);

	// Add to target pane
	const targetTabs = get(pane0TabsAtom);
	set(pane0TabsAtom, [...targetTabs, tabToMove]);
	set(pane0ActiveTabAtom, tabToMove.id);

	// Update source active tab
	if (newSourceTabs.length > 0) {
		const newActiveIndex = Math.min(
			sourceTabs.findIndex((tab) => tab.id === sourceActiveTab),
			newSourceTabs.length - 1
		);
		set(pane1ActiveTabAtom, newSourceTabs[newActiveIndex]?.id || null);
	} else {
		set(pane1ActiveTabAtom, null);
	}

	// Switch focus to target pane
	set(paneStateAtom, { ...paneState, activePane: 0 });
});

export const moveTabToPaneRightAtom = atom(null, (get, set) => {
	const paneState = get(paneStateAtom);
	if (paneState.count !== 2) return; // Only works in dual pane mode

	const currentPane = paneState.activePane;
	const targetPane = currentPane === 0 ? 1 : null; // Can only move from left to right

	if (targetPane === null) return; // Already in rightmost pane or invalid

	const sourceTabs = get(pane0TabsAtom);
	const sourceActiveTab = get(pane0ActiveTabAtom);

	if (!sourceActiveTab || sourceTabs.length === 0) return;

	const tabToMove = sourceTabs.find((tab) => tab.id === sourceActiveTab);
	if (!tabToMove) return;

	// Remove from source pane
	const newSourceTabs = sourceTabs.filter((tab) => tab.id !== sourceActiveTab);
	set(pane0TabsAtom, newSourceTabs);

	// Add to target pane
	const targetTabs = get(pane1TabsAtom);
	set(pane1TabsAtom, [...targetTabs, tabToMove]);
	set(pane1ActiveTabAtom, tabToMove.id);

	// Update source active tab
	if (newSourceTabs.length > 0) {
		const newActiveIndex = Math.min(
			sourceTabs.findIndex((tab) => tab.id === sourceActiveTab),
			newSourceTabs.length - 1
		);
		set(pane0ActiveTabAtom, newSourceTabs[newActiveIndex]?.id || null);
	} else {
		set(pane0ActiveTabAtom, null);
	}

	// Switch focus to target pane
	set(paneStateAtom, { ...paneState, activePane: 1 });
});

// Tab focus by number actions
export const focusTabByNumberAtom = atom(
	null,
	(get, set, tabNumber: number) => {
		const paneState = get(paneStateAtom);
		const activePane = paneState.activePane;
		const tabs = activePane === 0 ? get(pane0TabsAtom) : get(pane1TabsAtom);

		if (tabNumber >= 1 && tabNumber <= tabs.length) {
			const targetTab = tabs[tabNumber - 1]; // Convert to 0-based index
			if (targetTab) {
				if (activePane === 0) {
					set(pane0ActiveTabAtom, targetTab.id);
				} else {
					set(pane1ActiveTabAtom, targetTab.id);
				}
			}
		}
	}
);

// Individual tab focus atoms for hotkeys
export const focusTab1Atom = atom(null, (_, set) =>
	set(focusTabByNumberAtom, 1)
);
export const focusTab2Atom = atom(null, (_, set) =>
	set(focusTabByNumberAtom, 2)
);
export const focusTab3Atom = atom(null, (_, set) =>
	set(focusTabByNumberAtom, 3)
);
export const focusTab4Atom = atom(null, (_, set) =>
	set(focusTabByNumberAtom, 4)
);
export const focusTab5Atom = atom(null, (_, set) =>
	set(focusTabByNumberAtom, 5)
);
export const focusTab6Atom = atom(null, (_, set) =>
	set(focusTabByNumberAtom, 6)
);
export const focusTab7Atom = atom(null, (_, set) =>
	set(focusTabByNumberAtom, 7)
);
export const focusTab8Atom = atom(null, (_, set) =>
	set(focusTabByNumberAtom, 8)
);
export const focusTab9Atom = atom(null, (_, set) =>
	set(focusTabByNumberAtom, 9)
);

// Tab navigation atoms
export const focusNextTabAtom = atom(null, (get, set) => {
	const paneState = get(paneStateAtom);
	const activePane = paneState.activePane;
	const tabs = activePane === 0 ? get(pane0TabsAtom) : get(pane1TabsAtom);
	const currentActiveTabId =
		activePane === 0 ? get(pane0ActiveTabAtom) : get(pane1ActiveTabAtom);

	if (tabs.length <= 1 || !currentActiveTabId) return;

	const currentIndex = tabs.findIndex((tab) => tab.id === currentActiveTabId);
	if (currentIndex === -1) return;

	// Move to next tab, wrapping around to first if at the end
	const nextIndex = (currentIndex + 1) % tabs.length;
	const nextTab = tabs[nextIndex];

	if (nextTab) {
		if (activePane === 0) {
			set(pane0ActiveTabAtom, nextTab.id);
		} else {
			set(pane1ActiveTabAtom, nextTab.id);
		}
	}
});

export const focusPreviousTabAtom = atom(null, (get, set) => {
	const paneState = get(paneStateAtom);
	const activePane = paneState.activePane;
	const tabs = activePane === 0 ? get(pane0TabsAtom) : get(pane1TabsAtom);
	const currentActiveTabId =
		activePane === 0 ? get(pane0ActiveTabAtom) : get(pane1ActiveTabAtom);

	if (tabs.length <= 1 || !currentActiveTabId) return;

	const currentIndex = tabs.findIndex((tab) => tab.id === currentActiveTabId);
	if (currentIndex === -1) return;

	// Move to previous tab, wrapping around to last if at the beginning
	const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
	const prevTab = tabs[prevIndex];

	if (prevTab) {
		if (activePane === 0) {
			set(pane0ActiveTabAtom, prevTab.id);
		} else {
			set(pane1ActiveTabAtom, prevTab.id);
		}
	}
});

// Spawn-order navigation atoms (navigate tabs by openedAt timestamp)
export const focusNextSpawnedTabAtom = atom(null, (get, set) => {
	const paneState = get(paneStateAtom);
	const activePane = paneState.activePane;
	const tabs = activePane === 0 ? get(pane0TabsAtom) : get(pane1TabsAtom);
	const currentActiveTabId =
		activePane === 0 ? get(pane0ActiveTabAtom) : get(pane1ActiveTabAtom);

	if (tabs.length <= 1 || !currentActiveTabId) return;

	// Sort tabs by openedAt timestamp
	const sortedTabs = [...tabs].sort((a, b) => a.openedAt - b.openedAt);
	const currentIndex = sortedTabs.findIndex((tab) => tab.id === currentActiveTabId);
	if (currentIndex === -1) return;

	// Move to next tab in spawn order, wrapping around
	const nextIndex = (currentIndex + 1) % sortedTabs.length;
	const nextTab = sortedTabs[nextIndex];

	if (nextTab) {
		if (activePane === 0) {
			set(pane0ActiveTabAtom, nextTab.id);
		} else {
			set(pane1ActiveTabAtom, nextTab.id);
		}
	}
});

export const focusPreviousSpawnedTabAtom = atom(null, (get, set) => {
	const paneState = get(paneStateAtom);
	const activePane = paneState.activePane;
	const tabs = activePane === 0 ? get(pane0TabsAtom) : get(pane1TabsAtom);
	const currentActiveTabId =
		activePane === 0 ? get(pane0ActiveTabAtom) : get(pane1ActiveTabAtom);

	if (tabs.length <= 1 || !currentActiveTabId) return;

	// Sort tabs by openedAt timestamp
	const sortedTabs = [...tabs].sort((a, b) => a.openedAt - b.openedAt);
	const currentIndex = sortedTabs.findIndex((tab) => tab.id === currentActiveTabId);
	if (currentIndex === -1) return;

	// Move to previous tab in spawn order, wrapping around
	const prevIndex = currentIndex === 0 ? sortedTabs.length - 1 : currentIndex - 1;
	const prevTab = sortedTabs[prevIndex];

	if (prevTab) {
		if (activePane === 0) {
			set(pane0ActiveTabAtom, prevTab.id);
		} else {
			set(pane1ActiveTabAtom, prevTab.id);
		}
	}
});

export const closeActiveTabAtom = atom(null, (get, set) => {
	const paneState = get(paneStateAtom);
	const activePane = paneState.activePane;

	if (activePane === 0) {
		const tabs = get(pane0TabsAtom);
		const activeTabId = get(pane0ActiveTabAtom);

		if (activeTabId) {
			// Find the tab being closed and save it to recently closed stack
			const closingTab = tabs.find((tab) => tab.id === activeTabId);
			if (closingTab) {
				const recentlyClosed = get(recentlyClosedTabsAtom);
				const newRecentlyClosed = [
					{ tab: closingTab, paneIndex: 0 as const },
					...recentlyClosed.slice(0, MAX_RECENTLY_CLOSED - 1),
				];
				set(recentlyClosedTabsAtom, newRecentlyClosed);
			}

			// Find the index of the tab being closed
			const closingTabIndex = tabs.findIndex((tab) => tab.id === activeTabId);
			const newTabs = tabs.filter((tab) => tab.id !== activeTabId);
			set(pane0TabsAtom, newTabs);

			// If we closed the active tab, select the next appropriate tab
			if (newTabs.length > 0) {
				// If there's a tab after the closed one, select it
				// Otherwise, select the previous tab (or the last one if closing the last tab)
				const nextTabIndex = Math.min(closingTabIndex, newTabs.length - 1);
				set(pane0ActiveTabAtom, newTabs[nextTabIndex]?.id || null);
			} else {
				set(pane0ActiveTabAtom, null);
			}
		}
	} else {
		const tabs = get(pane1TabsAtom);
		const activeTabId = get(pane1ActiveTabAtom);

		if (activeTabId) {
			// Find the tab being closed and save it to recently closed stack
			const closingTab = tabs.find((tab) => tab.id === activeTabId);
			if (closingTab) {
				const recentlyClosed = get(recentlyClosedTabsAtom);
				const newRecentlyClosed = [
					{ tab: closingTab, paneIndex: 1 as const },
					...recentlyClosed.slice(0, MAX_RECENTLY_CLOSED - 1),
				];
				set(recentlyClosedTabsAtom, newRecentlyClosed);
			}

			// Find the index of the tab being closed
			const closingTabIndex = tabs.findIndex((tab) => tab.id === activeTabId);
			const newTabs = tabs.filter((tab) => tab.id !== activeTabId);
			set(pane1TabsAtom, newTabs);

			// If we closed the active tab, select the next appropriate tab
			if (newTabs.length > 0) {
				// If there's a tab after the closed one, select it
				// Otherwise, select the previous tab (or the last one if closing the last tab)
				const nextTabIndex = Math.min(closingTabIndex, newTabs.length - 1);
				set(pane1ActiveTabAtom, newTabs[nextTabIndex]?.id || null);
			} else {
				set(pane1ActiveTabAtom, null);
			}
		}
	}
});

// Reopen last closed tab
export const reopenLastClosedTabAtom = atom(null, (get, set) => {
	const recentlyClosed = get(recentlyClosedTabsAtom);
	if (recentlyClosed.length === 0) return;

	const [lastClosed, ...remaining] = recentlyClosed;
	if (!lastClosed) return;

	const { tab, paneIndex } = lastClosed;
	const paneState = get(paneStateAtom);

	// Determine which pane to reopen in:
	// - If original pane still exists (single pane mode = pane 0 only), use it
	// - Otherwise use the active pane
	const targetPane = paneState.count === 1 ? 0 : paneIndex;

	// Add the tab back to the appropriate pane
	if (targetPane === 0) {
		const tabs = get(pane0TabsAtom);
		// Generate new ID to avoid conflicts if same note was reopened in another tab
		const reopenedTab = { ...tab, id: `${tab.viewData?.noteId || 'tab'}-${Date.now()}` };
		set(pane0TabsAtom, [...tabs, reopenedTab]);
		set(pane0ActiveTabAtom, reopenedTab.id);
	} else {
		const tabs = get(pane1TabsAtom);
		const reopenedTab = { ...tab, id: `${tab.viewData?.noteId || 'tab'}-${Date.now()}` };
		set(pane1TabsAtom, [...tabs, reopenedTab]);
		set(pane1ActiveTabAtom, reopenedTab.id);
	}

	// Set focus to the pane where we reopened the tab
	set(paneStateAtom, { ...paneState, activePane: targetPane });

	// Remove from recently closed stack
	set(recentlyClosedTabsAtom, remaining);
});
