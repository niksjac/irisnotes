import { atom } from "jotai";
import {
	activityBarVisible,
	sidebarCollapsed,
	toolbarVisibleAtom,
	zenModeAtom,
	zenModePreviousStateAtom,
	statusBarVisibleAtom,
} from "./index";
import { tabBarVisibleAtom } from "./panes";

// Layout actions
export const toggleSidebarAtom = atom(null, (get, set) => {
	const current = get(sidebarCollapsed);
	set(sidebarCollapsed, !current);
});

export const toggleActivityBarAtom = atom(null, (get, set) => {
	const current = get(activityBarVisible);
	set(activityBarVisible, !current);
});

export const toggleToolbarAtom = atom(null, (get, set) => {
	const current = get(toolbarVisibleAtom);
	set(toolbarVisibleAtom, !current);
});

// Zen mode toggle - hides all UI for distraction-free writing
// Note: Title bar (note name) remains visible in zen mode
export const toggleZenModeAtom = atom(null, (get, set) => {
	const isZenMode = get(zenModeAtom);
	
	if (!isZenMode) {
		// Entering zen mode - save current state and hide everything except title
		const previousState = {
			sidebarCollapsed: get(sidebarCollapsed),
			activityBarVisible: get(activityBarVisible),
			toolbarVisible: get(toolbarVisibleAtom),
			tabBarVisible: get(tabBarVisibleAtom),
			statusBarVisible: get(statusBarVisibleAtom),
		};
		set(zenModePreviousStateAtom, previousState);
		
		// Hide UI elements (keep title bar visible)
		set(sidebarCollapsed, true);
		set(activityBarVisible, false);
		set(toolbarVisibleAtom, false);
		set(tabBarVisibleAtom, false);
		set(statusBarVisibleAtom, false);
		set(zenModeAtom, true);
	} else {
		// Exiting zen mode - always restore full visibility so everything comes back on
		set(sidebarCollapsed, false);
		set(activityBarVisible, true);
		set(toolbarVisibleAtom, true);
		set(tabBarVisibleAtom, true);
		set(statusBarVisibleAtom, true);
		set(zenModePreviousStateAtom, null);
		set(zenModeAtom, false);
	}
});

export const handleSidebarCollapsedChangeAtom = atom(
	null,
	(_, set, collapsed: boolean) => {
		set(sidebarCollapsed, collapsed);
	}
);

// New note (root) name dialog state
export const newNoteDialogOpenAtom = atom<boolean>(false);

// New book dialog state
export const newBookDialogOpenAtom = atom<boolean>(false);

// New section dialog state
export const newSectionDialogOpenAtom = atom<boolean>(false);

// Note location dialog state
export const locationDialogOpenAtom = atom<boolean>(false);

export const openLocationDialogAtom = atom(null, (_get, set) => {
	set(locationDialogOpenAtom, true);
});

export const closeLocationDialogAtom = atom(null, (_get, set) => {
	set(locationDialogOpenAtom, false);
});
