import { useState, useCallback, useRef, useEffect } from "react";
import { useAtom } from "jotai";
import { ArrowDownAZ, ArrowUpAZ, Layers, ChevronsUpDown, Calendar, List, FolderTree, Search, X } from "lucide-react";
import { focusAreaAtom } from "@/atoms";
import { useItems } from "@/hooks";
import { getTreeViewCallbacks, treeFilterAtom, treeViewModeAtom, dateSortDirectionAtom } from "@/atoms/tree";

export function TreeHeader() {
	const [focusArea] = useAtom(focusAreaAtom);
	const treeHasFocus = focusArea === "tree";
	const [isSorting, setIsSorting] = useState(false);
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
	const [groupDirection, setGroupDirection] = useState<"asc" | "desc">("asc");
	const [isExpanded, setIsExpanded] = useState(true);
	const [showSearch, setShowSearch] = useState(false);
	const [filterText, setFilterText] = useAtom(treeFilterAtom);
	const [viewMode, setViewMode] = useAtom(treeViewModeAtom);
	const [dateSortDir, setDateSortDir] = useAtom(dateSortDirectionAtom);
	const { sortItemsRecursively } = useItems();
	const searchInputRef = useRef<HTMLInputElement>(null);

	// Focus search input when shown
	useEffect(() => {
		if (showSearch && searchInputRef.current) {
			searchInputRef.current.focus();
		}
	}, [showSearch]);

	const handleToggleSort = useCallback(async () => {
		const newDirection = sortDirection === "asc" ? "desc" : "asc";
		setIsSorting(true);
		setSortDirection(newDirection);
		// Clear date sort when using alpha sort
		setDateSortDir(null);
		try {
			await sortItemsRecursively("title", newDirection);
		} catch (err) {
			console.error("Failed to sort items:", err);
		} finally {
			setIsSorting(false);
		}
	}, [sortDirection, sortItemsRecursively, setDateSortDir]);

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

	const handleToggleDateSort = useCallback(() => {
		// Toggle: null -> desc -> asc -> null
		if (dateSortDir === null) {
			setDateSortDir("desc"); // newest first
		} else if (dateSortDir === "desc") {
			setDateSortDir("asc"); // oldest first
		} else {
			setDateSortDir(null); // off
		}
	}, [dateSortDir, setDateSortDir]);

	const handleToggleViewMode = useCallback(() => {
		setViewMode(viewMode === "hierarchical" ? "flat" : "hierarchical");
	}, [viewMode, setViewMode]);

	const handleToggleSearch = useCallback(() => {
		if (showSearch) {
			setFilterText("");
		}
		setShowSearch(!showSearch);
	}, [showSearch, setFilterText]);

	const handleClearFilter = useCallback(() => {
		setFilterText("");
		searchInputRef.current?.focus();
	}, [setFilterText]);

	const buttonClass = `flex items-center justify-center w-7 h-7 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors ${isSorting ? "opacity-50 cursor-wait" : ""}`;
	const activeButtonClass = `flex items-center justify-center w-7 h-7 text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-800 rounded transition-colors`;

	return (
		<div className="flex flex-col">
			<div
				className={`flex items-center justify-between gap-2 px-3 min-h-[32px] text-xs border-b border-gray-200 dark:border-gray-700 ${
					treeHasFocus
						? "bg-blue-100 dark:bg-[#132247]"
						: "bg-gray-50 dark:bg-gray-800"
				}`}
			>
				<span className="text-gray-600 dark:text-gray-400 font-medium">Notes</span>

				<div className="flex items-center gap-1">
					{/* Search toggle */}
					<button
						type="button"
						className={showSearch || filterText ? activeButtonClass : buttonClass}
						onClick={handleToggleSearch}
						title="Filter notes (search)"
					>
						<Search size={16} />
					</button>

					{/* Date sort toggle */}
					<button
						type="button"
						className={dateSortDir ? activeButtonClass : buttonClass}
						onClick={handleToggleDateSort}
						title={
							dateSortDir === null
								? "Sort by date (click for newest first)"
								: dateSortDir === "desc"
								? "Sorted: newest first (click for oldest)"
								: "Sorted: oldest first (click to disable)"
						}
					>
						<Calendar size={16} className={dateSortDir === "asc" ? "rotate-180" : ""} />
					</button>

					{/* View mode toggle (hierarchical/flat) */}
					<button
						type="button"
						className={viewMode === "flat" ? activeButtonClass : buttonClass}
						onClick={handleToggleViewMode}
						title={viewMode === "hierarchical" ? "Switch to flat view (all notes)" : "Switch to hierarchical view"}
					>
						{viewMode === "hierarchical" ? <FolderTree size={16} /> : <List size={16} />}
					</button>

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

			{/* Search/filter input bar */}
			{showSearch && (
				<div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
					<Search size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
					<input
						ref={searchInputRef}
						type="text"
						value={filterText}
						onChange={(e) => setFilterText(e.target.value)}
						placeholder="Filter notes..."
						className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 outline-none"
					/>
					{filterText && (
						<button
							type="button"
							onClick={handleClearFilter}
							className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
							title="Clear filter"
						>
							<X size={14} />
						</button>
					)}
				</div>
			)}
		</div>
	);
}
