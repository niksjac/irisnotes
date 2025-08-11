import { atom } from "jotai";
import {
	activityBarVisible,
	categoriesAtom,
	configViewActive,
	databaseStatusVisible,
	fontSizeAtom,
	hotkeysViewActive,
	notesAtom,
	selectedItemAtom,
	selectedNoteIdAtom,
	sidebarCollapsed,
	toolbarVisibleAtom,
} from "./index";

// Selection actions
export const selectItemAtom = atom(
	null,
	(_, set, { itemId, itemType }: { itemId: string; itemType: "note" | "category" }) => {
		set(selectedItemAtom, { id: itemId, type: itemType });
	}
);

export const selectNoteAtom = atom(null, (_, set, noteId: string) => {
	set(selectedNoteIdAtom, noteId);
});

// Layout actions
export const toggleSidebarAtom = atom(null, (get, set) => {
	const current = get(sidebarCollapsed);
	set(sidebarCollapsed, !current);
});

export const toggleActivityBarAtom = atom(null, (get, set) => {
	const current = get(activityBarVisible);
	set(activityBarVisible, !current);
});

export const toggleConfigViewAtom = atom(null, (get, set) => {
	const current = get(configViewActive);
	set(configViewActive, !current);
	if (!current) {
		set(hotkeysViewActive, false);
	}
});

export const toggleHotkeysViewAtom = atom(null, (get, set) => {
	const current = get(hotkeysViewActive);
	set(hotkeysViewActive, !current);
	if (!current) {
		set(configViewActive, false);
	}
});

export const toggleDatabaseStatusAtom = atom(null, (get, set) => {
	const current = get(databaseStatusVisible);
	set(databaseStatusVisible, !current);
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

// Note actions
export const handleNoteClickAtom = atom(null, (_, set, noteId: string) => {
	set(selectedNoteIdAtom, noteId);
	set(selectedItemAtom, { id: noteId, type: "note" });
});

export const handleTitleChangeAtom = atom(null, (get, set, { noteId, title }: { noteId: string; title: string }) => {
	const notes = get(notesAtom);
	const updatedNotes = notes.map((note) => (note.id === noteId ? { ...note, title } : note));
	set(notesAtom, updatedNotes);
});

export const handleContentChangeAtom = atom(
	null,
	(get, set, { noteId, content }: { noteId: string; content: string }) => {
		const notes = get(notesAtom);
		const updatedNotes = notes.map((note) => (note.id === noteId ? { ...note, content } : note));
		set(notesAtom, updatedNotes);
	}
);

export const addNoteAtom = atom(null, (get, set, note: any) => {
	const notes = get(notesAtom);
	set(notesAtom, [note, ...notes]);
});

export const removeNoteAtom = atom(null, (get, set, noteId: string) => {
	const notes = get(notesAtom);
	const updatedNotes = notes.filter((note) => note.id !== noteId);
	set(notesAtom, updatedNotes);
});

// Note: Category operations now handled by useCategoriesActions hook
// which provides proper CRUD operations with database synchronization

export const handleRenameCategoryAtom = atom(
	null,
	(get, set, { categoryId, newName }: { categoryId: string; newName: string }) => {
		const categories = get(categoriesAtom);
		const updatedCategories = categories.map((cat) => (cat.id === categoryId ? { ...cat, name: newName } : cat));
		set(categoriesAtom, updatedCategories);
	}
);

export const handleSidebarCollapsedChangeAtom = atom(null, (_, set, collapsed: boolean) => {
	set(sidebarCollapsed, collapsed);
});
