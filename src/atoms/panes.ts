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
