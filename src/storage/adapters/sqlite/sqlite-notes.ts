import type { CreateNoteParams, Note, NoteFilters, UpdateNoteParams } from "../../../types/database";
import type { StorageResult, VoidStorageResult } from "../../types";
import { BaseRepository } from "./sqlite-base";

/**
 * Repository for notes-related database operations
 */
export class SqliteNotesRepository extends BaseRepository {
	async getNotes(filters?: NoteFilters): Promise<StorageResult<Note[]>> {
		const dbCheck = this.checkDatabase();
		if (dbCheck) return dbCheck;

		try {
			let query = "SELECT * FROM notes WHERE deleted_at IS NULL";
			const params: any[] = [];

			// Apply filters
			if (filters?.is_pinned !== undefined) {
				query += " AND is_pinned = ?";
				params.push(String(filters.is_pinned ? 1 : 0));
			}
			if (filters?.is_archived !== undefined) {
				query += " AND is_archived = ?";
				params.push(String(filters.is_archived ? 1 : 0));
			}
			if (filters?.search_query) {
				query += " AND (title LIKE ? OR content_plaintext LIKE ?)";
				const searchParam = `%${filters.search_query}%`;
				params.push(searchParam, searchParam);
			}
			if (filters?.categories && filters.categories.length > 0) {
				query += ` AND id IN (SELECT note_id FROM note_categories WHERE category_id IN (${filters.categories.map(() => "?").join(", ")}))`;
				params.push(...filters.categories);
			}
			if (filters?.tags && filters.tags.length > 0) {
				query += ` AND id IN (SELECT note_id FROM note_tags WHERE tag_id IN (${filters.tags.map(() => "?").join(", ")}))`;
				params.push(...filters.tags);
			}
			if (filters?.date_range) {
				query += " AND created_at BETWEEN ? AND ?";
				params.push(filters.date_range.start, filters.date_range.end);
			}

			query += " ORDER BY updated_at DESC";

			const results = await this.db.select<Note[]>(query, params);
			return this.success(results);
		} catch (error) {
			return this.handleError(error, "Get notes");
		}
	}

	async getNote(id: string): Promise<StorageResult<Note | null>> {
		const dbCheck = this.checkDatabase();
		if (dbCheck) return dbCheck;

		try {
			const results = await this.db.select<Note[]>("SELECT * FROM notes WHERE id = ? AND deleted_at IS NULL", [id]);
			const note = results.length > 0 ? (results[0] as Note) : null;
			return this.success(note);
		} catch (error) {
			return this.handleError(error, "Get note");
		}
	}

	async createNote(params: CreateNoteParams): Promise<StorageResult<Note>> {
		const dbCheck = this.checkDatabase();
		if (dbCheck) return dbCheck;

		try {
			const now = this.now();
			const id = this.generateId();
			const title = params.title || "Untitled Note";
			const content = params.content || "";
			const contentType = params.content_type || "html";
			const contentRaw = params.content_raw || null;

			// Calculate word count and character count
			const wordCount = content.split(/\s+/).filter((word) => word.length > 0).length;
			const characterCount = content.length;

			// Extract plain text for search
			const contentPlaintext = content.replace(/<[^>]*>/g, "").trim();

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

			return this.success(newNote);
		} catch (error) {
			return this.handleError(error, "Create note");
		}
	}

	async updateNote(params: UpdateNoteParams): Promise<StorageResult<Note>> {
		const dbCheck = this.checkDatabase();
		if (dbCheck) return dbCheck;

		try {
			const now = this.now();
			const setParts: string[] = [];
			const queryParams: any[] = [];

			// Build dynamic update query
			if (params.title !== undefined) {
				setParts.push("title = ?");
				queryParams.push(params.title);
			}
			if (params.content !== undefined) {
				setParts.push("content = ?");
				queryParams.push(params.content);

				// Update word count and character count
				const wordCount = params.content.split(/\s+/).filter((word) => word.length > 0).length;
				const characterCount = params.content.length;
				const contentPlaintext = params.content.replace(/<[^>]*>/g, "").trim();

				setParts.push("word_count = ?", "character_count = ?", "content_plaintext = ?");
				queryParams.push(wordCount, characterCount, contentPlaintext);
			}
			if (params.content_type !== undefined) {
				setParts.push("content_type = ?");
				queryParams.push(params.content_type);
			}
			if (params.content_raw !== undefined) {
				setParts.push("content_raw = ?");
				queryParams.push(params.content_raw);
			}
			if (params.is_pinned !== undefined) {
				setParts.push("is_pinned = ?");
				queryParams.push(params.is_pinned);
			}
			if (params.is_archived !== undefined) {
				setParts.push("is_archived = ?");
				queryParams.push(params.is_archived);
			}

			// Always update the updated_at timestamp
			setParts.push("updated_at = ?");
			queryParams.push(now);

			// Add the ID parameter for the WHERE clause
			queryParams.push(params.id);

			const updateQuery = `UPDATE notes SET ${setParts.join(", ")} WHERE id = ? AND deleted_at IS NULL`;
			await this.db.execute(updateQuery, queryParams);

			// Get the updated note
			const results = await this.db.select<Note[]>("SELECT * FROM notes WHERE id = ? AND deleted_at IS NULL", [
				params.id,
			]);

			if (results.length === 0) {
				return this.failure("Note not found");
			}

			const updatedNote = results[0] as Note;
			return this.success(updatedNote);
		} catch (error) {
			return this.handleError(error, "Update note");
		}
	}

	async deleteNote(id: string): Promise<VoidStorageResult> {
		const dbCheck = this.checkDatabase();
		if (dbCheck) return dbCheck;

		try {
			const now = this.now();
			await this.db.execute("UPDATE notes SET deleted_at = ? WHERE id = ?", [now, id]);
			return this.voidSuccess();
		} catch (error) {
			return this.handleError(error, "Delete note");
		}
	}

	async searchNotes(query: string, filters?: NoteFilters): Promise<StorageResult<Note[]>> {
		const dbCheck = this.checkDatabase();
		if (dbCheck) return dbCheck;

		try {
			// Use full-text search if available, otherwise fall back to LIKE
			let searchQuery = `
        SELECT * FROM notes
        WHERE deleted_at IS NULL
        AND (title LIKE ? OR content_plaintext LIKE ?)
      `;
			const searchParam = `%${query}%`;
			const params = [searchParam, searchParam];

			// Apply additional filters
			if (filters?.is_pinned !== undefined) {
				searchQuery += " AND is_pinned = ?";
				params.push(String(filters.is_pinned ? 1 : 0));
			}
			if (filters?.is_archived !== undefined) {
				searchQuery += " AND is_archived = ?";
				params.push(String(filters.is_archived ? 1 : 0));
			}
			if (filters?.categories && filters.categories.length > 0) {
				searchQuery += ` AND id IN (SELECT note_id FROM note_categories WHERE category_id IN (${filters.categories.map(() => "?").join(", ")}))`;
				params.push(...filters.categories);
			}
			if (filters?.tags && filters.tags.length > 0) {
				searchQuery += ` AND id IN (SELECT note_id FROM note_tags WHERE tag_id IN (${filters.tags.map(() => "?").join(", ")}))`;
				params.push(...filters.tags);
			}

			searchQuery += " ORDER BY updated_at DESC LIMIT 50";

			const results = await this.db.select<Note[]>(searchQuery, params);
			return this.success(results);
		} catch (error) {
			return this.handleError(error, "Search notes");
		}
	}
}
