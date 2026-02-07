import { atom } from "jotai";

// ============ Layout Storage Utilities ============

const LAYOUT_STORAGE_KEY = "irisnotes-layout-state";

interface LayoutState {
	sidebarWidth: number;
	activityBarVisible: boolean;
	sidebarCollapsed: boolean;
	titleBarVisible: boolean;
	toolbarVisible: boolean;
}

const DEFAULT_LAYOUT: LayoutState = {
	sidebarWidth: 300,
	activityBarVisible: true,
	sidebarCollapsed: false,
	titleBarVisible: true,
	toolbarVisible: false,
};

/**
 * Loads layout state from localStorage synchronously.
 * Called at module initialization time to prevent flicker.
 */
const loadInitialLayout = (): LayoutState => {
	try {
		const stored = localStorage.getItem(LAYOUT_STORAGE_KEY);
		if (stored) {
			return { ...DEFAULT_LAYOUT, ...JSON.parse(stored) };
		}
	} catch {
		// Ignore errors during initial load
	}
	return DEFAULT_LAYOUT;
};

// Load layout once at module initialization (synchronous, before first render)
const initialLayout = loadInitialLayout();

// Layout atoms - initialized from localStorage to prevent flicker
export const sidebarCollapsed = atom<boolean>(initialLayout.sidebarCollapsed);
export const sidebarWidth = atom<number>(initialLayout.sidebarWidth);
export const sidebarHeight = atom<number>(200); // Default height for mobile
export const activityBarVisible = atom<boolean>(initialLayout.activityBarVisible);
export const activityBarExpanded = atom<boolean>(false); // Expanded shows labels

// Focus area: tracks which major UI section has focus (mutually exclusive)
export type FocusArea = "activity-bar" | "tree" | "pane-0" | "pane-1" | null;
export const focusAreaAtom = atom<FocusArea>(null);

export const toolbarVisibleAtom = atom<boolean>(initialLayout.toolbarVisible);
export const titleBarVisibleAtom = atom<boolean>(initialLayout.titleBarVisible);

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

// Import search atoms
export * from "./search";

// Import editor stats atoms
export * from "./editor-stats";
