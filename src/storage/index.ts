// Clean storage exports - no wrapper managers!
import { SQLiteStorageAdapter } from "./adapters/sqlite-adapter";
import type { StorageConfig } from "./types";

export { SQLiteStorageAdapter };
export type { StorageAdapter, StorageConfig, StorageResult, VoidStorageResult, StorageBackend } from "./types";

// Factory function for creating SQLite adapter
export function createSQLiteAdapter(config: StorageConfig) {
	return new SQLiteStorageAdapter(config);
}
