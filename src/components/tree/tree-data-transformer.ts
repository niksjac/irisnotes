import type { Category, Note } from "@/types/database";
import type { TreeData } from "@/types";

/**
 * Transform flat categories and notes into hierarchical tree structure
 */
export function buildTreeData(
	categories: Category[],
	notes: Note[],
	noteCategories: { noteId: string; categoryId: string }[]
): TreeData[] {
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
}
