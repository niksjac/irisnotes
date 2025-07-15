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
  isWrappingAtom,
  fontSizeAtom
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
    if (!current) {
      set(hotkeysViewActiveAtom, false);
    }
  }
);

export const toggleHotkeysViewAtom = atom(
  null,
  (get, set) => {
    const current = get(hotkeysViewActiveAtom);
    set(hotkeysViewActiveAtom, !current);
    if (!current) {
      set(configViewActiveAtom, false);
    }
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
  (_, set, paneId: 'left' | 'right') => {
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

// Editor actions
export const toggleLineWrappingAtom = atom(
  null,
  (get, set) => {
    const current = get(isWrappingAtom);
    set(isWrappingAtom, !current);
  }
);

export const increaseFontSizeAtom = atom(
  null,
  (get, set) => {
    const current = get(fontSizeAtom);
    set(fontSizeAtom, Math.min(current + 2, 24));
  }
);

export const decreaseFontSizeAtom = atom(
  null,
  (get, set) => {
    const current = get(fontSizeAtom);
    set(fontSizeAtom, Math.max(current - 2, 10));
  }
);

export const resetFontSizeAtom = atom(
  null,
  (_, set) => {
    set(fontSizeAtom, 14);
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

export const addNoteAtom = atom(
  null,
  (get, set, note: any) => {
    const notes = get(notesAtom);
    set(notesAtom, [note, ...notes]);
  }
);

export const removeNoteAtom = atom(
  null,
  (get, set, noteId: string) => {
    const notes = get(notesAtom);
    const updatedNotes = notes.filter(note => note.id !== noteId);
    set(notesAtom, updatedNotes);
  }
);

// Category actions
export const addCategoryAtom = atom(
  null,
  (get, set, category: any) => {
    const categories = get(categoriesAtom);
    set(categoriesAtom, [...categories, category]);
  }
);

export const removeCategoryAtom = atom(
  null,
  (get, set, categoryId: string) => {
    const categories = get(categoriesAtom);
    const updatedCategories = categories.filter(cat => cat.id !== categoryId);
    set(categoriesAtom, updatedCategories);
  }
);

// Add missing atoms for backward compatibility
export const handleDeleteNoteAtom = removeNoteAtom;
export const handleDeleteCategoryAtom = removeCategoryAtom;

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

export const handleSidebarCollapsedChangeAtom = atom(
  null,
  (_, set, collapsed: boolean) => {
    set(sidebarCollapsedAtom, collapsed);
  }
);