import { useCallback } from "react";
import { useAtom, useSetAtom } from "jotai";
import { useItems } from "./use-items";
import { useTabManagement } from "./use-tab-management";
import { locationDialogOpenAtom, closeLocationDialogAtom } from "@/atoms/actions";

/**
 * Hook for note creation actions with tab management integration.
 * Provides functions to create notes and open them in tabs.
 */
export function useNoteActions() {
	const { createNote, createBook, createSection, items } = useItems();
	const { openItemInTab } = useTabManagement();
	const [isLocationDialogOpen, setIsLocationDialogOpen] = useAtom(locationDialogOpenAtom);
	const closeDialogAction = useSetAtom(closeLocationDialogAtom);

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
	 * Create a new note with title, optionally in a book and/or section.
	 * Creates new book/section if they don't exist.
	 */
	const createNoteWithLocation = useCallback(
		async (
			noteTitle: string,
			bookInfo: { id: string } | { title: string } | null,
			sectionInfo: { id: string } | { title: string } | null
		) => {
			let bookId: string | undefined;
			let sectionId: string | undefined;

			// Handle book - either use existing or create new
			if (bookInfo) {
				if ("id" in bookInfo) {
					bookId = bookInfo.id;
				} else {
					// Create new book
					const bookResult = await createBook(bookInfo.title);
					if (!bookResult.success || !bookResult.data) {
						return bookResult;
					}
					bookId = bookResult.data.id;
				}
			}

			// Handle section - either use existing or create new
			if (sectionInfo && bookId) {
				if ("id" in sectionInfo) {
					sectionId = sectionInfo.id;
				} else {
					// Create new section inside the book
					const sectionResult = await createSection(sectionInfo.title, bookId);
					if (!sectionResult.success || !sectionResult.data) {
						return sectionResult;
					}
					sectionId = sectionResult.data.id;
				}
			}

			// Determine final parent: section > book > root
			const parentId = sectionId ?? bookId;

			const result = await createNote({
				title: noteTitle,
				content: "",
				parent_id: parentId,
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
		[createNote, createBook, createSection, openItemInTab]
	);

	/**
	 * Create a new note in a specific location and open it in a tab
	 * If newBookTitle is provided, creates a new book first and puts the note inside
	 * @deprecated Use createNoteWithLocation instead
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
		closeDialogAction();
	}, [closeDialogAction]);

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
		createNoteWithLocation,
		createNewBook,
		createNewSection,
		isLocationDialogOpen,
		openLocationDialog,
		closeLocationDialog,
		getBooks,
		getSectionsForBook,
		items,
	};
}
