import type Database from "@tauri-apps/plugin-sql";
import baseSchemaSQL from "../../schema/base.sql?raw";
import seedProdSQL from "../../schema/seed-prod.sql?raw";

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

		// Execute the schema SQL file
		await this.executeSchemaSQL();

		// Run any additional migrations
		await this.addMissingColumns();
		await this.insertDefaultData();
	}

	private async executeSchemaSQL(): Promise<void> {
		// Execute base schema first
		await this.executeSQLStatements(baseSchemaSQL, "base schema");

		// Then execute production seed data
		await this.executeSQLStatements(seedProdSQL, "seed data");
	}

	private async executeSQLStatements(sqlContent: string, description: string): Promise<void> {
		const statements = sqlContent
			.split(";")
			.map((stmt) => stmt.trim())
			.filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

		for (const statement of statements) {
			if (statement.trim()) {
				try {
					await this.db.execute(statement);
				} catch (error) {
					console.warn(`${description} statement ignored (likely already exists): ${error}`);
					// Continue with other statements - some might fail if already exist
				}
			}
		}
	}

	private async addMissingColumns(): Promise<void> {
		try {
			// Check if parent_category_id column exists in notes table
			const noteTableInfo = await this.db.select<Array<{ name: string }>>("PRAGMA table_info(notes)");
			const hasParentCategory = noteTableInfo.some((col) => col.name === "parent_category_id");

			if (!hasParentCategory) {
				console.log("Adding parent_category_id column to notes table...");
				await this.db.execute(`ALTER TABLE notes ADD COLUMN parent_category_id TEXT NULL`);
				await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_notes_parent_category_id ON notes(parent_category_id)`);
			}
		} catch (error) {
			console.error("❌ Failed to add missing columns:", error);
			console.warn("⚠️ App will continue with existing schema");
		}
	}

	private async insertDefaultData(): Promise<void> {
		// Default data is now handled by seed-prod.sql in executeSchemaSQL()
		// This method is kept for any additional runtime data initialization if needed
	}
}
