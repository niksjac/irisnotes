import { atom } from 'jotai';
import {
  selectedItemAtom,
  selectedNoteIdAtom,
  notesAtom,
  categoriesAtom,
  sidebarCollapsedAtom,
  activityBarVisibleAtom,
  configViewActiveAtom,
  hotkeysViewActiveAtom,
  databaseStatusVisibleAtom,
  isDualPaneModeAtom,
  activePaneIdAtom,
  toolbarVisibleAtom,
  isWrappingAtom
} from './index';

// Selection actions
export const selectItemAtom = atom(
  null,
  (_, set, { itemId, itemType }: { itemId: string; itemType: 'note' | 'category' }) => {
    set(selectedItemAtom, { id: itemId, type: itemType });
  }
);

export const selectNoteAtom = atom(
  null,
  (_, set, noteId: string) => {
    set(selectedNoteIdAtom, noteId);
  }
);

// Note actions
export const handleNoteClickAtom = atom(
  null,
  (_, set, noteId: string) => {
    set(selectedNoteIdAtom, noteId);
    set(selectedItemAtom, { id: noteId, type: 'note' });
  }
);

export const handleTitleChangeAtom = atom(
  null,
  (get, set, { noteId, title }: { noteId: string; title: string }) => {
    const notes = get(notesAtom);
    const updatedNotes = notes.map(note =>
      note.id === noteId ? { ...note, title } : note
    );
    set(notesAtom, updatedNotes);
  }
);

export const handleContentChangeAtom = atom(
  null,
  (get, set, { noteId, content }: { noteId: string; content: string }) => {
    const notes = get(notesAtom);
    const updatedNotes = notes.map(note =>
      note.id === noteId ? { ...note, content } : note
    );
    set(notesAtom, updatedNotes);
  }
);

export const handleDeleteNoteAtom = atom(
  null,
  (get, set, noteId: string) => {
    const notes = get(notesAtom);
    const updatedNotes = notes.filter(note => note.id !== noteId);
    set(notesAtom, updatedNotes);

    // Clear selection if deleted note was selected
    const selectedNoteId = get(selectedNoteIdAtom);
    if (selectedNoteId === noteId) {
      set(selectedNoteIdAtom, null);
      set(selectedItemAtom, { id: null, type: null });
    }
  }
);

// Category actions
export const handleDeleteCategoryAtom = atom(
  null,
  (get, set, categoryId: string) => {
    const categories = get(categoriesAtom);
    const updatedCategories = categories.filter(cat => cat.id !== categoryId);
    set(categoriesAtom, updatedCategories);
  }
);

export const handleRenameCategoryAtom = atom(
  null,
  (get, set, { categoryId, newName }: { categoryId: string; newName: string }) => {
    const categories = get(categoriesAtom);
    const updatedCategories = categories.map(cat =>
      cat.id === categoryId ? { ...cat, name: newName } : cat
    );
    set(categoriesAtom, updatedCategories);
  }
);

// Layout actions
export const toggleSidebarAtom = atom(
  null,
  (get, set) => {
    const current = get(sidebarCollapsedAtom);
    set(sidebarCollapsedAtom, !current);
  }
);

export const toggleActivityBarAtom = atom(
  null,
  (get, set) => {
    const current = get(activityBarVisibleAtom);
    set(activityBarVisibleAtom, !current);
  }
);

export const toggleConfigViewAtom = atom(
  null,
  (get, set) => {
    const current = get(configViewActiveAtom);
    set(configViewActiveAtom, !current);
  }
);

export const toggleHotkeysViewAtom = atom(
  null,
  (get, set) => {
    const current = get(hotkeysViewActiveAtom);
    set(hotkeysViewActiveAtom, !current);
  }
);

export const toggleDatabaseStatusAtom = atom(
  null,
  (get, set) => {
    const current = get(databaseStatusVisibleAtom);
    set(databaseStatusVisibleAtom, !current);
  }
);

export const toggleDualPaneModeAtom = atom(
  null,
  (get, set) => {
    const current = get(isDualPaneModeAtom);
    set(isDualPaneModeAtom, !current);
  }
);

export const setActivePaneAtom = atom(
  null,
  (_, set, paneId: any) => {
    set(activePaneIdAtom, paneId);
  }
);

export const toggleToolbarAtom = atom(
  null,
  (get, set) => {
    const current = get(toolbarVisibleAtom);
    set(toolbarVisibleAtom, !current);
  }
);

export const toggleLineWrappingAtom = atom(
  null,
  (get, set) => {
    const current = get(isWrappingAtom);
    set(isWrappingAtom, !current);
  }
);

export const handleSidebarCollapsedChangeAtom = atom(
  null,
  (_, set, collapsed: boolean) => {
    set(sidebarCollapsedAtom, collapsed);
  }
);