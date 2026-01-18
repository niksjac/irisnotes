import * as Icons from "lucide-react";
import { useMemo, useState } from "react";
import { useHotkeysConfig } from "@/hooks/use-hotkeys-config";
import {
	PROSEMIRROR_HOTKEYS,
	CODEMIRROR_HOTKEYS,
	SYSTEM_HOTKEYS,
} from "@/config/editor-hotkeys";
import type { HotkeyConfig } from "@/types";

interface HotkeyEntry {
	keys: string;
	description: string;
	context: string;
	category: string;
}

/**
 * Format a hotkey string for display
 * Converts "ctrl+shift+comma" to "Ctrl+Shift+,"
 */
function formatHotkeyForDisplay(key: string | undefined): string {
	if (!key) return "";
	return key
		.split("+")
		.map((part) => {
			const lower = part.toLowerCase();
			if (lower === "ctrl" || lower === "control") return "Ctrl";
			if (lower === "shift") return "Shift";
			if (lower === "alt") return "Alt";
			if (lower === "mod") return "Ctrl";
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

/**
 * Get icon for a hotkey category
 */
function getCategoryIcon(category: string): React.ReactNode {
	const iconClass = "w-5 h-5";
	switch (category.toLowerCase()) {
		case "layout":
			return <Icons.Layout className={iconClass} />;
		case "tabs":
			return <Icons.LayoutGrid className={iconClass} />;
		case "panes":
			return <Icons.Columns2 className={iconClass} />;
		case "editor":
			return <Icons.Edit className={iconClass} />;
		case "sidebar":
			return <Icons.PanelLeft className={iconClass} />;
		case "focus":
			return <Icons.Target className={iconClass} />;
		case "tab focus":
			return <Icons.Hash className={iconClass} />;
		case "tab navigation":
			return <Icons.ArrowRightLeft className={iconClass} />;
		case "tab movement":
			return <Icons.MoveHorizontal className={iconClass} />;
		case "views":
			return <Icons.Eye className={iconClass} />;
		case "app":
			return <Icons.RefreshCw className={iconClass} />;
		case "formatting":
			return <Icons.Type className={iconClass} />;
		case "blocks":
			return <Icons.Square className={iconClass} />;
		case "line operations":
			return <Icons.ArrowUpDown className={iconClass} />;
		case "history":
			return <Icons.History className={iconClass} />;
		case "lists":
			return <Icons.List className={iconClass} />;
		case "links":
			return <Icons.Link className={iconClass} />;
		case "clipboard":
			return <Icons.Clipboard className={iconClass} />;
		case "selection":
			return <Icons.TextCursor className={iconClass} />;
		case "navigation":
			return <Icons.Navigation className={iconClass} />;
		case "editing":
			return <Icons.Pencil className={iconClass} />;
		case "search":
			return <Icons.Search className={iconClass} />;
		default:
			return <Icons.Keyboard className={iconClass} />;
	}
}

export function HotkeysView() {
	const { hotkeys: appHotkeys } = useHotkeysConfig();
	const [searchQuery, setSearchQuery] = useState("");

	// Build flat list of all hotkeys
	const allHotkeys = useMemo<HotkeyEntry[]>(() => {
		const entries: HotkeyEntry[] = [];

		// 1. App-level hotkeys
		for (const [_, config] of Object.entries(appHotkeys) as [
			string,
			HotkeyConfig,
		][]) {
			if (!config?.key || !config?.description || !config?.category) {
				continue;
			}
			entries.push({
				keys: formatHotkeyForDisplay(config.key),
				description: config.description,
				context: "App",
				category: config.category,
			});
		}

		// 2. ProseMirror editor hotkeys
		for (const h of PROSEMIRROR_HOTKEYS) {
			entries.push({
				keys: h.key,
				description: h.description,
				context: "Rich Editor",
				category: h.category,
			});
		}

		// 3. CodeMirror source editor hotkeys
		for (const h of CODEMIRROR_HOTKEYS) {
			entries.push({
				keys: h.key,
				description: h.description,
				context: "Source Editor",
				category: h.category,
			});
		}

		// 4. System/browser hotkeys
		for (const h of SYSTEM_HOTKEYS) {
			entries.push({
				keys: h.key,
				description: h.description,
				context: "System",
				category: h.category,
			});
		}

		// Sort by context, then category, then description
		entries.sort((a, b) => {
			const contextOrder = ["App", "Rich Editor", "Source Editor", "System"];
			const contextDiff = contextOrder.indexOf(a.context) - contextOrder.indexOf(b.context);
			if (contextDiff !== 0) return contextDiff;
			const catDiff = a.category.localeCompare(b.category);
			if (catDiff !== 0) return catDiff;
			return a.description.localeCompare(b.description);
		});

		return entries;
	}, [appHotkeys]);

	// Filter hotkeys based on search query
	const filteredHotkeys = useMemo(() => {
		if (!searchQuery.trim()) return allHotkeys;
		const query = searchQuery.toLowerCase();
		return allHotkeys.filter(
			(h) =>
				h.keys.toLowerCase().includes(query) ||
				h.description.toLowerCase().includes(query) ||
				h.context.toLowerCase().includes(query) ||
				h.category.toLowerCase().includes(query)
		);
	}, [allHotkeys, searchQuery]);

	// Get unique categories for the legend
	const categories = useMemo(() => {
		const cats = new Set(filteredHotkeys.map((h) => h.category));
		return Array.from(cats).sort();
	}, [filteredHotkeys]);

	// Get context color
	const getContextColor = (context: string) => {
		switch (context) {
			case "App":
				return "bg-indigo-500";
			case "Rich Editor":
				return "bg-emerald-500";
			case "Source Editor":
				return "bg-amber-500";
			case "System":
				return "bg-gray-500";
			default:
				return "bg-gray-400";
		}
	};

	return (
		<div className="h-full overflow-auto bg-white dark:bg-gray-900">
			<div className="max-w-6xl mx-auto p-6 space-y-4">
				{/* Header with Search */}
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 dark:border-gray-700 pb-4">
					<div>
						<h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
							<Icons.Keyboard className="w-7 h-7" />
							Keyboard Shortcuts
						</h1>
						<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
							{filteredHotkeys.length} of {allHotkeys.length} shortcuts
						</p>
					</div>
					{/* Search Bar */}
					<div className="relative w-full sm:w-72">
						<Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Filter shortcuts..."
							className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
						{searchQuery && (
							<button
								onClick={() => setSearchQuery("")}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
							>
								<Icons.X className="w-4 h-4" />
							</button>
						)}
					</div>
				</div>

				{/* Context Legend */}
				<div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
					<div className="flex items-center gap-2">
						<span className="w-3 h-3 rounded bg-indigo-500" />
						<span>App</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="w-3 h-3 rounded bg-emerald-500" />
						<span>Rich Editor</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="w-3 h-3 rounded bg-amber-500" />
						<span>Source Editor</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="w-3 h-3 rounded bg-gray-500" />
						<span>System</span>
					</div>
					<span className="text-gray-400">|</span>
					<span className="text-xs text-gray-500 dark:text-gray-400">
						Tip: On macOS, use ⌘ instead of Ctrl
					</span>
				</div>

				{/* Shortcuts Table */}
				<div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
					<table className="w-full text-sm">
						<thead>
							<tr className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
								<th className="px-4 py-2.5 text-left font-semibold text-gray-700 dark:text-gray-300 w-36">
									Keys
								</th>
								<th className="px-4 py-2.5 text-left font-semibold text-gray-700 dark:text-gray-300">
									Description
								</th>
								<th className="px-4 py-2.5 text-left font-semibold text-gray-700 dark:text-gray-300 w-32">
									Context
								</th>
								<th className="px-4 py-2.5 text-left font-semibold text-gray-700 dark:text-gray-300 w-36">
									Category
								</th>
							</tr>
						</thead>
						<tbody>
							{filteredHotkeys.length === 0 ? (
								<tr>
									<td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
										No shortcuts match "{searchQuery}"
									</td>
								</tr>
							) : (
								filteredHotkeys.map((hotkey, idx) => {
									const prev = filteredHotkeys[idx - 1];
									const isNewContext = !prev || prev.context !== hotkey.context;
									const isNewCategory = !prev || prev.context !== hotkey.context || prev.category !== hotkey.category;

									return (
										<>
											{/* Context group header */}
											{isNewContext && (
												<tr key={`context-${hotkey.context}`}>
													<td
														colSpan={4}
														className={`px-4 py-2 font-semibold text-white text-sm ${getContextColor(hotkey.context)}`}
													>
														{hotkey.context}
													</td>
												</tr>
											)}
											{/* Category subgroup header */}
											{isNewCategory && (
												<tr key={`cat-${hotkey.context}-${hotkey.category}`}>
													<td
														colSpan={4}
														className="px-4 py-1.5 bg-gray-100 dark:bg-gray-800 border-y border-gray-200 dark:border-gray-700"
													>
														<span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
															{getCategoryIcon(hotkey.category)}
															{hotkey.category}
														</span>
													</td>
												</tr>
											)}
											{/* Hotkey row */}
											<tr
												key={`${hotkey.keys}-${hotkey.context}-${idx}`}
												className="hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800"
											>
												<td className="px-4 py-1.5 pl-6">
													<kbd className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded text-xs font-mono whitespace-nowrap">
														{hotkey.keys}
													</kbd>
												</td>
												<td className="px-4 py-1.5 text-gray-700 dark:text-gray-300">
													{hotkey.description}
												</td>
												<td className="px-4 py-1.5">
													<span className="text-gray-500 dark:text-gray-500 text-xs">
														{hotkey.context}
													</span>
												</td>
												<td className="px-4 py-1.5">
													<span className="text-gray-500 dark:text-gray-500 text-xs">
														{hotkey.category}
													</span>
												</td>
											</tr>
										</>
									);
								})
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
