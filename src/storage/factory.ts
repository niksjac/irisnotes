// Storage adapter factory - creates SQLite adapter

import type { StorageAdapter, StorageConfig } from "./types";
import { SQLiteStorageAdapter } from "./adapters/sqlite-adapter";

/**
 * Create a storage adapter based on the configuration
 * Currently only SQLite is supported - JSON adapters have been removed
 * in favor of a file-based export/import system
 */
export function createStorageAdapter(config: StorageConfig): StorageAdapter {
	if (config.backend !== "sqlite") {
		console.warn(
			`Backend '${config.backend}' not supported, using SQLite`
		);
	}
	return new SQLiteStorageAdapter(config);
}

/**
 * Get available storage backends
 */
export function getAvailableBackends(): string[] {
	return ["sqlite"];
}

/**
 * Validate storage configuration
 */
export function validateStorageConfig(config: StorageConfig): {
	valid: boolean;
	error?: string;
} {
	if (!config.backend) {
		return { valid: false, error: "Storage backend is required" };
	}

	if (config.backend !== "sqlite") {
		return {
			valid: false,
			error: `Only 'sqlite' backend is supported. Use export/import for file-based backup.`,
		};
	}

	if (!config.sqlite?.database_path) {
		return { valid: false, error: "SQLite backend requires database_path" };
	}

	return { valid: true };
}

/**
 * Get default storage configuration
 */
export function getDefaultStorageConfig(): StorageConfig {
	return {
		backend: "sqlite",
		sqlite: {
			database_path: "notes.db",
		},
	};
}
