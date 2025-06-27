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

export interface AppConfig {
  editor: {
    lineWrapping: boolean;
  };
  debug: {
    enableExampleNote: boolean;
  };
}