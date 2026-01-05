import { atom } from "jotai";
import {
	activityBarVisible,
	fontSizeAtom,
	sidebarCollapsed,
	toolbarVisibleAtom,
} from "./index";

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

// Editor actions
// Note: Line wrapping is now handled directly via useLineWrapping hook

export const increaseFontSizeAtom = atom(null, (get, set) => {
	const current = get(fontSizeAtom);
	set(fontSizeAtom, Math.min(current + 2, 24));
});

export const decreaseFontSizeAtom = atom(null, (get, set) => {
	const current = get(fontSizeAtom);
	set(fontSizeAtom, Math.max(current - 2, 10));
});

export const resetFontSizeAtom = atom(null, (_, set) => {
	set(fontSizeAtom, 14);
});

export const handleSidebarCollapsedChangeAtom = atom(
	null,
	(_, set, collapsed: boolean) => {
		set(sidebarCollapsed, collapsed);
	}
);
