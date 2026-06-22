// Note view tracking — records when notes are opened and queries "top notes".
//
// This is intentionally a small standalone module rather than part of the
// SQLiteStorageAdapter: it is called from openItemInTab (which has no adapter
// in scope) and from the Top Notes view. It reuses the same underlying Tauri
// SQL connection (keyed by path), so it never re-runs schema creation. The
// view-tracking columns themselves are added by SqliteSchemaManager on startup.

import Database from "@tauri-apps/plugin-sql";
import { invoke } from "@tauri-apps/api/core";

export type TopNotesMetric =
	| "most_viewed"
	| "recently_viewed"
	| "least_viewed"
	| "oldest";

export interface TopNote {
	id: string;
	title: string;
	view_count: number;
	last_viewed_at: string | null;
	created_at: string;
	updated_at: string;
}

let dbPromise: Promise<Database> | null = null;

function getDb(): Promise<Database> {
	if (!dbPromise) {
		dbPromise = (async () => {
			const path = await invoke<string>("get_database_path");
			return Database.load(`sqlite:${path}`);
		})();
	}
	return dbPromise;
}

/**
 * Increment the view count and stamp last_viewed_at for a note.
 * Fire-and-forget: failures are logged but never thrown, so opening a note
 * is never blocked by tracking.
 */
export async function recordNoteView(noteId: string): Promise<void> {
	try {
		const db = await getDb();
		await db.execute(
			`UPDATE items
			 SET view_count = COALESCE(view_count, 0) + 1,
			     last_viewed_at = datetime('now')
			 WHERE id = ? AND type = 'note' AND deleted_at IS NULL`,
			[noteId]
		);
	} catch (error) {
		console.warn("Failed to record note view:", error);
	}
}

const METRIC_ORDER_BY: Record<TopNotesMetric, string> = {
	// Most-opened first; only notes that have actually been opened.
	most_viewed: "view_count > 0 ORDER BY view_count DESC, last_viewed_at DESC",
	// Most recently opened first; only notes that have been opened.
	recently_viewed: "last_viewed_at IS NOT NULL ORDER BY last_viewed_at DESC",
	// Fewest opens first; includes never-opened notes (view_count = 0).
	least_viewed: "1 = 1 ORDER BY view_count ASC, updated_at ASC",
	// Oldest by creation date.
	oldest: "1 = 1 ORDER BY created_at ASC",
};

/**
 * Fetch the top notes for a given metric. Returns [] on error.
 */
export async function getTopNotes(
	metric: TopNotesMetric,
	limit = 25
): Promise<TopNote[]> {
	try {
		const db = await getDb();
		const clause = METRIC_ORDER_BY[metric];
		const rows = await db.select<TopNote[]>(
			`SELECT id, title, COALESCE(view_count, 0) AS view_count,
			        last_viewed_at, created_at, updated_at
			 FROM items
			 WHERE type = 'note' AND deleted_at IS NULL AND ${clause}
			 LIMIT ?`,
			[limit]
		);
		return rows;
	} catch (error) {
		console.warn("Failed to load top notes:", error);
		return [];
	}
}
