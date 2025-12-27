// Hierarchy validation logic for the unified items system
// Business rules for parent-child relationships

import type { ItemType } from "@/types/items";

// Define what item types can be children of what parents
const HIERARCHY_RULES: Record<ItemType, (ItemType | null)[]> = {
	// Books can only be at root level
	book: [null],

	// Sections can be at root or inside books
	section: [null, "book"],

	// Notes can be anywhere (root, books, or sections)
	note: [null, "book", "section"],
};

/**
 * Check if a child item type can be placed under a parent item type
 * @param childType - The type of item being placed
 * @param parentType - The type of the parent item (null for root)
 * @returns true if the relationship is valid
 */
export function canBeChildOf(
	childType: ItemType,
	parentType: ItemType | null
): boolean {
	const allowedParents = HIERARCHY_RULES[childType];
	return allowedParents.includes(parentType);
}

/**
 * Get all valid parent types for a given item type
 * @param itemType - The item type to get valid parents for
 * @returns Array of valid parent types (null means root level)
 */
export function getValidParentTypes(itemType: ItemType): (ItemType | null)[] {
	return HIERARCHY_RULES[itemType];
}

/**
 * Get all valid child types for a given parent type
 * @param parentType - The parent type (null for root)
 * @returns Array of item types that can be children
 */
export function getValidChildTypes(parentType: ItemType | null): ItemType[] {
	const validChildren: ItemType[] = [];

	for (const [childType, allowedParents] of Object.entries(HIERARCHY_RULES)) {
		if (allowedParents.includes(parentType)) {
			validChildren.push(childType as ItemType);
		}
	}

	return validChildren;
}

/**
 * Validate a move operation
 * @param itemType - Type of item being moved
 * @param newParentType - Type of new parent (null for root)
 * @returns Validation result with error message if invalid
 */
export function validateMove(
	itemType: ItemType,
	newParentType: ItemType | null
): { valid: boolean; error?: string } {
	if (canBeChildOf(itemType, newParentType)) {
		return { valid: true };
	}

	const parentName = newParentType || "root";
	const allowedParents = getValidParentTypes(itemType)
		.map((p) => p || "root")
		.join(", ");

	return {
		valid: false,
		error: `${itemType}s cannot be placed in ${parentName}. Valid locations: ${allowedParents}`,
	};
}

/**
 * Check if an item can have children
 * @param itemType - The item type to check
 * @returns true if the item type can contain children
 */
export function canHaveChildren(itemType: ItemType): boolean {
	return getValidChildTypes(itemType).length > 0;
}
