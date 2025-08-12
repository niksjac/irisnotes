import type Database from "@tauri-apps/plugin-sql";

/**
 * Manages SQLite database schema creation and migrations
 */
export class SqliteSchemaManager {
	private db: Database;

	constructor(database: Database) {
		this.db = database;
	}

	async createTables(): Promise<void> {
		if (!this.db) {
			throw new Error("Database not initialized");
		}

		// Create core tables
		await this.db.execute(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL DEFAULT 'Untitled Note',
        content TEXT NOT NULL DEFAULT '',
        content_type TEXT NOT NULL DEFAULT 'html',
        content_raw TEXT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        deleted_at TEXT NULL,
        is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
        is_archived BOOLEAN NOT NULL DEFAULT FALSE,
        word_count INTEGER NOT NULL DEFAULT 0,
        character_count INTEGER NOT NULL DEFAULT 0,
        content_plaintext TEXT NOT NULL DEFAULT '',
        sort_order INTEGER NOT NULL DEFAULT 0
      )
    `);

		await this.db.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        color TEXT DEFAULT NULL,
        icon TEXT DEFAULT NULL,
        parent_id TEXT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `);

		await this.db.execute(`
      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        color TEXT DEFAULT NULL,
        description TEXT DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

		await this.db.execute(`
      CREATE TABLE IF NOT EXISTS note_categories (
        note_id TEXT NOT NULL,
        category_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (note_id, category_id),
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      )
    `);

		await this.db.execute(`
      CREATE TABLE IF NOT EXISTS note_tags (
        note_id TEXT NOT NULL,
        tag_id TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (note_id, tag_id),
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      )
    `);

		await this.db.execute(`
      CREATE TABLE IF NOT EXISTS note_relationships (
        id TEXT PRIMARY KEY,
        source_note_id TEXT NOT NULL,
        target_note_id TEXT NOT NULL,
        relationship_type TEXT NOT NULL DEFAULT 'reference',
        description TEXT DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (source_note_id) REFERENCES notes(id) ON DELETE CASCADE,
        FOREIGN KEY (target_note_id) REFERENCES notes(id) ON DELETE CASCADE,
        UNIQUE(source_note_id, target_note_id, relationship_type)
      )
    `);

		await this.db.execute(`
      CREATE TABLE IF NOT EXISTS attachments (
        id TEXT PRIMARY KEY,
        note_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        original_filename TEXT NOT NULL,
        file_path TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
      )
    `);

		await this.db.execute(`
      CREATE TABLE IF NOT EXISTS note_versions (
        id TEXT PRIMARY KEY,
        note_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        version_number INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
      )
    `);

		await this.db.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

		// Run migrations before creating indexes
		await this.addSortOrderColumn();
		await this.createIndexes();
		await this.insertDefaultData();
	}

	private async createIndexes(): Promise<void> {
		await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC)`);
		await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_notes_title ON notes(title)`);
		await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_notes_deleted_at ON notes(deleted_at)`);
		await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_notes_sort_order ON notes(sort_order)`);
		await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order)`);
		await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name)`);
	}

	private async addSortOrderColumn(): Promise<void> {
		try {
			// First, check if table exists at all
			const tables = await this.db.select<Array<{ name: string }>>(
				"SELECT name FROM sqlite_master WHERE type='table' AND name='notes'"
			);

			if (tables.length === 0) {
				return;
			}

			// Check if sort_order column exists in notes table
			const tableInfo = await this.db.select<Array<{ name: string }>>("PRAGMA table_info(notes)");
			const hasColumn = tableInfo.some((col) => col.name === "sort_order");

			if (!hasColumn) {
				// Add the column to notes table
				await this.db.execute(`ALTER TABLE notes ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0`);
			}
		} catch (error) {
			console.error("❌ Failed to add sort_order column:", error);
			// Don't throw - let the app continue without sort_order for now
			console.warn("⚠️ App will continue without drag-and-drop ordering");
		}
	}

	private async insertDefaultData(): Promise<void> {
		// Insert default categories if they don't exist
		const existingCategories = await this.db.select<Array<{ count: number }>>(
			"SELECT COUNT(*) as count FROM categories"
		);
		if (existingCategories.length === 0 || (existingCategories[0]?.count ?? 0) === 0) {
			await this.db.execute(`
        INSERT INTO categories (id, name, description, sort_order) VALUES
        ('default', 'General', 'Default category for uncategorized notes', 0),
        ('quick-notes', 'Quick Notes', 'Fast capture and temporary notes', 1),
        ('projects', 'Projects', 'Project-related notes and documentation', 2)
      `);
		}
	}
}
