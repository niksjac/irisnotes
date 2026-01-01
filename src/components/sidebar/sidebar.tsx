import type React from "react";
import { useCallback } from "react";
import { useItems, useNotesStorage } from "@/hooks";
import { TreeView } from "../tree";
import { StorageIndicator } from "./storage-indicator";

export const Sidebar: React.FC = () => {
	const { isInitialized } = useNotesStorage();
	const { isLoading } = useItems();

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

	return (
		<div
			className="flex flex-col h-full bg-white dark:bg-gray-900 cursor-default"
			onClick={handleSidebarClick}
		>
			<StorageIndicator />
			<div className="flex-1 overflow-hidden">
				<TreeView />
			</div>
		</div>
	);
};
