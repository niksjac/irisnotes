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
		// Improved SQL statement splitting that handles multi-line statements properly
		const statements = this.splitSQLStatements(sqlContent);

		for (const statement of statements) {
			if (statement.trim()) {
				try {
					await this.db.execute(statement);
				} catch (error: any) {
					// Only warn for actual errors, not "already exists" conditions
					if (!this.isExpectedError(error)) {
						console.warn(`${description} statement ignored (likely already exists): ${error.message || error}`);
					}
					// Continue with other statements - some might fail if already exist
				}
			}
		}
	}

	private splitSQLStatements(sqlContent: string): string[] {
		// Remove comments and normalize whitespace
		const cleaned = sqlContent
			.split('\n')
			.map(line => line.replace(/--.*$/, '').trim())
			.filter(line => line.length > 0)
			.join(' ');

		// Split on semicolons, but be careful with complex statements
		const statements: string[] = [];
		let current = '';
		let inQuotes = false;
		let quoteChar = '';

		for (let i = 0; i < cleaned.length; i++) {
			const char = cleaned[i];

			if (!inQuotes && (char === '"' || char === "'")) {
				inQuotes = true;
				quoteChar = char;
			} else if (inQuotes && char === quoteChar) {
				inQuotes = false;
				quoteChar = '';
			} else if (!inQuotes && char === ';') {
				if (current.trim()) {
					statements.push(current.trim());
					current = '';
				}
				continue;
			}

			current += char;
		}

		// Add the last statement if it doesn't end with semicolon
		if (current.trim()) {
			statements.push(current.trim());
		}

		return statements.filter(stmt => stmt.length > 0);
	}

	private isExpectedError(error: any): boolean {
		const errorMessage = error.message || error.toString();
		return (
			errorMessage.includes('already exists') ||
			errorMessage.includes('duplicate column name') ||
			errorMessage.includes('table') && errorMessage.includes('already exists')
		);
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
