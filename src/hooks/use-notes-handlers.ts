import { useCallback } from "react";
import type { StorageAdapter } from "@/storage";

interface UseNotesHandlersProps {
	storageAdapter: StorageAdapter | null;
	setSelectedNoteId: (noteId: string | null) => void;
	updateNoteTitle: (noteId: string, title: string) => void;
	updateNoteContent: (noteId: string, content: string) => void;
	createNewNote: () => Promise<{ success: boolean; data?: any }>;
	loadAllNotes: () => Promise<void>;
	loadNoteCategories: () => Promise<any[]>;
}

export function useNotesHandlers({
	storageAdapter,
	setSelectedNoteId,
	updateNoteTitle,
	updateNoteContent,
	createNewNote,
	loadAllNotes,
	loadNoteCategories,
}: UseNotesHandlersProps) {
	const handleNoteClick = useCallback(
		(noteId: string) => {
			setSelectedNoteId(noteId);
		},
		[setSelectedNoteId]
	);

	const handleItemSelect = useCallback(
		(itemId: string, itemType: "note" | "category") => {
			// Handle both note and category selection for proper navigation state
			if (itemType === "category") {
				// For folders, we don't load them in the editor, just select them
				setSelectedNoteId(null);
			} else if (itemType === "note") {
				// For notes, update the selection but don't open automatically
				// Opening will be handled by onNoteSelect when appropriate (click, Enter, Space)
				setSelectedNoteId(itemId);
			}
		},
		[setSelectedNoteId]
	);

	const handleTitleChange = useCallback(
		(noteId: string, title: string) => {
			updateNoteTitle(noteId, title);
		},
		[updateNoteTitle]
	);

	const handleContentChange = useCallback(
		(noteId: string, content: string) => {
			updateNoteContent(noteId, content);
		},
		[updateNoteContent]
	);

	const handleFolderSelect = useCallback(
		(_folderId: string) => {
			setSelectedNoteId(null);
		},
		[setSelectedNoteId]
	);

	const handleCreateNote = useCallback(
		async (parentCategoryId?: string) => {
			if (!storageAdapter) return;

			try {
				const result = await createNewNote();
				if (result.success && result.data && parentCategoryId) {
					// Add the note to the category
					await storageAdapter.addNoteToCategory(result.data.id, parentCategoryId);
					// Reload note categories to update the tree
					await loadNoteCategories();
				}
			} catch (error) {
				console.error("Failed to create note:", error);
			}
		},
		[storageAdapter, createNewNote, loadNoteCategories]
	);

	const handleDeleteNote = useCallback(
		async (noteId: string) => {
			if (!storageAdapter) return;

			try {
				await storageAdapter.deleteNote(noteId);
				// Reload notes to update the UI
				await loadAllNotes();
			} catch (error) {
				console.error("Failed to delete note:", error);
			}
		},
		[storageAdapter, loadAllNotes]
	);

	const handleRenameNote = useCallback(
		async (noteId: string, newTitle: string) => {
			await updateNoteTitle(noteId, newTitle);
		},
		[updateNoteTitle]
	);

	return {
		handleNoteClick,
		handleItemSelect,
		handleTitleChange,
		handleContentChange,
		handleFolderSelect,
		handleCreateNote,
		handleDeleteNote,
		handleRenameNote,
	};
}
