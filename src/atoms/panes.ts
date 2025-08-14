import { atom } from "jotai";
import type { PaneState, Tab } from "@/types";

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
