import type { Note, CreateNoteParams, UpdateNoteParams, NoteFilters } from '../../../types/database';

// Storage backend types
export type StorageBackend = 'sqlite';

// Storage configuration
export interface StorageConfig {
  backend: StorageBackend;
  sqlite?: {
    database_path: string;
  };
}

// Storage operation results
export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Base storage interface
export interface StorageAdapter {
  // Configuration
  init(): Promise<StorageResult<void>>;
  getConfig(): StorageConfig;

  // Notes operations
  getNotes(filters?: NoteFilters): Promise<StorageResult<Note[]>>;
  getNote(id: string): Promise<StorageResult<Note | null>>;
  createNote(params: CreateNoteParams): Promise<StorageResult<Note>>;
  updateNote(params: UpdateNoteParams): Promise<StorageResult<Note>>;
  deleteNote(id: string): Promise<StorageResult<void>>;

  // Search
  searchNotes(query: string, filters?: NoteFilters): Promise<StorageResult<Note[]>>;

  // Synchronization
  sync?(): Promise<StorageResult<void>>;

  // Utility
  getStorageInfo(): Promise<StorageResult<{
    backend: StorageBackend;
    note_count: number;
    last_sync?: string;
    storage_size?: number;
  }>>;
}

// Multi-storage manager
export interface MultiStorageManager {
  // Storage management
  addStorage(name: string, adapter: StorageAdapter): Promise<StorageResult<void>>;
  removeStorage(name: string): Promise<StorageResult<void>>;
  getStorages(): string[];
  getStorage(name: string): StorageAdapter | null;
  setDefaultStorage(name: string): void;
  getDefaultStorage(): StorageAdapter | null;

  // Unified operations across all storages
  getAllNotes(filters?: NoteFilters): Promise<StorageResult<Note[]>>;
  searchAllNotes(query: string, filters?: NoteFilters): Promise<StorageResult<Note[]>>;

  // Cross-storage operations
  moveNote(noteId: string, fromStorage: string, toStorage: string): Promise<StorageResult<void>>;
  syncAllStorages(): Promise<StorageResult<void>>;
}