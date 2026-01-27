import type React from "react";
import { useCallback } from "react";
import { useAtomValue } from "jotai";
import { useItems, useNotesStorage } from "@/hooks";
import { sidebarViewModeAtom } from "@/atoms";
import { TreeView } from "../tree";
import { TreeHeader } from "./tree-header";
import { SearchSidebar } from "./search-sidebar";

export const Sidebar: React.FC = () => {
	const { isInitialized } = useNotesStorage();
	const { isLoading, items } = useItems();
	const sidebarViewMode = useAtomValue(sidebarViewModeAtom);

	// Focus tree when clicking on sidebar empty space
	// If a tree item was previously focused, restore focus to it; otherwise focus first item
	const handleSidebarClick = useCallback((e: React.MouseEvent) => {
		const target = e.target as HTMLElement;
		
		// Don't interfere if clicking directly on a tree item (it handles its own focus)
		if (target.closest('button[role="treeitem"]')) {
			return;
		}
		
		const treeContainer = (e.currentTarget as HTMLElement).querySelector(
			'[data-tree-container="true"]',
		) as HTMLElement | null;
		if (!treeContainer) return;

		// Try to find the item that was previously focused (has tabindex="0" in roving tabindex)
		// The headless-tree library sets tabindex="0" on the focused item
		const previouslyFocused = treeContainer.querySelector('button[role="treeitem"][tabindex="0"]') as HTMLElement | null;
		if (previouslyFocused) {
			previouslyFocused.focus();
		} else {
			// Fall back to first item if no previous focus
			const firstItem = treeContainer.querySelector('button[role="treeitem"]') as HTMLElement | null;
			if (firstItem) {
				firstItem.focus();
			}
		}
	}, []);

	if (!isInitialized || isLoading) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
					<p className="text-sm text-gray-500">Loading notes...</p>
				</div>
			</div>
		);
	}

	// Render search sidebar when in search mode
	if (sidebarViewMode === "search") {
		return <SearchSidebar />;
	}

	return (
		<div
			className="flex flex-col h-full bg-white dark:bg-gray-900 cursor-default"
			onClick={handleSidebarClick}
		>
			<TreeHeader />
			<div className="flex-1 overflow-hidden">
				<TreeView />
			</div>
			{/* Item count footer */}
			<div className="flex-shrink-0 px-3 py-2 text-[11px] text-gray-400 dark:text-gray-600 border-t border-gray-200 dark:border-gray-700">
				{items.length} items
			</div>
		</div>
	);
};
