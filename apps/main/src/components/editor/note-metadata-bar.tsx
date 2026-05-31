import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Clock3, Hash, History, RotateCcw } from "lucide-react";
import { useAtomValue } from "jotai";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { noteVersionStatesAtom } from "@/atoms/versioning";
import { useNoteVersioning } from "@/hooks/use-note-versioning";
import type { NoteVersion } from "@/types/database";
import type { FlexibleItem } from "@/types/items";

interface NoteMetadataBarProps {
	note: FlexibleItem;
	onOpenHistory?: (noteId: string) => void;
}

const modifiedDateFormatter = new Intl.DateTimeFormat(undefined, {
	year: "numeric",
	month: "short",
	day: "numeric",
	hour: "2-digit",
	minute: "2-digit",
});

function parseDate(value: string): Date | null {
	const normalized = value.includes("T") ? value : value.replace(" ", "T");
	const date = new Date(normalized);
	return Number.isNaN(date.getTime()) ? null : date;
}

function formatModifiedDate(value: string): string {
	const date = parseDate(value);
	return date ? modifiedDateFormatter.format(date) : "Unknown";
}

export function NoteMetadataBar({ note, onOpenHistory }: NoteMetadataBarProps) {
	const { getNoteVersions } = useNoteVersioning();
	const versionStates = useAtomValue(noteVersionStatesAtom);
	const versionState = versionStates[note.id];
	const [versions, setVersions] = useState<NoteVersion[]>([]);
	const [displayModifiedAt, setDisplayModifiedAt] = useState(note.updated_at);
	const previousContentRef = useRef({
		id: note.id,
		content: note.content,
		contentType: note.content_type,
		contentRaw: note.content_raw,
	});

	useEffect(() => {
		setDisplayModifiedAt(note.updated_at);
	}, [note.id, note.updated_at]);

	useEffect(() => {
		const previous = previousContentRef.current;
		const contentChanged =
			previous.id === note.id &&
			(previous.content !== note.content ||
				previous.contentType !== note.content_type ||
				previous.contentRaw !== note.content_raw);

		previousContentRef.current = {
			id: note.id,
			content: note.content,
			contentType: note.content_type,
			contentRaw: note.content_raw,
		};

		if (contentChanged) {
			setDisplayModifiedAt(new Date().toISOString());
		}
	}, [note.id, note.content, note.content_type, note.content_raw]);

	useEffect(() => {
		let cancelled = false;

		const loadVersions = async () => {
			const result = await getNoteVersions(note.id);
			if (cancelled) return;

			if (result.success) {
				setVersions(result.data);
			} else {
				setVersions([]);
			}
		};

		void loadVersions();

		return () => {
			cancelled = true;
		};
	}, [getNoteVersions, note.id, versionState?.lastSnapshotAt]);

	const latestVersionNumber = useMemo(
		() =>
			versions.reduce(
				(maxVersion, version) => Math.max(maxVersion, version.version_number),
				0
			),
		[versions]
	);
	const currentVersionLabel = `v${latestVersionNumber + 1}`;
	const revertCount = versions.length;
	const hasRevertVersions = revertCount > 0;
	const revertLabel = hasRevertVersions
		? `${revertCount} revert ${revertCount === 1 ? "point" : "points"}`
		: "No revert points";
	const modifiedLabel = useMemo(
		() => formatModifiedDate(displayModifiedAt),
		[displayModifiedAt]
	);

	const handleCopyId = useCallback(async () => {
		try {
			await writeText(note.id);
		} catch (error) {
			console.error("Failed to copy note ID:", error);
		}
	}, [note.id]);

	return (
		<div className="flex-shrink-0 min-h-7 px-3 py-1 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-[11px] text-gray-600 dark:text-gray-300 select-none">
			<div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 tabular-nums">
				<span
					className="inline-flex items-center gap-1.5 whitespace-nowrap"
					title={`Last modified ${modifiedLabel}`}
				>
					<Clock3 className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
					<span className="hidden sm:inline text-gray-500 dark:text-gray-400">
						Modified
					</span>
					<span className="font-medium text-gray-700 dark:text-gray-200">
						{modifiedLabel}
					</span>
				</span>

				<span
					className="inline-flex items-center gap-1.5 whitespace-nowrap"
					title={`Current note version ${currentVersionLabel}`}
				>
					<History className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
					<span className="text-gray-500 dark:text-gray-400">Version</span>
					<span className="font-medium text-gray-700 dark:text-gray-200">
						{currentVersionLabel}
					</span>
				</span>

				<button
					type="button"
					onClick={handleCopyId}
					className="inline-flex min-w-0 max-w-full sm:max-w-[22rem] md:max-w-[30rem] items-center gap-1.5 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
					title="Copy note ID"
				>
					<Hash className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
					<span className="text-gray-500 dark:text-gray-400">ID</span>
					<span className="min-w-0 truncate font-mono text-gray-700 dark:text-gray-200 select-text">
						{note.id}
					</span>
				</button>

				<button
					type="button"
					onClick={() => onOpenHistory?.(note.id)}
					disabled={!onOpenHistory}
					className={`inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 transition-colors disabled:cursor-default ${
						hasRevertVersions
							? "text-blue-700 bg-blue-50 hover:bg-blue-100 dark:text-blue-300 dark:bg-blue-950/40 dark:hover:bg-blue-950/60"
							: "text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
					}`}
					title="Open version history"
				>
					<RotateCcw className="w-3.5 h-3.5 flex-shrink-0" />
					<span className="whitespace-nowrap">{revertLabel}</span>
				</button>
			</div>
		</div>
	);
}