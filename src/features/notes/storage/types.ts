import type { Note, CreateNoteParams, UpdateNoteParams, NoteFilters, Category, Tag, NoteRelationship, Attachment, NoteVersion, Setting, CreateCategoryParams, CreateTagParams } from '../../../types/database';

// Storage backend types
export type StorageBackend = 'sqlite' | 'file-system' | 'cloud';

// Storage configuration
export interface StorageConfig {
  backend: StorageBackend;
  sqlite?: {
    database_path: string;
  };
  fileSystem?: {
    notes_directory: string;
  };
  cloud?: {
    provider: 'google-drive' | 'dropbox' | 'onedrive';
    credentials?: any;
  };
}

// Storage operation results - discriminated union for type safety
export type StorageResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// Specific type for void operations
export type VoidStorageResult =
  | { success: true }
  | { success: false; error: string };

// Base storage interface
export interface StorageAdapter {
  // Configuration
  init(): Promise<VoidStorageResult>;
  getConfig(): StorageConfig;

  // Notes operations
  getNotes(filters?: NoteFilters): Promise<StorageResult<Note[]>>;
  getNote(id: string): Promise<StorageResult<Note | null>>;
  createNote(params: CreateNoteParams): Promise<StorageResult<Note>>;
  updateNote(params: UpdateNoteParams): Promise<StorageResult<Note>>;
  deleteNote(id: string): Promise<VoidStorageResult>;

  // Categories operations
  getCategories(): Promise<StorageResult<Category[]>>;
  getCategory(id: string): Promise<StorageResult<Category | null>>;
  createCategory(params: CreateCategoryParams): Promise<StorageResult<Category>>;
  updateCategory(id: string, params: Partial<CreateCategoryParams>): Promise<StorageResult<Category>>;
  deleteCategory(id: string): Promise<VoidStorageResult>;
  getCategoryNotes(categoryId: string): Promise<StorageResult<Note[]>>;
  addNoteToCategory(noteId: string, categoryId: string): Promise<VoidStorageResult>;
  removeNoteFromCategory(noteId: string, categoryId: string): Promise<VoidStorageResult>;

  // Tags operations
  getTags(): Promise<StorageResult<Tag[]>>;
  getTag(id: string): Promise<StorageResult<Tag | null>>;
  createTag(params: CreateTagParams): Promise<StorageResult<Tag>>;
  updateTag(id: string, params: Partial<CreateTagParams>): Promise<StorageResult<Tag>>;
  deleteTag(id: string): Promise<VoidStorageResult>;
  getTagNotes(tagId: string): Promise<StorageResult<Note[]>>;
  addNoteTag(noteId: string, tagId: string): Promise<VoidStorageResult>;
  removeNoteTag(noteId: string, tagId: string): Promise<VoidStorageResult>;

  // Note relationships
  getNoteRelationships(noteId: string): Promise<StorageResult<NoteRelationship[]>>;
  createNoteRelationship(sourceId: string, targetId: string, type: 'reference' | 'child' | 'related', description?: string): Promise<StorageResult<NoteRelationship>>;
  deleteNoteRelationship(id: string): Promise<VoidStorageResult>;

  // Attachments
  getNoteAttachments(noteId: string): Promise<StorageResult<Attachment[]>>;
  createAttachment(noteId: string, filename: string, originalFilename: string, filePath: string, mimeType: string, fileSize: number): Promise<StorageResult<Attachment>>;
  deleteAttachment(id: string): Promise<VoidStorageResult>;

  // Note versions
  getNoteVersions(noteId: string): Promise<StorageResult<NoteVersion[]>>;
  createNoteVersion(noteId: string, title: string, content: string): Promise<StorageResult<NoteVersion>>;
  deleteNoteVersion(id: string): Promise<VoidStorageResult>;

  // Settings
  getSetting(key: string): Promise<StorageResult<Setting | null>>;
  setSetting(key: string, value: string): Promise<VoidStorageResult>;
  getAllSettings(): Promise<StorageResult<Setting[]>>;
  deleteSetting(key: string): Promise<VoidStorageResult>;

  // Search
  searchNotes(query: string, filters?: NoteFilters): Promise<StorageResult<Note[]>>;

  // Synchronization
  sync?(): Promise<VoidStorageResult>;

  // Utility
  getStorageInfo(): Promise<StorageResult<{
    backend: StorageBackend;
    note_count: number;
    category_count: number;
    tag_count: number;
    attachment_count: number;
    last_sync?: string;
    storage_size?: number;
  }>>;
}

// Single storage manager - manages one active storage at a time
export interface SingleStorageManager {
  // Storage management
  setActiveStorage(config: StorageConfig): Promise<VoidStorageResult>;
  getActiveStorage(): StorageAdapter | null;
  getActiveStorageConfig(): StorageConfig | null;

  // Delegate all operations to active storage
  getNotes(filters?: NoteFilters): Promise<StorageResult<Note[]>>;
  getNote(id: string): Promise<StorageResult<Note | null>>;
  createNote(params: CreateNoteParams): Promise<StorageResult<Note>>;
  updateNote(params: UpdateNoteParams): Promise<StorageResult<Note>>;
  deleteNote(id: string): Promise<VoidStorageResult>;
  searchNotes(query: string, filters?: NoteFilters): Promise<StorageResult<Note[]>>;

  // Category operations
  getCategories(): Promise<StorageResult<Category[]>>;
  createCategory(params: CreateCategoryParams): Promise<StorageResult<Category>>;
  updateCategory(id: string, params: Partial<CreateCategoryParams>): Promise<StorageResult<Category>>;
  deleteCategory(id: string): Promise<VoidStorageResult>;

  // Tag operations
  getTags(): Promise<StorageResult<Tag[]>>;
  createTag(params: CreateTagParams): Promise<StorageResult<Tag>>;
  updateTag(id: string, params: Partial<CreateTagParams>): Promise<StorageResult<Tag>>;
  deleteTag(id: string): Promise<VoidStorageResult>;

  // Utility
  sync(): Promise<VoidStorageResult>;
  getStorageInfo(): Promise<StorageResult<{
    backend: StorageBackend;
    note_count: number;
    category_count: number;
    tag_count: number;
    attachment_count: number;
    last_sync?: string;
    storage_size?: number;
  }>>;
}

// Multi-storage manager (legacy - for future use)
export interface MultiStorageManager {
  // Storage management
  addStorage(name: string, adapter: StorageAdapter): Promise<VoidStorageResult>;
  removeStorage(name: string): Promise<VoidStorageResult>;
  getStorages(): string[];
  getStorage(name: string): StorageAdapter | null;
  setDefaultStorage(name: string): void;
  getDefaultStorage(): StorageAdapter | null;

  // Unified operations across all storages
  getAllNotes(filters?: NoteFilters): Promise<StorageResult<Note[]>>;
  searchAllNotes(query: string, filters?: NoteFilters): Promise<StorageResult<Note[]>>;

  // Cross-storage operations
  moveNote(noteId: string, fromStorage: string, toStorage: string): Promise<VoidStorageResult>;
  syncAllStorages(): Promise<VoidStorageResult>;
}