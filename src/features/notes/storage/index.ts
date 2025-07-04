// Storage types
import type { MultiStorageManager } from './types';
export type {
  StorageBackend,
  StorageConfig,
  StorageResult,
  StorageAdapter,
  MultiStorageManager
} from './types';

// Storage adapters
import { SQLiteStorageAdapter } from './adapters/sqlite-storage';
import { MultiStorageManagerImpl } from './multi-storage-manager';

export { SQLiteStorageAdapter, MultiStorageManagerImpl };

// Factory function to create a SQLite storage adapter
export function createSQLiteStorageAdapter(databasePath: string): SQLiteStorageAdapter {
  return new SQLiteStorageAdapter({
    backend: 'sqlite',
    sqlite: {
      database_path: databasePath
    }
  });
}

// Factory function to create multi-storage manager
export function createMultiStorageManager(): MultiStorageManager {
  return new MultiStorageManagerImpl();
}