import { useCallback, useEffect, useState } from "react";
import { useNotesActions, useCategoriesActions, useNotesStorage, useCategoriesData } from "@/hooks";
import type { TreeData } from "@/types";

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
export function useTreeData(): UseTreeDataOptimizedResult {
	const [treeData, setTreeData] = useState<TreeData[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const { updateNote } = useNotesActions();
	const { updateCategory } = useCategoriesActions();
	const { categories } = useCategoriesData();
	const { storageAdapter } = useNotesStorage();

	// Load tree data directly from storage
	const loadTreeData = useCallback(async () => {
		if (!storageAdapter) {
			setError("Storage not available");
			setIsLoading(false);
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const result = await storageAdapter.getTreeData();
			if (result.success) {
				setTreeData(result.data);
			} else {
				setError(`Failed to load tree data: ${result.error}`);
			}
		} catch (err) {
			console.error("Failed to load tree data:", err);
			setError(`Failed to load tree data: ${err}`);
		} finally {
			setIsLoading(false);
		}
	}, [storageAdapter]);

	// Load tree data on mount and when storage changes
	useEffect(() => {
		loadTreeData();
	}, [loadTreeData]);

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

				// Simple nesting depth validation for categories (max 3 levels)
				if (nodeType === "category" && newParentId) {
					// Count depth by traversing up the parent chain
					let currentId = newParentId;
					let depth = 1;
					while (currentId && depth < 4) {
						const parent = categories.find((cat) => cat.id === currentId);
						if (!parent || !parent.parent_id) break;
						currentId = parent.parent_id;
						depth++;
					}
					if (depth >= 3) {
						setError("Cannot nest deeper than 3 levels");
						return;
					}
				}

				// Use enhanced tree operations
				const result = await storageAdapter.moveTreeItem(nodeId, nodeType, newParentId);

				if (!result.success) {
					setError(`Failed to move ${nodeType}: ${result.error}`);
					return;
				}

				// Refresh tree data after move
				await loadTreeData();
			} catch (err) {
				console.error("❌ Failed to move node:", err);
				setError(`Failed to move node: ${err}`);
			}
		},
		[storageAdapter, treeData, categories, findNodeType, loadTreeData]
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
					if (!result || !result.success) {
						setError(`Failed to rename category: ${result?.error || "Unknown error"}`);
						return;
					}
					await loadTreeData();
				} else if (nodeType === "note") {
					const result = await updateNote({ id: nodeId, title: newName });
					if (!result || !result.success) {
						setError(`Failed to rename note: ${result?.error || "Unknown error"}`);
						return;
					}
					await loadTreeData();
				} else {
					setError("Could not determine node type");
					return;
				}
			} catch (err) {
				console.error("Failed to rename node:", err);
				setError(`Failed to rename node: ${err}`);
			}
		},
		[storageAdapter, treeData, updateNote, updateCategory, loadTreeData, findNodeType]
	);

	return {
		treeData,
		isLoading,
		error,
		moveNode,
		updateNodeName,
	};
}
