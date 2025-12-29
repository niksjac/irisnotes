import { atom } from "jotai";
import type { ViewType } from "@/types";

// Legacy atoms for backward compatibility during migration
export const selectedNoteIdAtom = atom<string | null>(null);

// Legacy data atoms (to be removed once all components are migrated)
export const notesAtom = atom<any[]>([]);
export const categoriesAtom = atom<any[]>([]);
export const noteCategoriesAtom = atom<any[]>([]);

// Legacy selection atom for backward compatibility
export const selectedItemAtom = atom<{
	id: string | null;
	type: "note" | "category" | null;
}>({
	id: null,
	type: null,
});

// Layout atoms
export const sidebarCollapsed = atom<boolean>(false);
export const sidebarWidth = atom<number>(300); // Default width
export const sidebarHeight = atom<number>(200); // Default height for mobile
export const activityBarVisible = atom<boolean>(true);
export const configViewActive = atom<boolean>(false);
export const hotkeysViewActive = atom<boolean>(false);
export const databaseStatusVisible = atom<boolean>(false);

// Focus area: tracks which major UI section has focus (mutually exclusive)
export type FocusArea = "tree" | "pane" | null;
export const focusAreaAtom = atom<FocusArea>(null);

export const toolbarVisibleAtom = atom<boolean>(false);

// Editor atoms
export const isWrappingAtom = atom<boolean>(false);
export const fontSizeAtom = atom<number>(14);

// Import items atoms directly to avoid require issues
import { itemsAtom, selectedItemIdAtom } from "./items";

// Derived atoms (using new items system)
export const selectedNoteAtom = atom((get) => {
	const items = get(itemsAtom);
	const selectedId = get(selectedItemIdAtom);
	const selectedItem = items.find((item) => item.id === selectedId);
	return selectedItem?.type === "note" ? selectedItem : null;
});

// Helper function to determine view based on current state
const getDefaultView = (get: any): ViewType => {
	const configViewActiveValue = get(configViewActive);
	const hotkeysViewActiveValue = get(hotkeysViewActive);
	const selectedNote = get(selectedNoteAtom);

	if (configViewActiveValue) return "config-view";
	if (hotkeysViewActiveValue) return "hotkeys-view";
	if (selectedNote) {
		// Default to rich editor view when a note is selected
		// TODO: Add logic to determine between rich/source based on user preference
		return "editor-rich-view";
	}

	// Default fallback - show empty view when nothing is selected
	return "empty-view";
};

// Import pane atoms
export * from "./panes";

// Import new unified items atoms
export * from "./items";

// Import tree view atoms
export * from "./tree";

// Current view state derived atom (for single-pane mode or when no pane specified)
export const currentViewAtom = atom<ViewType>((get) => getDefaultView(get));
