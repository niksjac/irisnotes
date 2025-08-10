import { useAtom } from "jotai";
import { useCallback, useState } from "react";
import { categoriesAtom, noteCategoriesAtom } from "@/atoms";
import type { Category } from "@/types/database";

export const useCategoriesData = () => {
	const [categories, setCategories] = useAtom(categoriesAtom);
	const [noteCategories, setNoteCategories] = useAtom(noteCategoriesAtom);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const updateCategories = useCallback(
		(newCategories: Category[]) => {
			setCategories(newCategories);
		},
		[setCategories]
	);

	const addCategory = useCallback(
		(category: Category) => {
			setCategories((prev) => [...prev, category]);
		},
		[setCategories]
	);

	const updateCategory = useCallback(
		(updatedCategory: Category) => {
			setCategories((prev) =>
				prev.map((category) => (category.id === updatedCategory.id ? updatedCategory : category))
			);
		},
		[setCategories]
	);

	const removeCategory = useCallback(
		(categoryId: string) => {
			setCategories((prev) => prev.filter((category) => category.id !== categoryId));
		},
		[setCategories]
	);

	const updateNoteCategories = useCallback(
		(newNoteCategories: { noteId: string; categoryId: string }[]) => {
			setNoteCategories(newNoteCategories);
		},
		[setNoteCategories]
	);

	const addNoteToCategory = useCallback(
		(noteId: string, categoryId: string) => {
			setNoteCategories((prev) => {
				// Check if relationship already exists
				const exists = prev.some((nc) => nc.noteId === noteId && nc.categoryId === categoryId);
				if (exists) return prev;

				return [...prev, { noteId, categoryId }];
			});
		},
		[setNoteCategories]
	);

	const removeNoteFromCategory = useCallback(
		(noteId: string, categoryId: string) => {
			setNoteCategories((prev) => prev.filter((nc) => !(nc.noteId === noteId && nc.categoryId === categoryId)));
		},
		[setNoteCategories]
	);

	const removeAllNoteCategoriesForNote = useCallback(
		(noteId: string) => {
			setNoteCategories((prev) => prev.filter((nc) => nc.noteId !== noteId));
		},
		[setNoteCategories]
	);

	const removeAllNoteCategoriesForCategory = useCallback(
		(categoryId: string) => {
			setNoteCategories((prev) => prev.filter((nc) => nc.categoryId !== categoryId));
		},
		[setNoteCategories]
	);

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	return {
		categories,
		noteCategories,
		isLoading,
		error,
		setIsLoading,
		setError,
		updateCategories,
		addCategory,
		updateCategory,
		removeCategory,
		updateNoteCategories,
		addNoteToCategory,
		removeNoteFromCategory,
		removeAllNoteCategoriesForNote,
		removeAllNoteCategoriesForCategory,
		clearError,
	};
};
