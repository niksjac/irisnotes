import type { Category, Note } from "@/types/database";
import type { TreeData } from "@/types";

/**
 * V3: Enhanced tree builder with unified ordering (categories and notes can be mixed)
 */
export function buildTreeData(categories: Category[], notes: Note[]): TreeData[] {
	// Create category map for quick lookup
	const categoryMap = new Map<string, Category>();
	categories.forEach((cat) => categoryMap.set(cat.id, cat));

	// Create unified items map by parent
	const itemsByParent = new Map<
		string | null,
		Array<{
			id: string;
			name: string;
			type: "note" | "category";
			sort_order: number;
			isInternal?: boolean;
		}>
	>();

	// Add all categories to the map
	categories.forEach((category) => {
		const parentId = category.parent_id || null;
		const items = itemsByParent.get(parentId) || [];
		items.push({
			id: category.id,
			name: category.name,
			type: "category",
			sort_order: category.sort_order,
			isInternal: true,
		});
		itemsByParent.set(parentId, items);
	});

	// Add all notes to the map
	notes.forEach((note) => {
		const parentId = note.parent_category_id || null;
		const items = itemsByParent.get(parentId) || [];
		items.push({
			id: note.id,
			name: note.title,
			type: "note",
			sort_order: note.sort_order,
			isInternal: false,
		});
		itemsByParent.set(parentId, items);
	});

	// Build tree recursively with unified ordering
	const buildUnifiedTree = (parentId: string | null): TreeData[] => {
		const items = itemsByParent.get(parentId) || [];

		// Sort all items together by sort_order (ascending for consistent ordering)
		items.sort((a, b) => a.sort_order - b.sort_order);

		return items.map((item) => {
			const treeNode: TreeData = {
				id: item.id,
				name: item.name,
				type: item.type,
			};

			// If it's a category, recursively build children
			if (item.type === "category") {
				const children = buildUnifiedTree(item.id);
				if (children.length > 0) {
					treeNode.children = children;
				}
			}

			return treeNode;
		});
	};

	// Build and return the complete tree starting from root
	return buildUnifiedTree(null);
}

/**
 * Helper to determine if an item type can accept drops
 */
export function canAcceptDrop(targetType: "note" | "category", _dragType: "note" | "category"): boolean {
	// Notes can't accept drops (they're not containers)
	if (targetType === "note") {
		return false;
	}

	// Categories can accept both notes and other categories
	if (targetType === "category") {
		return true;
	}

	return false;
}

/**
 * Helper to validate nesting depth (max 3 levels for categories)
 */
export function validateNestingDepth(
	categories: Category[],
	_categoryId: string,
	newParentId: string | null
): { valid: boolean; depth: number; maxDepth: number } {
	const maxDepth = 3;

	if (!newParentId) {
		return { valid: true, depth: 1, maxDepth };
	}

	// Calculate depth of target parent
	let currentId = newParentId;
	let depth = 1;

	while (currentId && depth < maxDepth + 1) {
		const parent = categories.find((cat) => cat.id === currentId);
		if (!parent || !parent.parent_id) {
			break;
		}
		currentId = parent.parent_id;
		depth++;
	}

	// The new item would be at depth + 1
	const newDepth = depth + 1;

	return {
		valid: newDepth <= maxDepth,
		depth: newDepth,
		maxDepth,
	};
}
