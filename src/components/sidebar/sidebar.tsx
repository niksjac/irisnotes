import type React from "react";
import { useCallback } from "react";
import { useItems, useNotesStorage } from "@/hooks";
import { TreeView } from "../tree";
import { StorageIndicator } from "./storage-indicator";

export const Sidebar: React.FC = () => {
	const { isInitialized } = useNotesStorage();
	const { isLoading } = useItems();

	// Focus the first tree item when clicking anywhere in the sidebar
	const handleSidebarClick = useCallback((e: React.MouseEvent) => {
		// Find the first focusable tree item button and focus it
		const treeContainer = (e.currentTarget as HTMLElement).querySelector(
			'[data-tree-container="true"]',
		) as HTMLElement | null;
		if (treeContainer) {
			// Find the first button (tree item) inside the container
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
