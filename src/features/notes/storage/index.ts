// Storage types
import type { MultiStorageManager } from './types';
export type {
  StorageBackend,
  FileFormat,
  Notebook,
  FileNote,
  StorageConfig,
  StorageResult,
  StorageAdapter,
  MultiStorageManager,
  FileFormatHandler
} from './types';

// Storage adapters
import { FileStorageAdapter } from './adapters/file-storage';
import { SQLiteStorageAdapter } from './adapters/sqlite-storage';
import { MultiStorageManagerImpl } from './multi-storage-manager';

export { FileStorageAdapter, SQLiteStorageAdapter, MultiStorageManagerImpl };

// Format handlers
export {
  getFileFormatHandler,
  registerFormatHandler,
  getSupportedFormats,
  isFormatSupported,
  getFormatInfo,
  detectFormatFromExtension,
  detectFormatFromContent
} from './format-handlers';

// Individual format handlers for custom usage
export { CustomFormatHandler } from './format-handlers/custom-format-handler';
export { MarkdownFormatHandler } from './format-handlers/markdown-handler';
export { HtmlFormatHandler } from './format-handlers/html-handler';
export { JsonFormatHandler } from './format-handlers/json-handler';
export { TextFormatHandler } from './format-handlers/text-handler';

// Factory function to create a file storage adapter
export function createFileStorageAdapter(basePath: string = 'notes'): FileStorageAdapter {
  return new FileStorageAdapter({
    backend: 'file',
    file: {
      base_path: basePath,
      supported_formats: ['custom', 'markdown', 'html', 'json', 'txt'],
      auto_sync: true
    }
  });
}

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