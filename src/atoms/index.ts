import { atom } from "jotai";

// Layout atoms
export const sidebarCollapsed = atom<boolean>(false);
export const sidebarWidth = atom<number>(300); // Default width
export const sidebarHeight = atom<number>(200); // Default height for mobile
export const activityBarVisible = atom<boolean>(true);
export const activityBarExpanded = atom<boolean>(false); // Expanded shows labels

// Focus area: tracks which major UI section has focus (mutually exclusive)
export type FocusArea = "activity-bar" | "tree" | "pane-0" | "pane-1" | null;
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

// Import pane atoms
export * from "./panes";

// Import new unified items atoms
export * from "./items";

// Import tree view atoms
export * from "./tree";

// Import action atoms
export * from "./actions";
