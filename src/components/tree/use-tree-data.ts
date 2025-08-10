import { useCallback, useEffect, useState } from "react";
import { useNotesData, useCategoriesData } from "@/hooks";
import type { TreeData } from "@/types";
import { buildTreeData } from "./tree-data-transformer";

interface UseTreeDataResult {
	treeData: TreeData[];
	isLoading: boolean;
	error: string | null;
}

export function useTreeData(): UseTreeDataResult {
	const [treeData, setTreeData] = useState<TreeData[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const { notes } = useNotesData();
	const { categories, noteCategories } = useCategoriesData();

	// Rebuild tree when data changes
	const refreshData = useCallback(() => {
		setIsLoading(true);
		setError(null);

		try {
			// Build the tree with current data from atoms
			const newTreeData = buildTreeData(categories, notes, noteCategories);
			setTreeData(newTreeData);
		} catch (err) {
			console.error("Failed to build tree data:", err);
			setError(`Failed to load tree data: ${err}`);
		} finally {
			setIsLoading(false);
		}
	}, [categories, notes, noteCategories]);

	// Rebuild tree when data changes
	useEffect(() => {
		refreshData();
	}, [refreshData]);

	return {
		treeData,
		isLoading,
		error,
	};
}
