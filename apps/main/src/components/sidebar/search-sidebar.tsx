import type React from "react";
import { useEffect, useRef, useState, useCallback } from "react";
import { Search, X, FileText, Book, FolderOpen, ChevronLeft, Loader2 } from "lucide-react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
	fullTextSearchQueryAtom,
	sidebarViewModeAtom,
	itemsAtom,
} from "@/atoms";
import { useTabManagement, useNotesStorage } from "@/hooks";
import type { FlexibleItem } from "@/types/items";

interface SearchResult {
	note: FlexibleItem;
	section: FlexibleItem | null;
	book: FlexibleItem | null;
	matchSnippet: string;
}

export const SearchSidebar: React.FC = () => {
	const [query, setQuery] = useAtom(fullTextSearchQueryAtom);
	const setSidebarViewMode = useSetAtom(sidebarViewModeAtom);
	const items = useAtomValue(itemsAtom); // For building hierarchy info
	const { openItemInTab } = useTabManagement();
	const { storageAdapter } = useNotesStorage();

	const inputRef = useRef<HTMLInputElement>(null);
	const [selectedIndex, setSelectedIndex] = useState(-1);
	const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [searchError, setSearchError] = useState<string | null>(null);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Focus input when component mounts
	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.focus();
		}
	}, []);

	// Debounced FTS search
	const performSearch = useCallback(
		async (searchQuery: string) => {
			if (!searchQuery.trim()) {
				setSearchResults([]);
				setIsSearching(false);
				return;
			}

			if (!storageAdapter) {
				setSearchError("Storage not initialized");
				setIsSearching(false);
				return;
			}

			setIsSearching(true);
			setSearchError(null);

			try {
				const result = await storageAdapter.searchItems(searchQuery, {
					types: ["note"],
					limit: 50,
				});

				if (result.success) {
					// Build search results with hierarchy info
					const results: SearchResult[] = result.data.map((item) => ({
						...buildSearchResult(item, items),
						// Use match snippet from FTS if available, otherwise generate one
						matchSnippet:
							item.metadata?._matchSnippet ||
							generateSnippet(item, searchQuery),
					}));
					setSearchResults(results);
				} else {
					setSearchError(result.error);
					setSearchResults([]);
				}
			} catch (error) {
				setSearchError(`Search failed: ${error}`);
				setSearchResults([]);
			} finally {
				setIsSearching(false);
			}
		},
		[storageAdapter, items]
	);

	// Trigger debounced search when query changes
	useEffect(() => {
		if (debounceRef.current) {
			clearTimeout(debounceRef.current);
		}

		if (!query.trim()) {
			setSearchResults([]);
			setIsSearching(false);
			return;
		}

		setIsSearching(true);
		debounceRef.current = setTimeout(() => {
			performSearch(query);
		}, 150); // 150ms debounce for responsive feel

		return () => {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
		};
	}, [query, performSearch]);

	// Reset selection when results change
	useEffect(() => {
		setSelectedIndex(-1);
	}, [searchResults]);

	// Keyboard navigation within the search input
	const handleKeyDown = (e: React.KeyboardEvent) => {
		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				setSelectedIndex((prev) =>
					Math.min(prev + 1, searchResults.length - 1)
				);
				break;
			case "ArrowUp":
				e.preventDefault();
				setSelectedIndex((prev) => Math.max(prev - 1, -1));
				break;
			case "Enter":
				e.preventDefault();
				if (selectedIndex >= 0 && searchResults[selectedIndex]) {
					handleSelectNote(searchResults[selectedIndex].note);
				}
				break;
			case "Escape":
				e.preventDefault();
				if (query) {
					setQuery("");
				} else {
					handleBackToTree();
				}
				break;
		}
	};

	const handleSelectNote = (note: FlexibleItem) => {
		openItemInTab({
			id: note.id,
			title: note.title,
			type: "note",
		});
	};

	const handleBackToTree = () => {
		setSidebarViewMode("tree");
		setQuery("");
	};

	const handleClearQuery = () => {
		setQuery("");
		inputRef.current?.focus();
	};

	return (
		<div className="flex flex-col h-full bg-white dark:bg-gray-900">
			{/* Header */}
			<div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
				<button
					onClick={handleBackToTree}
					className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
					title="Back to tree view"
				>
					<ChevronLeft className="h-4 w-4" />
				</button>
				<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
					Search
				</span>
			</div>

			{/* Search Input */}
			<div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
					<input
						ref={inputRef}
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="Search in notes..."
						className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400"
					/>
					{query && (
						<button
							onClick={handleClearQuery}
							className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded"
						>
							<X className="h-3.5 w-3.5" />
						</button>
					)}
				</div>
			</div>

			{/* Results */}
			<div className="flex-1 overflow-y-auto">
				{!query.trim() ? (
					<div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
						<Search className="h-8 w-8 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
						<p>Type to search in all notes</p>
						<p className="text-xs mt-1 text-gray-400">
							Full-text search powered by FTS5
						</p>
					</div>
				) : isSearching ? (
					<div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
						<Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin text-blue-500" />
						<p>Searching...</p>
					</div>
				) : searchError ? (
					<div className="px-4 py-8 text-center text-sm text-red-500 dark:text-red-400">
						<p>Search error</p>
						<p className="text-xs mt-1">{searchError}</p>
					</div>
				) : searchResults.length === 0 ? (
					<div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
						No results found for "{query}"
					</div>
				) : (
					<div className="py-1">
						{/* Results count */}
						<div className="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400">
							{searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
						</div>

						{/* Result items */}
						{searchResults.map((result, index) => (
							<button
								key={result.note.id}
								onClick={() => handleSelectNote(result.note)}
								onMouseEnter={() => setSelectedIndex(index)}
								className={`w-full text-left px-3 py-2 transition-colors ${
									index === selectedIndex
										? "bg-blue-50 dark:bg-blue-900/30"
										: "hover:bg-gray-50 dark:hover:bg-gray-800"
								}`}
							>
								{/* Note title with icon */}
								<div className="flex items-center gap-2 mb-1">
									<FileText className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
									<span className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
										{highlightMatch(result.note.title, query)}
									</span>
								</div>

								{/* Hierarchy path */}
								{(result.section || result.book) && (
									<div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 ml-5 mb-1">
										{result.book && (
											<>
												<Book className="h-3 w-3 text-amber-500" />
												<span className="truncate">{result.book.title}</span>
											</>
										)}
										{result.section && (
											<>
												{result.book && <span>/</span>}
												<FolderOpen className="h-3 w-3 text-purple-500" />
												<span className="truncate">{result.section.title}</span>
											</>
										)}
									</div>
								)}

								{/* Match snippet */}
								{result.matchSnippet && result.matchSnippet !== "Match in title" && (
									<div className="ml-5 text-xs text-gray-500 dark:text-gray-400 truncate">
										{highlightMatch(result.matchSnippet, query)}
									</div>
								)}
							</button>
						))}
					</div>
				)}
			</div>

			{/* Footer */}
			<div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
				<kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px]">
					Esc
				</kbd>
				<span className="ml-1">to go back</span>
			</div>
		</div>
	);
};

// Helper to build search result with hierarchy info
function buildSearchResult(
	note: FlexibleItem,
	items: FlexibleItem[]
): Omit<SearchResult, "matchSnippet"> {
	let section: FlexibleItem | null = null;
	let book: FlexibleItem | null = null;

	if (note.parent_id) {
		const parent = items.find((item) => item.id === note.parent_id);
		if (parent) {
			if (parent.type === "section") {
				section = parent;
				if (parent.parent_id) {
					const grandparent = items.find((item) => item.id === parent.parent_id);
					if (grandparent?.type === "book") {
						book = grandparent;
					}
				}
			} else if (parent.type === "book") {
				book = parent;
			}
		}
	}

	return { note, section, book };
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

// Generate a snippet for fallback when FTS doesn't provide one
function generateSnippet(item: FlexibleItem, query: string): string {
	const contentToSearch =
		item.content_plaintext || item.content || item.content_raw || "";
	const lowerContent = contentToSearch.toLowerCase();
	const lowerQuery = query.toLowerCase();
	const matchIndex = lowerContent.indexOf(lowerQuery);

	if (matchIndex === -1) {
		// Check if match is in title
		if (item.title.toLowerCase().includes(lowerQuery)) {
			return "Match in title";
		}
		return "";
	}

	const snippetStart = Math.max(0, matchIndex - 40);
	const snippetEnd = Math.min(
		contentToSearch.length,
		matchIndex + query.length + 60
	);

	return (
		(snippetStart > 0 ? "..." : "") +
		contentToSearch.slice(snippetStart, snippetEnd).trim() +
		(snippetEnd < contentToSearch.length ? "..." : "")
	);
}
