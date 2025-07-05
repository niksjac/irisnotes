// Re-export database types for backward compatibility
export type {
  Note,
  Category,
  Tag,
  NoteWithRelations,
  CategoryWithNotes,
  TagWithNotes,
  SearchResult,
  NoteFilters,
  NoteSortOptions,
  CreateNoteParams,
  UpdateNoteParams,
  CreateCategoryParams,
  CreateTagParams,
  AppSettings,
  DatabaseInfo,
  BackupData
} from './database';

// Storage configuration types
export interface StorageSettings {
  backend: 'sqlite' | 'file-system' | 'cloud'; // Available storage backends
  sqlite?: {
    database_path: string;
  };
  fileSystem?: {
    notes_directory: string;
  };
  cloud?: {
    provider: 'google-drive' | 'dropbox' | 'onedrive';
    credentials?: any; // Provider-specific credentials
  };
}

export interface AppConfig {
  editor: {
    lineWrapping: boolean;
  };
  debug: {
    enableExampleNote: boolean;
  };
  storage: StorageSettings;
  development: {
    useLocalConfig: boolean;
    configPath: string;
  };
  production: {
    customConfigPath?: string;
    customDatabasePath?: string;
    customNotesPath?: string;
  };
}