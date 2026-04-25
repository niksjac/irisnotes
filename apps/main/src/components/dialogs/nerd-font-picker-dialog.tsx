import { createPortal } from "react-dom";
import { useEffect, useRef, useState, useMemo, type FC } from "react";
import { Search } from "lucide-react";
import { useAtom } from "jotai";
import { nerdFontPickerOpenAtom } from "@/atoms";
import { activeEditorViewStore } from "@/components/editor/active-editor-view-store";

// Shape mirrors the generated data module. Imported lazily (see useEffect).
interface NerdFontIcon {
	char: string;
	code: string;
	name: string;
	keywords: string;
	category: string;
}

type IconsModule = {
	NERD_FONT_ICONS: readonly NerdFontIcon[];
	NERD_FONT_CATEGORIES: readonly string[];
	NERD_FONT_VERSION: string;
};

const MAX_RESULTS = 300;
const NERD_FONT_FAMILY = '"Symbols Nerd Font"';

// Module-level cache so repeat opens are instant after first load.
let iconsModuleCache: IconsModule | null = null;

export const NerdFontPickerDialog: FC = () => {
	const [isOpen, setIsOpen] = useAtom(nerdFontPickerOpenAtom);
	const [query, setQuery] = useState("");
	const [activeCategory, setActiveCategory] = useState<string | null>(null);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [iconsModule, setIconsModule] = useState<IconsModule | null>(
		iconsModuleCache,
	);

	const dialogRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const gridRef = useRef<HTMLDivElement>(null);

	// Lazy load the ~10k icon dataset on first open
	useEffect(() => {
		if (!isOpen || iconsModuleCache) return;
		let cancelled = false;
		import("@/data/nerd-font-icons").then((mod) => {
			if (cancelled) return;
			const cached: IconsModule = {
				NERD_FONT_ICONS: mod.NERD_FONT_ICONS,
				NERD_FONT_CATEGORIES: mod.NERD_FONT_CATEGORIES,
				NERD_FONT_VERSION: mod.NERD_FONT_VERSION,
			};
			iconsModuleCache = cached;
			setIconsModule(cached);
		});
		return () => {
			cancelled = true;
		};
	}, [isOpen]);

	const filtered = useMemo((): NerdFontIcon[] => {
		if (!iconsModule) return [];
		let results: readonly NerdFontIcon[] = iconsModule.NERD_FONT_ICONS;

		if (activeCategory) {
			results = results.filter((i) => i.category === activeCategory);
		}

		if (query.trim()) {
			const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
			const scored: Array<{ icon: NerdFontIcon; score: number }> = [];
			for (const icon of results) {
				const haystack =
					`${icon.name} ${icon.keywords} ${icon.code}`.toLowerCase();
				let score = 0;
				for (const w of words) {
					if (haystack.includes(w)) score += 1;
				}
				if (score === words.length) scored.push({ icon, score });
			}
			scored.sort((a, b) => b.score - a.score);
			return scored.slice(0, MAX_RESULTS).map((s) => s.icon);
		}

		return results.slice(0, MAX_RESULTS);
	}, [query, activeCategory, iconsModule]);

	useEffect(() => {
		setSelectedIndex(0);
	}, [filtered]);

	useEffect(() => {
		if (gridRef.current) {
			const el = gridRef.current.querySelector(`[data-idx="${selectedIndex}"]`);
			el?.scrollIntoView({ block: "nearest" });
		}
	}, [selectedIndex]);

	useEffect(() => {
		if (isOpen) {
			inputRef.current?.focus();
			setQuery("");
			setActiveCategory(null);
			setSelectedIndex(0);
		}
	}, [isOpen]);

	const getColumnsCount = (): number => {
		if (!gridRef.current) return 10;
		const firstChild = gridRef.current.querySelector(
			"[data-idx]",
		) as HTMLElement | null;
		if (!firstChild) return 10;
		const gridWidth = gridRef.current.clientWidth;
		const itemWidth = firstChild.offsetWidth + 4;
		return Math.max(1, Math.floor(gridWidth / itemWidth));
	};

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
					setSelectedIndex((prev) =>
						Math.min(prev + 1, filtered.length - 1),
					);
					break;
				case "ArrowLeft":
					e.preventDefault();
					setSelectedIndex((prev) => Math.max(prev - 1, 0));
					break;
				case "ArrowDown":
					e.preventDefault();
					setSelectedIndex((prev) =>
						Math.min(prev + cols, filtered.length - 1),
					);
					break;
				case "ArrowUp":
					e.preventDefault();
					setSelectedIndex((prev) => Math.max(prev - cols, 0));
					break;
				case "Enter": {
					e.preventDefault();
					const icon = filtered[selectedIndex];
					if (icon) handleSelect(icon);
					break;
				}
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen, filtered, selectedIndex]);

	useEffect(() => {
		if (!isOpen) return;

		const handleClickOutside = (e: MouseEvent) => {
			if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
				handleClose();
			}
		};

		const id = setTimeout(
			() => document.addEventListener("mousedown", handleClickOutside),
			0,
		);
		return () => {
			clearTimeout(id);
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen]);

	const handleClose = () => {
		setIsOpen(false);
	};

	const handleSelect = (icon: NerdFontIcon) => {
		const view = activeEditorViewStore.get();
		if (view) {
			const { schema } = view.state;
			const { from, to } = view.state.selection;
			// Wrap glyph with a fontFamily mark so it renders correctly even when
			// the editor's global font isn't a Nerd Font.
			const fontFamilyMark = schema.marks.fontFamily;
			const marks = fontFamilyMark
				? [fontFamilyMark.create({ family: NERD_FONT_FAMILY })]
				: [];
			const node = schema.text(icon.char, marks);
			const tr = view.state.tr.replaceWith(from, to, node);
			view.dispatch(tr);
			view.focus();
		}
		handleClose();
	};

	if (!isOpen) return null;

	const selectedIcon = filtered[selectedIndex];
	const categories = iconsModule?.NERD_FONT_CATEGORIES ?? [];

	const dialogContent = (
		<div className="fixed inset-0 z-50 flex items-start justify-center pt-[6vh] bg-black/40">
			<div
				ref={dialogRef}
				className="w-full max-w-[640px] bg-white dark:bg-gray-800 rounded-md shadow-2xl border border-gray-300 dark:border-gray-600 overflow-hidden flex flex-col"
				style={{ maxHeight: "70vh" }}
			>
				<div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-gray-200 dark:border-gray-700">
					<Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
					<input
						ref={inputRef}
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search Nerd Font icons by name, keyword, or hex code..."
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

				<div className="flex items-center gap-1 px-2 py-2.5 min-h-[44px] border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-hide">
					<button
						onClick={() => setActiveCategory(null)}
						className={`px-2 py-1 text-xs rounded whitespace-nowrap transition-colors ${
							activeCategory === null
								? "bg-blue-500 text-white"
								: "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
						}`}
					>
						All
					</button>
					{categories.map((cat) => (
						<button
							key={cat}
							onClick={() =>
								setActiveCategory(activeCategory === cat ? null : cat)
							}
							className={`px-2 py-1 text-xs rounded whitespace-nowrap transition-colors ${
								activeCategory === cat
									? "bg-blue-500 text-white"
									: "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
							}`}
						>
							{cat}
						</button>
					))}
				</div>

				<div className="flex-1 overflow-y-auto p-2 min-h-0">
					{!iconsModule ? (
						<div className="text-center text-gray-400 dark:text-gray-500 text-sm py-8">
							Loading icons…
						</div>
					) : (
						<div
							ref={gridRef}
							className="grid gap-1"
							style={{
								gridTemplateColumns: "repeat(auto-fill, minmax(40px, 1fr))",
							}}
						>
							{filtered.map((icon, i) => (
								<button
									key={`${icon.code}-${i}`}
									data-idx={i}
									onClick={() => handleSelect(icon)}
									onMouseEnter={() => setSelectedIndex(i)}
									title={`${icon.name} (U+${icon.code})`}
									className={`nf-glyph flex items-center justify-center w-10 h-10 rounded text-xl cursor-pointer transition-colors ${
										i === selectedIndex
											? "bg-blue-500 text-white"
											: "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
									}`}
								>
									{icon.char}
								</button>
							))}
						</div>
					)}
					{iconsModule && filtered.length === 0 && (
						<div className="text-center text-gray-400 dark:text-gray-500 text-sm py-8">
							No icons found
						</div>
					)}
				</div>

				<div className="flex items-center gap-3 px-3 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
					{selectedIcon ? (
						<>
							<span className="nf-glyph text-base">{selectedIcon.char}</span>
							<span className="font-medium text-gray-700 dark:text-gray-300 truncate">
								{selectedIcon.name}
							</span>
							<span className="font-mono">U+{selectedIcon.code}</span>
							<span className="ml-auto whitespace-nowrap">
								{filtered.length} icons
							</span>
						</>
					) : (
						<span>{iconsModule ? `${filtered.length} icons` : "Loading…"}</span>
					)}
				</div>
			</div>
		</div>
	);

	return createPortal(dialogContent, document.body);
};
