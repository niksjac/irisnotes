import { useCallback } from 'react';
import { useNotesData } from './use-notes-data';
import { useNotesSelection } from './use-notes-selection';
import { useNotesStorage } from './use-notes-storage';
import type { CreateNoteParams, UpdateNoteParams, NoteFilters } from '../../../types/database';
import type { PaneId } from './use-notes-selection';

export const useNotesActions = () => {
  const {
    setIsLoading,
    setError,
    updateNotes,
    addNote,
    updateNote: updateNoteInState,
    removeNote,
    clearError,
  } = useNotesData();

  const { setSelectedNoteIdForPane, clearSelectionForPane } = useNotesSelection();

  const { storageManager } = useNotesStorage();

  const loadAllNotes = useCallback(
    async (filters?: NoteFilters) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await storageManager.getNotes(filters);
        if (result.success) {
          updateNotes(result.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        console.error('Failed to load notes:', err);
        setError(`Failed to load notes: ${err}`);
      } finally {
        setIsLoading(false);
      }
    },
    [storageManager, setIsLoading, setError, updateNotes]
  );

  const createNote = useCallback(
    async (params: CreateNoteParams, targetPane?: PaneId) => {
      setError(null);

      try {
        const result = await storageManager.createNote(params);
        if (result.success) {
          const newNote = result.data;
          addNote(newNote);

          // Select the new note in the target pane
          if (targetPane) {
            setSelectedNoteIdForPane(targetPane, newNote.id);
          } else {
            setSelectedNoteIdForPane('left', newNote.id);
          }

          return { success: true, data: newNote };
        } else {
          setError(result.error);
          return result;
        }
      } catch (err) {
        const errorMsg = `Failed to create note: ${err}`;
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    },
    [storageManager, setError, addNote, setSelectedNoteIdForPane]
  );

  const updateNote = useCallback(
    async (params: UpdateNoteParams) => {
      setError(null);

      try {
        const result = await storageManager.updateNote(params);
        if (result.success) {
          const updatedNote = result.data;
          updateNoteInState(updatedNote);
          return { success: true, data: updatedNote };
        } else {
          setError(result.error);
          return result;
        }
      } catch (err) {
        const errorMsg = `Failed to update note: ${err}`;
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    },
    [storageManager, setError, updateNoteInState]
  );

  const deleteNote = useCallback(
    async (noteId: string) => {
      setError(null);

      try {
        const result = await storageManager.deleteNote(noteId);
        if (result.success) {
          removeNote(noteId);

          // Clear selection if the deleted note was selected
          clearSelectionForPane('left');
          clearSelectionForPane('right');

          return { success: true };
        } else {
          setError(result.error);
          return result;
        }
      } catch (err) {
        const errorMsg = `Failed to delete note: ${err}`;
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    },
    [storageManager, setError, removeNote, clearSelectionForPane]
  );

  const searchNotes = useCallback(
    async (query: string, filters?: NoteFilters) => {
      setError(null);

      try {
        const result = await storageManager.searchNotes(query, filters);
        if (result.success) {
          return { success: true, data: result.data };
        } else {
          setError(result.error);
          return result;
        }
      } catch (err) {
        const errorMsg = `Failed to search notes: ${err}`;
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    },
    [storageManager, setError]
  );

  const createNewNote = useCallback(
    (targetPane?: PaneId) => {
      return createNote(
        {
          title: 'Untitled Note',
          content: '',
          content_type: 'custom',
        },
        targetPane
      );
    },
    [createNote]
  );

  const updateNoteTitle = useCallback(
    (noteId: string, title: string) => {
      return updateNote({ id: noteId, title });
    },
    [updateNote]
  );

  const updateNoteContent = useCallback(
    (noteId: string, content: string, contentType?: 'html' | 'markdown' | 'plain' | 'custom', contentRaw?: string) => {
      const updateParams: UpdateNoteParams = {
        id: noteId,
        content,
      };

      if (contentType !== undefined) {
        updateParams.content_type = contentType;
      }

      if (contentRaw !== undefined) {
        updateParams.content_raw = contentRaw;
      }

      return updateNote(updateParams);
    },
    [updateNote]
  );

  return {
    loadAllNotes,
    createNote,
    createNewNote,
    updateNote,
    updateNoteTitle,
    updateNoteContent,
    deleteNote,
    searchNotes,
    clearError,
  };
};
