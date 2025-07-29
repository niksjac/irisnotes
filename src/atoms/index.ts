import { atom } from 'jotai';

// Types
export type ViewType = 'config-view' | 'hotkeys-view' | 'folder-view' | 'dual-pane-view' | 'single-pane-view';

// Selection state atoms
export const selectedItemAtom = atom<{
	id: string | null;
	type: 'note' | 'category' | null;
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
export const sidebarCollapsedAtom = atom<boolean>(false);
export const activityBarVisibleAtom = atom<boolean>(true);
export const configViewActiveAtom = atom<boolean>(false);
export const hotkeysViewActiveAtom = atom<boolean>(false);
export const databaseStatusVisibleAtom = atom<boolean>(false);
export const isDualPaneModeAtom = atom<boolean>(false);
export const activePaneIdAtom = atom<any>(null);
export const toolbarVisibleAtom = atom<boolean>(true);

// Editor atoms
export const isWrappingAtom = atom<boolean>(false);
export const fontSizeAtom = atom<number>(14);

// Derived atoms
export const selectedNoteAtom = atom(get => {
	const notes = get(notesAtom);
	const selectedNoteId = get(selectedNoteIdAtom);
	return notes.find(note => note.id === selectedNoteId) || null;
});

export const selectedFolderAtom = atom(get => {
	const selectedItem = get(selectedItemAtom);
	const categories = get(categoriesAtom);

	if (selectedItem.type === 'category' && selectedItem.id) {
		return categories.find(cat => cat.id === selectedItem.id) || null;
	}
	return null;
});

export const notesForPaneAtom = atom<{
	left: any;
	right: any;
}>({
	left: null,
	right: null,
});

// Current view state derived atom
export const currentViewAtom = atom<ViewType>(get => {
	const configViewActive = get(configViewActiveAtom);
	const hotkeysViewActive = get(hotkeysViewActiveAtom);
	const selectedFolder = get(selectedFolderAtom);
	const isDualPaneMode = get(isDualPaneModeAtom);

	if (configViewActive) return 'config-view';
	if (hotkeysViewActive) return 'hotkeys-view';
	if (selectedFolder) return 'folder-view';
	if (isDualPaneMode) return 'dual-pane-view';
	return 'single-pane-view';
});
