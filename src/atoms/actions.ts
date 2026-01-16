import { atom } from "jotai";
import {
	activityBarVisible,
	sidebarCollapsed,
	toolbarVisibleAtom,
} from "./index";
import { editorSettingsAtom } from "./settings";

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

// Editor font size actions (scales base font, inline em sizes scale proportionally)
// Note: Line wrapping is now handled directly via useLineWrapping hook

export const increaseFontSizeAtom = atom(null, (get, set) => {
	const settings = get(editorSettingsAtom);
	const newSize = Math.min((settings.fontSize || 14) + 1, 32);
	set(editorSettingsAtom, { ...settings, fontSize: newSize });
});

export const decreaseFontSizeAtom = atom(null, (get, set) => {
	const settings = get(editorSettingsAtom);
	const newSize = Math.max((settings.fontSize || 14) - 1, 8);
	set(editorSettingsAtom, { ...settings, fontSize: newSize });
});

export const resetFontSizeAtom = atom(null, (get, set) => {
	const settings = get(editorSettingsAtom);
	set(editorSettingsAtom, { ...settings, fontSize: 14 });
});

export const handleSidebarCollapsedChangeAtom = atom(
	null,
	(_, set, collapsed: boolean) => {
		set(sidebarCollapsed, collapsed);
	}
);
