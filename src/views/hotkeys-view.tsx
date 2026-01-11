import * as Icons from "lucide-react";
import { useMemo } from "react";
import { useHotkeysConfig } from "@/hooks/use-hotkeys-config";
import {
	PROSEMIRROR_HOTKEYS,
	CODEMIRROR_HOTKEYS,
	SYSTEM_HOTKEYS,
	groupHotkeysByCategory,
} from "@/config/editor-hotkeys";
import type { HotkeyConfig } from "@/types";

interface HotkeyGroup {
	title: string;
	icon: React.ReactNode;
	shortcuts: { keys: string; description: string }[];
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

	// Build hotkey groups from all sources
	const hotkeyGroups = useMemo<HotkeyGroup[]>(() => {
		const groups: HotkeyGroup[] = [];

		// 1. App-level hotkeys from useHotkeysConfig (grouped by category)
		const appHotkeysByCategory: Record<
			string,
			{ keys: string; description: string }[]
		> = {};

		for (const [_, config] of Object.entries(appHotkeys) as [
			string,
			HotkeyConfig,
		][]) {
			// Skip invalid configs
			if (!config?.key || !config?.description || !config?.category) {
				continue;
			}
			const category = config.category;
			if (!appHotkeysByCategory[category]) {
				appHotkeysByCategory[category] = [];
			}
			appHotkeysByCategory[category].push({
				keys: formatHotkeyForDisplay(config.key),
				description: config.description,
			});
		}

		// Add app hotkey groups
		for (const [category, shortcuts] of Object.entries(appHotkeysByCategory)) {
			groups.push({
				title: category,
				icon: getCategoryIcon(category),
				shortcuts,
			});
		}

		// 2. ProseMirror editor hotkeys
		const pmGrouped = groupHotkeysByCategory(PROSEMIRROR_HOTKEYS);
		for (const [category, hotkeys] of Object.entries(pmGrouped)) {
			groups.push({
				title: `Rich Editor - ${category}`,
				icon: getCategoryIcon(category),
				shortcuts: hotkeys.map((h) => ({
					keys: h.key,
					description: h.description,
				})),
			});
		}

		// 3. CodeMirror source editor hotkeys
		const cmGrouped = groupHotkeysByCategory(CODEMIRROR_HOTKEYS);
		for (const [category, hotkeys] of Object.entries(cmGrouped)) {
			groups.push({
				title: `Source Editor - ${category}`,
				icon: getCategoryIcon(category),
				shortcuts: hotkeys.map((h) => ({
					keys: h.key,
					description: h.description,
				})),
			});
		}

		// 4. System/browser hotkeys
		const sysGrouped = groupHotkeysByCategory(SYSTEM_HOTKEYS);
		for (const [category, hotkeys] of Object.entries(sysGrouped)) {
			groups.push({
				title: `System - ${category}`,
				icon: getCategoryIcon(category),
				shortcuts: hotkeys.map((h) => ({
					keys: h.key,
					description: h.description,
				})),
			});
		}

		return groups;
	}, [appHotkeys]);

	return (
		<div className="h-full overflow-auto bg-white dark:bg-gray-900">
			<div className="max-w-5xl mx-auto p-6 space-y-6">
				{/* Header */}
				<div className="border-b border-gray-200 dark:border-gray-700 pb-4">
					<h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
						<Icons.Keyboard className="w-7 h-7" />
						Keyboard Shortcuts
					</h1>
					<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
						Complete reference for all available keyboard shortcuts
					</p>
				</div>

				{/* Tip */}
				<div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
					<div className="flex items-start gap-3">
						<Icons.Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
						<div className="text-sm text-blue-800 dark:text-blue-200">
							<strong>Tip:</strong> On macOS, use{" "}
							<kbd className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs font-mono">
								⌘
							</kbd>{" "}
							(Command) instead of{" "}
							<kbd className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs font-mono">
								Ctrl
							</kbd>
						</div>
					</div>
				</div>

				{/* Legend */}
				<div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
					<div className="flex items-center gap-2">
						<span className="w-3 h-3 rounded bg-indigo-500" />
						<span>App Shortcuts</span>
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
				</div>

				{/* Shortcut Groups */}
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{hotkeyGroups.map((group) => {
						// Determine color based on group title
						let accentColor = "bg-indigo-500";
						if (group.title.startsWith("Rich Editor")) {
							accentColor = "bg-emerald-500";
						} else if (group.title.startsWith("Source Editor")) {
							accentColor = "bg-amber-500";
						} else if (group.title.startsWith("System")) {
							accentColor = "bg-gray-500";
						}

						return (
							<div
								key={group.title}
								className="bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden"
							>
								{/* Group Header */}
								<div className="px-4 py-3 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex items-center gap-2">
									<span className={`w-2 h-2 rounded-full ${accentColor}`} />
									<h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 text-sm">
										{group.icon}
										{group.title}
									</h2>
								</div>

								{/* Shortcuts */}
								<div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-64 overflow-y-auto">
									{group.shortcuts.map((shortcut, idx) => (
										<div
											key={`${shortcut.keys}-${idx}`}
											className="px-4 py-2 flex items-center justify-between gap-2"
										>
											<span className="text-sm text-gray-700 dark:text-gray-300 truncate">
												{shortcut.description}
											</span>
											<kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded text-xs font-mono whitespace-nowrap flex-shrink-0">
												{shortcut.keys}
											</kbd>
										</div>
									))}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
