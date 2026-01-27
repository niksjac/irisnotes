import { useState, useCallback } from "react";
import { useAtom } from "jotai";
import { ArrowDownAZ, ArrowUpAZ, Layers, ChevronsUpDown } from "lucide-react";
import { focusAreaAtom } from "@/atoms";
import { useItems } from "@/hooks";
import { getTreeViewCallbacks } from "@/atoms/tree";

export function TreeHeader() {
	const [focusArea] = useAtom(focusAreaAtom);
	const treeHasFocus = focusArea === "tree";
	const [isSorting, setIsSorting] = useState(false);
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
	const [groupDirection, setGroupDirection] = useState<"asc" | "desc">("asc");
	const [isExpanded, setIsExpanded] = useState(true);
	const { sortItemsRecursively } = useItems();

	const handleToggleSort = useCallback(async () => {
		const newDirection = sortDirection === "asc" ? "desc" : "asc";
		setIsSorting(true);
		setSortDirection(newDirection);
		try {
			await sortItemsRecursively("title", newDirection);
		} catch (err) {
			console.error("Failed to sort items:", err);
		} finally {
			setIsSorting(false);
		}
	}, [sortDirection, sortItemsRecursively]);

	const handleGroupByType = useCallback(async () => {
		const newDirection = groupDirection === "asc" ? "desc" : "asc";
		setIsSorting(true);
		setGroupDirection(newDirection);
		try {
			await sortItemsRecursively("type", newDirection);
		} catch (err) {
			console.error("Failed to group items:", err);
		} finally {
			setIsSorting(false);
		}
	}, [groupDirection, sortItemsRecursively]);

	const handleToggleExpandCollapse = useCallback(() => {
		const callbacks = getTreeViewCallbacks();
		if (isExpanded) {
			callbacks?.collapseAll?.();
		} else {
			callbacks?.expandAll?.();
		}
		setIsExpanded(!isExpanded);
	}, [isExpanded]);

	const buttonClass = `flex items-center justify-center w-7 h-7 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors ${isSorting ? "opacity-50 cursor-wait" : ""}`;

	return (
		<div
			className={`flex items-center justify-between gap-2 px-3 min-h-[40px] text-xs border-b border-gray-200 dark:border-gray-700 ${
				treeHasFocus
					? "bg-blue-100 dark:bg-[#132247]"
					: "bg-gray-50 dark:bg-gray-800"
			}`}
		>
			<span className="text-gray-600 dark:text-gray-400 font-medium">Notes</span>

			<div className="flex items-center gap-1">
				{/* Expand/Collapse All */}
				<button
					type="button"
					className={buttonClass}
					onClick={handleToggleExpandCollapse}
					title={isExpanded ? "Collapse all folders" : "Expand all folders"}
				>
					<ChevronsUpDown size={16} className={isExpanded ? "" : "rotate-180"} />
				</button>

				{/* Toggle alphabetical sort */}
				<button
					type="button"
					className={buttonClass}
					onClick={handleToggleSort}
					disabled={isSorting}
					title={sortDirection === "asc" ? "Sort A-Z (click for Z-A)" : "Sort Z-A (click for A-Z)"}
				>
					{sortDirection === "asc" ? <ArrowDownAZ size={16} /> : <ArrowUpAZ size={16} />}
				</button>

				{/* Group by type - toggles direction */}
				<button
					type="button"
					className={buttonClass}
					onClick={handleGroupByType}
					disabled={isSorting}
					title={groupDirection === "asc" ? "Group: Books → Sections → Notes (click to reverse)" : "Group: Notes → Sections → Books (click to reverse)"}
				>
					<Layers size={16} className={groupDirection === "desc" ? "rotate-180" : ""} />
				</button>
			</div>
		</div>
	);
}
