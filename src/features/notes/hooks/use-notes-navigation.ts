import { useCallback } from 'react';
import { useNotesSelection } from './use-notes-selection';
import { useNotesData } from './use-notes-data';
import type { PaneId } from './use-notes-selection';

export const useNotesNavigation = () => {
  const {
    selectedNoteId,
    selectedNoteIds,
    setSelectedNoteId,
    setSelectedNoteIds,
    setSelectedNoteIdForPane,
    openNoteInPane,
    getSelectedNoteForPane,
    clearSelection,
    clearSelectionForPane,
  } = useNotesSelection();

  const { notes } = useNotesData();

  const getSelectedNote = useCallback(() => {
    return selectedNoteId ? notes.find(note => note.id === selectedNoteId) || null : null;
  }, [selectedNoteId, notes]);

  const getSelectedNoteById = useCallback(
    (noteId: string) => {
      return notes.find(note => note.id === noteId) || null;
    },
    [notes]
  );

  const getNotesForPane = useCallback(() => {
    return {
      left: getSelectedNoteForPane('left', notes),
      right: getSelectedNoteForPane('right', notes),
    };
  }, [getSelectedNoteForPane, notes]);

  return {
    // Selection state
    selectedNoteId,
    selectedNoteIds,

    // Selection actions
    setSelectedNoteId,
    setSelectedNoteIds,
    setSelectedNoteIdForPane,
    openNoteInPane,
    clearSelection,
    clearSelectionForPane,

    // Navigation helpers
    getSelectedNote,
    getSelectedNoteById,
    getSelectedNoteForPane: (paneId: PaneId) => getSelectedNoteForPane(paneId, notes),
    getNotesForPane,
  };
};
