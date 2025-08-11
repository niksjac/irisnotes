import type { Category, CreateCategoryParams, Note } from "../../../types/database";
import type { StorageResult, VoidStorageResult } from "../../types";
import { BaseRepository } from "./sqlite-base";

/**
 * Repository for categories-related database operations
 */
export class SqliteCategoriesRepository extends BaseRepository {
	async getCategories(): Promise<StorageResult<Category[]>> {
		const dbCheck = this.checkDatabase();
		if (dbCheck) return dbCheck;

		try {
			const results = await this.db.select<Category[]>("SELECT * FROM categories ORDER BY sort_order ASC, name ASC");
			return this.success(results);
		} catch (error) {
			return this.handleError(error, "Get categories");
		}
	}

	async getCategory(id: string): Promise<StorageResult<Category | null>> {
		const dbCheck = this.checkDatabase();
		if (dbCheck) return dbCheck;

		try {
			const results = await this.db.select<Category[]>("SELECT * FROM categories WHERE id = ?", [id]);
			const category = results.length > 0 ? (results[0] as Category) : null;
			return this.success(category);
		} catch (error) {
			return this.handleError(error, "Get category");
		}
	}

	async createCategory(params: CreateCategoryParams): Promise<StorageResult<Category>> {
		const dbCheck = this.checkDatabase();
		if (dbCheck) return dbCheck;

		try {
			const now = this.now();
			const id = this.generateId();
			const sortOrder = params.sort_order || 0;

			const insertQuery = `
        INSERT INTO categories (id, name, description, color, icon, parent_id, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

			await this.db.execute(insertQuery, [
				id,
				params.name,
				params.description || "",
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
				description: params.description || "",
				color: params.color || null,
				icon: params.icon || null,
				parent_id: params.parent_id || null,
				sort_order: sortOrder,
				created_at: now,
				updated_at: now,
			};

			return this.success(newCategory);
		} catch (error) {
			return this.handleError(error, "Create category");
		}
	}

	async updateCategory(id: string, params: Partial<CreateCategoryParams>): Promise<StorageResult<Category>> {
		const dbCheck = this.checkDatabase();
		if (dbCheck) return dbCheck;

		try {
			const now = this.now();
			const setParts: string[] = [];
			const queryParams: any[] = [];

			if (params.name !== undefined) {
				setParts.push("name = ?");
				queryParams.push(params.name);
			}
			if (params.description !== undefined) {
				setParts.push("description = ?");
				queryParams.push(params.description);
			}
			if (params.color !== undefined) {
				setParts.push("color = ?");
				queryParams.push(params.color);
			}
			if (params.icon !== undefined) {
				setParts.push("icon = ?");
				queryParams.push(params.icon);
			}
			if (params.parent_id !== undefined) {
				setParts.push("parent_id = ?");
				queryParams.push(params.parent_id);
			}
			if (params.sort_order !== undefined) {
				setParts.push("sort_order = ?");
				queryParams.push(params.sort_order);
			}

			setParts.push("updated_at = ?");
			queryParams.push(now);
			queryParams.push(id);

			const updateQuery = `UPDATE categories SET ${setParts.join(", ")} WHERE id = ?`;
			await this.db.execute(updateQuery, queryParams);

			const results = await this.db.select<Category[]>("SELECT * FROM categories WHERE id = ?", [id]);
			if (results.length === 0) {
				return this.failure("Category not found");
			}

			return this.success(results[0] as Category);
		} catch (error) {
			return this.handleError(error, "Update category");
		}
	}

	async deleteCategory(id: string): Promise<VoidStorageResult> {
		const dbCheck = this.checkDatabase();
		if (dbCheck) return dbCheck;

		try {
			// Remove all note associations first
			await this.db.execute("DELETE FROM note_categories WHERE category_id = ?", [id]);
			// Delete the category
			await this.db.execute("DELETE FROM categories WHERE id = ?", [id]);
			return this.voidSuccess();
		} catch (error) {
			return this.handleError(error, "Delete category");
		}
	}

	async getCategoryNotes(categoryId: string): Promise<StorageResult<Note[]>> {
		const dbCheck = this.checkDatabase();
		if (dbCheck) return dbCheck;

		try {
			const query = `
        SELECT n.* FROM notes n
        JOIN note_categories nc ON n.id = nc.note_id
        WHERE nc.category_id = ? AND n.deleted_at IS NULL
        		ORDER BY n.sort_order DESC, n.updated_at DESC
      `;

			// Try with sort_order, fallback if column doesn't exist
			try {
				const results = await this.db.select<Note[]>(query, [categoryId]);
				return this.success(results);
			} catch (error: any) {
				if (error?.message?.includes("no such column: sort_order")) {
					// Fallback query without sort_order
					const fallbackQuery = `
		        SELECT n.* FROM notes n
		        JOIN note_categories nc ON n.id = nc.note_id
		        WHERE nc.category_id = ? AND n.deleted_at IS NULL
		        ORDER BY n.updated_at DESC
		      `;
					const results = await this.db.select<Note[]>(fallbackQuery, [categoryId]);
					return this.success(results);
				}
				throw error;
			}
		} catch (error) {
			return this.handleError(error, "Get category notes");
		}
	}

	async addNoteToCategory(noteId: string, categoryId: string): Promise<VoidStorageResult> {
		const dbCheck = this.checkDatabase();
		if (dbCheck) return dbCheck;

		try {
			const now = this.now();
			await this.db.execute(
				"INSERT OR IGNORE INTO note_categories (note_id, category_id, created_at) VALUES (?, ?, ?)",
				[noteId, categoryId, now]
			);
			return this.voidSuccess();
		} catch (error) {
			return this.handleError(error, "Add note to category");
		}
	}

	async removeNoteFromCategory(noteId: string, categoryId: string): Promise<VoidStorageResult> {
		const dbCheck = this.checkDatabase();
		if (dbCheck) return dbCheck;

		try {
			await this.db.execute("DELETE FROM note_categories WHERE note_id = ? AND category_id = ?", [noteId, categoryId]);
			return this.voidSuccess();
		} catch (error) {
			return this.handleError(error, "Remove note from category");
		}
	}
}
