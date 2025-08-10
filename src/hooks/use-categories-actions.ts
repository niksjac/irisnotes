import { useCallback, useEffect } from "react";
import type { CreateCategoryParams } from "@/types/database";
import { useCategoriesData } from "./use-categories-data";
import { useNotesStorage } from "./use-notes-storage";

export const useCategoriesActions = () => {
	const {
		setIsLoading,
		setError,
		updateCategories,
		addCategory,
		updateCategory: updateCategoryInState,
		removeCategory,
		updateNoteCategories,
		addNoteToCategory: addNoteToCategoryInState,
		removeNoteFromCategory: removeNoteFromCategoryInState,
		removeAllNoteCategoriesForCategory,
		clearError,
	} = useCategoriesData();

	const { storageAdapter, isInitialized } = useNotesStorage();

	const loadAllCategories = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			if (!storageAdapter) {
				setError("Storage not initialized");
				return;
			}

			const result = await storageAdapter.getCategories();
			if (result.success) {
				updateCategories(result.data);
			} else {
				setError(result.error);
			}
		} catch (err) {
			console.error("Failed to load categories:", err);
			setError(`Failed to load categories: ${err}`);
		} finally {
			setIsLoading(false);
		}
	}, [storageAdapter, setIsLoading, setError, updateCategories]);

	const loadAllNoteCategories = useCallback(async () => {
		if (!storageAdapter) return;

		try {
			const relationships: { noteId: string; categoryId: string }[] = [];

			// Get all categories first
			const categoriesResult = await storageAdapter.getCategories();
			if (!categoriesResult.success) return;

			// Load note-category relationships
			for (const category of categoriesResult.data) {
				const result = await storageAdapter.getCategoryNotes(category.id);
				if (result.success) {
					result.data.forEach((note: any) => {
						relationships.push({
							noteId: note.id,
							categoryId: category.id,
						});
					});
				}
			}

			updateNoteCategories(relationships);
		} catch (error) {
			console.error("Failed to load note categories:", error);
		}
	}, [storageAdapter, updateNoteCategories]);

	// Auto-load categories when storage is initialized
	useEffect(() => {
		if (isInitialized) {
			loadAllCategories();
			loadAllNoteCategories();
		}
	}, [isInitialized, loadAllCategories, loadAllNoteCategories]);

	const createCategory = useCallback(
		async (params: CreateCategoryParams) => {
			setError(null);

			try {
				if (!storageAdapter) {
					setError("Storage not initialized");
					return { success: false, error: "Storage not initialized" };
				}

				const result = await storageAdapter.createCategory(params);
				if (result.success) {
					const newCategory = result.data;
					addCategory(newCategory);
					return { success: true, data: newCategory };
				} else {
					setError(result.error);
					return result;
				}
			} catch (err) {
				const errorMsg = `Failed to create category: ${err}`;
				setError(errorMsg);
				return { success: false, error: errorMsg };
			}
		},
		[storageAdapter, setError, addCategory]
	);

	const updateCategory = useCallback(
		async (categoryId: string, params: Partial<CreateCategoryParams>) => {
			setError(null);

			try {
				if (!storageAdapter) {
					setError("Storage not initialized");
					return { success: false, error: "Storage not initialized" };
				}

				const result = await storageAdapter.updateCategory(categoryId, params);
				if (result.success) {
					const updatedCategory = result.data;
					updateCategoryInState(updatedCategory);
					return { success: true, data: updatedCategory };
				} else {
					setError(result.error);
					return result;
				}
			} catch (err) {
				const errorMsg = `Failed to update category: ${err}`;
				setError(errorMsg);
				return { success: false, error: errorMsg };
			}
		},
		[storageAdapter, setError, updateCategoryInState]
	);

	const deleteCategory = useCallback(
		async (categoryId: string) => {
			setError(null);

			try {
				if (!storageAdapter) {
					setError("Storage not initialized");
					return { success: false, error: "Storage not initialized" };
				}

				const result = await storageAdapter.deleteCategory(categoryId);
				if (result.success) {
					removeCategory(categoryId);
					removeAllNoteCategoriesForCategory(categoryId);
					return { success: true };
				} else {
					setError(result.error);
					return result;
				}
			} catch (err) {
				const errorMsg = `Failed to delete category: ${err}`;
				setError(errorMsg);
				return { success: false, error: errorMsg };
			}
		},
		[storageAdapter, setError, removeCategory, removeAllNoteCategoriesForCategory]
	);

	const addNoteToCategory = useCallback(
		async (noteId: string, categoryId: string) => {
			setError(null);

			try {
				if (!storageAdapter) {
					setError("Storage not initialized");
					return { success: false, error: "Storage not initialized" };
				}

				const result = await storageAdapter.addNoteToCategory(noteId, categoryId);
				if (result.success) {
					addNoteToCategoryInState(noteId, categoryId);
					return { success: true };
				} else {
					setError(result.error);
					return result;
				}
			} catch (err) {
				const errorMsg = `Failed to add note to category: ${err}`;
				setError(errorMsg);
				return { success: false, error: errorMsg };
			}
		},
		[storageAdapter, setError, addNoteToCategoryInState]
	);

	const removeNoteFromCategory = useCallback(
		async (noteId: string, categoryId: string) => {
			setError(null);

			try {
				if (!storageAdapter) {
					setError("Storage not initialized");
					return { success: false, error: "Storage not initialized" };
				}

				const result = await storageAdapter.removeNoteFromCategory(noteId, categoryId);
				if (result.success) {
					removeNoteFromCategoryInState(noteId, categoryId);
					return { success: true };
				} else {
					setError(result.error);
					return result;
				}
			} catch (err) {
				const errorMsg = `Failed to remove note from category: ${err}`;
				setError(errorMsg);
				return { success: false, error: errorMsg };
			}
		},
		[storageAdapter, setError, removeNoteFromCategoryInState]
	);

	const moveNote = useCallback(
		async (noteId: string, newCategoryId: string | null) => {
			setError(null);

			try {
				if (!storageAdapter) {
					setError("Storage not initialized");
					return { success: false, error: "Storage not initialized" };
				}

				// Get current categories for the note
				const categoriesResult = await storageAdapter.getCategories();
				if (!categoriesResult.success) {
					setError("Failed to get categories");
					return { success: false, error: "Failed to get categories" };
				}

				// Remove from all categories first
				for (const category of categoriesResult.data) {
					await storageAdapter.removeNoteFromCategory(noteId, category.id);
				}

				// Add to new category if specified
				if (newCategoryId) {
					const result = await storageAdapter.addNoteToCategory(noteId, newCategoryId);
					if (!result.success) {
						setError(result.error);
						return result;
					}
				}

				// Reload note categories to update state
				await loadAllNoteCategories();
				return { success: true };
			} catch (err) {
				const errorMsg = `Failed to move note: ${err}`;
				setError(errorMsg);
				return { success: false, error: errorMsg };
			}
		},
		[storageAdapter, setError, loadAllNoteCategories]
	);

	const createFolder = useCallback(
		(parentCategoryId?: string) => {
			return createCategory({
				name: "New Folder",
				description: "",
				...(parentCategoryId && { parent_id: parentCategoryId }),
			});
		},
		[createCategory]
	);

	const renameCategory = useCallback(
		(categoryId: string, newName: string) => {
			return updateCategory(categoryId, { name: newName });
		},
		[updateCategory]
	);

	return {
		loadAllCategories,
		loadAllNoteCategories,
		createCategory,
		createFolder,
		updateCategory,
		renameCategory,
		deleteCategory,
		addNoteToCategory,
		removeNoteFromCategory,
		moveNote,
		clearError,
	};
};
