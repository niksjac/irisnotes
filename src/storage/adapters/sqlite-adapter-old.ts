import Database from '@tauri-apps/plugin-sql';
import type {
	Attachment,
	Category,
	CreateCategoryParams,
	CreateNoteParams,
	CreateTagParams,
	Note,
	NoteFilters,
	NoteRelationship,
	NoteVersion,
	Setting,
	Tag,
	UpdateNoteParams,
} from '../../types/database';
import type { StorageAdapter, StorageConfig, StorageResult, VoidStorageResult } from '../types';

// Complete SQLite storage adapter implementation
export class SQLiteStorageAdapter implements StorageAdapter {
	private config: StorageConfig;
	private db: Database | null = null;

	constructor(config: StorageConfig) {
		this.config = config;
	}

	async init(): Promise<VoidStorageResult> {
		try {
			// Initialize SQLite database connection
			const dbPath = this.config.sqlite?.database_path || 'notes.db';

			this.db = await Database.load(`sqlite:${dbPath}`);

			// Create tables if they don't exist
			await this.createTables();

			return { success: true };
		} catch (error) {
			console.error('❌ Failed to initialize SQLite database:', error);
			return {
				success: false,
				error: `Failed to initialize SQLite database: ${error}`,
			};
		}
	}

	private async createTables(): Promise<void> {
		if (!this.db) {
			throw new Error('Database not initialized');
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
        content_plaintext TEXT NOT NULL DEFAULT ''
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

		// Create indexes for performance
		await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC)`);
		await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_notes_title ON notes(title)`);
		await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_notes_deleted_at ON notes(deleted_at)`);
		await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order)`);
		await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name)`);

		// Insert default categories if they don't exist
		const existingCategories = await this.db.select<Array<{ count: number }>>(
			'SELECT COUNT(*) as count FROM categories'
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

	getConfig(): StorageConfig {
		return this.config;
	}

	// Notes operations
	async getNotes(filters?: NoteFilters): Promise<StorageResult<Note[]>> {
		if (!this.db) {
			return { success: false, error: 'Database not initialized' };
		}

		try {
			let query = 'SELECT * FROM notes WHERE deleted_at IS NULL';
			const params: any[] = [];

			// Apply filters
			if (filters?.is_pinned !== undefined) {
				query += ' AND is_pinned = ?';
				params.push(filters.is_pinned);
			}
			if (filters?.is_archived !== undefined) {
				query += ' AND is_archived = ?';
				params.push(filters.is_archived);
			}
			if (filters?.search_query) {
				query += ' AND (title LIKE ? OR content_plaintext LIKE ?)';
				const searchParam = `%${filters.search_query}%`;
				params.push(searchParam, searchParam);
			}
			if (filters?.categories && filters.categories.length > 0) {
				query += ` AND id IN (SELECT note_id FROM note_categories WHERE category_id IN (${filters.categories.map(() => '?').join(', ')}))`;
				params.push(...filters.categories);
			}
			if (filters?.tags && filters.tags.length > 0) {
				query += ` AND id IN (SELECT note_id FROM note_tags WHERE tag_id IN (${filters.tags.map(() => '?').join(', ')}))`;
				params.push(...filters.tags);
			}
			if (filters?.date_range) {
				query += ' AND created_at BETWEEN ? AND ?';
				params.push(filters.date_range.start, filters.date_range.end);
			}

			query += ' ORDER BY updated_at DESC';

			const results = await this.db.select<Note[]>(query, params);
			return { success: true, data: results };
		} catch (error) {
			return { success: false, error: `Failed to get notes: ${error}` };
		}
	}

	async getNote(id: string): Promise<StorageResult<Note | null>> {
		if (!this.db) {
			return { success: false, error: 'Database not initialized' };
		}

		try {
			const results = await this.db.select<Note[]>('SELECT * FROM notes WHERE id = ? AND deleted_at IS NULL', [id]);
			const note = results.length > 0 ? (results[0] as Note) : null;
			return { success: true, data: note };
		} catch (error) {
			return { success: false, error: `Failed to get note: ${error}` };
		}
	}

	async createNote(params: CreateNoteParams): Promise<StorageResult<Note>> {
		if (!this.db) {
			return { success: false, error: 'Database not initialized' };
		}

		try {
			const now = new Date().toISOString();
			const id = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			const title = params.title || 'Untitled Note';
			const content = params.content || '';
			const contentType = params.content_type || 'html';
			const contentRaw = params.content_raw || null;

			// Calculate word count and character count
			const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
			const characterCount = content.length;

			// Extract plain text for search
			const contentPlaintext = content.replace(/<[^>]*>/g, '').trim();

			const insertQuery = `
        INSERT INTO notes (
          id, title, content, content_type, content_raw,
          created_at, updated_at, is_pinned, is_archived,
          word_count, character_count, content_plaintext
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

			await this.db.execute(insertQuery, [
				id,
				title,
				content,
				contentType,
				contentRaw,
				now,
				now,
				false,
				false,
				wordCount,
				characterCount,
				contentPlaintext,
			]);

			// Handle category assignments
			if (params.category_ids && params.category_ids.length > 0) {
				for (const categoryId of params.category_ids) {
					await this.addNoteToCategory(id, categoryId);
				}
			}

			// Handle tag assignments
			if (params.tag_ids && params.tag_ids.length > 0) {
				for (const tagId of params.tag_ids) {
					await this.addNoteTag(id, tagId);
				}
			}

			// Create the note object to return
			const newNote: Note = {
				id,
				title,
				content,
				content_type: contentType,
				content_raw: contentRaw,
				created_at: now,
				updated_at: now,
				deleted_at: null,
				is_pinned: false,
				is_archived: false,
				word_count: wordCount,
				character_count: characterCount,
				content_plaintext: contentPlaintext,
			};

			return { success: true, data: newNote };
		} catch (error) {
			return { success: false, error: `Failed to create note: ${error}` };
		}
	}

	async updateNote(params: UpdateNoteParams): Promise<StorageResult<Note>> {
		if (!this.db) {
			return { success: false, error: 'Database not initialized' };
		}

		try {
			const now = new Date().toISOString();
			const setParts: string[] = [];
			const queryParams: any[] = [];

			// Build dynamic update query
			if (params.title !== undefined) {
				setParts.push('title = ?');
				queryParams.push(params.title);
			}
			if (params.content !== undefined) {
				setParts.push('content = ?');
				queryParams.push(params.content);

				// Update word count and character count
				const wordCount = params.content.split(/\s+/).filter(word => word.length > 0).length;
				const characterCount = params.content.length;
				const contentPlaintext = params.content.replace(/<[^>]*>/g, '').trim();

				setParts.push('word_count = ?', 'character_count = ?', 'content_plaintext = ?');
				queryParams.push(wordCount, characterCount, contentPlaintext);
			}
			if (params.content_type !== undefined) {
				setParts.push('content_type = ?');
				queryParams.push(params.content_type);
			}
			if (params.content_raw !== undefined) {
				setParts.push('content_raw = ?');
				queryParams.push(params.content_raw);
			}
			if (params.is_pinned !== undefined) {
				setParts.push('is_pinned = ?');
				queryParams.push(params.is_pinned);
			}
			if (params.is_archived !== undefined) {
				setParts.push('is_archived = ?');
				queryParams.push(params.is_archived);
			}

			// Always update the updated_at timestamp
			setParts.push('updated_at = ?');
			queryParams.push(now);

			// Add the ID parameter for the WHERE clause
			queryParams.push(params.id);

			const updateQuery = `UPDATE notes SET ${setParts.join(', ')} WHERE id = ? AND deleted_at IS NULL`;
			await this.db.execute(updateQuery, queryParams);

			// Get the updated note
			const results = await this.db.select<Note[]>('SELECT * FROM notes WHERE id = ? AND deleted_at IS NULL', [
				params.id,
			]);

			if (results.length === 0) {
				return { success: false, error: 'Note not found' };
			}

			const updatedNote = results[0] as Note;
			return { success: true, data: updatedNote };
		} catch (error) {
			return { success: false, error: `Failed to update note: ${error}` };
		}
	}

	async deleteNote(id: string): Promise<VoidStorageResult> {
		if (!this.db) {
			return { success: false, error: 'Database not initialized' };
		}

		try {
			const now = new Date().toISOString();
			await this.db.execute('UPDATE notes SET deleted_at = ? WHERE id = ?', [now, id]);
			return { success: true };
		} catch (error) {
			return { success: false, error: `Failed to delete note: ${error}` };
		}
	}

	// Categories operations
	async getCategories(): Promise<StorageResult<Category[]>> {
		if (!this.db) {
			return { success: false, error: 'Database not initialized' };
		}

		try {
			const results = await this.db.select<Category[]>('SELECT * FROM categories ORDER BY sort_order ASC, name ASC');
			return { success: true, data: results };
		} catch (error) {
			return { success: false, error: `Failed to get categories: ${error}` };
		}
	}

	async getCategory(id: string): Promise<StorageResult<Category | null>> {
		if (!this.db) {
			return { success: false, error: 'Database not initialized' };
		}

		try {
			const results = await this.db.select<Category[]>('SELECT * FROM categories WHERE id = ?', [id]);
			const category = results.length > 0 ? (results[0] as Category) : null;
			return { success: true, data: category };
		} catch (error) {
			return { success: false, error: `Failed to get category: ${error}` };
		}
	}

	async createCategory(params: CreateCategoryParams): Promise<StorageResult<Category>> {
		if (!this.db) {
			return { success: false, error: 'Database not initialized' };
		}

		try {
			const now = new Date().toISOString();
			const id = `category_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			const sortOrder = params.sort_order || 0;

			const insertQuery = `
        INSERT INTO categories (id, name, description, color, icon, parent_id, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

			await this.db.execute(insertQuery, [
				id,
				params.name,
				params.description || '',
				params.color || null,
				params.icon || null,
				params.parent_id || null,
				sortOrder,
				now,
				now,
			]);

			const newCategory: Category = {
				id,
				name: params.name,
				description: params.description || '',
				color: params.color || null,
				icon: params.icon || null,
				parent_id: params.parent_id || null,
				sort_order: sortOrder,
				created_at: now,
				updated_at: now,
			};

			return { success: true, data: newCategory };
		} catch (error) {
			return { success: false, error: `Failed to create category: ${error}` };
		}
	}

	async updateCategory(id: string, params: Partial<CreateCategoryParams>): Promise<StorageResult<Category>> {
		if (!this.db) {
			return { success: false, error: 'Database not initialized' };
		}

		try {
			const now = new Date().toISOString();
			const setParts: string[] = [];
			const queryParams: any[] = [];

			if (params.name !== undefined) {
				setParts.push('name = ?');
				queryParams.push(params.name);
			}
			if (params.description !== undefined) {
				setParts.push('description = ?');
				queryParams.push(params.description);
			}
			if (params.color !== undefined) {
				setParts.push('color = ?');
				queryParams.push(params.color);
			}
			if (params.icon !== undefined) {
				setParts.push('icon = ?');
				queryParams.push(params.icon);
			}
			if (params.parent_id !== undefined) {
				setParts.push('parent_id = ?');
				queryParams.push(params.parent_id);
			}
			if (params.sort_order !== undefined) {
				setParts.push('sort_order = ?');
				queryParams.push(params.sort_order);
			}

			setParts.push('updated_at = ?');
			queryParams.push(now);
			queryParams.push(id);

			const updateQuery = `UPDATE categories SET ${setParts.join(', ')} WHERE id = ?`;
			await this.db.execute(updateQuery, queryParams);

			const results = await this.db.select<Category[]>('SELECT * FROM categories WHERE id = ?', [id]);
			if (results.length === 0) {
				return { success: false, error: 'Category not found' };
			}

			return { success: true, data: results[0] as Category };
		} catch (error) {
			return { success: false, error: `Failed to update category: ${error}` };
		}
	}

	async deleteCategory(id: string): Promise<VoidStorageResult> {
		if (!this.db) {
			return { success: false, error: 'Database not initialized' };
		}

		try {
			// Remove all note associations first
			await this.db.execute('DELETE FROM note_categories WHERE category_id = ?', [id]);
			// Delete the category
			await this.db.execute('DELETE FROM categories WHERE id = ?', [id]);
			return { success: true };
		} catch (error) {
			return { success: false, error: `Failed to delete category: ${error}` };
		}
	}

	async getCategoryNotes(categoryId: string): Promise<StorageResult<Note[]>> {
		if (!this.db) {
			return { success: false, error: 'Database not initialized' };
		}

		try {
			const query = `
        SELECT n.* FROM notes n
        JOIN note_categories nc ON n.id = nc.note_id
        WHERE nc.category_id = ? AND n.deleted_at IS NULL
        ORDER BY n.updated_at DESC
      `;
			const results = await this.db.select<Note[]>(query, [categoryId]);
			return { success: true, data: results };
		} catch (error) {
			return {
				success: false,
				error: `Failed to get category notes: ${error}`,
			};
		}
	}

	async addNoteToCategory(noteId: string, categoryId: string): Promise<VoidStorageResult> {
		if (!this.db) {
			return { success: false, error: 'Database not initialized' };
		}

		try {
			const now = new Date().toISOString();
			await this.db.execute(
				'INSERT OR IGNORE INTO note_categories (note_id, category_id, created_at) VALUES (?, ?, ?)',
				[noteId, categoryId, now]
			);
			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: `Failed to add note to category: ${error}`,
			};
		}
	}

	async removeNoteFromCategory(noteId: string, categoryId: string): Promise<VoidStorageResult> {
		if (!this.db) {
			return { success: false, error: 'Database not initialized' };
		}

		try {
			await this.db.execute('DELETE FROM note_categories WHERE note_id = ? AND category_id = ?', [noteId, categoryId]);
			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: `Failed to remove note from category: ${error}`,
			};
		}
	}

	// Tags operations
	async getTags(): Promise<StorageResult<Tag[]>> {
		if (!this.db) {
			return { success: false, error: 'Database not initialized' };
		}

		try {
			const results = await this.db.select<Tag[]>('SELECT * FROM tags ORDER BY name ASC');
			return { success: true, data: results };
		} catch (error) {
			return { success: false, error: `Failed to get tags: ${error}` };
		}
	}

	async getTag(id: string): Promise<StorageResult<Tag | null>> {
		if (!this.db) {
			return { success: false, error: 'Database not initialized' };
		}

		try {
			const results = await this.db.select<Tag[]>('SELECT * FROM tags WHERE id = ?', [id]);
			const tag = results.length > 0 ? (results[0] as Tag) : null;
			return { success: true, data: tag };
		} catch (error) {
			return { success: false, error: `Failed to get tag: ${error}` };
		}
	}

	async createTag(params: CreateTagParams): Promise<StorageResult<Tag>> {
		if (!this.db) {
			return { success: false, error: 'Database not initialized' };
		}

		try {
			const now = new Date().toISOString();
			const id = `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

			const insertQuery = `
        INSERT INTO tags (id, name, color, description, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

			await this.db.execute(insertQuery, [id, params.name, params.color || null, params.description || '', now, now]);

			const newTag: Tag = {
				id,
				name: params.name,
				color: params.color || null,
				description: params.description || '',
				created_at: now,
				updated_at: now,
			};

			return { success: true, data: newTag };
		} catch (error) {
			return { success: false, error: `Failed to create tag: ${error}` };
		}
	}

	async updateTag(id: string, params: Partial<CreateTagParams>): Promise<StorageResult<Tag>> {
		if (!this.db) {
			return { success: false, error: 'Database not initialized' };
		}

		try {
			const now = new Date().toISOString();
			const setParts: string[] = [];
			const queryParams: any[] = [];

			if (params.name !== undefined) {
				setParts.push('name = ?');
				queryParams.push(params.name);
			}
			if (params.color !== undefined) {
				setParts.push('color = ?');
				queryParams.push(params.color);
			}
			if (params.description !== undefined) {
				setParts.push('description = ?');
				queryParams.push(params.description);
			}

			setParts.push('updated_at = ?');
			queryParams.push(now);
			queryParams.push(id);

			const updateQuery = `UPDATE tags SET ${setParts.join(', ')} WHERE id = ?`;
			await this.db.execute(updateQuery, queryParams);

			const results = await this.db.select<Tag[]>('SELECT * FROM tags WHERE id = ?', [id]);
			if (results.length === 0) {
				return { success: false, error: 'Tag not found' };
			}

			return { success: true, data: results[0] as Tag };
		} catch (error) {
			return { success: false, error: `Failed to update tag: ${error}` };
		}
	}

	async deleteTag(id: string): Promise<VoidStorageResult> {
		if (!this.db) {
			return { success: false, error: 'Database not initialized' };
		}

		try {
			// Remove all note associations first
			await this.db.execute('DELETE FROM note_tags WHERE tag_id = ?', [id]);
			// Delete the tag
			await this.db.execute('DELETE FROM tags WHERE id = ?', [id]);
			return { success: true };
		} catch (error) {
			return { success: false, error: `Failed to delete tag: ${error}` };
		}
	}

	async getTagNotes(tagId: string): Promise<StorageResult<Note[]>> {
		if (!this.db) {
			return { success: false, error: 'Database not initialized' };
		}

		try {
			const query = `
        SELECT n.* FROM notes n
        JOIN note_tags nt ON n.id = nt.note_id
        WHERE nt.tag_id = ? AND n.deleted_at IS NULL
        ORDER BY n.updated_at DESC
      `;
			const results = await this.db.select<Note[]>(query, [tagId]);
			return { success: true, data: results };
		} catch (error) {
			return { success: false, error: `Failed to get tag notes: ${error}` };
		}
	}

	async addNoteTag(noteId: string, tagId: string): Promise<VoidStorageResult> {
		if (!this.db) {
			return { success: false, error: 'Database not initialized' };
		}

		try {
			const now = new Date().toISOString();
			await this.db.execute('INSERT OR IGNORE INTO note_tags (note_id, tag_id, created_at) VALUES (?, ?, ?)', [
				noteId,
				tagId,
				now,
			]);
			return { success: true };
		} catch (error) {
			return { success: false, error: `Failed to add note tag: ${error}` };
		}
	}

	async removeNoteTag(noteId: string, tagId: string): Promise<VoidStorageResult> {
		if (!this.db) {
			return { success: false, error: 'Database not initialized' };
		}

		try {
			await this.db.execute('DELETE FROM note_tags WHERE note_id = ? AND tag_id = ?', [noteId, tagId]);
			return { success: true };
		} catch (error) {
			return { success: false, error: `Failed to remove note tag: ${error}` };
		}
	}

	// Note relationships
	async getNoteRelationships(noteId: string): Promise<StorageResult<NoteRelationship[]>> {
		if (!this.db) {
			return { success: false, error: 'Database not initialized' };
		}

		try {
			const results = await this.db.select<NoteRelationship[]>(
				'SELECT * FROM note_relationships WHERE source_note_id = ? OR target_note_id = ?',
				[noteId, noteId]
			);
			return { success: true, data: results };
		} catch (error) {
			return {
				success: false,
				error: `Failed to get note relationships: ${error}`,
			};
		}
	}

	async createNoteRelationship(
		sourceId: string,
		targetId: string,
		type: 'reference' | 'child' | 'related',
		description?: string
	): Promise<StorageResult<NoteRelationship>> {
		if (!this.db) {
			return { success: false, error: 'Database not initialized' };
		}

		try {
			const now = new Date().toISOString();
			const id = `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

			const insertQuery = `
        INSERT INTO note_relationships (id, source_note_id, target_note_id, relationship_type, description, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

			await this.db.execute(insertQuery, [id, sourceId, targetId, type, description || '', now]);

			const newRelationship: NoteRelationship = {
				id,
				source_note_id: sourceId,
				target_note_id: targetId,
				relationship_type: type,
				description: description || '',
				created_at: now,
			};

			return { success: true, data: newRelationship };
		} catch (error) {
			return {
				success: false,
				error: `Failed to create note relationship: ${error}`,
			};
		}
	}

	async deleteNoteRelationship(id: string): Promise<VoidStorageResult> {
		if (!this.db) {
			return { success: false, error: 'Database not initialized' };
		}

		try {
			await this.db.execute('DELETE FROM note_relationships WHERE id = ?', [id]);
			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: `Failed to delete note relationship: ${error}`,
			};
		}
	}

	// Attachments
	async getNoteAttachments(noteId: string): Promise<StorageResult<Attachment[]>> {
		if (!this.db) {
			return { success: false, error: 'Database not initialized' };
		}

		try {
			const results = await this.db.select<Attachment[]>(
				'SELECT * FROM attachments WHERE note_id = ? ORDER BY created_at DESC',
				[noteId]
			);
			return { success: true, data: results };
		} catch (error) {
			return {
				success: false,
				error: `Failed to get note attachments: ${error}`,
			};
		}
	}

	async createAttachment(
		noteId: string,
		filename: string,
		originalFilename: string,
		filePath: string,
		mimeType: string,
		fileSize: number
	): Promise<StorageResult<Attachment>> {
		if (!this.db) {
			return { success: false, error: 'Database not initialized' };
		}

		try {
			const now = new Date().toISOString();
			const id = `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

			const insertQuery = `
        INSERT INTO attachments (id, note_id, filename, original_filename, file_path, mime_type, file_size, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

			await this.db.execute(insertQuery, [id, noteId, filename, originalFilename, filePath, mimeType, fileSize, now]);

			const newAttachment: Attachment = {
				id,
				note_id: noteId,
				filename,
				original_filename: originalFilename,
				file_path: filePath,
				mime_type: mimeType,
				file_size: fileSize,
				created_at: now,
			};

			return { success: true, data: newAttachment };
		} catch (error) {
			return { success: false, error: `Failed to create attachment: ${error}` };
		}
	}

	async deleteAttachment(id: string): Promise<VoidStorageResult> {
		if (!this.db) {
			return { success: false, error: 'Database not initialized' };
		}

		try {
			await this.db.execute('DELETE FROM attachments WHERE id = ?', [id]);
			return { success: true };
		} catch (error) {
			return { success: false, error: `Failed to delete attachment: ${error}` };
		}
	}

	// Note versions
	async getNoteVersions(noteId: string): Promise<StorageResult<NoteVersion[]>> {
		if (!this.db) {
			return { success: false, error: 'Database not initialized' };
		}

		try {
			const results = await this.db.select<NoteVersion[]>(
				'SELECT * FROM note_versions WHERE note_id = ? ORDER BY version_number DESC',
				[noteId]
			);
			return { success: true, data: results };
		} catch (error) {
			return { success: false, error: `Failed to get note versions: ${error}` };
		}
	}

	async createNoteVersion(noteId: string, title: string, content: string): Promise<StorageResult<NoteVersion>> {
		if (!this.db) {
			return { success: false, error: 'Database not initialized' };
		}

		try {
			const now = new Date().toISOString();
			const id = `ver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

			// Get the next version number
			const versionResult = await this.db.select<{ max_version: number }[]>(
				'SELECT COALESCE(MAX(version_number), 0) as max_version FROM note_versions WHERE note_id = ?',
				[noteId]
			);
			const nextVersion = (versionResult[0]?.max_version || 0) + 1;

			const insertQuery = `
        INSERT INTO note_versions (id, note_id, title, content, version_number, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

			await this.db.execute(insertQuery, [id, noteId, title, content, nextVersion, now]);

			const newVersion: NoteVersion = {
				id,
				note_id: noteId,
				title,
				content,
				version_number: nextVersion,
				created_at: now,
			};

			return { success: true, data: newVersion };
		} catch (error) {
			return {
				success: false,
				error: `Failed to create note version: ${error}`,
			};
		}
	}

	async deleteNoteVersion(id: string): Promise<VoidStorageResult> {
		if (!this.db) {
			return { success: false, error: 'Database not initialized' };
		}

		try {
			await this.db.execute('DELETE FROM note_versions WHERE id = ?', [id]);
			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: `Failed to delete note version: ${error}`,
			};
		}
	}

	async restoreNoteVersion(noteId: string, versionId: string): Promise<StorageResult<Note>> {
		if (!this.db) {
			return { success: false, error: 'Database not initialized' };
		}

		try {
			// Get the version to restore
			const versionResult = await this.db.select<NoteVersion[]>(
				'SELECT * FROM note_versions WHERE id = ? AND note_id = ?',
				[versionId, noteId]
			);

			if (versionResult.length === 0) {
				return { success: false, error: 'Note version not found' };
			}

			const version = versionResult[0];
			if (!version) {
				return { success: false, error: 'Note version not found' };
			}

			const now = new Date().toISOString();

			// Update the note with the version's content
			await this.db.execute('UPDATE notes SET title = ?, content = ?, updated_at = ? WHERE id = ?', [
				version.title,
				version.content,
				now,
				noteId,
			]);

			// Get the updated note
			const noteResult = await this.db.select<Note[]>('SELECT * FROM notes WHERE id = ?', [noteId]);

			if (noteResult.length === 0) {
				return { success: false, error: 'Note not found after restoration' };
			}

			const note = noteResult[0];
			if (!note) {
				return { success: false, error: 'Note not found after restoration' };
			}

			return { success: true, data: note };
		} catch (error) {
			return {
				success: false,
				error: `Failed to restore note version: ${error}`,
			};
		}
	}

	// Settings
	async getSetting(key: string): Promise<StorageResult<Setting | null>> {
		if (!this.db) {
			return { success: false, error: 'Database not initialized' };
		}

		try {
			const results = await this.db.select<Setting[]>('SELECT * FROM settings WHERE key = ?', [key]);
			const setting = results.length > 0 ? (results[0] as Setting) : null;
			return { success: true, data: setting };
		} catch (error) {
			return { success: false, error: `Failed to get setting: ${error}` };
		}
	}

	async setSetting(key: string, value: string): Promise<StorageResult<Setting>> {
		if (!this.db) {
			return { success: false, error: 'Database not initialized' };
		}

		try {
			const now = new Date().toISOString();
			await this.db.execute(
				'INSERT OR REPLACE INTO settings (key, value, created_at, updated_at) VALUES (?, ?, ?, ?)',
				[key, value, now, now]
			);

			// Return the created/updated setting
			const setting: Setting = {
				key,
				value,
				created_at: now,
				updated_at: now,
			};
			return { success: true, data: setting };
		} catch (error) {
			return { success: false, error: `Failed to set setting: ${error}` };
		}
	}

	async getSettings(): Promise<StorageResult<Setting[]>> {
		if (!this.db) {
			return { success: false, error: 'Database not initialized' };
		}

		try {
			const results = await this.db.select<Setting[]>('SELECT * FROM settings ORDER BY key ASC');
			return { success: true, data: results };
		} catch (error) {
			return { success: false, error: `Failed to get all settings: ${error}` };
		}
	}

	async deleteSetting(key: string): Promise<VoidStorageResult> {
		if (!this.db) {
			return { success: false, error: 'Database not initialized' };
		}

		try {
			await this.db.execute('DELETE FROM settings WHERE key = ?', [key]);
			return { success: true };
		} catch (error) {
			return { success: false, error: `Failed to delete setting: ${error}` };
		}
	}

	async searchNotes(query: string, filters?: NoteFilters): Promise<StorageResult<Note[]>> {
		if (!this.db) {
			return { success: false, error: 'Database not initialized' };
		}

		try {
			// Use FTS search for better performance
			let sqlQuery = `
        SELECT notes.* FROM notes
        JOIN notes_fts ON notes.rowid = notes_fts.rowid
        WHERE notes_fts MATCH ? AND notes.deleted_at IS NULL
      `;
			const params: any[] = [query];

			// Apply additional filters
			if (filters?.is_pinned !== undefined) {
				sqlQuery += ' AND notes.is_pinned = ?';
				params.push(filters.is_pinned);
			}
			if (filters?.is_archived !== undefined) {
				sqlQuery += ' AND notes.is_archived = ?';
				params.push(filters.is_archived);
			}
			if (filters?.categories && filters.categories.length > 0) {
				sqlQuery += ` AND notes.id IN (SELECT note_id FROM note_categories WHERE category_id IN (${filters.categories.map(() => '?').join(', ')}))`;
				params.push(...filters.categories);
			}
			if (filters?.tags && filters.tags.length > 0) {
				sqlQuery += ` AND notes.id IN (SELECT note_id FROM note_tags WHERE tag_id IN (${filters.tags.map(() => '?').join(', ')}))`;
				params.push(...filters.tags);
			}

			sqlQuery += ' ORDER BY notes.updated_at DESC';

			const results = await this.db.select<Note[]>(sqlQuery, params);
			return { success: true, data: results };
		} catch {
			// Fallback to LIKE search if FTS fails
			try {
				let fallbackQuery =
					'SELECT * FROM notes WHERE deleted_at IS NULL AND (title LIKE ? OR content_plaintext LIKE ?)';
				const fallbackParams: any[] = [`%${query}%`, `%${query}%`];

				if (filters?.is_pinned !== undefined) {
					fallbackQuery += ' AND is_pinned = ?';
					fallbackParams.push(filters.is_pinned);
				}
				if (filters?.is_archived !== undefined) {
					fallbackQuery += ' AND is_archived = ?';
					fallbackParams.push(filters.is_archived);
				}
				if (filters?.categories && filters.categories.length > 0) {
					fallbackQuery += ` AND id IN (SELECT note_id FROM note_categories WHERE category_id IN (${filters.categories.map(() => '?').join(', ')}))`;
					fallbackParams.push(...filters.categories);
				}
				if (filters?.tags && filters.tags.length > 0) {
					fallbackQuery += ` AND id IN (SELECT note_id FROM note_tags WHERE tag_id IN (${filters.tags.map(() => '?').join(', ')}))`;
					fallbackParams.push(...filters.tags);
				}

				fallbackQuery += ' ORDER BY updated_at DESC';

				const results = await this.db.select<Note[]>(fallbackQuery, fallbackParams);
				return { success: true, data: results };
			} catch (fallbackError) {
				return {
					success: false,
					error: `Failed to search notes: ${fallbackError}`,
				};
			}
		}
	}

	async sync(): Promise<VoidStorageResult> {
		// For SQLite, sync is essentially a no-op since it's already persistent
		return { success: true };
	}

	async getStorageInfo(): Promise<
		StorageResult<{
			backend: 'sqlite';
			note_count: number;
			category_count: number;
			tag_count: number;
			attachment_count: number;
			last_sync?: string;
			storage_size?: number;
		}>
	> {
		if (!this.db) {
			return { success: false, error: 'Database not initialized' };
		}

		try {
			const noteCountResult = await this.db.select<{ count: number }[]>(
				'SELECT COUNT(*) as count FROM notes WHERE deleted_at IS NULL'
			);
			const categoryCountResult = await this.db.select<{ count: number }[]>('SELECT COUNT(*) as count FROM categories');
			const tagCountResult = await this.db.select<{ count: number }[]>('SELECT COUNT(*) as count FROM tags');
			const attachmentCountResult = await this.db.select<{ count: number }[]>(
				'SELECT COUNT(*) as count FROM attachments'
			);

			return {
				success: true,
				data: {
					backend: 'sqlite',
					note_count: noteCountResult[0]?.count || 0,
					category_count: categoryCountResult[0]?.count || 0,
					tag_count: tagCountResult[0]?.count || 0,
					attachment_count: attachmentCountResult[0]?.count || 0,
					last_sync: new Date().toISOString(),
				},
			};
		} catch (error) {
			return { success: false, error: `Failed to get storage info: ${error}` };
		}
	}
}
