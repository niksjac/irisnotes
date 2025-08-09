import type Database from "@tauri-apps/plugin-sql";
import type { StorageResult, VoidStorageResult } from "../../types";

/**
 * Base repository class with common database patterns and error handling
 */
export abstract class BaseRepository {
	protected db: Database;

	constructor(database: Database) {
		this.db = database;
	}

	/**
	 * Helper method to handle database errors consistently
	 */
	protected handleError(error: unknown, operation: string): { success: false; error: string } {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error(`${operation} failed:`, error);
		return { success: false, error: `${operation} failed: ${errorMessage}` };
	}

	/**
	 * Helper method to check if database is initialized
	 */
	protected checkDatabase(): { success: false; error: string } | null {
		if (!this.db) {
			return { success: false, error: "Database not initialized" };
		}
		return null;
	}

	/**
	 * Generate a unique ID for database records
	 */
	protected generateId(): string {
		return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * Get current ISO timestamp
	 */
	protected now(): string {
		return new Date().toISOString();
	}

	/**
	 * Helper to wrap successful results
	 */
	protected success<T>(data: T): StorageResult<T> {
		return { success: true, data };
	}

	/**
	 * Helper to wrap void successful results
	 */
	protected voidSuccess(): VoidStorageResult {
		return { success: true };
	}

	/**
	 * Helper to wrap failed results
	 */
	protected failure(error: string): { success: false; error: string } {
		return { success: false, error };
	}
}
