// SQLite Storage Adapter with Unified Items Schema
// Uses single items table with JSON metadata column

import Database from "@tauri-apps/plugin-sql";
import type {
	Attachment,
	Category,
	CreateNoteParams,
	Note,
	NoteFilters,
	NoteRelationship,
	NoteVersion,
	Setting,
	Tag,
	UpdateNoteParams,
} from "../../types/database";
import type {
	StorageAdapter,
	StorageConfig,
	StorageResult,
	VoidStorageResult,
} from "../types";
import type { TreeData } from "../../types";
import type { FlexibleItem, CreateItemParams } from "../../types/items";
import { canBeChildOf } from "../hierarchy";
import { SqliteSchemaManager } from "./sqlite";

/**
 * SQLite Storage Adapter using unified items table
 * Production-ready with ACID transactions and full-text search
 */
export class SQLiteStorageAdapter implements StorageAdapter {
	private config: StorageConfig;
	private db: Database | null = null;
	private schemaManager: SqliteSchemaManager | null = null;

	constructor(config: StorageConfig) {
		this.config = config;
	}

	async init(): Promise<VoidStorageResult> {
		try {
			// Initialize SQLite database connection
			const dbPath = this.config.sqlite?.database_path || "notes.db";
			this.db = await Database.load(`sqlite:${dbPath}`);

			// Initialize schema manager
			this.schemaManager = new SqliteSchemaManager(this.db);

			// Create tables and indexes
			await this.schemaManager.createTables();
			return { success: true };
		} catch (error) {
			console.error("❌ Failed to initialize SQLite storage:", error);
			return {
				success: false,
				error: `Failed to initialize storage: ${error}`,
			};
		}
	}

	getConfig(): StorageConfig {
		return this.config;
	}

	// ===== FLEXIBLE ITEM OPERATIONS =====

	async createItem(params: CreateItemParams): Promise<StorageResult<FlexibleItem>> {
		if (!this.db) return { success: false, error: "Database not initialized" };

		try {
			// Validate hierarchy
			if (params.parent_id) {
				const parentResult = await this.getItem(params.parent_id);
				if (!parentResult.success || !parentResult.data) {
					return { success: false, error: 'Parent item not found' };
				}

				if (!canBeChildOf(params.type, parentResult.data.type)) {
					return { success: false, error: `${params.type}s cannot be placed in ${parentResult.data.type}s` };
				}
			}

			const now = new Date().toISOString();
			const id = `${params.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

			// Get next sort order
			const sortOrder = await this.getNextSortOrder(params.parent_id || null);

			const newItem: FlexibleItem = {
				id,
				type: params.type,
				title: params.title,
				content: params.content,
				content_type: params.content_type,
				content_raw: params.content_raw,
				content_plaintext: this.extractPlaintext(params.content || ''),
				parent_id: params.parent_id || null,
				sort_order: sortOrder,
				metadata: params.metadata || {},
				created_at: now,
				updated_at: now,
			};

			// Insert into database
			await this.db.execute(
				`INSERT INTO items (
					id, type, title, content, content_type, content_raw, content_plaintext,
					parent_id, sort_order, metadata, created_at, updated_at, word_count, character_count
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				[
					newItem.id,
					newItem.type,
					newItem.title,
					newItem.content || '',
					newItem.content_type || 'html',
					newItem.content_raw,
					newItem.content_plaintext,
					newItem.parent_id,
					newItem.sort_order,
					JSON.stringify(newItem.metadata),
					newItem.created_at,
					newItem.updated_at,
					this.countWords(newItem.content || ''),
					(newItem.content || '').length,
				]
			);

			return { success: true, data: newItem };
		} catch (error) {
			return { success: false, error: `Failed to create item: ${error}` };
		}
	}

	async getItem(id: string): Promise<StorageResult<FlexibleItem | null>> {
		if (!this.db) return { success: false, error: "Database not initialized" };

		try {
			const results = await this.db.select<any[]>(
				"SELECT * FROM items WHERE id = ? AND deleted_at IS NULL",
				[id]
			);

			if (results.length === 0) {
				return { success: true, data: null };
			}

			const item = this.rowToFlexibleItem(results[0]);
			return { success: true, data: item };
		} catch (error) {
			return { success: false, error: `Failed to get item: ${error}` };
		}
	}

	private async getNextSortOrder(parentId: string | null): Promise<number> {
		if (!this.db) return 0;

		try {
			const results = await this.db.select<Array<{ max_sort: number }>>(
				"SELECT MAX(sort_order) as max_sort FROM items WHERE parent_id = ? AND deleted_at IS NULL",
				[parentId]
			);

			return (results[0]?.max_sort || 0) + 1;
		} catch (error) {
			console.warn("Failed to get next sort order:", error);
			return 0;
		}
	}

	private extractPlaintext(content: string): string {
		// Simple plaintext extraction (remove markdown/html)
		return content.replace(/[#*_`\[\]()]/g, '').replace(/\n+/g, ' ').trim();
	}

	private countWords(content: string): number {
		return content.trim().split(/\s+/).filter(word => word.length > 0).length;
	}

	private rowToFlexibleItem(row: any): FlexibleItem {
		return {
			id: row.id,
			type: row.type,
			title: row.title,
			content: row.content,
			content_type: row.content_type,
			content_raw: row.content_raw,
			content_plaintext: row.content_plaintext,
			parent_id: row.parent_id,
			sort_order: row.sort_order,
			metadata: row.metadata ? JSON.parse(row.metadata) : {},
			created_at: row.created_at,
			updated_at: row.updated_at,
			deleted_at: row.deleted_at,
		};
	}

	// ===== ADAPTER INTERFACE IMPLEMENTATION =====

	async getNotes(_filters?: NoteFilters): Promise<StorageResult<Note[]>> {
		if (!this.db) return { success: false, error: "Database not initialized" };

		try {
			const results = await this.db.select<any[]>(
				"SELECT * FROM items WHERE type = 'note' AND deleted_at IS NULL ORDER BY created_at DESC"
			);

			const notes: Note[] = results.map(row => this.rowToNote(row));
			return { success: true, data: notes };
		} catch (error) {
			return { success: false, error: `Failed to get notes: ${error}` };
		}
	}

	async getNote(id: string): Promise<StorageResult<Note | null>> {
		if (!this.db) return { success: false, error: "Database not initialized" };

		try {
			const results = await this.db.select<any[]>(
				"SELECT * FROM items WHERE id = ? AND type = 'note' AND deleted_at IS NULL",
				[id]
			);

			if (results.length === 0) {
				return { success: true, data: null };
			}

			const note = this.rowToNote(results[0]);
			return { success: true, data: note };
		} catch (error) {
			return { success: false, error: `Failed to get note: ${error}` };
		}
	}

	async createNote(params: CreateNoteParams): Promise<StorageResult<Note>> {
		const result = await this.createItem({
			type: 'note',
			title: params.title || 'Untitled Note',
			content: params.content || '',
			content_type: params.content_type || 'html',
			content_raw: params.content_raw,
			metadata: {},
		});

		if (!result.success) return result;
		return { success: true, data: this.flexibleItemToNote(result.data) };
	}

	async updateNote(params: UpdateNoteParams): Promise<StorageResult<Note>> {
		if (!this.db) return { success: false, error: "Database not initialized" };

		try {
			const now = new Date().toISOString();
			const content = params.content;
			const contentPlaintext = content ? this.extractPlaintext(content) : undefined;
			const wordCount = content ? this.countWords(content) : undefined;
			const characterCount = content ? content.length : undefined;

			// Build update query dynamically
			const updates: string[] = [];
			const values: any[] = [];

			if (params.title !== undefined) {
				updates.push("title = ?");
				values.push(params.title);
			}
			if (params.content !== undefined) {
				updates.push("content = ?", "content_plaintext = ?", "word_count = ?", "character_count = ?");
				values.push(params.content, contentPlaintext, wordCount, characterCount);
			}
			if (params.content_type !== undefined) {
				updates.push("content_type = ?");
				values.push(params.content_type);
			}
			if (params.content_raw !== undefined) {
				updates.push("content_raw = ?");
				values.push(params.content_raw);
			}
			if (params.is_pinned !== undefined || params.is_archived !== undefined) {
				// Update metadata JSON
				const currentResult = await this.getNote(params.id);
				if (currentResult.success && currentResult.data) {
					const currentMetadata = JSON.parse(await this.db.select<any[]>(
						"SELECT metadata FROM items WHERE id = ?", [params.id]
					).then(rows => rows[0]?.metadata || '{}'));

					const newMetadata = {
						...currentMetadata,
						...(params.is_pinned !== undefined && { is_pinned: params.is_pinned }),
						...(params.is_archived !== undefined && { is_archived: params.is_archived }),
					};

					updates.push("metadata = ?");
					values.push(JSON.stringify(newMetadata));
				}
			}

			updates.push("updated_at = ?");
			values.push(now);
			values.push(params.id);

			await this.db.execute(
				`UPDATE items SET ${updates.join(", ")} WHERE id = ?`,
				values
			);

			// Return updated note
			const noteResult = await this.getNote(params.id);
			if (!noteResult.success) {
				return noteResult;
			}
			if (!noteResult.data) {
				return { success: false, error: "Note not found after update" };
			}
			return { success: true, data: noteResult.data };
		} catch (error) {
			return { success: false, error: `Failed to update note: ${error}` };
		}
	}

	async deleteNote(id: string): Promise<VoidStorageResult> {
		if (!this.db) return { success: false, error: "Database not initialized" };

		try {
			const now = new Date().toISOString();
			await this.db.execute(
				"UPDATE items SET deleted_at = ?, updated_at = ? WHERE id = ?",
				[now, now, id]
			);

			return { success: true };
		} catch (error) {
			return { success: false, error: `Failed to delete note: ${error}` };
		}
	}

	async searchNotes(query: string, _filters?: NoteFilters): Promise<StorageResult<Note[]>> {
		if (!this.db) return { success: false, error: "Database not initialized" };

		try {
			// Use FTS if available, otherwise fallback to LIKE
			let results: any[];
			try {
				results = await this.db.select<any[]>(
					`SELECT items.* FROM items
					 JOIN items_fts ON items.rowid = items_fts.rowid
					 WHERE items_fts MATCH ? AND items.type = 'note' AND items.deleted_at IS NULL
					 ORDER BY rank`,
					[query]
				);
			} catch {
				// Fallback to LIKE search
				results = await this.db.select<any[]>(
					`SELECT * FROM items
					 WHERE type = 'note' AND deleted_at IS NULL
					 AND (title LIKE ? OR content_plaintext LIKE ?)
					 ORDER BY created_at DESC`,
					[`%${query}%`, `%${query}%`]
				);
			}

			const notes: Note[] = results.map(row => this.rowToNote(row));
			return { success: true, data: notes };
		} catch (error) {
			return { success: false, error: `Failed to search notes: ${error}` };
		}
	}

	async getCategories(): Promise<StorageResult<Category[]>> {
		if (!this.db) return { success: false, error: "Database not initialized" };

		try {
			const results = await this.db.select<any[]>(
				"SELECT * FROM items WHERE type IN ('book', 'section') AND deleted_at IS NULL ORDER BY sort_order"
			);

			const categories: Category[] = results.map(row => this.rowToCategory(row));
			return { success: true, data: categories };
		} catch (error) {
			return { success: false, error: `Failed to get categories: ${error}` };
		}
	}

	async getTreeData(): Promise<StorageResult<TreeData[]>> {
		if (!this.db) return { success: false, error: "Database not initialized" };

		try {
			// Use the tree_items view if available
			let results: any[];
			try {
				results = await this.db.select<any[]>(
					"SELECT * FROM tree_items ORDER BY parent_id NULLS FIRST, sort_order ASC"
				);
			} catch {
				// Fallback to manual query
				results = await this.db.select<any[]>(
					`SELECT
						id, title as name, type, parent_id, sort_order,
						json_extract(metadata, '$.custom_icon') as custom_icon,
						json_extract(metadata, '$.custom_text_color') as custom_text_color,
						json_extract(metadata, '$.is_pinned') as is_pinned
					FROM items
					WHERE deleted_at IS NULL
					ORDER BY parent_id NULLS FIRST, sort_order ASC`
				);
			}

			// Build tree structure
			const itemsByParent = new Map<string | null, any[]>();

			for (const item of results) {
				const parentId = item.parent_id;
				const items = itemsByParent.get(parentId) || [];
				items.push(item);
				itemsByParent.set(parentId, items);
			}

			const buildTree = (parentId: string | null): TreeData[] => {
				const items = itemsByParent.get(parentId) || [];
				return items.map(item => {
					const treeNode: TreeData = {
						id: item.id,
						name: item.name,
						type: item.type === 'book' || item.type === 'section' ? 'category' : item.type,
					};

					// Add children for container types
					if (item.type === 'book' || item.type === 'section') {
						const children = buildTree(item.id);
						if (children.length > 0) {
							treeNode.children = children;
						}
					}

					return treeNode;
				});
			};

			const treeData = buildTree(null);
			return { success: true, data: treeData };
		} catch (error) {
			return { success: false, error: `Failed to get tree data: ${error}` };
		}
	}

	// Helper conversion methods
	private rowToNote(row: any): Note {
		const metadata = row.metadata ? JSON.parse(row.metadata) : {};
		return {
			id: row.id,
			title: row.title,
			content: row.content || '',
			content_type: row.content_type || 'html',
			content_raw: row.content_raw,
			created_at: row.created_at,
			updated_at: row.updated_at,
			deleted_at: row.deleted_at,
			is_pinned: metadata.is_pinned || false,
			is_archived: metadata.is_archived || false,
			word_count: row.word_count || 0,
			character_count: row.character_count || 0,
			content_plaintext: row.content_plaintext || '',
			sort_order: row.sort_order,
			parent_category_id: row.parent_id,
		};
	}

	private flexibleItemToNote(item: FlexibleItem): Note {
		return {
			id: item.id,
			title: item.title,
			content: item.content || '',
			content_type: (item.content_type as any) || 'html',
			content_raw: item.content_raw || null,
			created_at: item.created_at,
			updated_at: item.updated_at,
			deleted_at: item.deleted_at || null,
			is_pinned: item.metadata.is_pinned || false,
			is_archived: item.metadata.is_archived || false,
			word_count: item.metadata.word_count || 0,
			character_count: item.metadata.character_count || 0,
			content_plaintext: item.content_plaintext || '',
			sort_order: item.sort_order,
			parent_category_id: item.parent_id,
		};
	}

	private rowToCategory(row: any): Category {
		const metadata = row.metadata ? JSON.parse(row.metadata) : {};
		return {
			id: row.id,
			name: row.title,
			description: metadata.description || '',
			color: metadata.custom_text_color || null,
			icon: metadata.custom_icon || null,
			parent_id: row.parent_id,
			sort_order: row.sort_order,
			created_at: row.created_at,
			updated_at: row.updated_at,
		};
	}

	// Stub implementations for interface compliance
	async getCategory(): Promise<StorageResult<Category | null>> { throw new Error("Not implemented"); }
	async createCategory(): Promise<StorageResult<Category>> { throw new Error("Not implemented"); }
	async updateCategory(): Promise<StorageResult<Category>> { throw new Error("Not implemented"); }
	async deleteCategory(): Promise<VoidStorageResult> { throw new Error("Not implemented"); }
	async getCategoryNotes(): Promise<StorageResult<Note[]>> { throw new Error("Not implemented"); }
	async addNoteToCategory(): Promise<VoidStorageResult> { throw new Error("Not implemented"); }
	async removeNoteFromCategory(): Promise<VoidStorageResult> { throw new Error("Not implemented"); }
	async updateNoteSortOrder(): Promise<VoidStorageResult> { throw new Error("Not implemented"); }
	async moveNoteToCategory(): Promise<VoidStorageResult> { throw new Error("Not implemented"); }
	async moveTreeItem(): Promise<VoidStorageResult> { throw new Error("Not implemented"); }
	async reorderTreeItem(): Promise<VoidStorageResult> { throw new Error("Not implemented"); }
	async getTags(): Promise<StorageResult<Tag[]>> {
		if (!this.db) return { success: false, error: "Database not initialized" };
		try {
			const results = await this.db.select<Tag[]>("SELECT * FROM tags ORDER BY name ASC");
			return { success: true, data: results };
		} catch (error) {
			return { success: false, error: `Failed to get tags: ${error}` };
		}
	}
	async getTag(): Promise<StorageResult<Tag | null>> { throw new Error("Not implemented"); }
	async createTag(): Promise<StorageResult<Tag>> { throw new Error("Not implemented"); }
	async updateTag(): Promise<StorageResult<Tag>> { throw new Error("Not implemented"); }
	async deleteTag(): Promise<VoidStorageResult> { throw new Error("Not implemented"); }
	async getTagNotes(): Promise<StorageResult<Note[]>> { throw new Error("Not implemented"); }
	async addNoteTag(): Promise<VoidStorageResult> { throw new Error("Not implemented"); }
	async removeNoteTag(): Promise<VoidStorageResult> { throw new Error("Not implemented"); }
	async getNoteRelationships(): Promise<StorageResult<NoteRelationship[]>> { throw new Error("Not implemented"); }
	async createNoteRelationship(): Promise<StorageResult<NoteRelationship>> { throw new Error("Not implemented"); }
	async deleteNoteRelationship(): Promise<VoidStorageResult> { throw new Error("Not implemented"); }
	async getNoteAttachments(): Promise<StorageResult<Attachment[]>> { throw new Error("Not implemented"); }
	async createAttachment(): Promise<StorageResult<Attachment>> { throw new Error("Not implemented"); }
	async deleteAttachment(): Promise<VoidStorageResult> { throw new Error("Not implemented"); }
	async getNoteVersions(): Promise<StorageResult<NoteVersion[]>> { throw new Error("Not implemented"); }
	async createNoteVersion(): Promise<StorageResult<NoteVersion>> { throw new Error("Not implemented"); }
	async restoreNoteVersion(): Promise<StorageResult<Note>> { throw new Error("Not implemented"); }
	async getSettings(): Promise<StorageResult<Setting[]>> {
		if (!this.db) return { success: false, error: "Database not initialized" };
		try {
			const results = await this.db.select<Setting[]>("SELECT * FROM settings");
			return { success: true, data: results };
		} catch (error) {
			return { success: false, error: `Failed to get settings: ${error}` };
		}
	}
	async getSetting(): Promise<StorageResult<Setting | null>> { throw new Error("Not implemented"); }
	async setSetting(): Promise<StorageResult<Setting>> { throw new Error("Not implemented"); }
	async deleteSetting(): Promise<VoidStorageResult> { throw new Error("Not implemented"); }
	async sync(): Promise<VoidStorageResult> { return { success: true }; }

	async getStorageInfo(): Promise<StorageResult<{
		backend: "sqlite" | "json-single" | "json-hybrid" | "cloud";
		note_count: number;
		category_count: number;
		tag_count: number;
		attachment_count: number;
		last_sync?: string;
		storage_size?: number;
	}>> {
		if (!this.db) return { success: false, error: "Database not initialized" };

		try {
			const [noteCount, categoryCount, tagCount] = await Promise.all([
				this.db.select<Array<{ count: number }>>(
					"SELECT COUNT(*) as count FROM items WHERE type = 'note' AND deleted_at IS NULL"
				),
				this.db.select<Array<{ count: number }>>(
					"SELECT COUNT(*) as count FROM items WHERE type IN ('book', 'section') AND deleted_at IS NULL"
				),
				this.db.select<Array<{ count: number }>>(
					"SELECT COUNT(*) as count FROM tags"
				),
			]);

			return {
				success: true,
				data: {
					backend: "sqlite",
					note_count: noteCount[0]?.count || 0,
					category_count: categoryCount[0]?.count || 0,
					tag_count: tagCount[0]?.count || 0,
					attachment_count: 0,
				},
			};
		} catch (error) {
			return { success: false, error: `Failed to get storage info: ${error}` };
		}
	}
}