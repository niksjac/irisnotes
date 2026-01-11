import { useState, useCallback } from "react";
import { useItems } from "./use-items";
import { useTabManagement } from "./use-tab-management";

/**
 * Hook for note creation actions with tab management integration.
 * Provides functions to create notes and open them in tabs.
 */
export function useNoteActions() {
	const { createNote, createBook, createSection, items } = useItems();
	const { openItemInTab } = useTabManagement();
	const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);

	/**
	 * Create a new note in the root and open it in a tab
	 */
	const createNoteInRoot = useCallback(async () => {
		const result = await createNote({
			title: "Untitled Note",
			content: "",
			parent_id: undefined,
		});

		if (result.success && result.data) {
			openItemInTab({
				id: result.data.id,
				title: result.data.title,
				type: "note",
			});
		}

		return result;
	}, [createNote, openItemInTab]);

	/**
	 * Create a new note in a specific location and open it in a tab
	 * If newBookTitle is provided, creates a new book first and puts the note inside
	 */
	const createNoteInLocation = useCallback(
		async (parentId: string | null, newBookTitle?: string) => {
			let finalParentId = parentId ?? undefined;

			// If creating a new book, create it first
			if (newBookTitle) {
				const bookResult = await createBook(newBookTitle);
				if (bookResult.success && bookResult.data) {
					finalParentId = bookResult.data.id;
				} else {
					return bookResult; // Return error if book creation failed
				}
			}

			const result = await createNote({
				title: "Untitled Note",
				content: "",
				parent_id: finalParentId,
			});

			if (result.success && result.data) {
				openItemInTab({
					id: result.data.id,
					title: result.data.title,
					type: "note",
				});
			}

			return result;
		},
		[createNote, createBook, openItemInTab]
	);

	/**
	 * Create a new book
	 */
	const createNewBook = useCallback(
		async (title: string, parentId?: string) => {
			return await createBook(title, parentId);
		},
		[createBook]
	);

	/**
	 * Create a new section
	 */
	const createNewSection = useCallback(
		async (title: string, parentId?: string) => {
			return await createSection(title, parentId);
		},
		[createSection]
	);

	/**
	 * Open the location picker dialog
	 */
	const openLocationDialog = useCallback(() => {
		setIsLocationDialogOpen(true);
	}, []);

	/**
	 * Close the location picker dialog
	 */
	const closeLocationDialog = useCallback(() => {
		setIsLocationDialogOpen(false);
	}, []);

	/**
	 * Get all books (for location picker)
	 */
	const getBooks = useCallback(() => {
		return items.filter((item) => item.type === "book" && !item.deleted_at);
	}, [items]);

	/**
	 * Get sections for a specific book (for location picker)
	 */
	const getSectionsForBook = useCallback(
		(bookId: string) => {
			return items.filter(
				(item) =>
					item.type === "section" &&
					item.parent_id === bookId &&
					!item.deleted_at
			);
		},
		[items]
	);

	return {
		createNoteInRoot,
		createNoteInLocation,
		createNewBook,
		createNewSection,
		isLocationDialogOpen,
		openLocationDialog,
		closeLocationDialog,
		getBooks,
		getSectionsForBook,
	};
}
