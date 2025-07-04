import Database from '@tauri-apps/plugin-sql';
import type { StorageAdapter, StorageConfig, StorageResult } from '../types';
import type { Note, CreateNoteParams, UpdateNoteParams, NoteFilters } from '../../../../types/database';

// Placeholder SQLite storage adapter - would integrate with the existing database
export class SQLiteStorageAdapter implements StorageAdapter {
  private config: StorageConfig;
  private db: Database | null = null;

  constructor(config: StorageConfig) {
    this.config = config;
  }

  async init(): Promise<StorageResult<void>> {
    try {
      // Initialize SQLite database connection
      const dbPath = this.config.sqlite?.database_path || 'notes.db';
      this.db = await Database.load(`sqlite:${dbPath}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: `Failed to initialize SQLite database: ${error}` };
    }
  }

  getConfig(): StorageConfig {
    return this.config;
  }

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
      const results = await this.db.select<Note[]>(
        'SELECT * FROM notes WHERE id = ? AND deleted_at IS NULL',
        [id]
      );
      const note = results.length > 0 ? results[0] as Note : null;
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
        id, title, content, contentType, contentRaw,
        now, now, false, false,
        wordCount, characterCount, contentPlaintext
      ]);

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
        content_plaintext: contentPlaintext
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
      const results = await this.db.select<Note[]>(
        'SELECT * FROM notes WHERE id = ? AND deleted_at IS NULL',
        [params.id]
      );

      if (results.length === 0) {
        return { success: false, error: 'Note not found' };
      }

      const updatedNote = results[0] as Note;
      return { success: true, data: updatedNote };
    } catch (error) {
      return { success: false, error: `Failed to update note: ${error}` };
    }
  }

  async deleteNote(id: string): Promise<StorageResult<void>> {
    if (!this.db) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      const now = new Date().toISOString();
      await this.db.execute(
        'UPDATE notes SET deleted_at = ? WHERE id = ?',
        [now, id]
      );
      return { success: true };
    } catch (error) {
      return { success: false, error: `Failed to delete note: ${error}` };
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

      sqlQuery += ' ORDER BY notes.updated_at DESC';

      const results = await this.db.select<Note[]>(sqlQuery, params);
      return { success: true, data: results };
    } catch (error) {
      // Fallback to LIKE search if FTS fails
      try {
        let fallbackQuery = 'SELECT * FROM notes WHERE deleted_at IS NULL AND (title LIKE ? OR content_plaintext LIKE ?)';
        const fallbackParams: any[] = [`%${query}%`, `%${query}%`];

        if (filters?.is_pinned !== undefined) {
          fallbackQuery += ' AND is_pinned = ?';
          fallbackParams.push(filters.is_pinned);
        }
        if (filters?.is_archived !== undefined) {
          fallbackQuery += ' AND is_archived = ?';
          fallbackParams.push(filters.is_archived);
        }

        fallbackQuery += ' ORDER BY updated_at DESC';

        const results = await this.db.select<Note[]>(fallbackQuery, fallbackParams);
        return { success: true, data: results };
      } catch (fallbackError) {
        return { success: false, error: `Failed to search notes: ${fallbackError}` };
      }
    }
  }

  async sync(): Promise<StorageResult<void>> {
    // For SQLite, sync is essentially a no-op since it's already persistent
    return { success: true };
  }

  async getStorageInfo(): Promise<StorageResult<{
    backend: 'sqlite';
    note_count: number;
    last_sync?: string;
    storage_size?: number;
  }>> {
    if (!this.db) {
      return { success: false, error: 'Database not initialized' };
    }

    try {
      const countResult = await this.db.select<{ count: number }[]>(
        'SELECT COUNT(*) as count FROM notes WHERE deleted_at IS NULL'
      );
      const noteCount = countResult[0]?.count || 0;

      return {
        success: true,
        data: {
          backend: 'sqlite',
          note_count: noteCount,
          last_sync: new Date().toISOString()
        }
      };
    } catch (error) {
      return { success: false, error: `Failed to get storage info: ${error}` };
    }
  }
}