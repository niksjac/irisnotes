import type { Category, Note } from "@/types/database";
import type { TreeData } from "@/types";

/**
 * NEW: Simplified tree builder for optimized schema
 * Uses direct parent-child relationships instead of many-to-many
 */
export function buildTreeDataV2(categories: Category[], notes: Note[]): TreeData[] {
	// Create category map for quick lookup
	const categoryMap = new Map<string, Category>();
	categories.forEach((cat) => categoryMap.set(cat.id, cat));

	// Separate notes by parent category
	const notesByCategory = new Map<string | null, Note[]>();
	const rootNotes: Note[] = [];

	notes.forEach((note) => {
		const parentId = note.parent_category_id || null;
		if (parentId === null) {
			rootNotes.push(note);
		} else {
			const categoryNotes = notesByCategory.get(parentId) || [];
			categoryNotes.push(note);
			notesByCategory.set(parentId, categoryNotes);
		}
	});

	// Build category tree recursively
	const buildCategoryTree = (parentId: string | null): TreeData[] => {
		return categories
			.filter((cat) => cat.parent_id === parentId)
			.sort((a, b) => a.sort_order - b.sort_order)
			.map((category) => {
				const children: TreeData[] = [];

				// Add subcategories first
				const subcategories = buildCategoryTree(category.id);
				children.push(...subcategories);

				// Add notes in this category
				const categoryNotes = notesByCategory.get(category.id) || [];
				const noteNodes: TreeData[] = categoryNotes
					.sort((a, b) => {
						// Sort by sort_order DESC (newest first), then by title
						if (a.sort_order !== b.sort_order) {
							return b.sort_order - a.sort_order;
						}
						return a.title.localeCompare(b.title);
					})
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
		.sort((a, b) => {
			// Sort by sort_order DESC (newest first), then by title
			if (a.sort_order !== b.sort_order) {
				return b.sort_order - a.sort_order;
			}
			return a.title.localeCompare(b.title);
		})
		.map((note) => ({
			id: note.id,
			name: note.title,
			type: "note" as const,
		}));
	tree.push(...rootNoteNodes);

	return tree;
}

/**
 * Helper to move a note to a different category (simplified)
 */
export function moveNoteToCategory(noteId: string, newCategoryId: string | null) {
	// This would be implemented in the storage adapter
	// Much simpler than the current approach:
	// UPDATE notes SET parent_category_id = ? WHERE id = ?
	return {
		query: "UPDATE notes SET parent_category_id = ?, sort_order = ? WHERE id = ?",
		params: [newCategoryId, Date.now(), noteId],
	};
}

/**
 * Helper to move a category to a different parent (simplified)
 */
export function moveCategoryToParent(categoryId: string, newParentId: string | null) {
	// UPDATE categories SET parent_id = ? WHERE id = ?
	return {
		query: "UPDATE categories SET parent_id = ?, sort_order = ? WHERE id = ?",
		params: [newParentId, Date.now(), categoryId],
	};
}
