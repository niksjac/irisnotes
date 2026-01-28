/**
 * Settings Storage Module
 *
 * Direct SQLite access for settings, bypassing the storage adapter pattern.
 * This keeps settings simple and fast while the adapter handles complex item operations.
 *
 * Settings are stored as JSON-stringified values in the `settings` table.
 */

import Database from "@tauri-apps/plugin-sql";
import { invoke } from "@tauri-apps/api/core";
import { save, open } from "@tauri-apps/plugin-dialog";
import { writeTextFile, readTextFile } from "@tauri-apps/plugin-fs";

// Database singleton
let dbInstance: Database | null = null;
let dbInitPromise: Promise<Database> | null = null;

/**
 * Get database connection (lazy initialization)
 * Uses the same path resolution as the main storage adapter
 */
async function getDb(): Promise<Database> {
	if (dbInstance) {
		return dbInstance;
	}

	// Prevent multiple simultaneous init attempts
	if (dbInitPromise) {
		return dbInitPromise;
	}

	dbInitPromise = (async () => {
		try {
			// Get the actual database path from Tauri backend (handles dev vs prod)
			const databasePath = await invoke<string>("get_database_path");
			dbInstance = await Database.load(`sqlite:${databasePath}`);
			return dbInstance;
		} catch (error) {
			dbInitPromise = null;
			throw error;
		}
	})();

	return dbInitPromise;
}

/**
 * Get a single setting by key
 * @param key - Setting key
 * @param defaultValue - Default value if setting doesn't exist
 */
export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
	try {
		const db = await getDb();
		const result = await db.select<{ value: string }[]>(
			"SELECT value FROM settings WHERE key = ?",
			[key],
		);

		if (result.length > 0 && result[0]) {
			return JSON.parse(result[0].value) as T;
		}
		return defaultValue;
	} catch (error) {
		console.warn(`Failed to get setting ${key}:`, error);
		return defaultValue;
	}
}

/**
 * Set a single setting
 * @param key - Setting key
 * @param value - Value to store (will be JSON serialized)
 */
export async function setSetting<T>(key: string, value: T): Promise<void> {
	const db = await getDb();
	await db.execute(
		`INSERT INTO settings (key, value, created_at, updated_at) 
     VALUES (?, ?, datetime('now'), datetime('now'))
     ON CONFLICT(key) DO UPDATE SET 
       value = excluded.value,
       updated_at = datetime('now')`,
		[key, JSON.stringify(value)],
	);
}

/**
 * Delete a setting
 * @param key - Setting key to delete
 */
export async function deleteSetting(key: string): Promise<void> {
	const db = await getDb();
	await db.execute("DELETE FROM settings WHERE key = ?", [key]);
}

/**
 * Get multiple settings at once
 * @param defaults - Object with keys and default values
 * @returns Object with same keys, filled with stored or default values
 */
export async function getMultipleSettings<T extends Record<string, unknown>>(
	defaults: T,
): Promise<T> {
	const db = await getDb();
	const keys = Object.keys(defaults);
	const placeholders = keys.map(() => "?").join(",");

	const result = await db.select<{ key: string; value: string }[]>(
		`SELECT key, value FROM settings WHERE key IN (${placeholders})`,
		keys,
	);

	const settings = { ...defaults };
	for (const row of result) {
		try {
			(settings as Record<string, unknown>)[row.key] = JSON.parse(row.value);
		} catch {
			// Keep default on parse error
		}
	}

	return settings;
}

/**
 * Set multiple settings at once (in a transaction)
 * @param settings - Object with key-value pairs to store
 */
export async function setMultipleSettings(
	settings: Record<string, unknown>,
): Promise<void> {
	const db = await getDb();

	// Use a transaction for atomicity
	await db.execute("BEGIN TRANSACTION");
	try {
		for (const [key, value] of Object.entries(settings)) {
			await db.execute(
				`INSERT INTO settings (key, value, created_at, updated_at) 
         VALUES (?, ?, datetime('now'), datetime('now'))
         ON CONFLICT(key) DO UPDATE SET 
           value = excluded.value,
           updated_at = datetime('now')`,
				[key, JSON.stringify(value)],
			);
		}
		await db.execute("COMMIT");
	} catch (error) {
		await db.execute("ROLLBACK");
		throw error;
	}
}

/**
 * Get all settings as a flat object
 */
export async function getAllSettings(): Promise<Record<string, unknown>> {
	const db = await getDb();
	const result = await db.select<{ key: string; value: string }[]>(
		"SELECT key, value FROM settings",
	);

	const settings: Record<string, unknown> = {};
	for (const row of result) {
		try {
			settings[row.key] = JSON.parse(row.value);
		} catch {
			settings[row.key] = row.value;
		}
	}
	return settings;
}

// ============ Export/Import Functions ============

export interface SettingsExport {
	version: number;
	exportedAt: string;
	appVersion?: string;
	settings: Record<string, unknown>;
}

/**
 * Export all settings to a JSON file
 * Opens a save dialog for the user to choose the destination
 */
export async function exportSettings(): Promise<boolean> {
	try {
		const settings = await getAllSettings();

		const exportData: SettingsExport = {
			version: 1,
			exportedAt: new Date().toISOString(),
			settings,
		};

		const path = await save({
			defaultPath: `irisnotes-settings-${Date.now()}.json`,
			filters: [{ name: "JSON", extensions: ["json"] }],
		});

		if (path) {
			await writeTextFile(path, JSON.stringify(exportData, null, 2));
			return true;
		}
		return false;
	} catch (error) {
		console.error("Failed to export settings:", error);
		return false;
	}
}

/**
 * Import settings from a JSON file
 * Opens a file dialog for the user to choose the file
 * @returns true if import succeeded, false otherwise
 */
export async function importSettings(): Promise<boolean> {
	try {
		const path = await open({
			filters: [{ name: "JSON", extensions: ["json"] }],
		});

		if (!path || typeof path !== "string") {
			return false;
		}

		const content = await readTextFile(path);
		const data = JSON.parse(content) as SettingsExport;

		// Validate version
		if (data.version !== 1) {
			console.error(`Unsupported settings version: ${data.version}`);
			return false;
		}

		// Import each setting
		await setMultipleSettings(data.settings);
		return true;
	} catch (error) {
		console.error("Failed to import settings:", error);
		return false;
	}
}

/**
 * Clear localStorage cache and reload settings from SQLite
 * Useful after import or when cache might be stale
 */
export function clearSettingsCache(): void {
	// Find and remove all setting: prefixed items from localStorage
	const keysToRemove: string[] = [];
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key?.startsWith("setting:")) {
			keysToRemove.push(key);
		}
	}
	for (const key of keysToRemove) {
		localStorage.removeItem(key);
	}
}
