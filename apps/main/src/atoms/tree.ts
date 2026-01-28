import { atom } from "jotai";

export type TreeViewType = "complex";

export const treeViewTypeAtom = atom<TreeViewType>("complex");

/**
 * Hoisted root ID for tree view
 * When set, the tree view shows only the children of this book/section as root items
 * null = show normal root items (books/notes at top level)
 */
export const hoistedRootIdAtom = atom<string | null>(null);

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
