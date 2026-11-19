import * as Icons from "lucide-react";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useAtomValue } from "jotai";
import { useHotkeysConfig } from "@/hooks/use-hotkeys-config";
import {
	buildProsemirrorHotkeys,
	CODEMIRROR_HOTKEYS,
	SYSTEM_HOTKEYS,
} from "@/config/editor-hotkeys";
import { editorKeybindingsAtom } from "@/atoms/editor-keybindings";
import { DEFAULT_HOTKEYS } from "@/config/default-hotkeys";
import { normalizeCode } from "@/utils/app-hotkeys";
import type { HotkeyConfig, HotkeyMapping } from "@/types";

interface HotkeyEntry {
	keys: string;
	description: string;
	context: string;
	category: string;
	/** Set for app hotkeys, which can be changed here */
	actionId?: keyof HotkeyMapping;
	/** The key differs from the default */
	customized?: boolean;
}

/** A recorded key that is already bound to other app actions */
interface PendingConflict {
	actionId: keyof HotkeyMapping;
	key: string;
	usedBy: string[];
}

const MODIFIER_ORDER = ["ctrl", "shift", "alt", "meta"];

/** "Shift+Ctrl+E" / "control+shift+e" → "ctrl+shift+e", for comparing bindings */
function canonicalHotkey(key: string): string {
	const parts = key.toLowerCase().split("+").map((p) => (p === "control" || p === "mod" ? "ctrl" : p));
	const mods = MODIFIER_ORDER.filter((m) => parts.includes(m));
	const rest = parts.filter((p) => !MODIFIER_ORDER.includes(p));
	return [...mods, ...rest].join("+");
}

/**
 * Hotkey string for a keydown, in react-hotkeys-hook names (from event.code,
 * like the app's matcher). Null while only modifiers are held.
 */
function hotkeyFromEvent(e: KeyboardEvent): string | null {
	const key = normalizeCode(e.code);
	if (!key || MODIFIER_ORDER.includes(key)) return null;
	const mods = [e.ctrlKey && "ctrl", e.shiftKey && "shift", e.altKey && "alt", e.metaKey && "meta"].filter(Boolean);
	return [...mods, key].join("+");
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

export function HotkeysView() {
	const { hotkeys: appHotkeys, setHotkeyKey } = useHotkeysConfig();
	const editorKeybindings = useAtomValue(editorKeybindingsAtom);
	const prosemirrorHotkeys = useMemo(
		() => buildProsemirrorHotkeys(editorKeybindings),
		[editorKeybindings],
	);
	const [searchQuery, setSearchQuery] = useState("");
	const [contextFilter, setContextFilter] = useState<string | null>(null);
	const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
	const searchRef = useRef<HTMLInputElement>(null);
	const [recordingId, setRecordingId] = useState<keyof HotkeyMapping | null>(null);
	const [recordHint, setRecordHint] = useState<string | null>(null);
	const [conflict, setConflict] = useState<PendingConflict | null>(null);
	const [saveError, setSaveError] = useState<string | null>(null);

	const saveKey = async (actionId: keyof HotkeyMapping, key: string | null) => {
		setConflict(null);
		setSaveError(null);
		try {
			await setHotkeyKey(actionId, key);
		} catch (error) {
			setSaveError(`Could not save hotkeys.toml: ${String(error)}`);
		}
	};

	// While recording, the next key combination becomes the action's key.
	// Capture phase on window, so no app hotkey fires meanwhile.
	useEffect(() => {
		if (!recordingId) return;
		const stop = () => {
			setRecordingId(null);
			setRecordHint(null);
		};
		const onKeyDown = (e: KeyboardEvent) => {
			e.preventDefault();
			e.stopPropagation();
			if (e.key === "Escape" && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey) {
				stop();
				return;
			}
			const key = hotkeyFromEvent(e);
			if (!key) return;
			// Plain or Shift+ keys would fire while typing; F-keys are fine alone
			const bareKey = key.split("+").pop() ?? "";
			if (!e.ctrlKey && !e.altKey && !e.metaKey && !/^f\d+$/.test(bareKey)) {
				setRecordHint("Add Ctrl or Alt (F-keys work alone)");
				return;
			}
			stop();
			const usedBy = (Object.entries(appHotkeys) as [keyof HotkeyMapping, HotkeyConfig][])
				.filter(([id, config]) => id !== recordingId && config.key && canonicalHotkey(config.key) === canonicalHotkey(key))
				.map(([, config]) => config.description);
			if (usedBy.length > 0) {
				setConflict({ actionId: recordingId, key, usedBy });
			} else {
				void saveKey(recordingId, key);
			}
		};
		const onMouseDown = (e: MouseEvent) => {
			if (!(e.target as Element).closest?.("[data-hotkey-recorder]")) stop();
		};
		window.addEventListener("keydown", onKeyDown, true);
		window.addEventListener("mousedown", onMouseDown, true);
		return () => {
			window.removeEventListener("keydown", onKeyDown, true);
			window.removeEventListener("mousedown", onMouseDown, true);
		};
	}, [recordingId, appHotkeys]);

	// Ctrl+F focuses the filter input from anywhere in the hotkeys view.
	useHotkeys(
		"ctrl+f",
		(e) => {
			e.preventDefault();
			searchRef.current?.focus();
			searchRef.current?.select();
		},
		{ enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"], enableOnContentEditable: true },
	);

	// Build flat list of all hotkeys
	const allHotkeys = useMemo<HotkeyEntry[]>(() => {
		const entries: HotkeyEntry[] = [];

		// 1. App-level hotkeys
		for (const [actionId, config] of Object.entries(appHotkeys) as [
			keyof HotkeyMapping,
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
				actionId,
				customized: config.key !== DEFAULT_HOTKEYS[actionId]?.key,
			});
		}

		// 2. ProseMirror editor hotkeys (derived from atom for live overrides)
		for (const h of prosemirrorHotkeys) {
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
	}, [appHotkeys, prosemirrorHotkeys]);

	// Derive unique categories from all hotkeys
	const allCategories = useMemo(() => {
		const cats = new Set(allHotkeys.map((h) => h.category));
		return Array.from(cats).sort();
	}, [allHotkeys]);

	// Filter hotkeys based on search query, context filter, and category filter
	const filteredHotkeys = useMemo(() => {
		let result = allHotkeys;
		if (contextFilter) {
			result = result.filter((h) => h.context === contextFilter);
		}
		if (categoryFilter) {
			result = result.filter((h) => h.category === categoryFilter);
		}
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(h) =>
					h.keys.toLowerCase().includes(query) ||
					h.description.toLowerCase().includes(query) ||
					h.context.toLowerCase().includes(query) ||
					h.category.toLowerCase().includes(query)
			);
		}
		return result;
	}, [allHotkeys, searchQuery, contextFilter, categoryFilter]);

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
							{filteredHotkeys.length} of {allHotkeys.length} shortcuts · click an App shortcut to change it
						</p>
					</div>
					{/* Search Bar */}
					<div className="relative w-full sm:w-72">
						<Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
						<input
							ref={searchRef}
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Filter shortcuts... (Ctrl+F)"
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

				{saveError && (
					<div className="px-3 py-2 rounded-md text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
						{saveError}
					</div>
				)}

				{/* Context Filter Buttons */}
				<div className="flex flex-wrap items-center gap-2 text-sm">
					{[
						{ label: "App" },
						{ label: "Rich Editor" },
						{ label: "Source Editor" },
						{ label: "System" },
					].map(({ label }) => (
						<button
							key={label}
							onClick={() => setContextFilter(contextFilter === label ? null : label)}
							className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer border ${
								contextFilter === label
									? "bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500"
									: "text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
							}`}
						>
							{label}
						</button>
					))}
					{(contextFilter || categoryFilter || searchQuery) && (
						<button
							onClick={() => { setContextFilter(null); setCategoryFilter(null); setSearchQuery(""); }}
							className="px-3 py-1 rounded-md text-xs font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
						>
							Clear filters
						</button>
					)}
				</div>

				{/* Category Filter Buttons */}
				<div className="flex flex-wrap items-center gap-2 text-sm">
					{allCategories.map((cat) => (
						<button
							key={cat}
							onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
							className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer border ${
								categoryFilter === cat
									? "bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-500"
									: "text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
							}`}
						>
							{cat}
						</button>
					))}
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
									return (
										<Fragment key={`${hotkey.keys}-${hotkey.context}-${idx}`}>
											{/* Hotkey row */}
											<tr
												className="hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800"
											>
												<td className="px-4 py-1.5">
													{hotkey.actionId ? (
														<KeyCell
															hotkey={hotkey}
															recording={recordingId === hotkey.actionId}
															hint={recordHint}
															onRecord={() => {
																setConflict(null);
																setRecordHint(null);
																setRecordingId(recordingId === hotkey.actionId ? null : hotkey.actionId ?? null);
															}}
															onReset={() => hotkey.actionId && void saveKey(hotkey.actionId, null)}
														/>
													) : (
														<kbd className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded text-xs font-mono whitespace-nowrap">
															{hotkey.keys}
														</kbd>
													)}
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
											{conflict && conflict.actionId === hotkey.actionId && (
												<tr className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
													<td colSpan={4} className="px-4 py-2 text-xs text-amber-800 dark:text-amber-200">
														<div className="flex flex-wrap items-center gap-2">
															<span>
																<kbd className="font-mono">{formatHotkeyForDisplay(conflict.key)}</kbd> is already used by{" "}
																{conflict.usedBy.join(", ")}.
															</span>
															<button
																type="button"
																onClick={() => void saveKey(conflict.actionId, conflict.key)}
																className="px-2 py-0.5 rounded border border-amber-400 dark:border-amber-600 hover:bg-amber-100 dark:hover:bg-amber-800/40 cursor-pointer"
															>
																Use it anyway
															</button>
															<button
																type="button"
																onClick={() => setConflict(null)}
																className="px-2 py-0.5 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
															>
																Cancel
															</button>
														</div>
													</td>
												</tr>
											)}
										</Fragment>
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

interface KeyCellProps {
	hotkey: HotkeyEntry;
	recording: boolean;
	hint: string | null;
	onRecord: () => void;
	onReset: () => void;
}

/** App hotkey: click to record a new key; reset appears once it differs from the default */
function KeyCell({ hotkey, recording, hint, onRecord, onReset }: KeyCellProps) {
	return (
		<div data-hotkey-recorder className="flex items-center gap-1.5">
			<button
				type="button"
				onClick={onRecord}
				title={recording ? "Press the new key combination (Esc cancels)" : "Click to change"}
				className={`px-2 py-0.5 rounded text-xs font-mono whitespace-nowrap cursor-pointer ${
					recording
						? "bg-blue-600 text-white ring-2 ring-blue-300 dark:ring-blue-700"
						: hotkey.customized
							? "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 hover:ring-1 hover:ring-blue-400"
							: "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:ring-1 hover:ring-blue-400"
				}`}
			>
				{recording ? hint ?? "Press keys…" : hotkey.keys}
			</button>
			{hotkey.customized && !recording && (
				<button
					type="button"
					onClick={onReset}
					title={`Reset to default (${formatHotkeyForDisplay(hotkey.actionId ? DEFAULT_HOTKEYS[hotkey.actionId].key : "")})`}
					className="p-0.5 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
				>
					<Icons.RotateCcw className="w-3 h-3" />
				</button>
			)}
		</div>
	);
}
