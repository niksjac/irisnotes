import { useAtom } from 'jotai';
import { selectedNoteIdAtom } from '../../../atoms';
import { useState, useCallback } from 'react';
import type { Note } from '../../../types/database';

export type PaneId = 'left' | 'right';

export const useNotesSelection = () => {
  const [selectedNoteId, setSelectedNoteId] = useAtom(selectedNoteIdAtom);
  const [selectedNoteIds, setSelectedNoteIds] = useState<{
    left: string | null;
    right: string | null;
  }>({
    left: null,
    right: null
  });

  const setSelectedNoteIdForPane = useCallback((paneId: PaneId, noteId: string | null) => {
    setSelectedNoteIds(prev => ({ ...prev, [paneId]: noteId }));
  }, []);

  const openNoteInPane = useCallback((noteId: string, paneId: PaneId) => {
    setSelectedNoteIds(prev => ({ ...prev, [paneId]: noteId }));
  }, []);

  const getSelectedNoteForPane = useCallback((paneId: PaneId, notes: Note[]) => {
    const noteId = selectedNoteIds[paneId];
    return noteId ? notes.find(note => note.id === noteId) || null : null;
  }, [selectedNoteIds]);

  const clearSelection = useCallback(() => {
    setSelectedNoteId(null);
    setSelectedNoteIds({ left: null, right: null });
  }, [setSelectedNoteId]);

  const clearSelectionForPane = useCallback((paneId: PaneId) => {
    setSelectedNoteIds(prev => ({ ...prev, [paneId]: null }));
  }, []);

  return {
    selectedNoteId,
    selectedNoteIds,
    setSelectedNoteId,
    setSelectedNoteIds,
    setSelectedNoteIdForPane,
    openNoteInPane,
    getSelectedNoteForPane,
    clearSelection,
    clearSelectionForPane,
  };
};