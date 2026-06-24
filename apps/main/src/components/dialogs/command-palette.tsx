import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";

export interface PaletteItem {
	id: string;
	label: string;
	/** Right-aligned secondary text (category, path, pane, etc.). */
	hint?: string;
	/** Extra text included in the search haystack but not displayed. */
	keywords?: string;
	icon?: React.ReactNode;
	run: () => void;
}

interface CommandPaletteProps {
	isOpen: boolean;
	onClose: () => void;
	items: PaletteItem[];
	placeholder: string;
	emptyText?: string;
}

/**
 * Generic Ctrl+P-style command palette: a centered modal with a filter input
 * and a keyboard-navigable result list. Mirrors QuickSearchDialog's look/feel.
 */
export function CommandPalette({
	isOpen,
	onClose,
	items,
	placeholder,
	emptyText = "No matches",
}: CommandPaletteProps) {
	const [query, setQuery] = useState("");
	const [selectedIndex, setSelectedIndex] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);
	const listRef = useRef<HTMLDivElement>(null);
	const dialogRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (isOpen) {
			setQuery("");
			setSelectedIndex(0);
			requestAnimationFrame(() => inputRef.current?.focus());
		}
	}, [isOpen]);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return items;
		const words = q.split(/\s+/).filter(Boolean);
		return items
			.map((item) => {
				const hay =
					`${item.label} ${item.hint ?? ""} ${item.keywords ?? ""}`.toLowerCase();
				return {
					item,
					matchCount: words.filter((w) => hay.includes(w)).length,
					all: words.every((w) => hay.includes(w)),
				};
			})
			.filter((r) => r.all)
			.sort((a, b) => b.matchCount - a.matchCount)
			.map((r) => r.item);
	}, [query, items]);

	// Keep the selection within bounds when the result set shrinks.
	useEffect(() => {
		setSelectedIndex((i) => Math.min(i, Math.max(0, filtered.length - 1)));
	}, [filtered.length]);

	useEffect(() => {
		if (!isOpen) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			switch (e.key) {
				case "Escape":
					e.preventDefault();
					onClose();
					break;
				case "ArrowDown":
					e.preventDefault();
					setSelectedIndex((p) => Math.min(p + 1, filtered.length - 1));
					break;
				case "ArrowUp":
					e.preventDefault();
					setSelectedIndex((p) => Math.max(p - 1, 0));
					break;
				case "Enter": {
					e.preventDefault();
					const item = filtered[selectedIndex];
					if (item) {
						onClose();
						item.run();
					}
					break;
				}
			}
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, filtered, selectedIndex, onClose]);

	useEffect(() => {
		const el = listRef.current?.querySelector(`[data-idx="${selectedIndex}"]`);
		el?.scrollIntoView({ block: "nearest" });
	}, [selectedIndex]);

	// Click outside to dismiss.
	useEffect(() => {
		if (!isOpen) return;
		const handleMouseDown = (e: MouseEvent) => {
			if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
				onClose();
			}
		};
		document.addEventListener("mousedown", handleMouseDown);
		return () => document.removeEventListener("mousedown", handleMouseDown);
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return createPortal(
		<div className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] bg-black/40">
			<div
				ref={dialogRef}
				className="w-full max-w-[560px] bg-white dark:bg-gray-800 rounded-md shadow-2xl border border-gray-300 dark:border-gray-600 overflow-hidden"
			>
				<div className="flex items-center gap-2.5 px-3 py-2.5">
					<Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
					<input
						ref={inputRef}
						type="text"
						value={query}
						onChange={(e) => {
							setQuery(e.target.value);
							setSelectedIndex(0);
						}}
						placeholder={placeholder}
						className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
					/>
				</div>

				<div
					ref={listRef}
					className="border-t border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto"
				>
					{filtered.length === 0 ? (
						<div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
							{emptyText}
						</div>
					) : (
						filtered.map((item, index) => {
							const isSelected = index === selectedIndex;
							return (
								<button
									key={item.id}
									data-idx={index}
									onClick={() => {
										onClose();
										item.run();
									}}
									onMouseEnter={() => setSelectedIndex(index)}
									className={`w-full text-left px-3 py-1.5 flex items-center gap-2.5 transition-colors ${
										isSelected
											? "bg-blue-600 dark:bg-blue-600"
											: "hover:bg-gray-100 dark:hover:bg-gray-700/60"
									}`}
								>
									{item.icon && (
										<span
											className={`flex-shrink-0 flex items-center ${
												isSelected
													? "text-white"
													: "text-gray-400 dark:text-gray-500"
											}`}
										>
											{item.icon}
										</span>
									)}
									<span
										className={`flex-1 text-sm truncate ${
											isSelected
												? "text-white"
												: "text-gray-900 dark:text-gray-100"
										}`}
									>
										{item.label}
									</span>
									{item.hint && (
										<span
											className={`text-xs flex-shrink-0 truncate max-w-[220px] ${
												isSelected
													? "text-blue-200"
													: "text-gray-400 dark:text-gray-500"
											}`}
										>
											{item.hint}
										</span>
									)}
								</button>
							);
						})
					)}
				</div>
			</div>
		</div>,
		document.body
	);
}
