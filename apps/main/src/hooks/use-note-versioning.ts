import { useAtomValue, useSetAtom } from "jotai";
import { useCallback } from "react";
import {
	noteVersionStatesAtom,
	versioningConfigAtom,
} from "@/atoms/versioning";
import type {
	NoteVersion,
	NoteVersionSource,
} from "@/types/database";
import type { FlexibleItem } from "@/types/items";
import type { StorageAdapter, StorageResult } from "@/storage";
import { useNotesStorage } from "./use-notes-storage";

type SnapshotResult = StorageResult<NoteVersion | null>;

interface SnapshotOptions {
	force?: boolean;
}

function normalizeContentRaw(value: string | null | undefined): string | null {
	return value ?? null;
}

function getContentType(
	note: FlexibleItem
): "html" | "markdown" | "plain" | "custom" {
	return note.content_type || "html";
}

function getBaselineTime(note: FlexibleItem): number {
	const updatedAt = Date.parse(note.updated_at);
	if (!Number.isNaN(updatedAt)) return updatedAt;

	const createdAt = Date.parse(note.created_at);
	if (!Number.isNaN(createdAt)) return createdAt;

	return Date.now();
}

function isSameSnapshot(version: NoteVersion, note: FlexibleItem): boolean {
	return (
		version.title === note.title &&
		version.content === (note.content || "") &&
		version.content_type === getContentType(note) &&
		normalizeContentRaw(version.content_raw) === normalizeContentRaw(note.content_raw)
	);
}

export function useNoteVersioning(storageAdapterOverride?: StorageAdapter | null) {
	const config = useAtomValue(versioningConfigAtom);
	const versionStates = useAtomValue(noteVersionStatesAtom);
	const setVersionStates = useSetAtom(noteVersionStatesAtom);
	const { storageAdapter: hookStorageAdapter } = useNotesStorage();
	const storageAdapter = storageAdapterOverride ?? hookStorageAdapter;

	const markSnapshotAttempt = useCallback(
		(noteId: string, source: NoteVersionSource) => {
			const now = Date.now();
			setVersionStates((prev) => ({
				...prev,
				[noteId]: {
					...prev[noteId],
					lastSnapshotAt: now,
					...(source === "auto-content" && {
						lastContentSnapshotAt: now,
					}),
				},
			}));
		},
		[setVersionStates]
	);

	const getNoteVersions = useCallback(
		async (noteId: string): Promise<StorageResult<NoteVersion[]>> => {
			if (!storageAdapter) {
				return { success: false, error: "Storage not initialized" };
			}

			return await storageAdapter.getNoteVersions(noteId);
		},
		[storageAdapter]
	);

	const createSnapshot = useCallback(
		async (
			note: FlexibleItem,
			source: NoteVersionSource = "manual",
			comment?: string,
			options: SnapshotOptions = {}
		): Promise<SnapshotResult> => {
			if (!storageAdapter) {
				return { success: false, error: "Storage not initialized" };
			}
			if (note.type !== "note") {
				return { success: true, data: null };
			}
			if (!config.enabled && !options.force) {
				return { success: true, data: null };
			}

			const versionsResult = await storageAdapter.getNoteVersions(note.id);
			if (!versionsResult.success) {
				return versionsResult;
			}

			const latestVersion = versionsResult.data[0];
			if (latestVersion && isSameSnapshot(latestVersion, note)) {
				markSnapshotAttempt(note.id, source);
				return { success: true, data: null };
			}

			const result = await storageAdapter.createNoteVersion({
				note_id: note.id,
				title: note.title,
				content: note.content || "",
				content_type: getContentType(note),
				content_raw: normalizeContentRaw(note.content_raw),
				comment: comment || null,
				source,
			});

			if (result.success) {
				markSnapshotAttempt(note.id, source);
				if (config.maxVersionsPerNote > 0) {
					void storageAdapter.pruneNoteVersions(
						note.id,
						config.maxVersionsPerNote
					);
				}
			}

			return result;
		},
		[config, markSnapshotAttempt, storageAdapter]
	);

	const maybeSnapshotForContentChange = useCallback(
		async (
			note: FlexibleItem | undefined,
			nextContent: string,
			nextContentType?: "html" | "markdown" | "plain" | "custom",
			nextContentRaw?: string | null
		): Promise<SnapshotResult> => {
			if (!note || note.type !== "note" || !config.enabled) {
				return { success: true, data: null };
			}

			const currentContentType = getContentType(note);
			const contentChanged = (note.content || "") !== nextContent;
			const contentTypeChanged =
				nextContentType !== undefined && nextContentType !== currentContentType;
			const contentRawChanged =
				nextContentRaw !== undefined &&
				normalizeContentRaw(nextContentRaw) !== normalizeContentRaw(note.content_raw);

			if (!contentChanged && !contentTypeChanged && !contentRawChanged) {
				return { success: true, data: null };
			}

			const lastContentSnapshotAt =
				versionStates[note.id]?.lastContentSnapshotAt ?? getBaselineTime(note);

			if (Date.now() - lastContentSnapshotAt < config.contentSnapshotIntervalMs) {
				return { success: true, data: null };
			}

			return await createSnapshot(
				note,
				"auto-content",
				"Automatic content snapshot"
			);
		},
		[config, createSnapshot, versionStates]
	);

	const snapshotTitleChange = useCallback(
		async (note: FlexibleItem | undefined): Promise<SnapshotResult> => {
			if (!note || note.type !== "note") {
				return { success: true, data: null };
			}

			return await createSnapshot(note, "title-change", "Before title change");
		},
		[createSnapshot]
	);

	const snapshotBeforeRestore = useCallback(
		async (note: FlexibleItem | undefined): Promise<SnapshotResult> => {
			if (!note || note.type !== "note") {
				return { success: true, data: null };
			}

			return await createSnapshot(
				note,
				"before-restore",
				"Before restoring version",
				{ force: true }
			);
		},
		[createSnapshot]
	);

	const restoreNoteVersion = useCallback(
		async (noteId: string, versionId: string) => {
			if (!storageAdapter) {
				return { success: false, error: "Storage not initialized" };
			}

			return await storageAdapter.restoreNoteVersion(noteId, versionId);
		},
		[storageAdapter]
	);

	return {
		config,
		getNoteVersions,
		createSnapshot,
		maybeSnapshotForContentChange,
		snapshotTitleChange,
		snapshotBeforeRestore,
		restoreNoteVersion,
	};
}