import { atom } from "jotai";

// Quick search dialog (Ctrl+P) - search by note name
export const quickSearchOpenAtom = atom<boolean>(false);
export const quickSearchQueryAtom = atom<string>("");

// Full-text search sidebar (Ctrl+Shift+F) - search in content
export const fullTextSearchQueryAtom = atom<string>("");

// Sidebar view mode: "tree" | "search"
export type SidebarViewMode = "tree" | "search";
export const sidebarViewModeAtom = atom<SidebarViewMode>("tree");

// Action atoms
export const openQuickSearchAtom = atom(null, (_get, set) => {
	set(quickSearchOpenAtom, true);
	set(quickSearchQueryAtom, "");
});

export const closeQuickSearchAtom = atom(null, (_get, set) => {
	set(quickSearchOpenAtom, false);
	set(quickSearchQueryAtom, "");
});

// Theme switcher dialog
export const themeSwitcherOpenAtom = atom<boolean>(false);
export const openThemeSwitcherAtom = atom(null, (_get, set) => {
	set(themeSwitcherOpenAtom, true);
});
export const closeThemeSwitcherAtom = atom(null, (_get, set) => {
	set(themeSwitcherOpenAtom, false);
});

export const openSearchSidebarAtom = atom(null, (_get, set) => {
	set(sidebarViewModeAtom, "search");
});

export const toggleSearchSidebarAtom = atom(null, (get, set) => {
	const currentMode = get(sidebarViewModeAtom);
	set(sidebarViewModeAtom, currentMode === "search" ? "tree" : "search");
});

// Quick hotkeys modal (Ctrl+/)
export const quickHotkeysOpenAtom = atom<boolean>(false);

export const showQuickHotkeysAtom = atom(null, (_get, set) => {
	set(quickHotkeysOpenAtom, true);
});

export const hideQuickHotkeysAtom = atom(null, (_get, set) => {
	set(quickHotkeysOpenAtom, false);
});

// Symbol picker dialog
export const symbolPickerOpenAtom = atom<boolean>(false);

export const openSymbolPickerAtom = atom(null, (_get, set) => {
	set(symbolPickerOpenAtom, true);
});

export const closeSymbolPickerAtom = atom(null, (_get, set) => {
	set(symbolPickerOpenAtom, false);
});
