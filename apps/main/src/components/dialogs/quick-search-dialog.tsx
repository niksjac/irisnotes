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

interface SearchResult {
	item: FlexibleItem;
	section: FlexibleItem | null;
	book: FlexibleItem | null;
	matchCount: number;
}

export const QuickSearchDialog: FC = () => {
	const [isOpen, setIsOpen] = useAtom(quickSearchOpenAtom);
	const [query, setQuery] = useAtom(quickSearchQueryAtom);
	const items = useAtomValue(itemsAtom);
	const { openItemInTab } = useTabManagement();

	const dialogRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLDivElement>(null);
	const [selectedIndex, setSelectedIndex] = useState(0);

	// Ranked OR search: split on whitespace, any word matching scores a hit.
	// Results with more matching words float to the top.
	// Searches all item types (notes, sections, books) in one unified list.
	const searchResults = useMemo((): SearchResult[] => {
		if (!query.trim()) return [];

		const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);

		const matched = items
			.filter((item) => !item.deleted_at)
			.map((item) => ({
				item,
				matchCount: words.filter((w) => item.title.toLowerCase().includes(w)).length,
			}))
			.filter(({ matchCount }) => matchCount > 0)
			.sort((a, b) => b.matchCount - a.matchCount)
			.slice(0, 50)
			.map(({ item, matchCount }) => {
				let section: FlexibleItem | null = null;
				let book: FlexibleItem | null = null;

				if (item.parent_id) {
					const parent = items.find((i) => i.id === item.parent_id);
					if (parent?.type === "section") {
						section = parent;
						if (parent.parent_id) {
							const gp = items.find((i) => i.id === parent.parent_id);
							if (gp?.type === "book") book = gp;
						}
					} else if (parent?.type === "book") {
						book = parent;
					}
				}

				return { item, section, book, matchCount };
			});

		return matched;
	}, [query, items]);

	// Reset selection on results change; scroll selected item into view
	useEffect(() => {
		setSelectedIndex(0);
	}, [searchResults]);

	useEffect(() => {
		if (listRef.current) {
			const el = listRef.current.querySelector(`[data-idx="${selectedIndex}"]`);
			el?.scrollIntoView({ block: "nearest" });
		}
	}, [selectedIndex]);

	// Focus input when dialog opens
	useEffect(() => {
		if (isOpen && inputRef.current) {
			inputRef.current.focus();
		}
	}, [isOpen]);

	// Keyboard navigation
	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			switch (e.key) {
				case "Escape":
					e.preventDefault();
					handleClose();
					break;
				case "ArrowDown":
					e.preventDefault();
					setSelectedIndex((prev) => Math.min(prev + 1, searchResults.length - 1));
					break;
				case "ArrowUp":
					e.preventDefault();
					setSelectedIndex((prev) => Math.max(prev - 1, 0));
					break;
				case "Enter":
					e.preventDefault();
					if (searchResults[selectedIndex]) handleSelect(searchResults[selectedIndex]);
					break;
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, searchResults, selectedIndex]);

	// Click outside to close
	useEffect(() => {
		if (!isOpen) return;

		const handleClickOutside = (e: MouseEvent) => {
			if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
				handleClose();
			}
		};

		const id = setTimeout(() => document.addEventListener("mousedown", handleClickOutside), 0);
		return () => {
			clearTimeout(id);
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen]);

	const handleClose = () => {
		setIsOpen(false);
		setQuery("");
		setSelectedIndex(0);
	};

	const handleSelect = (result: SearchResult) => {
		openItemInTab({
			id: result.item.id,
			title: result.item.title,
			type: result.item.type as "note" | "section" | "book",
		});
		handleClose();
	};

	const getItemIcon = (type: string) => {
		switch (type) {
			case "note":
				return <FileText className="w-4 h-4 text-green-500 flex-shrink-0" />;
			case "section":
				return <FolderOpen className="w-4 h-4 text-amber-500 flex-shrink-0" />;
			case "book":
				return <Book className="w-4 h-4 text-blue-500 flex-shrink-0" />;
			default:
				return <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />;
		}
	};

	if (!isOpen) return null;

	const queryWords = query.trim().toLowerCase().split(/\s+/).filter(Boolean);

	const dialogContent = (
		<div className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] bg-black/40">
			<div
				ref={dialogRef}
				className="w-full max-w-[560px] bg-white dark:bg-gray-800 rounded-md shadow-2xl border border-gray-300 dark:border-gray-600 overflow-hidden"
			>
				{/* Search input — VS Code Ctrl+P style */}
				<div className="flex items-center gap-2.5 px-3 py-2.5">
					<Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
					<input
						ref={inputRef}
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search notes, sections, books..."
						className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
					/>
					{query && (
						<button
							onClick={() => {
								setQuery("");
								inputRef.current?.focus();
							}}
							className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-1 text-xs"
							tabIndex={-1}
						>
							✕
						</button>
					)}
				</div>

				{/* Results — only rendered when there is a query */}
				{query.trim() && (
					<div
						ref={listRef}
						className="border-t border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto"
					>
						{searchResults.length === 0 ? (
							<div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
								No results for "{query}"
							</div>
						) : (
							searchResults.map((result, index) => {
								const isSelected = index === selectedIndex;
								const pathParts = [
									result.book?.title,
									result.section?.title,
								].filter(Boolean);

								return (
									<button
										key={result.item.id}
										data-idx={index}
										onClick={() => handleSelect(result)}
										onMouseEnter={() => setSelectedIndex(index)}
										className={`w-full text-left px-3 py-1.5 flex items-center gap-2.5 transition-colors ${
											isSelected
												? "bg-blue-600 dark:bg-blue-600"
												: "hover:bg-gray-100 dark:hover:bg-gray-700/60"
										}`}
									>
										{getItemIcon(result.item.type)}
										<span
											className={`flex-1 text-sm truncate ${
												isSelected
													? "text-white"
													: "text-gray-900 dark:text-gray-100"
											}`}
										>
											{highlightWords(result.item.title, queryWords, isSelected)}
										</span>
										{pathParts.length > 0 && (
											<span
												className={`text-xs flex-shrink-0 truncate max-w-[200px] ${
													isSelected
														? "text-blue-200"
														: "text-gray-400 dark:text-gray-500"
												}`}
											>
												{pathParts.join(" › ")}
											</span>
										)}
									</button>
								);
							})
						)}
					</div>
				)}
			</div>
		</div>
	);

	return createPortal(dialogContent, document.body);
};

/**
 * Highlight every occurrence of each search word in the text.
 * Overlapping/adjacent ranges are merged before rendering.
 */
function highlightWords(
	text: string,
	words: string[],
	isSelected: boolean
): React.ReactNode {
	if (!words.length) return text;

	const lower = text.toLowerCase();
	const ranges: [number, number][] = [];

	for (const word of words) {
		let start = 0;
		// biome-ignore lint/suspicious/noAssignInExpressions: deliberate iteration
		for (let idx = lower.indexOf(word, start); idx !== -1; idx = lower.indexOf(word, start)) {
			ranges.push([idx, idx + word.length]);
			start = idx + 1;
		}
	}

	if (!ranges.length) return text;

	// Sort and merge overlapping ranges
	ranges.sort((a, b) => a[0] - b[0]);
	const merged: [number, number][] = [ranges[0]!];
	for (let i = 1; i < ranges.length; i++) {
		const last = merged[merged.length - 1]!;
		if (ranges[i]![0] <= last[1]) {
			last[1] = Math.max(last[1], ranges[i]![1]);
		} else {
			merged.push(ranges[i]!);
		}
	}

	const segments: React.ReactNode[] = [];
	let pos = 0;
	for (const [from, to] of merged) {
		if (pos < from) segments.push(text.slice(pos, from));
		segments.push(
			<span
				key={from}
				className={
					isSelected
						? "bg-white/25 rounded-sm"
						: "bg-yellow-200 dark:bg-yellow-600/50 rounded-sm"
				}
			>
				{text.slice(from, to)}
			</span>
		);
		pos = to;
	}
	if (pos < text.length) segments.push(text.slice(pos));

	return <>{segments}</>;
}
