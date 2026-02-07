import { Database } from "bun:sqlite";
import { homedir } from "os";
import { join, dirname } from "path";
import { existsSync } from "fs";

export interface NoteItem {
	id: string;
	parent_id: string | null;
	type: "note" | "book" | "section";
	title: string;
	content: string | null;
	created_at: string;
	updated_at: string;
	sort_order: string;
}

export interface SearchResult {
	id: string;
	title: string;
	snippet: string;
	parent_path: string;
	updated_at: string;
	word_count: number;
}

/**
 * Get the path to the notes database
 * Checks dev path first, then production path
 */
function getDatabasePath(): string {
	// Check if we're in development mode (running from monorepo)
	// Navigate up from apps/cli/src to find monorepo root
	let currentDir = import.meta.dir;
	for (let i = 0; i < 5; i++) {
		const devDbPath = join(currentDir, "dev", "notes.db");
		const pnpmWorkspace = join(currentDir, "pnpm-workspace.yaml");
		
		if (existsSync(pnpmWorkspace) && existsSync(devDbPath)) {
			return devDbPath;
		}
		currentDir = dirname(currentDir);
	}

	// Production path: ~/.config/irisnotes/notes.db
	const prodPath = join(homedir(), ".config", "irisnotes", "notes.db");
	if (existsSync(prodPath)) {
		return prodPath;
	}

	// Fallback: check for IRISNOTES_DB environment variable
	if (process.env.IRISNOTES_DB && existsSync(process.env.IRISNOTES_DB)) {
		return process.env.IRISNOTES_DB;
	}

	throw new Error(
		"Could not find notes database. Looked in:\n" +
		"  - Development: <monorepo>/dev/notes.db\n" +
		"  - Production: ~/.config/irisnotes/notes.db\n" +
		"  - Environment: IRISNOTES_DB variable\n\n" +
		"Make sure IrisNotes has been run at least once to create the database."
	);
}

let db: Database | null = null;

/**
 * Get database connection (singleton)
 */
export function getDatabase(): Database {
	if (!db) {
		const dbPath = getDatabasePath();
		db = new Database(dbPath, { readonly: true });
	}
	return db;
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
	if (db) {
		db.close();
		db = null;
	}
}

/**
 * Get all notes with their hierarchy path
 */
export function getAllNotes(): NoteItem[] {
	const database = getDatabase();
	return database.query(`
		SELECT id, parent_id, type, title, content, created_at, updated_at, sort_order
		FROM items
		WHERE type = 'note'
		ORDER BY updated_at DESC
	`).all() as NoteItem[];
}

/**
 * Get all items (notes, books, sections)
 */
export function getAllItems(): NoteItem[] {
	const database = getDatabase();
	return database.query(`
		SELECT id, parent_id, type, title, content, created_at, updated_at, sort_order
		FROM items
		ORDER BY type DESC, sort_order ASC
	`).all() as NoteItem[];
}

/**
 * Get item by ID
 */
export function getItemById(id: string): NoteItem | undefined {
	const database = getDatabase();
	return database.query(`
		SELECT id, parent_id, type, title, content, created_at, updated_at, sort_order
		FROM items
		WHERE id = ?
	`).get(id) as NoteItem | undefined;
}

/**
 * Find notes by title (case-insensitive, partial match)
 * Returns all matches, not just the first one
 */
export function findNotesByTitle(title: string): NoteItem[] {
	const database = getDatabase();
	
	// Try exact match first
	let results = database.query(`
		SELECT id, parent_id, type, title, content, created_at, updated_at, sort_order
		FROM items
		WHERE type = 'note' AND LOWER(title) = LOWER(?)
		ORDER BY updated_at DESC
	`).all(title) as NoteItem[];
	
	if (results.length > 0) return results;
	
	// Try contains match
	results = database.query(`
		SELECT id, parent_id, type, title, content, created_at, updated_at, sort_order
		FROM items
		WHERE type = 'note' AND LOWER(title) LIKE LOWER(?)
		ORDER BY updated_at DESC
	`).all(`%${title}%`) as NoteItem[];
	
	return results;
}

/**
 * Search notes using FTS5
 */
export function searchNotes(query: string, limit = 20): SearchResult[] {
	const database = getDatabase();
	
	// Escape special FTS5 characters and prepare query
	const safeQuery = query.replace(/['"]/g, "");
	
	const results = database.query(`
		WITH matches AS (
			SELECT 
				i.id,
				i.title,
				i.content,
				i.updated_at,
				snippet(items_fts, 1, '>>>', '<<<', '...', 30) as snippet
			FROM items_fts
			JOIN items i ON items_fts.rowid = i.rowid
			WHERE items_fts MATCH ? AND i.type = 'note'
			ORDER BY rank
			LIMIT ?
		)
		SELECT 
			m.id,
			m.title,
			COALESCE(m.snippet, '') as snippet,
			COALESCE(
				(SELECT p.title FROM items p WHERE p.id = i.parent_id) || 
				CASE WHEN gp.title IS NOT NULL THEN ' → ' || gp.title ELSE '' END,
				''
			) as parent_path,
			m.updated_at,
			(LENGTH(m.content) - LENGTH(REPLACE(m.content, ' ', '')) + 1) as word_count
		FROM matches m
		JOIN items i ON m.id = i.id
		LEFT JOIN items gp ON i.parent_id = gp.parent_id AND gp.id != i.parent_id
	`).all(safeQuery + "*", limit) as SearchResult[];
	
	return results;
}

/**
 * Build the full path for an item (e.g., "Work → Projects → Note Title")
 */
export function getItemPath(item: NoteItem): string {
	const database = getDatabase();
	const path: string[] = [item.title];
	
	let currentParentId = item.parent_id;
	while (currentParentId) {
		const parent = database.query(`
			SELECT id, parent_id, title FROM items WHERE id = ?
		`).get(currentParentId) as { id: string; parent_id: string | null; title: string } | undefined;
		
		if (parent) {
			path.unshift(parent.title);
			currentParentId = parent.parent_id;
		} else {
			break;
		}
	}
	
	return path.join(" → ");
}
