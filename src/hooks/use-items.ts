import { useAtom, useAtomValue } from "jotai";
import { useCallback, useEffect, useState } from "react";
import {
	itemsAtom,
	selectedItemIdAtom,
	selectedItemAtom,
	treeDataAtom,
} from "@/atoms/items";
import { useNotesStorage } from "./use-notes-storage";
import { canBeChildOf } from "@/storage/hierarchy";
import type { FlexibleItem, CreateItemParams } from "@/types/items";
import type { UpdateNoteParams, CreateNoteParams } from "@/types/database";

export const useItems = () => {
	const [items, setItems] = useAtom(itemsAtom);
	const [selectedItemId, setSelectedItemId] = useAtom(selectedItemIdAtom);
	const selectedItem = useAtomValue(selectedItemAtom);
	const treeData = useAtomValue(treeDataAtom);

	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const { storageAdapter, isInitialized } = useNotesStorage();

	// ========================================
	// LOAD OPERATIONS
	// ========================================

	const loadAllItems = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			if (!storageAdapter) {
				setError("Storage not initialized");
				return;
			}

			const result = await storageAdapter.getAllItems();
			if (result.success) {
				setItems(result.data);
			} else {
				setError(result.error);
			}
		} catch (err) {
			console.error("Failed to load items:", err);
			setError(`Failed to load items: ${err}`);
		} finally {
			setIsLoading(false);
		}
	}, [storageAdapter, setItems]);

	// Auto-load items when storage is initialized
	useEffect(() => {
		if (isInitialized) {
			loadAllItems();
		}
	}, [isInitialized, loadAllItems]);

	// ========================================
	// CREATE OPERATIONS
	// ========================================

	const createItem = useCallback(
		async (params: CreateItemParams) => {
			setError(null);

			try {
				if (!storageAdapter) {
					setError("Storage not initialized");
					return { success: false, error: "Storage not initialized" };
				}

				// Validate hierarchy
				const parentType = params.parent_id
					? items.find((item) => item.id === params.parent_id)?.type || null
					: null;

				if (!canBeChildOf(params.type, parentType)) {
					const errorMsg = `Cannot create ${params.type} under ${parentType || "root"}`;
					setError(errorMsg);
					return { success: false, error: errorMsg };
				}

				// Create via unified createItem method
				let result: any;
				if (params.type === "note") {
					const noteParams: CreateNoteParams = {
						title: params.title,
						content: params.content || "",
						content_type: "html",
						parent_id: params.parent_id,
					};
					result = await storageAdapter.createNote(noteParams);
				} else {
					// Books and sections use unified createItem method
					result = await storageAdapter.createItem(params);
				}

				if (result.success) {
					// Reload to get updated tree data
					await loadAllItems();

					// Select the new item if it's a note
					if (params.type === "note") {
						setSelectedItemId(result.data.id);
					}

					return { success: true, data: result.data };
				} else {
					setError(result.error);
					return result;
				}
			} catch (err) {
				const errorMsg = `Failed to create ${params.type}: ${err}`;
				setError(errorMsg);
				return { success: false, error: errorMsg };
			}
		},
		[storageAdapter, items, loadAllItems, setSelectedItemId]
	);

	// ========================================
	// UPDATE OPERATIONS
	// ========================================

	const updateItem = useCallback(
		async (id: string, updates: Partial<FlexibleItem>) => {
			setError(null);

			try {
				if (!storageAdapter) {
					setError("Storage not initialized");
					return { success: false, error: "Storage not initialized" };
				}

				const item = items.find((i) => i.id === id);
				if (!item) {
					setError("Item not found");
					return { success: false, error: "Item not found" };
				}

				// Validate hierarchy if parent_id is being changed
				if (updates.parent_id !== undefined) {
					const newParentType = updates.parent_id
						? items.find((i) => i.id === updates.parent_id)?.type || null
						: null;

					if (!canBeChildOf(item.type, newParentType)) {
						const errorMsg = `Cannot move ${item.type} under ${newParentType || "root"}`;
						setError(errorMsg);
						return { success: false, error: errorMsg };
					}
				}

				// Update via appropriate adapter method based on type
				let result: any;
				if (item.type === "note") {
					const noteParams: UpdateNoteParams = { id };
					if (updates.title) noteParams.title = updates.title;
					if (updates.content !== undefined)
						noteParams.content = updates.content;
					if (updates.content_type)
						noteParams.content_type = updates.content_type;
					if (updates.content_raw !== undefined)
						noteParams.content_raw = updates.content_raw;
					if (updates.parent_id !== undefined)
						noteParams.parent_id = updates.parent_id;

					result = await storageAdapter.updateNote(noteParams);
				} else {
					// Books and sections use unified updateItem method
					result = await storageAdapter.updateItem(id, updates);
				}

				if (result.success) {
					// Reload to get updated tree data
					await loadAllItems();
					return { success: true, data: result.data };
				} else {
					setError(result.error);
					return result;
				}
			} catch (err) {
				const errorMsg = `Failed to update item: ${err}`;
				setError(errorMsg);
				return { success: false, error: errorMsg };
			}
		},
		[storageAdapter, items, loadAllItems]
	);

	// ========================================
	// DELETE OPERATIONS
	// ========================================

	const deleteItem = useCallback(
		async (id: string) => {
			setError(null);

			try {
				if (!storageAdapter) {
					setError("Storage not initialized");
					return { success: false, error: "Storage not initialized" };
				}

				const item = items.find((i) => i.id === id);
				if (!item) {
					setError("Item not found");
					return { success: false, error: "Item not found" };
				}

				// Delete via unified deleteItem method
				let result: any;
				if (item.type === "note") {
					result = await storageAdapter.deleteNote(id);
				} else {
					result = await storageAdapter.deleteItem(id);
				}

				if (result.success) {
					// Clear selection if the deleted item was selected
					if (selectedItemId === id) {
						setSelectedItemId(null);
					}

					// Reload to get updated tree data
					await loadAllItems();
					return { success: true };
				} else {
					setError(result.error);
					return result;
				}
			} catch (err) {
				const errorMsg = `Failed to delete item: ${err}`;
				setError(errorMsg);
				return { success: false, error: errorMsg };
			}
		},
		[storageAdapter, items, selectedItemId, setSelectedItemId, loadAllItems]
	);

	// ========================================
	// SEARCH OPERATIONS
	// ========================================

	const searchItems = useCallback(
		async (query: string, filters?: { type?: "note" | "book" | "section" }) => {
			setError(null);

			try {
				if (!storageAdapter) {
					setError("Storage not initialized");
					return { success: false, error: "Storage not initialized" };
				}

				// For now, only search notes since that's what the adapter supports
				if (!filters?.type || filters.type === "note") {
					const result = await storageAdapter.searchNotes(query);
					if (result.success) {
						return { success: true, data: result.data };
					} else {
						setError(result.error);
						return result;
					}
				}

				// For books/sections, do client-side filtering
				const filteredItems = items.filter((item) => {
					if (filters?.type && item.type !== filters.type) return false;
					return item.title.toLowerCase().includes(query.toLowerCase());
				});

				return { success: true, data: filteredItems };
			} catch (err) {
				const errorMsg = `Failed to search items: ${err}`;
				setError(errorMsg);
				return { success: false, error: errorMsg };
			}
		},
		[storageAdapter, items]
	);

	// ========================================
	// CONVENIENCE METHODS
	// ========================================

	const createNote = useCallback(
		(params: Omit<CreateNoteParams, "content_type">) => {
			return createItem({
				type: "note",
				title: params.title,
				content: params.content,
				parent_id: params.parent_id,
			});
		},
		[createItem]
	);

	const createBook = useCallback(
		(title: string, parent_id?: string) => {
			return createItem({
				type: "book",
				title,
				parent_id,
			});
		},
		[createItem]
	);

	const createSection = useCallback(
		(title: string, parent_id?: string) => {
			return createItem({
				type: "section",
				title,
				parent_id,
			});
		},
		[createItem]
	);

	const updateItemTitle = useCallback(
		(id: string, title: string) => {
			return updateItem(id, { title });
		},
		[updateItem]
	);

	const updateItemContent = useCallback(
		async (
			id: string,
			content: string,
			contentType?: "html" | "markdown" | "plain" | "custom",
			contentRaw?: string
		) => {
			
			// Optimistically update local state immediately
			setItems((prevItems) =>
				prevItems.map((item) =>
					item.id === id
						? {
								...item,
								content,
								...(contentType !== undefined && { content_type: contentType }),
								...(contentRaw !== undefined && { content_raw: contentRaw }),
							}
						: item
				)
			);

			// Persist to database without reloading all items
			if (!storageAdapter) {
				console.error("[updateItemContent] Storage adapter not initialized");
				return { success: false, error: "Storage not initialized" };
			}

			// Note: We don't validate the item exists here because:
			// 1. For newly created notes, `items` in the closure may be stale
			// 2. The database will return an error if the note doesn't exist
			const noteParams: UpdateNoteParams = { id, content };
			if (contentType !== undefined) noteParams.content_type = contentType;
			if (contentRaw !== undefined) noteParams.content_raw = contentRaw;

			return await storageAdapter.updateNote(noteParams);
		},
		[storageAdapter, setItems]
	);

	const moveItem = useCallback(
		async (id: string, newParentId: string | null, insertIndex?: number) => {
			setError(null);

			try {
				if (!storageAdapter) {
					setError("Storage not initialized");
					return { success: false, error: "Storage not initialized" };
				}

				const item = items.find((i) => i.id === id);
				if (!item) {
					setError("Item not found");
					return { success: false, error: "Item not found" };
				}

				// Validate hierarchy
				const newParentType = newParentId
					? items.find((i) => i.id === newParentId)?.type || null
					: null;

				if (!canBeChildOf(item.type, newParentType)) {
					const errorMsg = `Cannot move ${item.type} under ${newParentType || "root"}`;
					setError(errorMsg);
					return { success: false, error: errorMsg };
				}

				// Use the storage adapter's moveTreeItem method
				const result = await storageAdapter.moveTreeItem(
					id,
					item.type as "note" | "book" | "section",
					newParentId,
					insertIndex
				);

				if (result.success) {
					// Reload to get updated tree data
					await loadAllItems();
					return { success: true };
				} else {
					setError(result.error);
					return result;
				}
			} catch (err) {
				const errorMsg = `Failed to move item: ${err}`;
				setError(errorMsg);
				return { success: false, error: errorMsg };
			}
		},
		[storageAdapter, items, loadAllItems]
	);

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	const clearSelection = useCallback(() => {
		setSelectedItemId(null);
	}, [setSelectedItemId]);

	// ========================================
	// RETURN API
	// ========================================

	const selectItem = useCallback(
		(itemId: string | null) => {
			setSelectedItemId(itemId);
		},
		[setSelectedItemId]
	);

	const isSelected = useCallback(
		(itemId: string) => {
			return selectedItemId === itemId;
		},
		[selectedItemId]
	);

	// ========================================
	// SORTING OPERATIONS
	// ========================================

	/**
	 * Sort all items recursively by a given field and direction.
	 * This sorts items at every level (root, within books, within sections).
	 */
	/**
	 * Get type priority for sorting (books first, then sections, then notes)
	 */
	const getTypePriority = (type: string): number => {
		switch (type) {
			case "book": return 0;
			case "section": return 1;
			case "note": return 2;
			default: return 3;
		}
	};

	const sortItemsRecursively = useCallback(
		async (field: "title" | "created" | "updated" | "type", direction: "asc" | "desc") => {
			setError(null);

			try {
				if (!storageAdapter) {
					setError("Storage not initialized");
					return { success: false, error: "Storage not initialized" };
				}

				// Group items by parent_id
				const itemsByParent = new Map<string | null, FlexibleItem[]>();
				for (const item of items) {
					const parentId = item.parent_id ?? null;
					if (!itemsByParent.has(parentId)) {
						itemsByParent.set(parentId, []);
					}
					itemsByParent.get(parentId)?.push(item);
				}

				// Sort each group and reorder
				for (const [parentId, groupItems] of itemsByParent) {
					// Sort items within this group
					const sortedItems = [...groupItems].sort((a, b) => {
						// For "type" field, group by type first, then sort by title within each type
						if (field === "type") {
							const typeDiff = getTypePriority(a.type) - getTypePriority(b.type);
							// Apply direction to type grouping (desc = notes first, asc = books first)
							const adjustedTypeDiff = direction === "desc" ? -typeDiff : typeDiff;
							if (adjustedTypeDiff !== 0) return adjustedTypeDiff;
							// Within same type, sort by title alphabetically
							return a.title.localeCompare(b.title);
						}

						let comparison = 0;
						switch (field) {
							case "title":
								comparison = a.title.localeCompare(b.title);
								break;
							case "created":
								comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
								break;
							case "updated":
								comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
								break;
						}
						return direction === "desc" ? -comparison : comparison;
					});

					// Apply new order to each item in this group
					for (let i = 0; i < sortedItems.length; i++) {
						const item = sortedItems[i];
						if (item) {
							await storageAdapter.reorderTreeItem(
								item.id,
								item.type,
								i,
								parentId
							);
						}
					}
				}

				// Reload to get updated sort_order values
				await loadAllItems();

				return { success: true };
			} catch (err) {
				const errorMsg = `Failed to sort items: ${err}`;
				setError(errorMsg);
				return { success: false, error: errorMsg };
			}
		},
		[storageAdapter, items, loadAllItems]
	);

	return {
		// Data
		items,
		selectedItemId,
		selectedItem,
		treeData,
		isLoading,
		error,

		// Core CRUD operations
		loadAllItems,
		createItem,
		updateItem,
		deleteItem,
		searchItems,

		// Convenience methods
		createNote,
		createBook,
		createSection,
		updateItemTitle,
		updateItemContent,
		moveItem,

		// Selection management
		setSelectedItemId,
		selectItem,
		clearSelection,
		isSelected,

		// Sorting
		sortItemsRecursively,

		// Error handling
		clearError,
	};
};
