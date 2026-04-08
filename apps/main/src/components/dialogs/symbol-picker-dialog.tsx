import { createPortal } from "react-dom";
import { useEffect, useRef, useState, useMemo, type FC } from "react";
import { Search } from "lucide-react";
import { useAtom } from "jotai";
import { symbolPickerOpenAtom } from "@/atoms";
import { activeEditorViewStore } from "@/components/editor/active-editor-view-store";
import {
	UNICODE_SYMBOLS,
	UNICODE_CATEGORIES,
	type UnicodeSymbol,
} from "@/data/unicode-symbols";

const MAX_RESULTS = 200;

export const SymbolPickerDialog: FC = () => {
	const [isOpen, setIsOpen] = useAtom(symbolPickerOpenAtom);
	const [query, setQuery] = useState("");
	const [activeCategory, setActiveCategory] = useState<string | null>(null);
	const [selectedIndex, setSelectedIndex] = useState(0);

	const dialogRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const gridRef = useRef<HTMLDivElement>(null);

	// Filtered symbols: search query takes priority, then category filter
	const filtered = useMemo((): UnicodeSymbol[] => {
		let results = UNICODE_SYMBOLS;

		if (activeCategory) {
			results = results.filter((s) => s.category === activeCategory);
		}

		if (query.trim()) {
			const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
			results = results
				.map((sym) => {
					const haystack = `${sym.name} ${sym.keywords} ${sym.char} ${sym.code}`.toLowerCase();
					const matchCount = words.filter((w) => haystack.includes(w)).length;
					return { sym, matchCount };
				})
				.filter(({ matchCount }) => matchCount > 0)
				.sort((a, b) => b.matchCount - a.matchCount)
				.map(({ sym }) => sym);
		}

		return results.slice(0, MAX_RESULTS);
	}, [query, activeCategory]);

	// Reset selection when results change
	useEffect(() => {
		setSelectedIndex(0);
	}, [filtered]);

	// Scroll selected into view
	useEffect(() => {
		if (gridRef.current) {
			const el = gridRef.current.querySelector(`[data-idx="${selectedIndex}"]`);
			el?.scrollIntoView({ block: "nearest" });
		}
	}, [selectedIndex]);

	// Focus input on open
	useEffect(() => {
		if (isOpen) {
			inputRef.current?.focus();
			setQuery("");
			setActiveCategory(null);
			setSelectedIndex(0);
		}
	}, [isOpen]);

	// Compute columns for keyboard grid navigation
	const getColumnsCount = (): number => {
		if (!gridRef.current) return 10;
		const firstChild = gridRef.current.querySelector("[data-idx]") as HTMLElement | null;
		if (!firstChild) return 10;
		const gridWidth = gridRef.current.clientWidth;
		const itemWidth = firstChild.offsetWidth + 4; // gap approximation
		return Math.max(1, Math.floor(gridWidth / itemWidth));
	};

	// Keyboard navigation
	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			const cols = getColumnsCount();
			switch (e.key) {
				case "Escape":
					e.preventDefault();
					handleClose();
					break;
				case "ArrowRight":
					e.preventDefault();
					setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
					break;
				case "ArrowLeft":
					e.preventDefault();
					setSelectedIndex((prev) => Math.max(prev - 1, 0));
					break;
				case "ArrowDown":
					e.preventDefault();
					setSelectedIndex((prev) => Math.min(prev + cols, filtered.length - 1));
					break;
				case "ArrowUp":
					e.preventDefault();
					setSelectedIndex((prev) => Math.max(prev - cols, 0));
					break;
				case "Enter": {
					e.preventDefault();
					const sym = filtered[selectedIndex];
					if (sym) handleSelect(sym);
					break;
				}
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, filtered, selectedIndex]);

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
	};

	const handleSelect = (sym: UnicodeSymbol) => {
		const view = activeEditorViewStore.get();
		if (view) {
			const { from, to } = view.state.selection;
			const tr = view.state.tr.replaceWith(from, to, view.state.schema.text(sym.char));
			view.dispatch(tr);
			view.focus();
		}
		handleClose();
	};

	if (!isOpen) return null;

	const selectedSym = filtered[selectedIndex];

	const dialogContent = (
		<div className="fixed inset-0 z-50 flex items-start justify-center pt-[6vh] bg-black/40">
			<div
				ref={dialogRef}
				className="w-full max-w-[640px] bg-white dark:bg-gray-800 rounded-md shadow-2xl border border-gray-300 dark:border-gray-600 overflow-hidden flex flex-col"
				style={{ maxHeight: "70vh" }}
			>
				{/* Search input */}
				<div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-gray-200 dark:border-gray-700">
					<Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
					<input
						ref={inputRef}
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search symbols by name, keyword, or hex code..."
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

				{/* Category tabs */}
				<div className="flex gap-1 px-2 py-1.5 border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-hide">
					<button
						onClick={() => setActiveCategory(null)}
						className={`px-2 py-0.5 text-xs rounded whitespace-nowrap transition-colors ${
							activeCategory === null
								? "bg-blue-500 text-white"
								: "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
						}`}
					>
						All
					</button>
					{UNICODE_CATEGORIES.map((cat) => (
						<button
							key={cat}
							onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
							className={`px-2 py-0.5 text-xs rounded whitespace-nowrap transition-colors ${
								activeCategory === cat
									? "bg-blue-500 text-white"
									: "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
							}`}
						>
							{cat}
						</button>
					))}
				</div>

				{/* Symbol grid */}
				<div className="flex-1 overflow-y-auto p-2 min-h-0">
					<div
						ref={gridRef}
						className="grid gap-1"
						style={{ gridTemplateColumns: "repeat(auto-fill, minmax(40px, 1fr))" }}
					>
						{filtered.map((sym, i) => (
							<button
								key={`${sym.code}-${i}`}
								data-idx={i}
								onClick={() => handleSelect(sym)}
								onMouseEnter={() => setSelectedIndex(i)}
								title={`${sym.name} (U+${sym.code})`}
								className={`flex items-center justify-center w-10 h-10 rounded text-lg cursor-pointer transition-colors ${
									i === selectedIndex
										? "bg-blue-500 text-white"
										: "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
								}`}
							>
								{sym.char}
							</button>
						))}
					</div>
					{filtered.length === 0 && (
						<div className="text-center text-gray-400 dark:text-gray-500 text-sm py-8">
							No symbols found
						</div>
					)}
				</div>

				{/* Status bar: show info about selected symbol */}
				<div className="flex items-center gap-3 px-3 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-850">
					{selectedSym ? (
						<>
							<span className="text-base">{selectedSym.char}</span>
							<span className="font-medium text-gray-700 dark:text-gray-300">{selectedSym.name}</span>
							<span className="font-mono">U+{selectedSym.code}</span>
							<span className="ml-auto">{filtered.length} symbols</span>
						</>
					) : (
						<span>{filtered.length} symbols</span>
					)}
				</div>
			</div>
		</div>
	);

	return createPortal(dialogContent, document.body);
};
