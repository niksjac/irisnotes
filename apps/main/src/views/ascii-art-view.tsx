import { useState, useCallback, useEffect, useRef } from "react";
import * as Icons from "lucide-react";
import { useAtomValue } from "jotai";
import { useAsciiArt } from "@/hooks";
import { hotkeysAtom } from "@/atoms/hotkeys";
import type { AsciiArtEntry } from "@/atoms/ascii-art";
import type { HotkeyConfig } from "@/types";

/**
 * Convert a KeyboardEvent to a normalized hotkey string like "ctrl+shift+a"
 */
function keyEventToCombo(e: KeyboardEvent): string | null {
	const key = e.key.toLowerCase();
	// Ignore bare modifier presses
	if (["control", "shift", "alt", "meta"].includes(key)) return null;

	const parts: string[] = [];
	if (e.ctrlKey || e.metaKey) parts.push("ctrl");
	if (e.shiftKey) parts.push("shift");
	if (e.altKey) parts.push("alt");

	// Normalize key name
	let keyName = key;
	if (e.code.startsWith("Digit") && /^[0-9]$/.test(key)) {
		keyName = key;
	} else if (e.code.startsWith("Key") && /^[a-z]$/.test(key)) {
		keyName = key;
	} else if (key === " ") {
		keyName = "space";
	} else if (key === "arrowup") {
		keyName = "up";
	} else if (key === "arrowdown") {
		keyName = "down";
	} else if (key === "arrowleft") {
		keyName = "left";
	} else if (key === "arrowright") {
		keyName = "right";
	}

	parts.push(keyName);
	return parts.join("+");
}

/**
 * Format a hotkey string for display: "ctrl+shift+alt+1" → "Ctrl+Shift+Alt+1"
 */
function formatKey(key: string): string {
	return key
		.split("+")
		.map((part) => {
			const lower = part.toLowerCase();
			if (lower === "ctrl" || lower === "control") return "Ctrl";
			if (lower === "shift") return "Shift";
			if (lower === "alt") return "Alt";
			if (lower === "mod") return "Ctrl";
			if (lower === "comma") return ",";
			if (lower === "period") return ".";
			return part.charAt(0).toUpperCase() + part.slice(1);
		})
		.join("+");
}

/**
 * Normalize a key combo for comparison: lowercase, sorted modifiers.
 */
function normalizeKeyCombo(key: string): string {
	const parts = key.toLowerCase().split("+");
	const modifiers = parts.filter((p) => ["ctrl", "shift", "alt", "mod", "meta", "control"].includes(p));
	const rest = parts.filter((p) => !["ctrl", "shift", "alt", "mod", "meta", "control"].includes(p));
	// Normalize mod/control to ctrl
	const normalized = modifiers.map((m) => (m === "mod" || m === "control" || m === "meta") ? "ctrl" : m);
	const unique = [...new Set(normalized)].sort();
	return [...unique, ...rest].join("+");
}

interface EntryFormState {
	key: string;
	description: string;
	art: string;
}

const EMPTY_ENTRY: EntryFormState = { key: "", description: "", art: "" };

export function AsciiArtView() {
	const { entries, saveConfig } = useAsciiArt();
	const appHotkeys = useAtomValue(hotkeysAtom);

	// Local editing state — clone of entries for editing
	const [localEntries, setLocalEntries] = useState<AsciiArtEntry[]>([]);
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	const [formState, setFormState] = useState<EntryFormState>(EMPTY_ENTRY);
	const [isAdding, setIsAdding] = useState(false);
	const [saveStatus, setSaveStatus] = useState<string | null>(null);
	const artTextareaRef = useRef<HTMLTextAreaElement>(null);

	// Sync from loaded entries
	useEffect(() => {
		setLocalEntries(entries);
	}, [entries]);

	const [isRecordingKey, setIsRecordingKey] = useState(false);

	// Build set of used key combos (app hotkeys + other ascii art entries)
	const getConflict = useCallback(
		(keyCombo: string, excludeIndex?: number): string | null => {
			if (!keyCombo.trim()) return null;
			const normalized = normalizeKeyCombo(keyCombo);

			// Check app hotkeys
			for (const [, config] of Object.entries(appHotkeys) as [string, HotkeyConfig][]) {
				if (config?.key && normalizeKeyCombo(config.key) === normalized) {
					return `Conflicts with app shortcut: "${config.description}"`;
				}
			}

			// Check other ASCII art entries
			for (let i = 0; i < localEntries.length; i++) {
				if (i === excludeIndex) continue;
				const entry = localEntries[i];
				if (entry && normalizeKeyCombo(entry.key) === normalized) {
					return `Conflicts with ASCII art: "${entry.description}"`;
				}
			}

			return null;
		},
		[appHotkeys, localEntries],
	);

	const conflict = getConflict(formState.key, editingIndex ?? undefined);

	const handleSave = useCallback(async () => {
		if (!formState.key.trim() || !formState.art.trim()) return;

		let updated: AsciiArtEntry[];
		if (editingIndex !== null) {
			updated = localEntries.map((e, i) =>
				i === editingIndex ? { ...formState } : e,
			);
		} else {
			updated = [...localEntries, { ...formState }];
		}

		await saveConfig(updated);
		setLocalEntries(updated);
		setEditingIndex(null);
		setIsAdding(false);
		setFormState(EMPTY_ENTRY);
		setSaveStatus("Saved");
		setTimeout(() => setSaveStatus(null), 2000);
	}, [formState, editingIndex, localEntries, saveConfig]);

	const handleDelete = useCallback(
		async (index: number) => {
			const updated = localEntries.filter((_, i) => i !== index);
			await saveConfig(updated);
			setLocalEntries(updated);
			if (editingIndex === index) {
				setEditingIndex(null);
				setFormState(EMPTY_ENTRY);
			}
		},
		[localEntries, saveConfig, editingIndex],
	);

	const startEdit = useCallback(
		(index: number) => {
			setEditingIndex(index);
			setIsAdding(false);
			const entry = localEntries[index];
		if (entry) setFormState({ ...entry });
		},
		[localEntries],
	);

	const startAdd = useCallback(() => {
		setIsAdding(true);
		setEditingIndex(null);
		setFormState(EMPTY_ENTRY);
	}, []);

	const cancelEdit = useCallback(() => {
		setEditingIndex(null);
		setIsAdding(false);
		setFormState(EMPTY_ENTRY);
	}, []);

	const isFormOpen = isAdding || editingIndex !== null;
	const canSave = formState.key.trim() && formState.art.trim() && !conflict;

	return (
		<div className="h-full overflow-auto bg-white dark:bg-gray-900">
			<div className="max-w-4xl mx-auto p-6 space-y-6">
				{/* Header */}
				<div className="border-b border-gray-200 dark:border-gray-700 pb-4">
					<h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
						<Icons.TextCursorInput className="w-7 h-7" />
						ASCII Art Insertions
					</h1>
					<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
						Define ASCII art snippets bound to keyboard shortcuts.
						Press the key combo in the editor to insert the art at the cursor.
					</p>
				</div>

				{/* Entries List */}
				{localEntries.length === 0 && !isFormOpen && (
					<div className="text-center py-12 text-gray-400 dark:text-gray-500">
						<Icons.TextCursorInput className="w-12 h-12 mx-auto mb-3 opacity-40" />
						<p className="text-lg">No ASCII art defined yet</p>
						<p className="text-sm mt-1">Click the button below to add your first snippet</p>
					</div>
				)}

				{localEntries.length > 0 && (
					<div className="space-y-3">
						{localEntries.map((entry, index) => {
							const entryConflict = getConflict(entry.key, index);
							return (
								<div
									key={index}
									className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border transition-colors ${
										editingIndex === index
											? "border-blue-500 ring-1 ring-blue-500/30"
											: entryConflict
												? "border-amber-400 dark:border-amber-600"
												: "border-gray-200 dark:border-gray-700"
									}`}
								>
									<div className="flex items-start justify-between gap-4">
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-3 mb-2">
												<kbd className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded text-xs font-mono whitespace-nowrap">
													{formatKey(entry.key)}
												</kbd>
												<span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
													{entry.description || "Untitled"}
												</span>
											</div>
											{entryConflict && (
												<div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 mb-2">
													<Icons.AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
													{entryConflict}
												</div>
											)}
											<pre className="text-xs text-gray-500 dark:text-gray-400 font-mono whitespace-pre overflow-x-auto max-h-24 leading-tight">
												{entry.art}
											</pre>
										</div>
										<div className="flex items-center gap-1 flex-shrink-0">
											<button
												onClick={() => startEdit(index)}
												className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
												title="Edit"
											>
												<Icons.Pencil className="w-4 h-4" />
											</button>
											<button
												onClick={() => handleDelete(index)}
												className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
												title="Delete"
											>
												<Icons.Trash2 className="w-4 h-4" />
											</button>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}

				{/* Add / Edit Form */}
				{isFormOpen && (
					<div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-5 border border-gray-200 dark:border-gray-700 space-y-4">
						<h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
							{editingIndex !== null ? "Edit Entry" : "New Entry"}
						</h3>

						{/* Description */}
						<div>
							<label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
								Description
							</label>
							<input
								type="text"
								value={formState.description}
								onChange={(e) => setFormState((s) => ({ ...s, description: e.target.value }))}
								placeholder="e.g. Horizontal divider"
								className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>

						{/* Key combo */}
						<div>
							<label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
								Key Combination
							</label>
							<button
								type="button"
								onClick={() => setIsRecordingKey(true)}
								className={`w-full px-3 py-2 text-sm font-mono border rounded-lg bg-white dark:bg-gray-900 text-left focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
									conflict
										? "border-amber-400 dark:border-amber-600 focus:ring-amber-500"
										: "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
								} ${formState.key ? "text-gray-900 dark:text-gray-100" : "text-gray-400"}`}
							>
								{formState.key ? formatKey(formState.key) : "Click to record shortcut…"}
							</button>
							{conflict && (
								<div className="flex items-center gap-1.5 mt-1.5 text-xs text-amber-600 dark:text-amber-400">
									<Icons.AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
									{conflict}
								</div>
							)}
							{!conflict && formState.key && (
								<p className="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
									<Icons.Check className="w-3 h-3" />
									Available
								</p>
							)}
						</div>

						{/* Key recording dialog */}
						{isRecordingKey && (
							<KeyRecordDialog
								currentKey={formState.key}
								getConflict={getConflict}
								excludeIndex={editingIndex ?? undefined}
								onAccept={(combo) => {
									setFormState((s) => ({ ...s, key: combo }));
									setIsRecordingKey(false);
								}}
								onCancel={() => setIsRecordingKey(false)}
							/>
						)}

						{/* ASCII art */}
						<div>
							<label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
								ASCII Art
							</label>
							<textarea
								ref={artTextareaRef}
								value={formState.art}
								onChange={(e) => setFormState((s) => ({ ...s, art: e.target.value }))}
								placeholder={"┌─────────┐\n│  Hello  │\n└─────────┘"}
								rows={6}
								className="w-full px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y leading-tight"
							/>
						</div>

						{/* Preview */}
						{formState.art.trim() && (
							<div>
								<label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
									Preview
								</label>
								<pre className="px-3 py-2 text-sm font-mono bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg whitespace-pre overflow-x-auto leading-tight text-gray-700 dark:text-gray-300">
									{formState.art}
								</pre>
							</div>
						)}

						{/* Form Actions */}
						<div className="flex items-center gap-3 pt-1">
							<button
								onClick={handleSave}
								disabled={!canSave}
								className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
							>
								{editingIndex !== null ? "Update" : "Add"}
							</button>
							<button
								onClick={cancelEdit}
								className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
							>
								Cancel
							</button>
							{saveStatus && (
								<span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
									<Icons.Check className="w-3.5 h-3.5" />
									{saveStatus}
								</span>
							)}
						</div>
					</div>
				)}

				{/* Add button (when form is closed) */}
				{!isFormOpen && (
					<button
						onClick={startAdd}
						className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors w-full justify-center"
					>
						<Icons.Plus className="w-4 h-4" />
						Add ASCII Art Snippet
					</button>
				)}

				{/* Help */}
				<div className="text-xs text-gray-400 dark:text-gray-500 space-y-1 pt-2">
					<p>
						<span className="font-medium">How it works:</span> When the editor is focused, pressing the key combo inserts the ASCII art at the cursor position. Each line becomes a separate paragraph.
					</p>
					<p>
						<span className="font-medium">Config file:</span> Stored in <code className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">ascii-art.toml</code> — changes auto-reload.
					</p>
				</div>
			</div>
		</div>
	);
}

/**
 * Dialog that captures a keyboard shortcut by listening for key presses.
 * Shows real-time conflict detection and accept/cancel buttons.
 */
function KeyRecordDialog({
	currentKey,
	getConflict,
	excludeIndex,
	onAccept,
	onCancel,
}: {
	currentKey: string;
	getConflict: (key: string, excludeIndex?: number) => string | null;
	excludeIndex?: number;
	onAccept: (combo: string) => void;
	onCancel: () => void;
}) {
	const [recorded, setRecorded] = useState<string | null>(null);
	const dialogRef = useRef<HTMLDivElement>(null);

	const combo = recorded ?? currentKey;
	const conflict = combo ? getConflict(combo, excludeIndex) : null;

	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			// Escape closes dialog
			if (e.key === "Escape") {
				e.preventDefault();
				onCancel();
				return;
			}

			const result = keyEventToCombo(e);
			if (result) {
				e.preventDefault();
				e.stopPropagation();
				setRecorded(result);
			}
		}

		document.addEventListener("keydown", handleKeyDown, true);
		return () => document.removeEventListener("keydown", handleKeyDown, true);
	}, [onCancel]);

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
			<div
				ref={dialogRef}
				className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-300 dark:border-gray-600 p-5 space-y-4"
			>
				<div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
					Record Shortcut
				</div>
				<p className="text-xs text-gray-500 dark:text-gray-400">
					Press the desired key combination. Press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px] font-mono">Esc</kbd> to cancel.
				</p>

				{/* Display area */}
				<div className="flex items-center justify-center py-4 px-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 min-h-[60px]">
					{combo ? (
						<kbd className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-sm font-mono font-medium">
							{formatKey(combo)}
						</kbd>
					) : (
						<span className="text-sm text-gray-400 animate-pulse">
							Waiting for keypress…
						</span>
					)}
				</div>

				{/* Conflict/available indicator */}
				{combo && conflict && (
					<div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
						<Icons.AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
						{conflict}
					</div>
				)}
				{combo && !conflict && (
					<div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
						<Icons.Check className="w-3.5 h-3.5 flex-shrink-0" />
						Available — no conflicts
					</div>
				)}

				{/* Actions */}
				<div className="flex items-center gap-3 pt-1">
					<button
						onClick={() => combo && onAccept(combo)}
						disabled={!combo}
						className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
					>
						Accept
					</button>
					<button
						onClick={onCancel}
						className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
					>
						Cancel
					</button>
				</div>
			</div>
		</div>
	);
}
