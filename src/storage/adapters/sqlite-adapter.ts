import Database from "@tauri-apps/plugin-sql";
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
} from "../../types/database";
import type { StorageAdapter, StorageConfig, StorageResult, VoidStorageResult } from "../types";
import type { TreeData } from "../../types";
import { SqliteNotesRepository, SqliteCategoriesRepository, SqliteSchemaManager, SqliteTreeOperations } from "./sqlite";

/**
 * Clean, modular SQLite storage adapter using the repository pattern
 */
export class SQLiteStorageAdapter implements StorageAdapter {
	private config: StorageConfig;
	private db: Database | null = null;

	// Repositories for organized data access
	private notesRepo: SqliteNotesRepository | null = null;
	private categoriesRepo: SqliteCategoriesRepository | null = null;
	private schemaManager: SqliteSchemaManager | null = null;
	private treeOps: SqliteTreeOperations | null = null;

	constructor(config: StorageConfig) {
		this.config = config;
	}

	async init(): Promise<VoidStorageResult> {
		try {
			// Initialize SQLite database connection
			const dbPath = this.config.sqlite?.database_path || "notes.db";
			this.db = await Database.load(`sqlite:${dbPath}`);

			// Initialize repositories
			this.notesRepo = new SqliteNotesRepository(this.db);
			this.categoriesRepo = new SqliteCategoriesRepository(this.db);
			this.schemaManager = new SqliteSchemaManager(this.db);
			this.treeOps = new SqliteTreeOperations(this.db);

			// Create tables and indexes
			await this.schemaManager.createTables();
			return { success: true };
		} catch (error) {
			console.error("❌ Failed to initialize SQLite storage:", error);
			return { success: false, error: `Failed to initialize storage: ${error}` };
		}
	}

	getConfig(): StorageConfig {
		return this.config;
	}

	// ===== NOTES OPERATIONS (via Repository) =====
	async getNotes(filters?: NoteFilters): Promise<StorageResult<Note[]>> {
		if (!this.notesRepo) return { success: false, error: "Storage not initialized" };
		return this.notesRepo.getNotes(filters);
	}

	async getNote(id: string): Promise<StorageResult<Note | null>> {
		if (!this.notesRepo) return { success: false, error: "Storage not initialized" };
		return this.notesRepo.getNote(id);
	}

	async createNote(params: CreateNoteParams): Promise<StorageResult<Note>> {
		if (!this.notesRepo || !this.categoriesRepo) return { success: false, error: "Storage not initialized" };

		// Create the note
		const result = await this.notesRepo.createNote(params);
		if (!result.success) return result;

		// Handle category assignments
		if (params.category_ids && params.category_ids.length > 0) {
			for (const categoryId of params.category_ids) {
				await this.categoriesRepo.addNoteToCategory(result.data.id, categoryId);
			}
		}

		// Handle tag assignments (TODO: implement with TagsRepository)
		if (params.tag_ids && params.tag_ids.length > 0) {
			// TODO: Implement with TagsRepository
			console.log("Tag assignment not yet implemented for:", params.tag_ids);
		}

		return result;
	}

	async updateNote(params: UpdateNoteParams): Promise<StorageResult<Note>> {
		if (!this.notesRepo) return { success: false, error: "Storage not initialized" };
		return this.notesRepo.updateNote(params);
	}

	async deleteNote(id: string): Promise<VoidStorageResult> {
		if (!this.notesRepo) return { success: false, error: "Storage not initialized" };
		return this.notesRepo.deleteNote(id);
	}

	async searchNotes(query: string, filters?: NoteFilters): Promise<StorageResult<Note[]>> {
		if (!this.notesRepo) return { success: false, error: "Storage not initialized" };
		return this.notesRepo.searchNotes(query, filters);
	}

	// ===== CATEGORIES OPERATIONS (via Repository) =====
	async getCategories(): Promise<StorageResult<Category[]>> {
		if (!this.categoriesRepo) return { success: false, error: "Storage not initialized" };
		return this.categoriesRepo.getCategories();
	}

	async getCategory(id: string): Promise<StorageResult<Category | null>> {
		if (!this.categoriesRepo) return { success: false, error: "Storage not initialized" };
		return this.categoriesRepo.getCategory(id);
	}

	async createCategory(params: CreateCategoryParams): Promise<StorageResult<Category>> {
		if (!this.categoriesRepo) return { success: false, error: "Storage not initialized" };
		return this.categoriesRepo.createCategory(params);
	}

	async updateCategory(id: string, params: Partial<CreateCategoryParams>): Promise<StorageResult<Category>> {
		if (!this.categoriesRepo) return { success: false, error: "Storage not initialized" };
		return this.categoriesRepo.updateCategory(id, params);
	}

	async deleteCategory(id: string): Promise<VoidStorageResult> {
		if (!this.categoriesRepo) return { success: false, error: "Storage not initialized" };
		return this.categoriesRepo.deleteCategory(id);
	}

	async getCategoryNotes(categoryId: string): Promise<StorageResult<Note[]>> {
		if (!this.categoriesRepo) return { success: false, error: "Storage not initialized" };
		return this.categoriesRepo.getCategoryNotes(categoryId);
	}

	async addNoteToCategory(noteId: string, categoryId: string): Promise<VoidStorageResult> {
		if (!this.categoriesRepo) return { success: false, error: "Storage not initialized" };
		return this.categoriesRepo.addNoteToCategory(noteId, categoryId);
	}

	async removeNoteFromCategory(noteId: string, categoryId: string): Promise<VoidStorageResult> {
		if (!this.categoriesRepo) return { success: false, error: "Storage not initialized" };
		return this.categoriesRepo.removeNoteFromCategory(noteId, categoryId);
	}

	// ===== TREE OPERATIONS =====
	async getTreeData(): Promise<StorageResult<TreeData[]>> {
		if (!this.db) return { success: false, error: "Database not initialized" };

		try {
			console.log("🔍 Fetching tree data...");

			// Query the tree_items view that combines categories and notes
			let flatItems: Array<{
				id: string;
				name: string;
				type: "note" | "category";
				parent_id: string | null;
				sort_order: number;
			}>;

			try {
				flatItems = await this.db.select<
					Array<{
						id: string;
						name: string;
						type: "note" | "category";
						parent_id: string | null;
						sort_order: number;
					}>
				>("SELECT * FROM tree_items ORDER BY parent_id NULLS FIRST, sort_order ASC");
			} catch (viewError) {
				console.warn("tree_items view not found, using fallback query:", viewError);

				// Fallback to manual UNION query
				flatItems = await this.db.select<
					Array<{
						id: string;
						name: string;
						type: "note" | "category";
						parent_id: string | null;
						sort_order: number;
					}>
				>(`
					SELECT
						id,
						name,
						'category' as type,
						parent_id,
						sort_order
					FROM categories
					UNION ALL
					SELECT
						id,
						title as name,
						'note' as type,
						parent_category_id as parent_id,
						sort_order
					FROM notes
					WHERE deleted_at IS NULL
					ORDER BY parent_id NULLS FIRST, sort_order ASC
				`);
			}

			console.log("📊 Found flat items:", flatItems.length);

			// Build tree structure in memory (simple since data is already sorted)
			const itemsByParent = new Map<
				string | null,
				Array<{
					id: string;
					name: string;
					type: "note" | "category";
					parent_id: string | null;
					sort_order: number;
				}>
			>();

			// Group items by parent
			for (const item of flatItems) {
				const parentId = item.parent_id;
				const items = itemsByParent.get(parentId) || [];
				items.push(item);
				itemsByParent.set(parentId, items);
			}

			// Build tree recursively
			const buildTree = (parentId: string | null): TreeData[] => {
				const items = itemsByParent.get(parentId) || [];
				return items.map((item) => {
					const treeNode: TreeData = {
						id: item.id,
						name: item.name,
						type: item.type,
					};

					// Add children if this is a category
					if (item.type === "category") {
						const children = buildTree(item.id);
						if (children.length > 0) {
							treeNode.children = children;
						}
					}

					return treeNode;
				});
			};

			const treeData = buildTree(null);
			console.log("🌳 Built tree data:", treeData.length, "root items");
			return { success: true, data: treeData };
		} catch (error) {
			console.error("❌ Failed to get tree data:", error);
			return { success: false, error: `Failed to get tree data: ${error}` };
		}
	}

	async updateNoteSortOrder(noteId: string, sortOrder: number): Promise<VoidStorageResult> {
		if (!this.notesRepo) return { success: false, error: "Storage not initialized" };
		return this.notesRepo.updateNoteSortOrder(noteId, sortOrder);
	}

	async moveNoteToCategory(noteId: string, newCategoryId: string | null): Promise<VoidStorageResult> {
		if (!this.notesRepo) return { success: false, error: "Storage not initialized" };
		return this.notesRepo.moveNoteToCategory(noteId, newCategoryId);
	}

	// Enhanced tree operations
	async moveTreeItem(
		itemId: string,
		itemType: "note" | "category",
		newParentId: string | null,
		insertIndex?: number
	): Promise<VoidStorageResult> {
		if (!this.treeOps) return { success: false, error: "Storage not initialized" };
		return this.treeOps.moveTreeItem(itemId, itemType, newParentId, insertIndex);
	}

	async reorderTreeItem(
		itemId: string,
		itemType: "note" | "category",
		newIndex: number,
		parentId: string | null
	): Promise<VoidStorageResult> {
		if (!this.treeOps) return { success: false, error: "Storage not initialized" };
		return this.treeOps.reorderTreeItem(itemId, itemType, newIndex, parentId);
	}

	// ===== STUB METHODS (TODO: Implement with more repositories) =====
	// For now, keeping these as minimal stubs to satisfy the interface
	// These can be extracted into repositories later

	async getTags(): Promise<StorageResult<Tag[]>> {
		if (!this.db) return { success: false, error: "Database not initialized" };
		try {
			const results = await this.db.select<Tag[]>("SELECT * FROM tags ORDER BY name ASC");
			return { success: true, data: results };
		} catch (error) {
			return { success: false, error: `Failed to get tags: ${error}` };
		}
	}

	async getTag(id: string): Promise<StorageResult<Tag | null>> {
		if (!this.db) return { success: false, error: "Database not initialized" };
		try {
			const results = await this.db.select<Tag[]>("SELECT * FROM tags WHERE id = ?", [id]);
			const tag = results.length > 0 ? (results[0] as Tag) : null;
			return { success: true, data: tag };
		} catch (error) {
			return { success: false, error: `Failed to get tag: ${error}` };
		}
	}

	async createTag(params: CreateTagParams): Promise<StorageResult<Tag>> {
		if (!this.db) return { success: false, error: "Database not initialized" };
		try {
			const now = new Date().toISOString();
			const id = `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

			await this.db.execute(
				"INSERT INTO tags (id, name, color, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
				[id, params.name, params.color || null, params.description || "", now, now]
			);

			const newTag: Tag = {
				id,
				name: params.name,
				color: params.color || null,
				description: params.description || "",
				created_at: now,
				updated_at: now,
			};

			return { success: true, data: newTag };
		} catch (error) {
			return { success: false, error: `Failed to create tag: ${error}` };
		}
	}

	// More stub methods...
	async updateTag(): Promise<StorageResult<Tag>> {
		throw new Error("Not implemented");
	}
	async deleteTag(): Promise<VoidStorageResult> {
		throw new Error("Not implemented");
	}
	async getTagNotes(): Promise<StorageResult<Note[]>> {
		throw new Error("Not implemented");
	}
	async addNoteTag(): Promise<VoidStorageResult> {
		throw new Error("Not implemented");
	}
	async removeNoteTag(): Promise<VoidStorageResult> {
		throw new Error("Not implemented");
	}
	async getNoteRelationships(): Promise<StorageResult<NoteRelationship[]>> {
		throw new Error("Not implemented");
	}
	async createNoteRelationship(): Promise<StorageResult<NoteRelationship>> {
		throw new Error("Not implemented");
	}
	async deleteNoteRelationship(): Promise<VoidStorageResult> {
		throw new Error("Not implemented");
	}
	async getNoteAttachments(): Promise<StorageResult<Attachment[]>> {
		throw new Error("Not implemented");
	}
	async createAttachment(): Promise<StorageResult<Attachment>> {
		throw new Error("Not implemented");
	}
	async deleteAttachment(): Promise<VoidStorageResult> {
		throw new Error("Not implemented");
	}
	async getNoteVersions(): Promise<StorageResult<NoteVersion[]>> {
		throw new Error("Not implemented");
	}
	async createNoteVersion(): Promise<StorageResult<NoteVersion>> {
		throw new Error("Not implemented");
	}
	async restoreNoteVersion(): Promise<StorageResult<Note>> {
		throw new Error("Not implemented");
	}
	async getSetting(): Promise<StorageResult<Setting | null>> {
		throw new Error("Not implemented");
	}
	async setSetting(): Promise<StorageResult<Setting>> {
		throw new Error("Not implemented");
	}
	async getSettings(): Promise<StorageResult<Setting[]>> {
		throw new Error("Not implemented");
	}
	async deleteSetting(): Promise<VoidStorageResult> {
		throw new Error("Not implemented");
	}

	async sync(): Promise<VoidStorageResult> {
		// For SQLite, sync is essentially a no-op since it's already persistent
		return { success: true };
	}

	async getStorageInfo(): Promise<
		StorageResult<{
			backend: "sqlite";
			note_count: number;
			category_count: number;
			tag_count: number;
			attachment_count: number;
			last_sync?: string;
			storage_size?: number;
		}>
	> {
		if (!this.db) return { success: false, error: "Database not initialized" };

		try {
			const [noteCount, categoryCount, tagCount, attachmentCount] = await Promise.all([
				this.db.select<Array<{ count: number }>>("SELECT COUNT(*) as count FROM notes WHERE deleted_at IS NULL"),
				this.db.select<Array<{ count: number }>>("SELECT COUNT(*) as count FROM categories"),
				this.db.select<Array<{ count: number }>>("SELECT COUNT(*) as count FROM tags"),
				this.db.select<Array<{ count: number }>>("SELECT COUNT(*) as count FROM attachments"),
			]);

			return {
				success: true,
				data: {
					backend: "sqlite",
					note_count: noteCount[0]?.count || 0,
					category_count: categoryCount[0]?.count || 0,
					tag_count: tagCount[0]?.count || 0,
					attachment_count: attachmentCount[0]?.count || 0,
				},
			};
		} catch (error) {
			return { success: false, error: `Failed to get storage info: ${error}` };
		}
	}
}
