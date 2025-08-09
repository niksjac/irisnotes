import { useCallback, useEffect, useState } from "react";
import { useNotesCategories } from "./use-notes-categories";
import { useNotesData } from "./use-notes-data";
import { useNotesStorage } from "./use-notes-storage";
import type { Category, Note } from "@/types/database";
import type { TreeData } from "@/types";

interface UseTreeDataResult {
	treeData: TreeData[];
	isLoading: boolean;
	error: string | null;
	refreshData: () => Promise<void>;
}

export function useTreeData(): UseTreeDataResult {
	const [treeData, setTreeData] = useState<TreeData[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const { storageAdapter, isInitialized } = useNotesStorage();
	const { notes } = useNotesData();
	const { categories, noteCategories } = useNotesCategories({
		storageAdapter,
		isLoading: !isInitialized,
		notesLength: notes.length,
	});

	// Transform flat categories and notes into hierarchical tree structure
	const buildTreeData = useCallback(
		(categories: Category[], notes: Note[], noteCategories: { noteId: string; categoryId: string }[]): TreeData[] => {
			// Create a map for quick category lookup
			const categoryMap = new Map<string, Category>();
			categories.forEach((cat) => categoryMap.set(cat.id, cat));

			// Create a map for notes by category
			const notesByCategory = new Map<string, Note[]>();
			noteCategories.forEach((relation) => {
				const categoryNotes = notesByCategory.get(relation.categoryId) || [];
				const note = notes.find((n) => n.id === relation.noteId);
				if (note) {
					categoryNotes.push(note);
					notesByCategory.set(relation.categoryId, categoryNotes);
				}
			});

			// Find notes without categories (root level notes)
			const notesWithCategories = new Set(noteCategories.map((rel) => rel.noteId));
			const rootNotes = notes.filter((note) => !notesWithCategories.has(note.id));

			// Build tree recursively
			const buildCategoryTree = (parentId: string | null): TreeData[] => {
				return categories
					.filter((cat) => cat.parent_id === parentId)
					.sort((a, b) => a.sort_order - b.sort_order)
					.map((category) => {
						const children: TreeData[] = [];

						// Add subcategories
						const subcategories = buildCategoryTree(category.id);
						children.push(...subcategories);

						// Add notes in this category
						const categoryNotes = notesByCategory.get(category.id) || [];
						const noteNodes: TreeData[] = categoryNotes
							.sort((a, b) => a.title.localeCompare(b.title))
							.map((note) => ({
								id: note.id,
								name: note.title,
								type: "note" as const,
							}));
						children.push(...noteNodes);

						return {
							id: category.id,
							name: category.name,
							type: "category" as const,
							children: children.length > 0 ? children : undefined,
						};
					});
			};

			// Build the complete tree
			const tree: TreeData[] = [];

			// Add root categories with their children
			const rootCategories = buildCategoryTree(null);
			tree.push(...rootCategories);

			// Add root-level notes (notes without categories)
			const rootNoteNodes: TreeData[] = rootNotes
				.sort((a, b) => a.title.localeCompare(b.title))
				.map((note) => ({
					id: note.id,
					name: note.title,
					type: "note" as const,
				}));
			tree.push(...rootNoteNodes);

			return tree;
		},
		[]
	);

	// Refresh data from database
	const refreshData = useCallback(async () => {
		if (!isInitialized || !storageAdapter) {
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			// Data comes from the hooks, so we just need to rebuild the tree
			const newTreeData = buildTreeData(categories, notes, noteCategories);
			setTreeData(newTreeData);
		} catch (err) {
			console.error("Failed to build tree data:", err);
			setError(`Failed to load tree data: ${err}`);
		} finally {
			setIsLoading(false);
		}
	}, [isInitialized, storageAdapter, categories, notes, noteCategories, buildTreeData]);

	// Rebuild tree when data changes
	useEffect(() => {
		refreshData();
	}, [refreshData]);

	return {
		treeData,
		isLoading,
		error,
		refreshData,
	};
}
