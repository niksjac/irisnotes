import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState, type FC } from "react";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import {
	Copy,
	Eye,
	FilePlus2,
	GitCompare,
	History,
	Loader2,
	RefreshCw,
	RotateCcw,
	X,
} from "lucide-react";
import { useItems, useNoteVersioning, useTabManagement } from "@/hooks";
import type { NoteVersion } from "@/types/database";
import type { FlexibleItem } from "@/types/items";

interface NoteVersionHistoryDialogProps {
	isOpen: boolean;
	note: FlexibleItem | null;
	onClose: () => void;
}

type PanelMode = "preview" | "diff";

interface DiffRow {
	line: number;
	current: string;
	version: string;
	changed: boolean;
}

const MAX_DIFF_LINES = 300;

function formatVersionDate(value: string): string {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;

	return date.toLocaleString(undefined, {
		dateStyle: "medium",
		timeStyle: "short",
	});
}

function formatSource(source: NoteVersion["source"]): string {
	switch (source) {
		case "auto-content":
			return "Auto";
		case "title-change":
			return "Title";
		case "manual":
			return "Manual";
		case "before-restore":
			return "Restore";
		case "note-close":
			return "Close";
		default:
			return "Snapshot";
	}
}

function buildDiffRows(currentContent: string, versionContent: string): DiffRow[] {
	const currentLines = currentContent.split(/\r?\n/);
	const versionLines = versionContent.split(/\r?\n/);
	const lineCount = Math.min(
		Math.max(currentLines.length, versionLines.length),
		MAX_DIFF_LINES
	);
	const rows: DiffRow[] = [];

	for (let index = 0; index < lineCount; index++) {
		const current = currentLines[index] ?? "";
		const version = versionLines[index] ?? "";
		rows.push({
			line: index + 1,
			current,
			version,
			changed: current !== version,
		});
	}

	return rows;
}

export const NoteVersionHistoryDialog: FC<NoteVersionHistoryDialogProps> = ({
	isOpen,
	note,
	onClose,
}) => {
	const dialogRef = useRef<HTMLDivElement>(null);
	const [versions, setVersions] = useState<NoteVersion[]>([]);
	const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
	const [mode, setMode] = useState<PanelMode>("preview");
	const [isLoading, setIsLoading] = useState(false);
	const [isWorking, setIsWorking] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [status, setStatus] = useState<string | null>(null);

	const { createItem, loadAllItems } = useItems();
	const { openItemInTab } = useTabManagement();
	const {
		getNoteVersions,
		snapshotBeforeRestore,
		restoreNoteVersion,
	} = useNoteVersioning();

	const selectedVersion = useMemo(
		() => versions.find((version) => version.id === selectedVersionId) || null,
		[versions, selectedVersionId]
	);

	const diffRows = useMemo(() => {
		return buildDiffRows(note?.content || "", selectedVersion?.content || "");
	}, [note?.content, selectedVersion?.content]);

	const changedLineCount = useMemo(
		() => diffRows.filter((row) => row.changed).length,
		[diffRows]
	);

	const loadVersions = useCallback(async () => {
		if (!note) return;

		setIsLoading(true);
		setError(null);
		try {
			const result = await getNoteVersions(note.id);
			if (!result.success) {
				setError(result.error);
				return;
			}

			setVersions(result.data);
			setSelectedVersionId((current) => {
				if (current && result.data.some((version) => version.id === current)) {
					return current;
				}
				return result.data[0]?.id ?? null;
			});
		} finally {
			setIsLoading(false);
		}
	}, [getNoteVersions, note]);

	useEffect(() => {
		if (!isOpen) return;
		setMode("preview");
		setStatus(null);
		void loadVersions();
	}, [isOpen, loadVersions]);

	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				event.preventDefault();
				onClose();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose]);

	useEffect(() => {
		if (!isOpen) return;

		const handleMouseDown = (event: MouseEvent) => {
			if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
				onClose();
			}
		};

		const id = setTimeout(
			() => document.addEventListener("mousedown", handleMouseDown),
			0
		);
		return () => {
			clearTimeout(id);
			document.removeEventListener("mousedown", handleMouseDown);
		};
	}, [isOpen, onClose]);

	const handleRestore = async () => {
		if (!note || !selectedVersion || isWorking) return;

		setIsWorking(true);
		setError(null);
		setStatus(null);
		try {
			const snapshotResult = await snapshotBeforeRestore(note);
			if (!snapshotResult.success) {
				setError(snapshotResult.error);
				return;
			}

			const restoreResult = await restoreNoteVersion(note.id, selectedVersion.id);
			if (!restoreResult.success) {
				setError(restoreResult.error);
				return;
			}

			await loadAllItems();
			await loadVersions();
			setStatus(`Restored version ${selectedVersion.version_number}`);
		} finally {
			setIsWorking(false);
		}
	};

	const handleDuplicate = async () => {
		if (!note || !selectedVersion || isWorking) return;

		setIsWorking(true);
		setError(null);
		setStatus(null);
		try {
			const result = await createItem({
				type: "note",
				title: `${selectedVersion.title || note.title} (version ${selectedVersion.version_number})`,
				content: selectedVersion.content,
				content_type: selectedVersion.content_type,
				content_raw: selectedVersion.content_raw ?? undefined,
				parent_id: note.parent_id ?? undefined,
			});

			if (!result.success) {
				setError(result.error);
				return;
			}

			openItemInTab({
				id: result.data.id,
				title: result.data.title,
				type: "note",
			});
			setStatus("Duplicated version as a new note");
		} finally {
			setIsWorking(false);
		}
	};

	const handleCopy = async () => {
		if (!selectedVersion || isWorking) return;

		setIsWorking(true);
		setError(null);
		setStatus(null);
		try {
			await writeText(selectedVersion.content);
			setStatus("Copied version content");
		} catch (copyError) {
			setError(`Failed to copy version content: ${copyError}`);
		} finally {
			setIsWorking(false);
		}
	};

	if (!isOpen || !note) return null;

	return createPortal(
		<div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/45 px-4 py-6">
			<div
				ref={dialogRef}
				className="w-full max-w-6xl max-h-[88vh] bg-white dark:bg-gray-800 rounded-md shadow-2xl border border-gray-300 dark:border-gray-600 overflow-hidden flex flex-col"
			>
				<div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
					<History className="w-4 h-4 text-blue-500 flex-shrink-0" />
					<div className="min-w-0 flex-1">
						<h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
							Version History
						</h2>
						<p className="text-xs text-gray-500 dark:text-gray-400 truncate">
							{note.title}
						</p>
					</div>
					<button
						type="button"
						onClick={() => void loadVersions()}
						disabled={isLoading || isWorking}
						className="p-1.5 rounded text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
						title="Refresh versions"
					>
						<RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
					</button>
					<button
						type="button"
						onClick={onClose}
						className="p-1.5 rounded text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700"
						title="Close"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				<div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)]">
					<aside className="min-h-0 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 flex flex-col">
						<div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
							{versions.length} {versions.length === 1 ? "version" : "versions"}
						</div>
						<div className="flex-1 overflow-y-auto py-1">
							{isLoading ? (
								<div className="flex items-center gap-2 px-3 py-3 text-sm text-gray-500 dark:text-gray-400">
									<Loader2 className="w-4 h-4 animate-spin" />
									Loading versions
								</div>
							) : versions.length === 0 ? (
								<div className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400">
									No versions yet.
								</div>
							) : (
								versions.map((version) => {
									const isSelected = version.id === selectedVersionId;
									return (
										<button
											key={version.id}
											type="button"
											onClick={() => setSelectedVersionId(version.id)}
											className={`w-full text-left px-3 py-2 border-l-2 ${
												isSelected
													? "border-blue-500 bg-blue-50 dark:bg-blue-950/40"
													: "border-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
											}`}
										>
											<div className="flex items-center gap-2">
												<span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
													v{version.version_number}
												</span>
												<span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
													{formatSource(version.source)}
												</span>
											</div>
											<div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
												{formatVersionDate(version.created_at)}
											</div>
											<div className="mt-1 text-xs text-gray-700 dark:text-gray-200 truncate">
												{version.title || "Untitled"}
											</div>
										</button>
									);
								})
							)}
						</div>
					</aside>

					<section className="min-h-0 flex flex-col">
						<div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
							<div className="flex items-center border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
								<button
									type="button"
									onClick={() => setMode("preview")}
									className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs ${
										mode === "preview"
											? "bg-blue-600 text-white"
											: "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
									}`}
								>
									<Eye className="w-3.5 h-3.5" />
									Preview
								</button>
								<button
									type="button"
									onClick={() => setMode("diff")}
									className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border-l border-gray-300 dark:border-gray-600 ${
										mode === "diff"
											? "bg-blue-600 text-white"
											: "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
									}`}
								>
									<GitCompare className="w-3.5 h-3.5" />
									Diff
								</button>
							</div>

							<div className="ml-auto flex flex-wrap items-center gap-2">
								<button
									type="button"
									onClick={() => void handleCopy()}
									disabled={!selectedVersion || isWorking}
									className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
								>
									<Copy className="w-3.5 h-3.5" />
									Copy
								</button>
								<button
									type="button"
									onClick={() => void handleDuplicate()}
									disabled={!selectedVersion || isWorking}
									className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
								>
									<FilePlus2 className="w-3.5 h-3.5" />
									Duplicate
								</button>
								<button
									type="button"
									onClick={() => void handleRestore()}
									disabled={!selectedVersion || isWorking}
									className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
								>
									<RotateCcw className="w-3.5 h-3.5" />
									Restore
								</button>
							</div>
						</div>

						{error && (
							<div className="px-4 py-2 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border-b border-red-200 dark:border-red-900">
								{error}
							</div>
						)}
						{status && (
							<div className="px-4 py-2 text-xs text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/40 border-b border-green-200 dark:border-green-900">
								{status}
							</div>
						)}

						<div className="flex-1 min-h-0 overflow-auto p-4">
							{selectedVersion ? (
								mode === "preview" ? (
									<div className="space-y-3">
										<div>
											<div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
												Title
											</div>
											<div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
												{selectedVersion.title || "Untitled"}
											</div>
										</div>
										<pre className="min-h-80 whitespace-pre-wrap break-words rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3 text-xs leading-5 text-gray-900 dark:text-gray-100 font-mono">
											{selectedVersion.content || "No content"}
										</pre>
									</div>
								) : (
									<div className="space-y-3">
										<div className="text-xs text-gray-500 dark:text-gray-400">
											{changedLineCount} changed {changedLineCount === 1 ? "line" : "lines"}
											{Math.max(
												note.content?.split(/\r?\n/).length || 1,
												selectedVersion.content.split(/\r?\n/).length
											) > MAX_DIFF_LINES
												? `, showing first ${MAX_DIFF_LINES}`
												: ""}
										</div>
										<div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
											<div className="rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
												<div className="px-3 py-2 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
													Current
												</div>
												<div className="font-mono text-xs">
													{diffRows.map((row) => (
														<div
															key={`current-${row.line}`}
															className={`grid grid-cols-[3rem_minmax(0,1fr)] border-b border-gray-100 dark:border-gray-800 ${
																row.changed ? "bg-red-50 dark:bg-red-950/25" : ""
															}`}
														>
															<span className="select-none px-2 py-1 text-right text-gray-400 border-r border-gray-100 dark:border-gray-800">
																{row.line}
															</span>
															<span className="px-2 py-1 whitespace-pre-wrap break-words text-gray-900 dark:text-gray-100">
																{row.current || " "}
															</span>
														</div>
													))}
												</div>
											</div>
											<div className="rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
												<div className="px-3 py-2 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
													Version
												</div>
												<div className="font-mono text-xs">
													{diffRows.map((row) => (
														<div
															key={`version-${row.line}`}
															className={`grid grid-cols-[3rem_minmax(0,1fr)] border-b border-gray-100 dark:border-gray-800 ${
																row.changed ? "bg-green-50 dark:bg-green-950/25" : ""
															}`}
														>
															<span className="select-none px-2 py-1 text-right text-gray-400 border-r border-gray-100 dark:border-gray-800">
																{row.line}
															</span>
															<span className="px-2 py-1 whitespace-pre-wrap break-words text-gray-900 dark:text-gray-100">
																{row.version || " "}
															</span>
														</div>
													))}
												</div>
											</div>
										</div>
									</div>
								)
							) : (
								<div className="h-full flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
									Select a version to preview it.
								</div>
							)}
						</div>
					</section>
				</div>
			</div>
		</div>,
		document.body
	);
};