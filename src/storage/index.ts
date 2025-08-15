// Clean storage exports - no wrapper managers!
import { SQLiteStorageAdapter } from "./adapters/sqlite-adapter";
import { JsonSingleStorageAdapter } from "./adapters/json-single-adapter";
import { JsonHybridStorageAdapter } from "./adapters/json-hybrid-adapter";
import { createStorageAdapter } from "./factory";
import type { StorageConfig } from "./types";

export {
	SQLiteStorageAdapter,
	JsonSingleStorageAdapter,
	JsonHybridStorageAdapter,
	createStorageAdapter
};
export type { StorageAdapter, StorageConfig, StorageResult, VoidStorageResult, StorageBackend } from "./types";

// Legacy factory function for backward compatibility
export function createSQLiteAdapter(config: StorageConfig) {
	return new SQLiteStorageAdapter(config);
}
