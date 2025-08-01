import { useCallback, useEffect, useState } from 'react';
import type { CreateNoteParams, Note, NoteFilters, UpdateNoteParams, PaneId } from '../../../types';
import { createMultiStorageManager, createSQLiteStorageAdapter, type MultiStorageManager } from '../storage';

export const useMultiStorageNotes = () => {
	const [storageManager] = useState<MultiStorageManager>(() => createMultiStorageManager());
	const [notes, setNotes] = useState<Note[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [selectedNoteIds, setSelectedNoteIds] = useState<{
		left: string | null;
		right: string | null;
	}>({
		left: null,
		right: null,
	});

	const loadAllNotes = useCallback(
		async (filters?: NoteFilters) => {
			setIsLoading(true);
			setError(null);

			try {
				const result = await storageManager.getAllNotes(filters);
				if (result.success && result.data) {
					setNotes(result.data);
				} else {
					setError(!result.success ? result.error || 'Failed to load notes' : 'Failed to load notes');
				}
			} catch (err) {
				console.error('Failed to load notes:', err);
				setError(`Failed to load notes: ${err}`);
			} finally {
				setIsLoading(false);
			}
		},
		[storageManager]
	);

	// Initialize storage backends
	useEffect(() => {
		const initializeStorages = async () => {
			setIsLoading(true);
			setError(null);

			try {
				// Add SQLite-based storage
				const sqliteStorage = createSQLiteStorageAdapter('notes.db');
				const sqliteResult = await storageManager.addStorage('sqlite', sqliteStorage);

				if (!sqliteResult.success) {
					console.error('Failed to initialize SQLite storage:', sqliteResult.error);
					setError(sqliteResult.error || 'Failed to initialize SQLite storage');
				}

				// Set SQLite storage as default
				storageManager.setDefaultStorage('sqlite');

				// Load initial notes
				await loadAllNotes();
			} catch (err) {
				console.error('Failed to initialize storage:', err);
				setError(`Failed to initialize storage: ${err}`);
			} finally {
				setIsLoading(false);
			}
		};

		initializeStorages();
	}, [storageManager, loadAllNotes]);

	const createNote = useCallback(
		async (params: CreateNoteParams, targetPane?: PaneId) => {
			setError(null);

			try {
				const defaultStorage = storageManager.getDefaultStorage();
				if (!defaultStorage) {
					throw new Error('No default storage available');
				}

				const result = await defaultStorage.createNote(params);
				if (result.success && result.data) {
					const newNote = result.data;
					setNotes(prev => [newNote, ...prev]);

					// Select the new note in the target pane
					if (targetPane) {
						setSelectedNoteIds(prev => ({
							...prev,
							[targetPane]: newNote.id,
						}));
					} else {
						setSelectedNoteIds(prev => ({ ...prev, left: newNote.id }));
					}

					return { success: true, data: newNote };
				} else {
					setError(!result.success ? result.error || 'Failed to create note' : 'Failed to create note');
					return result;
				}
			} catch (err) {
				const errorMsg = `Failed to create note: ${err}`;
				setError(errorMsg);
				return { success: false, error: errorMsg };
			}
		},
		[storageManager]
	);

	const updateNote = useCallback(
		async (params: UpdateNoteParams) => {
			setError(null);

			try {
				const defaultStorage = storageManager.getDefaultStorage();
				if (!defaultStorage) {
					throw new Error('No default storage available');
				}

				const result = await defaultStorage.updateNote(params);
				if (result.success && result.data) {
					const updatedNote = result.data;
					setNotes(prev => prev.map(note => (note.id === params.id ? updatedNote : note)));
					return { success: true, data: updatedNote };
				} else {
					setError(!result.success ? result.error || 'Failed to update note' : 'Failed to update note');
					return result;
				}
			} catch (err) {
				const errorMsg = `Failed to update note: ${err}`;
				setError(errorMsg);
				return { success: false, error: errorMsg };
			}
		},
		[storageManager]
	);

	const deleteNote = useCallback(
		async (noteId: string) => {
			setError(null);

			try {
				const defaultStorage = storageManager.getDefaultStorage();
				if (!defaultStorage) {
					throw new Error('No default storage available');
				}

				const result = await defaultStorage.deleteNote(noteId);
				if (result.success) {
					setNotes(prev => prev.filter(note => note.id !== noteId));

					// Clear selection if the deleted note was selected
					setSelectedNoteIds(prev => ({
						left: prev.left === noteId ? null : prev.left,
						right: prev.right === noteId ? null : prev.right,
					}));

					return { success: true };
				} else {
					setError(result.error || 'Failed to delete note');
					return result;
				}
			} catch (err) {
				const errorMsg = `Failed to delete note: ${err}`;
				setError(errorMsg);
				return { success: false, error: errorMsg };
			}
		},
		[storageManager]
	);

	const searchNotes = useCallback(
		async (query: string, filters?: NoteFilters) => {
			setError(null);

			try {
				const result = await storageManager.searchAllNotes(query, filters);
				if (result.success && result.data) {
					return { success: true, data: result.data };
				} else {
					setError(!result.success ? result.error || 'Failed to search notes' : 'Failed to search notes');
					return result;
				}
			} catch (err) {
				const errorMsg = `Failed to search notes: ${err}`;
				setError(errorMsg);
				return { success: false, error: errorMsg };
			}
		},
		[storageManager]
	);

	const syncStorage = useCallback(async () => {
		setError(null);

		try {
			const result = await storageManager.syncAllStorages();
			if (result.success) {
				await loadAllNotes(); // Reload notes after sync
				return { success: true };
			} else {
				setError(result.error || 'Failed to sync storage');
				return result;
			}
		} catch (err) {
			const errorMsg = `Failed to sync storage: ${err}`;
			setError(errorMsg);
			return { success: false, error: errorMsg };
		}
	}, [storageManager, loadAllNotes]);

	// Convenience methods for pane management
	const setSelectedNoteIdForPane = useCallback((paneId: PaneId, noteId: string | null) => {
		setSelectedNoteIds(prev => ({ ...prev, [paneId]: noteId }));
	}, []);

	const openNoteInPane = useCallback((noteId: string, paneId: PaneId) => {
		setSelectedNoteIds(prev => ({ ...prev, [paneId]: noteId }));
	}, []);

	const getSelectedNoteForPane = useCallback(
		(paneId: PaneId) => {
			const noteId = selectedNoteIds[paneId];
			return noteId ? notes.find(note => note.id === noteId) : null;
		},
		[notes, selectedNoteIds]
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

	// Legacy support for backward compatibility
	const selectedNoteId = selectedNoteIds.left;
	const setSelectedNoteId = useCallback(
		(noteId: string | null) => {
			setSelectedNoteIdForPane('left', noteId);
		},
		[setSelectedNoteIdForPane]
	);
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
		getStorages: () => storageManager.getStorages(),
		getDefaultStorage: () => storageManager.getDefaultStorage(),
		setDefaultStorage: (name: string) => storageManager.setDefaultStorage(name),
	};
};
