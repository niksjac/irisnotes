import { atom } from "jotai";
import type { PaneState, Tab } from "@/types";
import { sidebarWidth, sidebarCollapsed } from "./index";

// Pane configuration
export const paneStateAtom = atom<PaneState>({
	count: 1,
	activePane: 0,
	splitDirection: 'horizontal',
});

// Tab state per pane
export const pane0TabsAtom = atom<Tab[]>([]);
export const pane1TabsAtom = atom<Tab[]>([]);

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
	return paneState.activePane === 0 ? get(pane0ActiveTabAtom) : get(pane1ActiveTabAtom);
});

// Get active tab object
export const activeTabAtom = atom((get) => {
	const tabs = get(activePaneTabsAtom);
	const activeTabId = get(activePaneActiveTabAtom);
	return tabs.find(tab => tab.id === activeTabId) || null;
});

// Tab management actions
export const newTabInActivePaneAtom = atom(null, (get, set) => {
	const paneState = get(paneStateAtom);
	const paneIndex = paneState.activePane;

	const newTab: Tab = {
		id: `empty-tab-${Date.now()}`,
		title: 'Empty Tab',
		viewType: 'empty-view',
	};

	if (paneIndex === 0) {
		set(pane0TabsAtom, prev => [...prev, newTab]);
		set(pane0ActiveTabAtom, newTab.id);
	} else {
		set(pane1TabsAtom, prev => [...prev, newTab]);
		set(pane1ActiveTabAtom, newTab.id);
	}
});

export const moveActiveTabLeftAtom = atom(null, (get, set) => {
	const paneState = get(paneStateAtom);
	const paneIndex = paneState.activePane;
	const tabs = paneIndex === 0 ? get(pane0TabsAtom) : get(pane1TabsAtom);
	const activeTabId = paneIndex === 0 ? get(pane0ActiveTabAtom) : get(pane1ActiveTabAtom);
	const setTabs = paneIndex === 0 ? pane0TabsAtom : pane1TabsAtom;

	if (!activeTabId || tabs.length <= 1) return;

	const currentIndex = tabs.findIndex(tab => tab.id === activeTabId);
	if (currentIndex <= 0) return; // Already at leftmost position

	const newTabs = [...tabs];
	const temp = newTabs[currentIndex - 1]!;
	newTabs[currentIndex - 1] = newTabs[currentIndex]!;
	newTabs[currentIndex] = temp;
	set(setTabs, newTabs);
});

export const moveActiveTabRightAtom = atom(null, (get, set) => {
	const paneState = get(paneStateAtom);
	const paneIndex = paneState.activePane;
	const tabs = paneIndex === 0 ? get(pane0TabsAtom) : get(pane1TabsAtom);
	const activeTabId = paneIndex === 0 ? get(pane0ActiveTabAtom) : get(pane1ActiveTabAtom);
	const setTabs = paneIndex === 0 ? pane0TabsAtom : pane1TabsAtom;

	if (!activeTabId || tabs.length <= 1) return;

	const currentIndex = tabs.findIndex(tab => tab.id === activeTabId);
	if (currentIndex >= tabs.length - 1) return; // Already at rightmost position

	const newTabs = [...tabs];
	const temp = newTabs[currentIndex]!;
	newTabs[currentIndex] = newTabs[currentIndex + 1]!;
	newTabs[currentIndex + 1] = temp;
	set(setTabs, newTabs);
});

export const toggleDualPaneModeAtom = atom(null, (get, set) => {
	const paneState = get(paneStateAtom);
	const newCount = paneState.count === 1 ? 2 : 1;
	set(paneStateAtom, { ...paneState, count: newCount });
});

// Pane resizing actions
export const resizePaneLeftAtom = atom(null, (get) => {
	const paneState = get(paneStateAtom);
	if (paneState.count !== 2) return; // Only works in dual pane mode

	// Get current widths from CSS custom properties
	const leftWidth = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pane-left-width')) || 50;

	// Decrease left pane by 5%, increase right pane
	const newLeftWidth = Math.max(20, leftWidth - 5); // Min 20%
	const newRightWidth = 100 - newLeftWidth;

	document.documentElement.style.setProperty('--pane-left-width', `${newLeftWidth}%`);
	document.documentElement.style.setProperty('--pane-right-width', `${newRightWidth}%`);
});

export const resizePaneRightAtom = atom(null, (get) => {
	const paneState = get(paneStateAtom);
	if (paneState.count !== 2) return; // Only works in dual pane mode

	// Get current widths from CSS custom properties
	const leftWidth = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pane-left-width')) || 50;

	// Increase left pane by 5%, decrease right pane
	const newLeftWidth = Math.min(80, leftWidth + 5); // Max 80%
	const newRightWidth = 100 - newLeftWidth;

	document.documentElement.style.setProperty('--pane-left-width', `${newLeftWidth}%`);
	document.documentElement.style.setProperty('--pane-right-width', `${newRightWidth}%`);
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

// Pane focus actions
export const focusPane1Atom = atom(null, (get, set) => {
	const paneState = get(paneStateAtom);
	if (paneState.count === 2) {
		set(paneStateAtom, { ...paneState, activePane: 0 });
	}
});

export const focusPane2Atom = atom(null, (get, set) => {
	const paneState = get(paneStateAtom);
	if (paneState.count === 2) {
		set(paneStateAtom, { ...paneState, activePane: 1 });
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

	const tabToMove = sourceTabs.find(tab => tab.id === sourceActiveTab);
	if (!tabToMove) return;

	// Remove from source pane
	const newSourceTabs = sourceTabs.filter(tab => tab.id !== sourceActiveTab);
	set(pane1TabsAtom, newSourceTabs);

	// Add to target pane
	const targetTabs = get(pane0TabsAtom);
	set(pane0TabsAtom, [...targetTabs, tabToMove]);
	set(pane0ActiveTabAtom, tabToMove.id);

	// Update source active tab
	if (newSourceTabs.length > 0) {
		const newActiveIndex = Math.min(sourceTabs.findIndex(tab => tab.id === sourceActiveTab), newSourceTabs.length - 1);
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

	const tabToMove = sourceTabs.find(tab => tab.id === sourceActiveTab);
	if (!tabToMove) return;

	// Remove from source pane
	const newSourceTabs = sourceTabs.filter(tab => tab.id !== sourceActiveTab);
	set(pane0TabsAtom, newSourceTabs);

	// Add to target pane
	const targetTabs = get(pane1TabsAtom);
	set(pane1TabsAtom, [...targetTabs, tabToMove]);
	set(pane1ActiveTabAtom, tabToMove.id);

	// Update source active tab
	if (newSourceTabs.length > 0) {
		const newActiveIndex = Math.min(sourceTabs.findIndex(tab => tab.id === sourceActiveTab), newSourceTabs.length - 1);
		set(pane0ActiveTabAtom, newSourceTabs[newActiveIndex]?.id || null);
	} else {
		set(pane0ActiveTabAtom, null);
	}

	// Switch focus to target pane
	set(paneStateAtom, { ...paneState, activePane: 1 });
});

// Tab focus by number actions
export const focusTabByNumberAtom = atom(null, (get, set, tabNumber: number) => {
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
});

// Individual tab focus atoms for hotkeys
export const focusTab1Atom = atom(null, (_, set) => set(focusTabByNumberAtom, 1));
export const focusTab2Atom = atom(null, (_, set) => set(focusTabByNumberAtom, 2));
export const focusTab3Atom = atom(null, (_, set) => set(focusTabByNumberAtom, 3));
export const focusTab4Atom = atom(null, (_, set) => set(focusTabByNumberAtom, 4));
export const focusTab5Atom = atom(null, (_, set) => set(focusTabByNumberAtom, 5));
export const focusTab6Atom = atom(null, (_, set) => set(focusTabByNumberAtom, 6));
export const focusTab7Atom = atom(null, (_, set) => set(focusTabByNumberAtom, 7));
export const focusTab8Atom = atom(null, (_, set) => set(focusTabByNumberAtom, 8));
export const focusTab9Atom = atom(null, (_, set) => set(focusTabByNumberAtom, 9));

// Tab navigation atoms
export const focusNextTabAtom = atom(null, (get, set) => {
	const paneState = get(paneStateAtom);
	const activePane = paneState.activePane;
	const tabs = activePane === 0 ? get(pane0TabsAtom) : get(pane1TabsAtom);
	const currentActiveTabId = activePane === 0 ? get(pane0ActiveTabAtom) : get(pane1ActiveTabAtom);

	if (tabs.length <= 1 || !currentActiveTabId) return;

	const currentIndex = tabs.findIndex(tab => tab.id === currentActiveTabId);
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
	const currentActiveTabId = activePane === 0 ? get(pane0ActiveTabAtom) : get(pane1ActiveTabAtom);

	if (tabs.length <= 1 || !currentActiveTabId) return;

	const currentIndex = tabs.findIndex(tab => tab.id === currentActiveTabId);
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

export const closeActiveTabAtom = atom(null, (get, set) => {
	const paneState = get(paneStateAtom);
	const activePane = paneState.activePane;

	if (activePane === 0) {
		const tabs = get(pane0TabsAtom);
		const activeTabId = get(pane0ActiveTabAtom);

		if (activeTabId) {
			// Find the index of the tab being closed
			const closingTabIndex = tabs.findIndex(tab => tab.id === activeTabId);
			const newTabs = tabs.filter(tab => tab.id !== activeTabId);
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
			// Find the index of the tab being closed
			const closingTabIndex = tabs.findIndex(tab => tab.id === activeTabId);
			const newTabs = tabs.filter(tab => tab.id !== activeTabId);
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
