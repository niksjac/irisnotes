import { useEffect, useMemo, useRef, useState } from "react";
import { X, Keyboard, Search } from "lucide-react";
import { useHotkeysConfig } from "@/hooks/use-hotkeys-config";
import {
	PROSEMIRROR_HOTKEYS,
} from "@/config/editor-hotkeys";

interface QuickHotkeysModalProps {
	isOpen: boolean;
	onClose: () => void;
}

/**
 * Format a hotkey string for display
 */
function formatHotkey(key: string | undefined): string {
	if (!key) return "";
	return key
		.split("+")
		.map((part) => {
			const lower = part.toLowerCase();
			if (lower === "ctrl" || lower === "control" || lower === "mod") return "Ctrl";
			if (lower === "shift") return "Shift";
			if (lower === "alt") return "Alt";
			if (lower === "meta") return "⌘";
			if (lower === "comma") return ",";
			if (lower === "period") return ".";
			if (lower === "arrowup" || lower === "up") return "↑";
			if (lower === "arrowdown" || lower === "down") return "↓";
			if (lower === "arrowleft" || lower === "left") return "←";
			if (lower === "arrowright" || lower === "right") return "→";
			if (lower === "tab") return "Tab";
			if (lower === "enter") return "Enter";
			if (lower === "escape" || lower === "esc") return "Esc";
			if (lower === "backspace") return "⌫";
			if (lower === "delete") return "Del";
			if (lower === "space") return "Space";
			return part.charAt(0).toUpperCase() + part.slice(1);
		})
		.join("+");
}

export function QuickHotkeysModal({ isOpen, onClose }: QuickHotkeysModalProps) {
	const modalRef = useRef<HTMLDivElement>(null);
	const filterRef = useRef<HTMLInputElement>(null);
	const { hotkeys: hotkeyMapping } = useHotkeysConfig();
	const [filter, setFilter] = useState("");

	// Close on Escape
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener("keydown", handleKeyDown);
			return () => document.removeEventListener("keydown", handleKeyDown);
		}
		return undefined;
	}, [isOpen, onClose]);

	// Focus filter and reset on open
	useEffect(() => {
		if (isOpen) {
			setFilter("");
			setTimeout(() => filterRef.current?.focus(), 0);
		}
	}, [isOpen]);

	// Close when clicking outside
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
			return () => document.removeEventListener("mousedown", handleClickOutside);
		}
		return undefined;
	}, [isOpen, onClose]);

	// Organize hotkeys by category
	const hotkeySections = useMemo(() => {
		const sections: Array<{
			title: string;
			hotkeys: Array<{ key: string; description: string }>;
		}> = [];

		// App hotkeys from config
		const appByCategory = new Map<string, Array<{ key: string; description: string }>>();
		Object.entries(hotkeyMapping).forEach(([, config]) => {
			const category = config.category;
			if (!appByCategory.has(category)) {
				appByCategory.set(category, []);
			}
			appByCategory.get(category)?.push({
				key: formatHotkey(config.key),
				description: config.description,
			});
		});

		// Add app sections in order
		const categoryOrder = [
			"Layout",
			"Focus",
			"Tabs",
			"Tab Navigation",
			"Panes",
			"Editor",
			"Notes",
			"Search",
			"Views",
		];

		for (const category of categoryOrder) {
			const items = appByCategory.get(category);
			if (items && items.length > 0) {
				sections.push({ title: category, hotkeys: items });
			}
		}

		// Add remaining categories
		for (const [category, items] of appByCategory) {
			if (!categoryOrder.includes(category) && items.length > 0) {
				sections.push({ title: category, hotkeys: items });
			}
		}

		// Add essential editor hotkeys
		const editorHotkeys = PROSEMIRROR_HOTKEYS.slice(0, 10).map((h) => ({
			key: formatHotkey(h.key),
			description: h.description,
		}));
		if (editorHotkeys.length > 0) {
			sections.push({ title: "Editor Formatting", hotkeys: editorHotkeys });
		}

		return sections;
	}, [hotkeyMapping]);

	// Filter sections by search term — keep all sections to preserve layout stability
	const filteredSections = useMemo(() => {
		if (!filter.trim()) return hotkeySections.map((s) => ({ ...s, matchCount: s.hotkeys.length }));
		const q = filter.toLowerCase();
		return hotkeySections.map((section) => {
			const matchingHotkeys = section.hotkeys.filter(
				(h) =>
					h.description.toLowerCase().includes(q) ||
					h.key.toLowerCase().includes(q) ||
					section.title.toLowerCase().includes(q)
			);
			return { ...section, hotkeys: matchingHotkeys, matchCount: matchingHotkeys.length };
		});
	}, [hotkeySections, filter]);

	const hasAnyMatch = filteredSections.some((s) => s.matchCount > 0);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
			<div
				ref={modalRef}
				className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col mx-4"
			>
				{/* Header */}
				<div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Keyboard size={20} className="text-blue-500" />
							<h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
								Keyboard Shortcuts
							</h2>
						</div>
						<button
							type="button"
							onClick={onClose}
							className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
						>
							<X size={20} />
						</button>
					</div>
					<div className="relative">
						<Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
						<input
							ref={filterRef}
							type="text"
							value={filter}
							onChange={(e) => setFilter(e.target.value)}
							placeholder="Filter shortcuts..."
							className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded outline-none focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
						/>
					</div>
				</div>

				{/* Content - Multi-column grid */}
				<div className="flex-1 overflow-y-auto p-6">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{filteredSections.map((section) => (
							<div
								key={section.title}
								className={`rounded-lg border overflow-hidden transition-opacity ${
									section.matchCount > 0
										? "border-gray-200 dark:border-gray-700"
										: "border-gray-100 dark:border-gray-800 opacity-25"
								}`}
							>
								<div className="px-3 py-2 bg-blue-50 dark:bg-blue-950/40 border-b border-gray-200 dark:border-gray-700">
									<h3 className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
										{section.title}
									</h3>
								</div>
								<div className="px-3 py-2 space-y-1">
									{section.matchCount > 0 ? (
										section.hotkeys.map((hotkey, index) => (
											<div
												key={`${section.title}-${index}`}
												className="flex items-center justify-between gap-4 text-sm"
											>
												<span className="text-gray-700 dark:text-gray-300 truncate">
													{hotkey.description}
												</span>
												<kbd className="flex-shrink-0 px-2 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded border border-gray-300 dark:border-gray-600">
													{hotkey.key}
												</kbd>
											</div>
										))
									) : (
										<div className="text-xs text-gray-400 dark:text-gray-500 py-1">
											No matches
										</div>
									)}
								</div>
							</div>
						))}
					</div>
					{!hasAnyMatch && (
						<div className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">
							No shortcuts match &ldquo;{filter}&rdquo;
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
					<p className="text-xs text-gray-500 dark:text-gray-400 text-center">
						Press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-200 dark:bg-gray-700 rounded">Esc</kbd> to close
						{" • "}
						<kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-200 dark:bg-gray-700 rounded">Ctrl+Shift+.</kbd> for full keyboard shortcuts view
					</p>
				</div>
			</div>
		</div>
	);
}
