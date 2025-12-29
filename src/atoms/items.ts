import { atom } from "jotai";
import type { FlexibleItem } from "@/types/items";
import { compareSortOrder } from "@/utils/sort-order";

// Core items data atom
export const itemsAtom = atom<FlexibleItem[]>([]);

// Selection state atoms
export const selectedItemIdAtom = atom<string | null>(null);

// Derived atom for selected item
export const selectedItemAtom = atom((get) => {
	const items = get(itemsAtom);
	const selectedId = get(selectedItemIdAtom);
	return items.find((item) => item.id === selectedId) || null;
});

// Tree data derived atom - builds hierarchical structure
export const treeDataAtom = atom((get) => {
	const items = get(itemsAtom);

	// Group items by parent_id
	const itemMap = new Map<string | null, FlexibleItem[]>();

	items.forEach((item) => {
		const parentId = item.parent_id || null;
		if (!itemMap.has(parentId)) {
			itemMap.set(parentId, []);
		}
		itemMap.get(parentId)?.push(item);
	});

	// Sort each group by sort_order (ASCII comparison for fractional indexing)
	itemMap.forEach((children) => {
		children.sort((a, b) => compareSortOrder(a.sort_order, b.sort_order));
	});

	return itemMap;
});

// Helper atoms for different item types
export const notesAtom = atom((get) => {
	const items = get(itemsAtom);
	return items.filter((item) => item.type === "note");
});

export const booksAtom = atom((get) => {
	const items = get(itemsAtom);
	return items.filter((item) => item.type === "book");
});

export const sectionsAtom = atom((get) => {
	const items = get(itemsAtom);
	return items.filter((item) => item.type === "section");
});
