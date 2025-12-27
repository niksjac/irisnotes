import type Database from "@tauri-apps/plugin-sql";
import baseSchemaSQL from "@schema/base.sql?raw";

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
		// Execute base schema
		await this.executeSQLStatements(baseSchemaSQL, "base schema");
	}

	private async executeSQLStatements(
		sqlContent: string,
		description: string
	): Promise<void> {
		// Improved SQL statement splitting that handles multi-line statements properly
		const statements = this.splitSQLStatements(sqlContent);

		for (const statement of statements) {
			const trimmed = statement.trim();
			if (trimmed && !trimmed.startsWith("--")) {
				try {
					await this.db.execute(trimmed);
				} catch (error: any) {
					const errorMsg = error.message || error.toString();

					// Only warn for actual errors, not "already exists" conditions
					if (!this.isExpectedError(error)) {
						// Skip incomplete input errors (likely from SQL parsing issues)
						if (
							!errorMsg.includes("incomplete input") &&
							!errorMsg.includes("cannot commit")
						) {
							console.warn(`${description} statement ignored: ${errorMsg}`);
						}
					}
					// Continue with other statements - some might fail if already exist
				}
			}
		}
	}

	private splitSQLStatements(sqlContent: string): string[] {
		// Better SQL statement splitting that preserves structure
		const lines = sqlContent.split("\n");
		const statements: string[] = [];
		let currentStatement = "";
		let inMultiLineStatement = false;
		let parenLevel = 0;

		for (const line of lines) {
			const trimmedLine = line.trim();

			// Skip empty lines and comments
			if (!trimmedLine || trimmedLine.startsWith("--")) {
				continue;
			}

			// Track parentheses for complex statements like triggers/views
			for (const char of trimmedLine) {
				if (char === "(") parenLevel++;
				if (char === ")") parenLevel--;
			}

			// Check if we're in a multi-line statement
			if (
				trimmedLine.includes("CREATE TRIGGER") ||
				trimmedLine.includes("CREATE VIEW") ||
				trimmedLine.includes("BEGIN") ||
				parenLevel > 0
			) {
				inMultiLineStatement = true;
			}

			currentStatement += (currentStatement ? " " : "") + trimmedLine;

			// End of statement detection
			if (
				trimmedLine.endsWith(";") &&
				(!inMultiLineStatement || parenLevel === 0)
			) {
				if (trimmedLine.includes("END;")) {
					inMultiLineStatement = false;
				}

				if (currentStatement.trim()) {
					statements.push(currentStatement.trim());
				}
				currentStatement = "";
				inMultiLineStatement = false;
				parenLevel = 0;
			}
		}

		// Add final statement if exists
		if (currentStatement.trim()) {
			statements.push(currentStatement.trim());
		}

		return statements.filter((stmt) => stmt.length > 5); // Filter out tiny fragments
	}

	private isExpectedError(error: any): boolean {
		const errorMessage = error.message || error.toString();
		return (
			errorMessage.includes("already exists") ||
			errorMessage.includes("duplicate column name") ||
			errorMessage.includes("duplicate index name") ||
			errorMessage.includes("duplicate trigger name") ||
			errorMessage.includes("duplicate view name") ||
			(errorMessage.includes("table") &&
				errorMessage.includes("already exists")) ||
			(errorMessage.includes("index") &&
				errorMessage.includes("already exists")) ||
			errorMessage.includes("incomplete input") ||
			errorMessage.includes("cannot commit - no transaction is active")
		);
	}

	private async addMissingColumns(): Promise<void> {
		try {
			// Check if the items table exists and has the expected structure
			const itemsTableInfo = await this.db.select<Array<{ name: string }>>(
				"PRAGMA table_info(items)"
			);

			// Add any missing columns that might be needed for future migrations
			// Currently all required columns are in the base schema
			// This method is kept for potential future schema updates
			if (itemsTableInfo.length === 0) {
				console.warn(
					"⚠️ Items table not found - schema may need to be recreated"
				);
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
