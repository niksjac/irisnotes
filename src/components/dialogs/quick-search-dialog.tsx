import { createPortal } from "react-dom";
import { useEffect, useRef, useState, useMemo, type FC } from "react";
import { Search, FileText, Book, FolderOpen } from "lucide-react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
	quickSearchOpenAtom,
	quickSearchQueryAtom,
	itemsAtom,
	selectedItemIdAtom,
} from "@/atoms";
import { useTabManagement } from "@/hooks";
import type { FlexibleItem } from "@/types/items";

type SearchMode = "notes" | "sections" | "books";

interface SearchResult {
	item: FlexibleItem;
	section: FlexibleItem | null;
	book: FlexibleItem | null;
}

export const QuickSearchDialog: FC = () => {
	const [isOpen, setIsOpen] = useAtom(quickSearchOpenAtom);
	const [query, setQuery] = useAtom(quickSearchQueryAtom);
	const items = useAtomValue(itemsAtom);
	const setSelectedItemId = useSetAtom(selectedItemIdAtom);
	const { openItemInTab } = useTabManagement();

	const dialogRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [mode, setMode] = useState<SearchMode>("notes");

	// Build search results based on mode
	// All modes return notes, but filter differently:
	// - notes: match note title
	// - sections: show notes in sections matching the query
	// - books: show notes in books matching the query
	const searchResults = useMemo((): SearchResult[] => {
		// Always get all notes with their hierarchy
		const allNoteResults = items
			.filter((item) => item.type === "note")
			.map((note) => buildSearchResult(note, items));

		if (!query.trim()) {
			return allNoteResults.slice(0, 30);
		}

		const lowerQuery = query.toLowerCase();
		
		const matchingResults = allNoteResults.filter((result) => {
			switch (mode) {
				case "notes":
					// Match note title
					return result.item.title.toLowerCase().includes(lowerQuery);
				case "sections":
					// Match section name
					return result.section?.title.toLowerCase().includes(lowerQuery) ?? false;
				case "books":
					// Match book name
					return result.book?.title.toLowerCase().includes(lowerQuery) ?? false;
			}
		});

		return matchingResults.slice(0, 30);
	}, [query, items, mode]);

	// Reset selection when results change
	useEffect(() => {
		setSelectedIndex(0);
	}, [searchResults]);

	// Focus input when dialog opens
	useEffect(() => {
		if (isOpen && inputRef.current) {
			inputRef.current.focus();
			setMode("notes"); // Reset to notes mode
		}
	}, [isOpen]);

	// Handle keyboard navigation
	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			switch (e.key) {
				case "Escape":
					e.preventDefault();
					handleClose();
					break;
				case "Tab":
					e.preventDefault();
					// Cycle through modes
					setMode((prev) => {
						if (prev === "notes") return "sections";
						if (prev === "sections") return "books";
						return "notes";
					});
					break;
				case "ArrowDown":
					e.preventDefault();
					setSelectedIndex((prev) =>
						Math.min(prev + 1, searchResults.length - 1)
					);
					break;
				case "ArrowUp":
					e.preventDefault();
					setSelectedIndex((prev) => Math.max(prev - 1, 0));
					break;
				case "Enter":
					e.preventDefault();
					if (searchResults[selectedIndex]) {
						handleSelectItem(searchResults[selectedIndex]);
					}
					break;
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, searchResults, selectedIndex, mode]);

	// Handle click outside to close
	useEffect(() => {
		if (!isOpen) return;

		const handleClickOutside = (e: MouseEvent) => {
			if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
				handleClose();
			}
		};

		const timeoutId = setTimeout(() => {
			document.addEventListener("mousedown", handleClickOutside);
		}, 0);

		return () => {
			clearTimeout(timeoutId);
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen]);

	const handleClose = () => {
		setIsOpen(false);
		setQuery("");
		setSelectedIndex(0);
	};

	const handleSelectItem = (result: SearchResult) => {
		// All modes return notes, so always open in tab
		openItemInTab({
			id: result.item.id,
			title: result.item.title,
			type: "note",
		});
		handleClose();
	};

	const getModeIcon = (m: SearchMode) => {
		switch (m) {
			case "notes": return <FileText className="h-3.5 w-3.5" />;
			case "sections": return <FolderOpen className="h-3.5 w-3.5" />;
			case "books": return <Book className="h-3.5 w-3.5" />;
		}
	};

	const getPlaceholder = () => {
		switch (mode) {
			case "notes": return "Search by note name...";
			case "sections": return "Search by section name...";
			case "books": return "Search by book name...";
		}
	};

	const getEmptyMessage = () => {
		if (!query.trim()) return "No notes available";
		switch (mode) {
			case "notes": return `No notes matching "${query}"`;
			case "sections": return `No notes in sections matching "${query}"`;
			case "books": return `No notes in books matching "${query}"`;
		}
	};

	if (!isOpen) return null;

	const dialogContent = (
		<div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/30">
			<div
				ref={dialogRef}
				className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
			>
				{/* Mode Switcher */}
				<div className="flex border-b border-gray-200 dark:border-gray-700">
					{(["notes", "sections", "books"] as SearchMode[]).map((m) => (
						<button
							key={m}
							onClick={() => setMode(m)}
							className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
								mode === m
									? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-b-2 border-blue-500"
									: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
							}`}
						>
							{getModeIcon(m)}
							<span className="capitalize">{m}</span>
						</button>
					))}
				</div>

				{/* Search Input */}
				<div className="flex items-center gap-3 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
					<Search className="h-4 w-4 text-gray-400" />
					<input
						ref={inputRef}
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder={getPlaceholder()}
						className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 text-sm"
					/>
				</div>

				{/* Results - Column-based compact layout */}
				<div className="max-h-72 overflow-y-auto">
					{searchResults.length === 0 ? (
						<div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
							{getEmptyMessage()}
						</div>
					) : (
						<table className="w-full text-sm">
							{/* Column Headers */}
							<thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
								<tr className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
									<th className="text-left px-4 py-1 font-medium">Name</th>
									<th className="text-left px-2 py-1 font-medium w-28">Section</th>
									<th className="text-left px-2 py-1 font-medium w-28">Book</th>
								</tr>
							</thead>
							{/* Rows */}
							<tbody>
								{searchResults.map((result, index) => (
									<tr
										key={result.item.id}
										onClick={() => handleSelectItem(result)}
										onMouseEnter={() => setSelectedIndex(index)}
										className={`cursor-pointer border-b border-gray-100 dark:border-gray-700/30 ${
											index === selectedIndex
												? "bg-blue-50 dark:bg-blue-900/30"
												: "hover:bg-gray-50 dark:hover:bg-gray-700/50"
										}`}
									>
										{/* Item name */}
										<td className="px-4 py-1">
											<div className="flex items-center gap-2 min-w-0">
													<FileText className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
												<span className="font-medium text-gray-900 dark:text-gray-100 truncate">
													{highlightMatch(result.item.title, query)}
												</span>
											</div>
										</td>
										{/* Section column */}
										<td className="px-2 py-1 w-28">
											{result.section && (
												<div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
														<FolderOpen className="h-3 w-3 text-amber-500 flex-shrink-0" />
													<span className="truncate text-xs">{result.section.title}</span>
												</div>
											)}
										</td>
										{/* Book column */}
										<td className="px-2 py-1 w-28">
											{result.book && (
												<div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
														<Book className="h-3 w-3 text-blue-500 flex-shrink-0" />
													<span className="truncate text-xs">{result.book.title}</span>
												</div>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</div>

				{/* Footer hint */}
				<div className="px-4 py-1.5 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-3">
					<span className="flex items-center gap-1">
						<kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px]">Tab</kbd>
						<span>switch mode</span>
					</span>
					<span className="flex items-center gap-1">
						<kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px]">↑↓</kbd>
						<span>navigate</span>
					</span>
					<span className="flex items-center gap-1">
						<kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px]">Enter</kbd>
						<span>open</span>
					</span>
					<span className="flex items-center gap-1">
						<kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px]">Esc</kbd>
						<span>close</span>
					</span>
				</div>
			</div>
		</div>
	);

	return createPortal(dialogContent, document.body);
};

// Helper to build search result with hierarchy info
function buildSearchResult(
	item: FlexibleItem,
	items: FlexibleItem[]
): SearchResult {
	let section: FlexibleItem | null = null;
	let book: FlexibleItem | null = null;

	if (item.parent_id) {
		const parent = items.find((i) => i.id === item.parent_id);
		if (parent) {
			if (parent.type === "section") {
				section = parent;
				// Find book (section's parent)
				if (parent.parent_id) {
					const grandparent = items.find((i) => i.id === parent.parent_id);
					if (grandparent?.type === "book") {
						book = grandparent;
					}
				}
			} else if (parent.type === "book") {
				book = parent;
			}
		}
	}

	return { item, section, book };
}

// Helper to highlight matching text
function highlightMatch(text: string, query: string): React.ReactNode {
	if (!query.trim()) return text;

	const lowerText = text.toLowerCase();
	const lowerQuery = query.toLowerCase();
	const index = lowerText.indexOf(lowerQuery);

	if (index === -1) return text;

	const before = text.slice(0, index);
	const match = text.slice(index, index + query.length);
	const after = text.slice(index + query.length);

	return (
		<>
			{before}
			<span className="bg-yellow-200 dark:bg-yellow-700 text-gray-900 dark:text-gray-100 rounded px-0.5">
				{match}
			</span>
			{after}
		</>
	);
}
