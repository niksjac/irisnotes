import { useCallback, useEffect } from "react";
import type { CreateNoteParams, NoteFilters, UpdateNoteParams } from "@/types/database";
import { useNotesData } from "./use-notes-data";
import type { PaneId } from "@/types";
import { useNotesSelection } from "./use-notes-selection";
import { useNotesStorage } from "./use-notes-storage";

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

	const { storageAdapter, isInitialized } = useNotesStorage();

	const loadAllNotes = useCallback(
		async (filters?: NoteFilters) => {
			setIsLoading(true);
			setError(null);

			try {
				if (!storageAdapter) {
					setError("Storage not initialized");
					return;
				}
				const result = await storageAdapter.getNotes(filters);
				if (result.success) {
					updateNotes(result.data);
				} else {
					setError(result.error);
				}
			} catch (err) {
				console.error("Failed to load notes:", err);
				setError(`Failed to load notes: ${err}`);
			} finally {
				setIsLoading(false);
			}
		},
		[storageAdapter, setIsLoading, setError, updateNotes]
	);

	// Auto-load notes when storage is initialized
	useEffect(() => {
		if (isInitialized) {
			loadAllNotes();
		}
	}, [isInitialized, loadAllNotes]);

	const createNote = useCallback(
		async (params: CreateNoteParams, targetPane?: PaneId) => {
			setError(null);

			try {
				if (!storageAdapter) {
					setError("Storage not initialized");
					return { success: false, error: "Storage not initialized" };
				}
				const result = await storageAdapter.createNote(params);
				if (result.success) {
					const newNote = result.data;
					addNote(newNote);

					// Select the new note in the target pane
					if (targetPane) {
						setSelectedNoteIdForPane(targetPane, newNote.id);
					} else {
						setSelectedNoteIdForPane("left", newNote.id);
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
		[storageAdapter, setError, addNote, setSelectedNoteIdForPane]
	);

	const updateNote = useCallback(
		async (params: UpdateNoteParams) => {
			setError(null);

			try {
				if (!storageAdapter) {
					setError("Storage not initialized");
					return;
				}
				const result = await storageAdapter.updateNote(params);
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
		[storageAdapter, setError, updateNoteInState]
	);

	const deleteNote = useCallback(
		async (noteId: string) => {
			setError(null);

			try {
				if (!storageAdapter) {
					setError("Storage not initialized");
					return;
				}
				const result = await storageAdapter.deleteNote(noteId);
				if (result.success) {
					removeNote(noteId);

					// Clear selection if the deleted note was selected
					clearSelectionForPane("left");
					clearSelectionForPane("right");

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
		[storageAdapter, setError, removeNote, clearSelectionForPane]
	);

	const searchNotes = useCallback(
		async (query: string, filters?: NoteFilters) => {
			setError(null);

			try {
				if (!storageAdapter) {
					setError("Storage not initialized");
					return { success: false, error: "Storage not initialized" };
				}
				const result = await storageAdapter.searchNotes(query, filters);
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
		[storageAdapter, setError]
	);

	const createNewNote = useCallback(
		(targetPane?: PaneId) => {
			return createNote(
				{
					title: "Untitled Note",
					content: "",
					content_type: "custom",
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
		(noteId: string, content: string, contentType?: "html" | "markdown" | "plain" | "custom", contentRaw?: string) => {
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
