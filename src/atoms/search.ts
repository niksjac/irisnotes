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

export const openSearchSidebarAtom = atom(null, (_get, set) => {
	set(sidebarViewModeAtom, "search");
});

export const toggleSearchSidebarAtom = atom(null, (get, set) => {
	const currentMode = get(sidebarViewModeAtom);
	set(sidebarViewModeAtom, currentMode === "search" ? "tree" : "search");
});
