import { useState, useEffect, useCallback } from 'react';
import type { Note, CreateNoteParams, UpdateNoteParams, NoteFilters } from '../../../types/database';
import type { SingleStorageManager } from '../storage/types';
import { createSingleStorageManager } from '../storage';
import { useConfig } from '../../../hooks/use-config';

export type PaneId = 'left' | 'right';

export const useSingleStorageNotes = () => {
  const { config, loading: configLoading } = useConfig();
  const [storageManager] = useState<SingleStorageManager>(() => createSingleStorageManager());
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNoteIds, setSelectedNoteIds] = useState<{
    left: string | null;
    right: string | null;
  }>({
    left: null,
    right: null
  });

  const loadAllNotes = useCallback(async (filters?: NoteFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await storageManager.getNotes(filters);
      if (result.success) {
        setNotes(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('Failed to load notes:', err);
      setError(`Failed to load notes: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }, [storageManager]);

  // Initialize storage when config loads or changes
  useEffect(() => {
    const initializeStorage = async () => {
      if (configLoading) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Configure storage based on config
        const storageConfig = config.storage;
        const result = await storageManager.setActiveStorage(storageConfig);

        if (!result.success) {
          console.error('❌ Failed to set active storage:', result.error);
          setError(result.error);
          return;
        }

        // Load initial notes
        await loadAllNotes();
      } catch (err) {
        console.error('❌ Failed to initialize storage:', err);
        setError(`Failed to initialize storage: ${err}`);
      } finally {
        setIsLoading(false);
      }
    };

    initializeStorage();
  }, [configLoading, config.storage, storageManager, loadAllNotes]);

  const createNote = useCallback(async (params: CreateNoteParams, targetPane?: PaneId) => {
    setError(null);

    try {
      const result = await storageManager.createNote(params);
      if (result.success) {
        const newNote = result.data;
        setNotes(prev => [newNote, ...prev]);

        // Select the new note in the target pane
        if (targetPane) {
          setSelectedNoteIds(prev => ({ ...prev, [targetPane]: newNote.id }));
        } else {
          setSelectedNoteIds(prev => ({ ...prev, left: newNote.id }));
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
  }, [storageManager]);

  const updateNote = useCallback(async (params: UpdateNoteParams) => {
    setError(null);

    try {
      const result = await storageManager.updateNote(params);
      if (result.success) {
        const updatedNote = result.data;
        setNotes(prev => prev.map(note =>
          note.id === params.id ? updatedNote : note
        ));
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
  }, [storageManager]);

  const deleteNote = useCallback(async (noteId: string) => {
    setError(null);

    try {
      const result = await storageManager.deleteNote(noteId);
      if (result.success) {
        setNotes(prev => prev.filter(note => note.id !== noteId));

        // Clear selection if the deleted note was selected
        setSelectedNoteIds(prev => ({
          left: prev.left === noteId ? null : prev.left,
          right: prev.right === noteId ? null : prev.right
        }));

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
  }, [storageManager]);

  const searchNotes = useCallback(async (query: string, filters?: NoteFilters) => {
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
  }, [storageManager]);

  const syncStorage = useCallback(async () => {
    setError(null);

    try {
      const result = await storageManager.sync();
      if (result.success) {
        await loadAllNotes(); // Reload notes after sync
        return { success: true };
      } else {
        setError(result.error);
        return result;
      }
    } catch (err) {
      const errorMsg = `Failed to sync storage: ${err}`;
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [storageManager, loadAllNotes]);

  // Get storage info
  const getStorageInfo = useCallback(async () => {
    try {
      return await storageManager.getStorageInfo();
    } catch (err) {
      return { success: false, error: `Failed to get storage info: ${err}` };
    }
  }, [storageManager]);

  // Convenience methods for pane management
  const setSelectedNoteIdForPane = useCallback((paneId: PaneId, noteId: string | null) => {
    setSelectedNoteIds(prev => ({ ...prev, [paneId]: noteId }));
  }, []);

  const openNoteInPane = useCallback((noteId: string, paneId: PaneId) => {
    setSelectedNoteIds(prev => ({ ...prev, [paneId]: noteId }));
  }, []);

  const getSelectedNoteForPane = useCallback((paneId: PaneId) => {
    const noteId = selectedNoteIds[paneId];
    return noteId ? notes.find(note => note.id === noteId) : null;
  }, [notes, selectedNoteIds]);

  const createNewNote = useCallback((targetPane?: PaneId) => {
    return createNote({
      title: 'Untitled Note',
      content: '',
      content_type: 'custom'
    }, targetPane);
  }, [createNote]);

  const updateNoteTitle = useCallback((noteId: string, title: string) => {
    return updateNote({ id: noteId, title });
  }, [updateNote]);

  const updateNoteContent = useCallback((noteId: string, content: string, contentType?: 'html' | 'markdown' | 'plain' | 'custom', contentRaw?: string) => {
    const updateParams: UpdateNoteParams = {
      id: noteId,
      content
    };

    if (contentType !== undefined) {
      updateParams.content_type = contentType;
    }

    if (contentRaw !== undefined) {
      updateParams.content_raw = contentRaw;
    }

    return updateNote(updateParams);
  }, [updateNote]);

  // Legacy support for backward compatibility
  const selectedNoteId = selectedNoteIds.left;
  const setSelectedNoteId = useCallback((noteId: string | null) => {
    setSelectedNoteIdForPane('left', noteId);
  }, [setSelectedNoteIdForPane]);
  const selectedNote = getSelectedNoteForPane('left');

  return {
    // Notes data
    notes,
    isLoading,
    error,

    // Selection state
    selectedNote,
    selectedNoteId,
    selectedNoteIds,

    // CRUD operations
    createNote,
    createNewNote,
    updateNote,
    updateNoteTitle,
    updateNoteContent,
    deleteNote,
    searchNotes,

    // Data loading
    loadAllNotes,
    syncStorage,

    // Selection management
    setSelectedNoteId,
    setSelectedNoteIds,
    setSelectedNoteIdForPane,
    openNoteInPane,
    getSelectedNoteForPane,

    // Storage management
    storageManager,
    getStorageInfo,
    activeStorageConfig: storageManager.getActiveStorageConfig()
  };
};