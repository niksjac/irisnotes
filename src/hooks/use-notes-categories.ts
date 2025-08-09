import { useCallback, useEffect, useState } from "react";
import type { Category, Note } from "@/types/database";
import type { StorageAdapter } from "@/storage";

interface UseNotesCategoriesProps {
	storageAdapter: StorageAdapter | null;
	isLoading: boolean;
	notesLength: number;
}

export function useNotesCategories({ storageAdapter, isLoading, notesLength }: UseNotesCategoriesProps) {
	const [categories, setCategories] = useState<Category[]>([]);
	const [noteCategories, setNoteCategories] = useState<{ noteId: string; categoryId: string }[]>([]);

	// Load categories when notes are loaded (indicating storage is ready)
	useEffect(() => {
		const loadCategories = async () => {
			if (!storageAdapter || isLoading) return;

			try {
				const result = await storageAdapter.getCategories();
				if (result.success) {
					setCategories(result.data);
				} else {
					console.error("Failed to load categories:", result.error);
				}
			} catch (error) {
				console.error("Failed to load categories:", error);
			}
		};

		// Only load categories after notes are loaded and storage is ready
		if (!isLoading && notesLength >= 0) {
			loadCategories();
		}
	}, [storageAdapter, isLoading, notesLength]);

	// Load note-category relationships
	const loadNoteCategories = useCallback(async () => {
		if (!storageAdapter) return [];

		try {
			const relationships: { noteId: string; categoryId: string }[] = [];

			// Load note categories for each category
			for (const category of categories) {
				const result = await storageAdapter.getCategoryNotes(category.id);
				if (result.success) {
					result.data.forEach((note: Note) => {
						relationships.push({
							noteId: note.id,
							categoryId: category.id,
						});
					});
				}
			}

			setNoteCategories(relationships);
			return relationships;
		} catch (error) {
			console.error("Failed to load note categories:", error);
			return [];
		}
	}, [storageAdapter, categories]);

	// Load note categories when categories change
	useEffect(() => {
		if (categories.length > 0) {
			loadNoteCategories();
		}
	}, [categories, loadNoteCategories]);

	// Category handlers
	const handleCreateFolder = useCallback(
		async (parentCategoryId?: string) => {
			if (!storageAdapter) return;

			try {
				const createParams = {
					name: "New Folder",
					description: "",
					...(parentCategoryId && { parent_id: parentCategoryId }),
				};
				const result = await storageAdapter.createCategory(createParams);

				if (result.success) {
					setCategories((prev) => [...prev, result.data]);
					// Reload categories to ensure consistency
					const categoriesResult = await storageAdapter.getCategories();
					if (categoriesResult.success) {
						setCategories(categoriesResult.data);
					}
				} else {
					console.error("Failed to create category:", result.error);
				}
			} catch (error) {
				console.error("Failed to create category:", error);
			}
		},
		[storageAdapter]
	);

	const handleMoveNote = useCallback(
		async (noteId: string, newCategoryId: string | null) => {
			if (!storageAdapter) return;

			try {
				// Remove from all categories first
				for (const category of categories) {
					await storageAdapter.removeNoteFromCategory(noteId, category.id);
				}

				// Add to new category if specified
				if (newCategoryId) {
					await storageAdapter.addNoteToCategory(noteId, newCategoryId);
				}

				// Reload note categories to update the tree
				await loadNoteCategories();
			} catch (error) {
				console.error("Failed to move note:", error);
			}
		},
		[storageAdapter, categories, loadNoteCategories]
	);

	const handleDeleteCategory = useCallback(
		async (categoryId: string) => {
			if (!storageAdapter) return;

			try {
				await storageAdapter.deleteCategory(categoryId);
				setCategories((prev) => prev.filter((cat) => cat.id !== categoryId));
			} catch (error) {
				console.error("Failed to delete category:", error);
			}
		},
		[storageAdapter]
	);

	const handleRenameCategory = useCallback(
		async (categoryId: string, newName: string) => {
			if (!storageAdapter) return;

			try {
				const result = await storageAdapter.updateCategory(categoryId, {
					name: newName,
				});
				if (result.success) {
					setCategories((prev) => prev.map((cat) => (cat.id === categoryId ? { ...cat, name: newName } : cat)));
				}
			} catch (error) {
				console.error("Failed to rename category:", error);
			}
		},
		[storageAdapter]
	);

	return {
		categories,
		noteCategories,
		handleCreateFolder,
		handleMoveNote,
		handleDeleteCategory,
		handleRenameCategory,
		loadNoteCategories,
	};
}
