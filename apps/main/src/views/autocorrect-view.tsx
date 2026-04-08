import { useState, useCallback, useEffect } from "react";
import * as Icons from "lucide-react";
import { useAutocorrect } from "@/hooks";
import type { AutocorrectEntry } from "@/atoms/autocorrect";

interface EntryFormState {
	trigger: string;
	replacement: string;
	description: string;
}

const EMPTY_ENTRY: EntryFormState = { trigger: "", replacement: "", description: "" };

export function AutocorrectView() {
	const { entries, saveConfig } = useAutocorrect();

	const [localEntries, setLocalEntries] = useState<AutocorrectEntry[]>([]);
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	const [formState, setFormState] = useState<EntryFormState>(EMPTY_ENTRY);
	const [isAdding, setIsAdding] = useState(false);
	const [saveStatus, setSaveStatus] = useState<string | null>(null);

	// Sync from loaded entries
	useEffect(() => {
		setLocalEntries(entries);
	}, [entries]);

	// Check for duplicate triggers
	const getConflict = useCallback(
		(trigger: string, excludeIndex?: number): string | null => {
			if (!trigger.trim()) return null;
						for (let i = 0; i < localEntries.length; i++) {
				if (i === excludeIndex) continue;
				const entry = localEntries[i];
				if (entry && entry.trigger === trigger) {
					return `Duplicate trigger: already used by "${entry.description || "Untitled"}"`;
				}
			}
			return null;
		},
		[localEntries],
	);

	const conflict = getConflict(formState.trigger, editingIndex ?? undefined);

	const handleSave = useCallback(async () => {
		if (!formState.trigger.trim() || !formState.replacement.trim()) return;

		let updated: AutocorrectEntry[];
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
			const entry = localEntries[index];
			if (!entry) return;
			setEditingIndex(index);
			setIsAdding(false);
			setFormState({ ...entry });
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
	const canSave = formState.trigger.trim() && formState.replacement.trim() && !conflict;

	return (
		<div className="h-full overflow-auto bg-white dark:bg-gray-900">
			<div className="max-w-4xl mx-auto p-6 space-y-6">
				{/* Header */}
				<div className="border-b border-gray-200 dark:border-gray-700 pb-4">
					<h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
						<Icons.Replace className="w-7 h-7" />
						Autocorrect Rules
					</h1>
					<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
						Define text replacements that trigger automatically as you type.
						The replacement fires as soon as the last character of the trigger is typed.
					</p>
				</div>

				{/* Entries List */}
				{localEntries.length === 0 && !isFormOpen && (
					<div className="text-center py-12 text-gray-400 dark:text-gray-500">
						<Icons.Replace className="w-12 h-12 mx-auto mb-3 opacity-40" />
						<p className="text-lg">No autocorrect rules defined yet</p>
						<p className="text-sm mt-1">Click the button below to add your first rule</p>
					</div>
				)}

				{localEntries.length > 0 && (
					<div className="space-y-2">
						{localEntries.map((entry, index) => {
							const entryConflict = getConflict(entry.trigger, index);
							return (
								<div
									key={index}
									className={`bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-3 border transition-colors ${
										editingIndex === index
											? "border-blue-500 ring-1 ring-blue-500/30"
											: entryConflict
												? "border-amber-400 dark:border-amber-600"
												: "border-gray-200 dark:border-gray-700"
									}`}
								>
									<div className="flex items-center justify-between gap-4">
										<div className="flex items-center gap-4 flex-1 min-w-0">
											<code className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded text-xs font-mono whitespace-nowrap">
												{entry.trigger}
											</code>
											<Icons.ArrowRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
											<span className="text-sm font-mono text-gray-900 dark:text-gray-100 truncate">
												{entry.replacement}
											</span>
											<span className="text-xs text-gray-400 dark:text-gray-500 truncate hidden sm:inline">
												{entry.description}
											</span>
										</div>
										{entryConflict && (
											<div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 flex-shrink-0">
												<Icons.AlertTriangle className="w-3.5 h-3.5" />
											</div>
										)}
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
							{editingIndex !== null ? "Edit Rule" : "New Rule"}
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
								placeholder="e.g. Infinity symbol"
								className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>

						{/* Trigger */}
						<div>
							<label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
								Trigger Text
							</label>
							<input
								type="text"
								value={formState.trigger}
								onChange={(e) => setFormState((s) => ({ ...s, trigger: e.target.value }))}
								placeholder="e.g. \infty"
								className={`w-full px-3 py-2 text-sm font-mono border rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
									conflict
										? "border-amber-400 dark:border-amber-600 focus:ring-amber-500 text-gray-900 dark:text-gray-100"
										: "border-gray-300 dark:border-gray-600 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
								} placeholder-gray-400`}
							/>
							{conflict && (
								<div className="flex items-center gap-1.5 mt-1.5 text-xs text-amber-600 dark:text-amber-400">
									<Icons.AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
									{conflict}
								</div>
							)}
						</div>

						{/* Replacement */}
						<div>
							<label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
								Replacement
							</label>
							<input
								type="text"
								value={formState.replacement}
								onChange={(e) => setFormState((s) => ({ ...s, replacement: e.target.value }))}
								placeholder="e.g. ∞"
								className="w-full px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>

						{/* Preview */}
						{formState.trigger.trim() && formState.replacement.trim() && (
							<div className="flex items-center gap-3 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
								<span className="text-xs text-gray-500 dark:text-gray-400">Preview:</span>
								<code className="text-sm font-mono text-gray-500 dark:text-gray-400">
									{formState.trigger}
								</code>
								<Icons.ArrowRight className="w-3.5 h-3.5 text-gray-400" />
								<span className="text-sm font-mono text-gray-900 dark:text-gray-100">
									{formState.replacement}
								</span>
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
						Add Autocorrect Rule
					</button>
				)}

				{/* Help */}
				<div className="text-xs text-gray-400 dark:text-gray-500 space-y-1 pt-2">
					<p>
						<span className="font-medium">How it works:</span> Type the trigger text in the editor — the replacement happens instantly when the last character of the trigger is typed. For example, typing <code className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">\alph</code> then <code className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">a</code> inserts α.
					</p>
					<p>
						<span className="font-medium">Trigger boundaries:</span> The trigger must be at the start of a line or preceded by a space to activate.
					</p>
					<p>
						<span className="font-medium">Config file:</span> Stored in <code className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">autocorrect.toml</code> — changes auto-reload.
					</p>
				</div>
			</div>
		</div>
	);
}
