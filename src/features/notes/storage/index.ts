// Storage types
export type {
  StorageBackend,
  StorageConfig,
  StorageResult,
  VoidStorageResult,
  StorageAdapter,
  SingleStorageManager,
  MultiStorageManager
} from './types';

// Storage adapters
import { SQLiteStorageAdapter } from './adapters/sqlite-storage';
import { MultiStorageManagerImpl } from './multi-storage-manager';
import { SingleStorageManagerImpl } from './single-storage-manager';

// Export storage classes
export { SQLiteStorageAdapter, MultiStorageManagerImpl, SingleStorageManagerImpl };

// Factory functions
export function createSQLiteStorageAdapter(databasePath: string): SQLiteStorageAdapter {
  return new SQLiteStorageAdapter({
    backend: 'sqlite',
    sqlite: {
      database_path: databasePath
    }
  });
}

export function createMultiStorageManager(): MultiStorageManagerImpl {
  return new MultiStorageManagerImpl();
}

export function createSingleStorageManager(): SingleStorageManagerImpl {
  return new SingleStorageManagerImpl();
}