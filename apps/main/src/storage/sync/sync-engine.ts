// Local-first sync engine.
//
// Talks to iris-server (apps/server). The desktop keeps writing to its local
// SQLite instantly; this engine reconciles with the hub: pull remote changes,
// apply them last-writer-wins, then push local changes. Single-user, so there
// is no real conflict resolution — newer `updated_at` simply wins.
//
// Rows are content-opaque: `content`/`metadata` are shipped as-is and never
// parsed here, so new editor/UI features need no change to sync.

import Database from "@tauri-apps/plugin-sql";
import type { SyncSettings } from "@/types";

/** Contract version this client speaks; must match the server's /version. */
const EXPECTED_SCHEMA_VERSION = 1;
const EXPECTED_SYNC_VERSION = 1;

/** One `items` row on the wire (camelCase — matches the Rust server's Item). */
interface WireItem {
	id: string;
	type: string;
	title: string;
	content: string;
	contentType: string;
	contentRaw: string | null;
	contentPlaintext: string;
	parentId: string | null;
	sortOrder: string;
	metadata: string;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
	wordCount: number;
	characterCount: number;
	viewCount: number;
	lastViewedAt: string | null;
}

export interface SyncResult {
	pulled: number;
	applied: number;
	pushed: number;
}

// Select local rows as WireItems (snake_case columns aliased to camelCase).
const SELECT_CHANGED = `SELECT
	id, type, title, content,
	content_type AS contentType, content_raw AS contentRaw,
	content_plaintext AS contentPlaintext, parent_id AS parentId,
	sort_order AS sortOrder, metadata,
	created_at AS createdAt, updated_at AS updatedAt, deleted_at AS deletedAt,
	word_count AS wordCount, character_count AS characterCount,
	view_count AS viewCount, last_viewed_at AS lastViewedAt
FROM items WHERE updated_at > $1 ORDER BY updated_at ASC`;

// Upsert a pulled row, last-writer-wins. Identical logic to the server side.
const UPSERT = `INSERT INTO items (
	id, type, title, content, content_type, content_raw, content_plaintext,
	parent_id, sort_order, metadata, created_at, updated_at, deleted_at,
	word_count, character_count, view_count, last_viewed_at)
	VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
	ON CONFLICT(id) DO UPDATE SET
	type=excluded.type, title=excluded.title, content=excluded.content,
	content_type=excluded.content_type, content_raw=excluded.content_raw,
	content_plaintext=excluded.content_plaintext, parent_id=excluded.parent_id,
	sort_order=excluded.sort_order, metadata=excluded.metadata,
	created_at=excluded.created_at, updated_at=excluded.updated_at,
	deleted_at=excluded.deleted_at, word_count=excluded.word_count,
	character_count=excluded.character_count, view_count=excluded.view_count,
	last_viewed_at=excluded.last_viewed_at
	WHERE excluded.updated_at > items.updated_at`;

function cursorKey(serverUrl: string, which: "pull" | "push"): string {
	return `iris.sync.${which}Cursor::${serverUrl}`;
}

async function checkVersion(serverUrl: string): Promise<void> {
	const res = await fetch(`${serverUrl}/version`);
	if (!res.ok) throw new Error(`version check failed: HTTP ${res.status}`);
	const v = (await res.json()) as { schemaVersion: number; syncVersion: number };
	if (v.syncVersion !== EXPECTED_SYNC_VERSION || v.schemaVersion !== EXPECTED_SCHEMA_VERSION) {
		throw new Error(
			`incompatible server: schema ${v.schemaVersion}/sync ${v.syncVersion}, ` +
				`client expects schema ${EXPECTED_SCHEMA_VERSION}/sync ${EXPECTED_SYNC_VERSION}`,
		);
	}
}

// Apply remote rows under the sync_ctl guard so the local updated_at trigger
// does NOT rewrite the timestamps we just pulled (which would ping-pong them
// straight back to the server). Returns how many rows were actually written.
// Insert parents before children to satisfy the parent_id foreign key: books
// are roots, sections live under books, notes under books/sections (and a note
// can never parent another note), so this type order is a valid topological one.
const TYPE_RANK: Record<string, number> = { book: 0, section: 1, note: 2 };

async function applyRemote(db: Database, items: WireItem[]): Promise<number> {
	if (items.length === 0) return 0;
	const ordered = [...items].sort(
		(a, b) => (TYPE_RANK[a.type] ?? 3) - (TYPE_RANK[b.type] ?? 3),
	);
	await db.execute("UPDATE sync_ctl SET applying = 1 WHERE id = 0");
	let applied = 0;
	try {
		for (const it of ordered) {
			try {
				const res = await db.execute(UPSERT, [
					it.id, it.type, it.title, it.content, it.contentType, it.contentRaw,
					it.contentPlaintext, it.parentId, it.sortOrder, it.metadata,
					it.createdAt, it.updatedAt, it.deletedAt, it.wordCount,
					it.characterCount, it.viewCount, it.lastViewedAt,
				]);
				applied += res.rowsAffected ?? 0;
			} catch (e) {
				// Skip a single bad row (e.g. a hierarchy-trigger reject) and keep going.
				console.error(`[sync] failed to apply item ${it.id}:`, e);
			}
		}
	} finally {
		await db.execute("UPDATE sync_ctl SET applying = 0 WHERE id = 0");
	}
	return applied;
}

/**
 * Run one full sync cycle against the configured server. Pull-then-push.
 * Returns counts; throws on network/contract failure (caller decides whether to
 * surface it). `onApplied` fires only when remote rows actually changed local
 * data, so the UI can refresh.
 */
export async function runSync(
	cfg: SyncSettings,
	onApplied?: () => void,
): Promise<SyncResult> {
	const serverUrl = cfg.serverUrl.replace(/\/+$/, "");
	const dbPath = cfg.databasePath ?? "notes.db";
	const headers = {
		"content-type": "application/json",
		authorization: `Bearer ${cfg.token}`,
	};

	await checkVersion(serverUrl);
	const db = await Database.load(`sqlite:${dbPath}`);

	// ---- PULL ----
	const pullCursor = localStorage.getItem(cursorKey(serverUrl, "pull")) ?? "";
	const pullRes = await fetch(`${serverUrl}/sync/pull`, {
		method: "POST",
		headers,
		body: JSON.stringify({ since: pullCursor }),
	});
	if (!pullRes.ok) throw new Error(`pull failed: HTTP ${pullRes.status}`);
	const { items, cursor } = (await pullRes.json()) as {
		items: WireItem[];
		cursor: string;
	};
	const applied = await applyRemote(db, items);
	localStorage.setItem(cursorKey(serverUrl, "pull"), cursor);
	if (applied > 0) onApplied?.();

	// ---- PUSH ----
	const pushCursor = localStorage.getItem(cursorKey(serverUrl, "push")) ?? "";
	const changed = await db.select<WireItem[]>(SELECT_CHANGED, [pushCursor]);
	let pushed = 0;
	if (changed.length > 0) {
		const pushRes = await fetch(`${serverUrl}/sync/push`, {
			method: "POST",
			headers,
			body: JSON.stringify({ items: changed }),
		});
		if (!pushRes.ok) throw new Error(`push failed: HTTP ${pushRes.status}`);
		pushed = changed.length;
	}
	// Advance the push cursor past everything currently local (incl. just-applied
	// rows). Re-sending an equal-timestamp row is harmless (server rejects it).
	const maxRow = await db.select<Array<{ m: string | null }>>(
		"SELECT COALESCE(MAX(updated_at), '') AS m FROM items",
	);
	const newMax = maxRow[0]?.m ?? pushCursor;
	localStorage.setItem(cursorKey(serverUrl, "push"), newMax);

	return { pulled: items.length, applied, pushed };
}
