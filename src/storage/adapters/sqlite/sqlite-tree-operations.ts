import type { VoidStorageResult } from "../../types";
import { BaseRepository } from "./sqlite-base";

/**
 * Enhanced tree operations for unified drag & drop functionality
 * Handles both notes and categories with proper ordering
 */
export class SqliteTreeOperations extends BaseRepository {
	/**
	 * Move any tree item (note or category) to a new parent with proper ordering
	 */
	async moveTreeItem(
		itemId: string,
		itemType: "note" | "category",
		newParentId: string | null,
		insertIndex?: number
	): Promise<VoidStorageResult> {
		const dbCheck = this.checkDatabase();
		if (dbCheck) return dbCheck;

		try {
			// Step 1: Get current sort orders in the target location
			const allTargetItems = await this.getItemSortOrders(newParentId);

			// Step 2: Filter out the item being moved (critical for same-parent moves)
			const targetSortOrders = allTargetItems.filter(
				(item) => !(item.id === itemId && item.type === itemType)
			);

			// Step 3: Calculate new sort order
			const newSortOrder = this.calculateInsertPosition(
				targetSortOrders,
				insertIndex
			);

			// Step 4: Update the item's parent and sort order
			if (itemType === "note") {
				await this.db.execute(
					"UPDATE notes SET parent_category_id = ?, sort_order = ? WHERE id = ?",
					[newParentId, newSortOrder, itemId]
				);
			} else {
				await this.db.execute(
					"UPDATE categories SET parent_id = ?, sort_order = ? WHERE id = ?",
					[newParentId, newSortOrder, itemId]
				);
			}

			return this.voidSuccess();
		} catch (error) {
			return this.handleError(error, `Move ${itemType}`);
		}
	}

	/**
	 * Get all items (notes and categories) in a parent with their sort orders
	 * CRITICAL: This must match the exact same ordering as used in getTreeData()
	 */
	private async getItemSortOrders(
		parentId: string | null
	): Promise<Array<{ id: string; type: string; sort_order: number }>> {
		// Use the EXACT same query as getTreeData() to ensure consistency
		const query = `
			SELECT id, 'category' as type, sort_order
			FROM categories
			WHERE parent_id ${parentId ? "= ?" : "IS NULL"}
			UNION ALL
			SELECT id, 'note' as type, sort_order
			FROM notes
			WHERE parent_category_id ${parentId ? "= ?" : "IS NULL"}
			AND deleted_at IS NULL
			ORDER BY sort_order ASC
		`;

		const params = parentId ? [parentId, parentId] : [];
		const items = await this.db.select<
			Array<{ id: string; type: string; sort_order: number }>
		>(query, params);

		return items;
	}

	/**
	 * Calculate the sort order for inserting at a specific index
	 */
	private calculateInsertPosition(
		existingItems: Array<{ sort_order: number }>,
		insertIndex?: number
	): number {
		if (existingItems.length === 0) {
			return 1000; // First item
		}

		if (insertIndex === undefined || insertIndex >= existingItems.length) {
			// Insert at end - use highest sort_order + 1000
			const maxOrder = Math.max(
				...existingItems.map((item) => item.sort_order)
			);
			return maxOrder + 1000;
		}

		if (insertIndex === 0) {
			// Insert at beginning - use lowest sort_order - 1000
			const minOrder = Math.min(
				...existingItems.map((item) => item.sort_order)
			);
			return Math.max(minOrder - 1000, 0); // Ensure non-negative
		}

		// Insert between items - use average of adjacent sort orders
		const prevItem = existingItems[insertIndex - 1];
		const nextItem = existingItems[insertIndex];

		if (!prevItem || !nextItem) {
			// Fallback if items are undefined
			const maxOrder = Math.max(
				...existingItems.map((item) => item.sort_order)
			);
			return maxOrder + 1000;
		}

		const prevOrder = prevItem.sort_order;
		const nextOrder = nextItem.sort_order;

		// Check if there's enough space between the items
		const gap = nextOrder - prevOrder;

		if (gap <= 1) {
			// Not enough space - use timestamp-based approach
			const timestamp = Date.now();
			return prevOrder + (timestamp % 1000) + 1;
		}

		// Always ensure at least 1 unit of spacing
		const spacing = Math.max(Math.floor(gap / 2), 1);
		const result = prevOrder + spacing;

		// Safety check: ensure we don't collide with existing sort orders
		if (result >= nextOrder) {
			return prevOrder + Math.max(1, Math.floor(gap / 3));
		}

		return result;
	}

	/**
	 * Reorder items within the same parent (for drag reordering without changing parent)
	 */
	async reorderTreeItem(
		itemId: string,
		itemType: "note" | "category",
		newIndex: number,
		parentId: string | null
	): Promise<VoidStorageResult> {
		const dbCheck = this.checkDatabase();
		if (dbCheck) return dbCheck;

		try {
			// Get current items in order
			const items = await this.getItemSortOrders(parentId);
			const currentIndex = items.findIndex(
				(item) => item.id === itemId && item.type === itemType
			);

			if (currentIndex === -1) {
				throw new Error("Item not found in parent");
			}

			// Remove item from current position
			items.splice(currentIndex, 1);

			// Calculate new sort order for the target position
			const newSortOrder = this.calculateInsertPosition(items, newIndex);

			// Update the item
			if (itemType === "note") {
				await this.db.execute("UPDATE notes SET sort_order = ? WHERE id = ?", [
					newSortOrder,
					itemId,
				]);
			} else {
				await this.db.execute(
					"UPDATE categories SET sort_order = ? WHERE id = ?",
					[newSortOrder, itemId]
				);
			}

			// Simple approach - the sort order calculation already ensures proper positioning

			return this.voidSuccess();
		} catch (error) {
			return this.handleError(error, `Reorder ${itemType}`);
		}
	}
}
