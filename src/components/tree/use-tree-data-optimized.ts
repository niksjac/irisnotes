import { useCallback, useEffect, useState } from "react";
import { useNotesData, useCategoriesData, useNotesActions, useCategoriesActions, useNotesStorage } from "@/hooks";
import type { TreeData } from "@/types";
import { buildTreeDataV3, validateNestingDepth } from "./tree-data-transformer-v3";

interface UseTreeDataOptimizedResult {
	treeData: TreeData[];
	isLoading: boolean;
	error: string | null;
	moveNode: (nodeId: string, newParentId: string | null) => Promise<void>;
	updateNodeName: (nodeId: string, newName: string) => Promise<void>;
}

/**
 * Tree data hook optimized for the new schema with direct parent-child relationships
 */
export function useTreeDataOptimized(): UseTreeDataOptimizedResult {
	const [treeData, setTreeData] = useState<TreeData[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const { notes } = useNotesData();
	const { categories } = useCategoriesData();
	const { updateNote, loadAllNotes } = useNotesActions();
	const { updateCategory, loadAllCategories } = useCategoriesActions();
	const { storageAdapter } = useNotesStorage();

	// Rebuild tree when data changes
	const refreshData = useCallback(() => {
		setIsLoading(true);
		setError(null);

		try {
			const newTreeData = buildTreeDataV3(categories, notes);
			setTreeData(newTreeData);
		} catch (err) {
			console.error("Failed to build tree data:", err);
			setError(`Failed to load tree data: ${err}`);
		} finally {
			setIsLoading(false);
		}
	}, [categories, notes]);

	// Rebuild tree when data changes
	useEffect(() => {
		refreshData();
	}, [refreshData]);

	// Helper to find node type recursively
	const findNodeType = useCallback((data: TreeData[], targetId: string): "note" | "category" | null => {
		for (const item of data) {
			if (item.id === targetId) {
				return item.type || "note";
			}
			if (item.children) {
				const found = findNodeType(item.children, targetId);
				if (found) return found;
			}
		}
		return null;
	}, []);

	// Move node to new parent (drag & drop)
	const moveNode = useCallback(
		async (nodeId: string, newParentId: string | null) => {
			if (!storageAdapter) {
				setError("Storage not available");
				return;
			}

			try {
				// Determine node type from current tree data
				const nodeType = findNodeType(treeData, nodeId);
				if (!nodeType) {
					setError("Could not determine node type");
					return;
				}

				// Validate nesting depth for categories
				if (nodeType === "category" && newParentId) {
					const validation = validateNestingDepth(categories, nodeId, newParentId);
					if (!validation.valid) {
						setError(`Cannot nest deeper than ${validation.maxDepth} levels`);
						return;
					}
				}

				// Use enhanced tree operations
				const result = await storageAdapter.moveTreeItem(nodeId, nodeType, newParentId);

				if (!result.success) {
					setError(`Failed to move ${nodeType}: ${result.error}`);
					return;
				}

				// Refresh data to reflect the move
				await loadAllNotes();
				await loadAllCategories();
			} catch (err) {
				console.error("❌ Failed to move node:", err);
				setError(`Failed to move node: ${err}`);
			}
		},
		[storageAdapter, treeData, categories, findNodeType, loadAllNotes, loadAllCategories]
	);

	// Rename node (F2 or double-click)
	const updateNodeName = useCallback(
		async (nodeId: string, newName: string) => {
			if (!storageAdapter) {
				setError("Storage not available");
				return;
			}

			try {
				const nodeType = findNodeType(treeData, nodeId);

				if (nodeType === "category") {
					const result = await updateCategory(nodeId, { name: newName });
					if (!result.success) {
						setError(`Failed to rename category: ${result.error}`);
						return;
					}
					await loadAllCategories();
				} else if (nodeType === "note") {
					const result = await updateNote({ id: nodeId, title: newName });
					if (!result.success) {
						setError(`Failed to rename note: ${result.error}`);
						return;
					}
					await loadAllNotes();
				} else {
					setError("Could not determine node type");
					return;
				}
			} catch (err) {
				console.error("Failed to rename node:", err);
				setError(`Failed to rename node: ${err}`);
			}
		},
		[storageAdapter, treeData, updateNote, updateCategory, loadAllNotes, loadAllCategories, findNodeType]
	);

	return {
		treeData,
		isLoading,
		error,
		moveNode,
		updateNodeName,
	};
}
