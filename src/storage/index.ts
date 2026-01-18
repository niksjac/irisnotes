// Clean storage exports - SQLite only with export/import for file-based backup
import { SQLiteStorageAdapter } from "./adapters/sqlite-adapter";
import { createStorageAdapter, getDefaultStorageConfig } from "./factory";
import { exportToFolder, importFromFolder } from "./export-import";
import type { StorageConfig } from "./types";

export {
	SQLiteStorageAdapter,
	createStorageAdapter,
	getDefaultStorageConfig,
	// Export/Import functionality
	exportToFolder,
	importFromFolder,
};

export type {
	StorageAdapter,
	StorageConfig,
	StorageResult,
	VoidStorageResult,
	StorageBackend,
} from "./types";

export type {
	ExportOptions,
	ExportResult,
	ImportOptions,
	ImportResult,
} from "./export-import";

// Legacy factory function for backward compatibility
export function createSQLiteAdapter(config: StorageConfig) {
	return new SQLiteStorageAdapter(config);
}
