import { useCallback, useEffect, useState } from "react";
import { useNotesData, useCategoriesData } from "@/hooks";
import type { TreeData } from "@/types";
import { buildTreeDataV2 } from "./tree-data-transformer-v2";
import { buildTreeData } from "./tree-data-transformer";

interface UseTreeDataV2Result {
	treeData: TreeData[];
	isLoading: boolean;
	error: string | null;
	moveNode: (nodeId: string, newParentId: string | null) => Promise<void>;
	updateNodeName: (nodeId: string, newName: string) => Promise<void>;
}

/**
 * Enhanced tree data hook that supports both old and new schema
 */
export function useTreeDataV2(): UseTreeDataV2Result {
	const [treeData, setTreeData] = useState<TreeData[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const { notes, refreshNotes } = useNotesData();
	const { categories, noteCategories, refreshCategories } = useCategoriesData();

	// Check if we have the new parent_category_id field
	const hasNewSchema = notes.length > 0 && "parent_category_id" in notes[0];

	// Rebuild tree when data changes
	const refreshData = useCallback(() => {
		setIsLoading(true);
		setError(null);

		try {
			let newTreeData: TreeData[];

			if (hasNewSchema) {
				// Use new simplified tree builder
				console.log("🌳 Using optimized tree schema (v2)");
				newTreeData = buildTreeDataV2(categories, notes);
			} else {
				// Fallback to old tree builder
				console.log("🌳 Using legacy tree schema (v1)");
				newTreeData = buildTreeData(categories, notes, noteCategories);
			}

			setTreeData(newTreeData);
		} catch (err) {
			console.error("Failed to build tree data:", err);
			setError(`Failed to load tree data: ${err}`);
		} finally {
			setIsLoading(false);
		}
	}, [categories, notes, noteCategories, hasNewSchema]);

	// Rebuild tree when data changes
	useEffect(() => {
		refreshData();
	}, [refreshData]);

	// Simplified move function for new schema
	const moveNode = useCallback(
		async (nodeId: string, newParentId: string | null) => {
			if (!hasNewSchema) {
				console.warn("Move operation requires schema v2 - please run migration");
				return;
			}

			try {
				// TODO: Implement actual database update
				// For now, just log the operation
				console.log(`Moving node ${nodeId} to parent ${newParentId}`);

				// This would be:
				// await storageAdapter.updateNote({
				//   id: nodeId,
				//   parent_category_id: newParentId,
				//   sort_order: Date.now()
				// });

				// Refresh data after move
				await refreshNotes();
			} catch (err) {
				console.error("Failed to move node:", err);
				setError(`Failed to move node: ${err}`);
			}
		},
		[hasNewSchema, refreshNotes]
	);

	// Simplified rename function
	const updateNodeName = useCallback(
		async (nodeId: string, newName: string) => {
			try {
				console.log(`Renaming node ${nodeId} to "${newName}"`);

				// TODO: Implement actual database update
				// This would be:
				// await storageAdapter.updateNote({ id: nodeId, title: newName });
				// or await storageAdapter.updateCategory(nodeId, { name: newName });

				// Refresh data after rename
				await refreshNotes();
				await refreshCategories();
			} catch (err) {
				console.error("Failed to rename node:", err);
				setError(`Failed to rename node: ${err}`);
			}
		},
		[refreshNotes, refreshCategories]
	);

	return {
		treeData,
		isLoading,
		error,
		moveNode,
		updateNodeName,
	};
}
