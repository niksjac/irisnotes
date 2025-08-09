import { atom } from "jotai";
import type { ViewType, PaneId } from "@/types";

// Selection state atoms
export const selectedItemAtom = atom<{
	id: string | null;
	type: "note" | "category" | null;
}>({
	id: null,
	type: null,
});

export const selectedNoteIdAtom = atom<string | null>(null);

// Core data atoms
export const notesAtom = atom<any[]>([]);
export const categoriesAtom = atom<any[]>([]);
export const noteCategoriesAtom = atom<any[]>([]);

// Layout atoms
export const sidebarCollapsed = atom<boolean>(false);
export const activityBarVisible = atom<boolean>(true);
export const configViewActive = atom<boolean>(false);
export const hotkeysViewActive = atom<boolean>(false);
export const databaseStatusVisible = atom<boolean>(false);
export const isDualPaneModeAtom = atom<boolean>(false);
export const activePaneIdAtom = atom<PaneId | null>(null);
export const toolbarVisibleAtom = atom<boolean>(true);

// Pane-specific view atoms
export const leftPaneViewAtom = atom<ViewType | null>(null);
export const rightPaneViewAtom = atom<ViewType | null>(null);

// Editor atoms
export const isWrappingAtom = atom<boolean>(false);
export const fontSizeAtom = atom<number>(14);

// Derived atoms
export const selectedNoteAtom = atom((get) => {
	const notes = get(notesAtom);
	const selectedNoteId = get(selectedNoteIdAtom);
	return notes.find((note) => note.id === selectedNoteId) || null;
});

export const selectedFolderAtom = atom((get) => {
	const selectedItem = get(selectedItemAtom);
	const categories = get(categoriesAtom);

	if (selectedItem.type === "category" && selectedItem.id) {
		return categories.find((cat) => cat.id === selectedItem.id) || null;
	}
	return null;
});

// Separate note atoms for each pane
export const leftPaneNoteAtom = atom<any>(null);
export const rightPaneNoteAtom = atom<any>(null);

export const notesForPaneAtom = atom<{
	left: any;
	right: any;
}>((get) => ({
	left: get(leftPaneNoteAtom),
	right: get(rightPaneNoteAtom),
}));

// Helper function to determine view based on current state
const getDefaultView = (get: any): ViewType => {
	const configViewActiveValue = get(configViewActive);
	const hotkeysViewActiveValue = get(hotkeysViewActive);
	const selectedFolder = get(selectedFolderAtom);
	const selectedNote = get(selectedNoteAtom);
	const notes = get(notesAtom);
	const categories = get(categoriesAtom);

	if (configViewActiveValue) return "config-view";
	if (hotkeysViewActiveValue) return "hotkeys-view";
	if (selectedFolder) return "folder-view";
	if (selectedNote) {
		// Default to rich editor view when a note is selected
		// TODO: Add logic to determine between rich/source based on user preference
		return "editor-rich-view";
	}

	// Show welcome view if no notes or categories exist
	if (notes.length === 0 && categories.length === 0) return "welcome-view";

	// Default fallback
	return "welcome-view";
};

// Current view state derived atom (for single-pane mode or when no pane specified)
export const currentViewAtom = atom<ViewType>((get) => getDefaultView(get));

// Helper function to determine view based on pane-specific state
const getPaneDefaultView = (get: any, paneNote: any): ViewType => {
	const configViewActiveValue = get(configViewActive);
	const hotkeysViewActiveValue = get(hotkeysViewActive);
	const selectedFolder = get(selectedFolderAtom);
	const notes = get(notesAtom);
	const categories = get(categoriesAtom);

	if (configViewActiveValue) return "config-view";
	if (hotkeysViewActiveValue) return "hotkeys-view";
	if (selectedFolder) return "folder-view";
	if (paneNote) {
		// Use rich editor view when a note is selected in this pane
		return "editor-rich-view";
	}

	// Show welcome view if no notes or categories exist
	if (notes.length === 0 && categories.length === 0) return "welcome-view";

	// Default fallback
	return "welcome-view";
};

// Pane-specific view atoms with fallback to pane-specific default logic
export const leftPaneCurrentView = atom<ViewType>((get) => {
	const leftPaneView = get(leftPaneViewAtom);
	const leftPaneNote = get(leftPaneNoteAtom);
	return leftPaneView || getPaneDefaultView(get, leftPaneNote);
});

export const rightPaneCurrentView = atom<ViewType>((get) => {
	const rightPaneView = get(rightPaneViewAtom);
	const rightPaneNote = get(rightPaneNoteAtom);
	return rightPaneView || getPaneDefaultView(get, rightPaneNote);
});
