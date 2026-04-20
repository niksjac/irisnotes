import { useState, useCallback, useRef, useEffect } from "react";
import { useAtom } from "jotai";
import { ArrowDownAZ, ArrowUpAZ, Layers, ChevronsUpDown, Calendar, List, FolderTree, Search, X, EllipsisVertical } from "lucide-react";
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
	const [menuOpen, setMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	// Close menu on click outside
	useEffect(() => {
		if (!menuOpen) return;
		const handleClick = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setMenuOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [menuOpen]);

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
	const menuItemClass = (active: boolean) =>
		`flex items-center gap-2.5 w-full px-3 py-1.5 text-xs transition-colors ${
			active
				? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
				: "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
		} disabled:opacity-50 disabled:cursor-wait`;

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

				<div className="relative" ref={menuRef}>
					<button
						type="button"
						className={buttonClass}
						onClick={() => setMenuOpen(!menuOpen)}
						title="Tree actions"
					>
						<EllipsisVertical size={16} />
					</button>

					{menuOpen && (
						<div className="absolute right-0 top-full mt-1 z-50 min-w-[200px] py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
							<button
								type="button"
								className={menuItemClass(showSearch || !!filterText)}
								onClick={() => { handleToggleSearch(); setMenuOpen(false); }}
							>
								<Search size={15} />
								<span>Filter notes</span>
							</button>

							<button
								type="button"
								className={menuItemClass(!!dateSortDir)}
								onClick={() => { handleToggleDateSort(); setMenuOpen(false); }}
							>
								<Calendar size={15} className={dateSortDir === "asc" ? "rotate-180" : ""} />
								<span>{dateSortDir === null ? "Sort by date" : dateSortDir === "desc" ? "Date: newest first" : "Date: oldest first"}</span>
							</button>

							<button
								type="button"
								className={menuItemClass(viewMode === "flat")}
								onClick={() => { handleToggleViewMode(); setMenuOpen(false); }}
							>
								{viewMode === "hierarchical" ? <FolderTree size={15} /> : <List size={15} />}
								<span>{viewMode === "hierarchical" ? "Switch to flat view" : "Switch to tree view"}</span>
							</button>

							<div className="my-1 border-t border-gray-200 dark:border-gray-700" />

							<button
								type="button"
								className={menuItemClass(false)}
								onClick={() => { handleToggleExpandCollapse(); setMenuOpen(false); }}
							>
								<ChevronsUpDown size={15} className={isExpanded ? "" : "rotate-180"} />
								<span>{isExpanded ? "Collapse all" : "Expand all"}</span>
							</button>

							<button
								type="button"
								className={menuItemClass(false)}
								onClick={() => { handleToggleSort(); setMenuOpen(false); }}
								disabled={isSorting}
							>
								{sortDirection === "asc" ? <ArrowDownAZ size={15} /> : <ArrowUpAZ size={15} />}
								<span>{sortDirection === "asc" ? "Sort A → Z" : "Sort Z → A"}</span>
							</button>

							<button
								type="button"
								className={menuItemClass(false)}
								onClick={() => { handleGroupByType(); setMenuOpen(false); }}
								disabled={isSorting}
							>
								<Layers size={15} className={groupDirection === "desc" ? "rotate-180" : ""} />
								<span>{groupDirection === "asc" ? "Group by type" : "Group by type (reversed)"}</span>
							</button>
						</div>
					)}
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
