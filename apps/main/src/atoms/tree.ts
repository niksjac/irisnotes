import { atom } from "jotai";

export type TreeViewType = "complex";

export const treeViewTypeAtom = atom<TreeViewType>("complex");

/**
 * Hoisted root ID for tree view
 * When set, the tree view shows only the children of this book/section as root items
 * null = show normal root items (books/notes at top level)
 */
export const hoistedRootIdAtom = atom<string | null>(null);

/**
 * Tree filter text for searching/filtering notes
 * When non-empty, tree shows only notes (no books/sections) matching the filter
 */
export const treeFilterAtom = atom<string>("");

/**
 * Tree view mode: hierarchical (default) or flat (all notes at root with parent prefixes)
 */
export type TreeViewMode = "hierarchical" | "flat";
export const treeViewModeAtom = atom<TreeViewMode>("hierarchical");

/**
 * Date sort direction for tree items
 * null = not sorting by date (use manual/alphabetical sort_order)
 */
export type DateSortDirection = "asc" | "desc" | null;
export const dateSortDirectionAtom = atom<DateSortDirection>(null);

// ============================================================================
// Global callback registry for tree view actions
// Using window object to avoid Jotai store mismatch issues
// ============================================================================

declare global {
	interface Window {
		__treeViewCallbacks?: {
			revealActiveInTree?: () => void;
			toggleHoist?: () => void;
			expandAll?: () => void;
			collapseAll?: () => void;
		};
	}
}

// Initialize the global callbacks object
if (typeof window !== 'undefined' && !window.__treeViewCallbacks) {
	window.__treeViewCallbacks = {};
}

/**
 * Register tree view callbacks (called from TreeView component)
 */
export function registerTreeViewCallbacks(callbacks: {
	revealActiveInTree?: () => void;
	toggleHoist?: () => void;
	expandAll?: () => void;
	collapseAll?: () => void;
}) {
	if (typeof window !== 'undefined') {
		window.__treeViewCallbacks = { ...window.__treeViewCallbacks, ...callbacks };
	}
}

/**
 * Unregister tree view callbacks (called on cleanup)
 */
export function unregisterTreeViewCallbacks() {
	if (typeof window !== 'undefined') {
		window.__treeViewCallbacks = {};
	}
}

/**
 * Get tree view callbacks (called from hotkey handlers)
 */
export function getTreeViewCallbacks() {
	return typeof window !== 'undefined' ? window.__treeViewCallbacks : {};
}
