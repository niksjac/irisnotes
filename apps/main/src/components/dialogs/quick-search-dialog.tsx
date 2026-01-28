import { createPortal } from "react-dom";
import { useEffect, useRef, useState, useMemo, type FC } from "react";
import { Search, FileText, Book, FolderOpen } from "lucide-react";
import { useAtom, useAtomValue } from "jotai";
import {
	quickSearchOpenAtom,
	quickSearchQueryAtom,
	itemsAtom,
} from "@/atoms";
import { useTabManagement } from "@/hooks";
import type { FlexibleItem } from "@/types/items";

type SearchMode = "notes" | "sections" | "books";

interface NoteResult {
	item: FlexibleItem;
	section: FlexibleItem | null;
	book: FlexibleItem | null;
}

interface SectionResult {
	item: FlexibleItem;
	book: FlexibleItem | null;
}

interface BookResult {
	item: FlexibleItem;
}

type SearchResult = NoteResult | SectionResult | BookResult;

export const QuickSearchDialog: FC = () => {
	const [isOpen, setIsOpen] = useAtom(quickSearchOpenAtom);
	const [query, setQuery] = useAtom(quickSearchQueryAtom);
	const items = useAtomValue(itemsAtom);
	const { openItemInTab } = useTabManagement();

	const dialogRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [mode, setMode] = useState<SearchMode>("notes");

	// Build search results based on mode
	// Each mode searches and returns its own type:
	// - notes: search notes, show with compact section/book info
	// - sections: search sections, show with book info
	// - books: search books, no extra columns
	const searchResults = useMemo((): SearchResult[] => {
		// Return empty if no query - don't show anything until user types
		if (!query.trim()) {
			return [];
		}

		const lowerQuery = query.toLowerCase();

		switch (mode) {
			case "notes": {
				const notes = items.filter(
					(item) =>
						item.type === "note" &&
						!item.deleted_at &&
						item.title.toLowerCase().includes(lowerQuery)
				);
				return notes.slice(0, 30).map((note) => buildNoteResult(note, items));
			}
			case "sections": {
				const sections = items.filter(
					(item) =>
						item.type === "section" &&
						!item.deleted_at &&
						item.title.toLowerCase().includes(lowerQuery)
				);
				return sections.slice(0, 30).map((section) => buildSectionResult(section, items));
			}
			case "books": {
				const books = items.filter(
					(item) =>
						item.type === "book" &&
						!item.deleted_at &&
						item.title.toLowerCase().includes(lowerQuery)
				);
				return books.slice(0, 30).map((book) => ({ item: book }));
			}
		}
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
		// Open item based on its actual type
		const itemType = result.item.type as "note" | "section" | "book";
		openItemInTab({
			id: result.item.id,
			title: result.item.title,
			type: itemType,
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
			case "notes": return "Search notes...";
			case "sections": return "Search sections...";
			case "books": return "Search books...";
		}
	};

	const getEmptyMessage = () => {
		if (!query.trim()) {
			switch (mode) {
				case "notes": return "Type to search notes...";
				case "sections": return "Type to search sections...";
				case "books": return "Type to search books...";
			}
		}
		switch (mode) {
			case "notes": return `No notes matching "${query}"`;
			case "sections": return `No sections matching "${query}"`;
			case "books": return `No books matching "${query}"`;
		}
	};

	if (!isOpen) return null;

	const dialogContent = (
		<div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/30">
			<div
				ref={dialogRef}
				className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
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

				{/* Results - compact row layout */}
				<div className="max-h-72 overflow-y-auto">
					{searchResults.length === 0 ? (
						<div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
							{getEmptyMessage()}
						</div>
					) : (
						<div className="py-1">
							{searchResults.map((result, index) => (
								<button
									key={result.item.id}
									onClick={() => handleSelectItem(result)}
									onMouseEnter={() => setSelectedIndex(index)}
									className={`w-full text-left px-4 py-1.5 flex items-center gap-3 transition-colors ${
										index === selectedIndex
											? "bg-blue-50 dark:bg-blue-900/30"
											: "hover:bg-gray-50 dark:hover:bg-gray-700/50"
									}`}
								>
									{/* Item icon and name */}
									<div className="flex items-center gap-2 min-w-0 flex-1">
										{mode === "notes" && (
											<FileText className="h-4 w-4 text-green-500 flex-shrink-0" />
										)}
										{mode === "sections" && (
											<FolderOpen className="h-4 w-4 text-amber-500 flex-shrink-0" />
										)}
										{mode === "books" && (
											<Book className="h-4 w-4 text-blue-500 flex-shrink-0" />
										)}
										<span className="font-medium text-gray-900 dark:text-gray-100 truncate text-sm">
											{highlightMatch(result.item.title, query)}
										</span>
									</div>

									{/* Hierarchy info - compact, mode-specific */}
									{mode === "notes" && (
										<div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
											{"section" in result && result.section && (
												<span className="truncate max-w-24" title={result.section.title}>
													{result.section.title}
												</span>
											)}
											{"book" in result && result.book && (
												<>
													{("section" in result && result.section) && <span>·</span>}
													<span className="truncate max-w-24" title={result.book.title}>
														{result.book.title}
													</span>
												</>
											)}
										</div>
									)}
									{mode === "sections" && "book" in result && result.book && (
										<div className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
											<span className="truncate max-w-32" title={result.book.title}>
												{result.book.title}
											</span>
										</div>
									)}
									{/* Books mode: no extra columns */}
								</button>
							))}
						</div>
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

// Helper to build note result with hierarchy info
function buildNoteResult(
	note: FlexibleItem,
	items: FlexibleItem[]
): NoteResult {
	let section: FlexibleItem | null = null;
	let book: FlexibleItem | null = null;

	if (note.parent_id) {
		const parent = items.find((i) => i.id === note.parent_id);
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

	return { item: note, section, book };
}

// Helper to build section result with book info
function buildSectionResult(
	section: FlexibleItem,
	items: FlexibleItem[]
): SectionResult {
	let book: FlexibleItem | null = null;

	if (section.parent_id) {
		const parent = items.find((i) => i.id === section.parent_id);
		if (parent?.type === "book") {
			book = parent;
		}
	}

	return { item: section, book };
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
