import type { Note, CreateNoteParams, UpdateNoteParams, NoteFilters } from '../../../types/database';

// Storage backend types
export type StorageBackend = 'sqlite' | 'file';

// File format types supported for file-based storage
export type FileFormat = 'custom' | 'markdown' | 'html' | 'json' | 'txt';

// Notebook (folder) information for file-based storage
export interface Notebook {
  id: string;
  name: string;
  path: string;
  isRoot: boolean;
  created_at: string;
  updated_at: string;
}

// File-based note metadata
export interface FileNote extends Note {
  file_path: string;
  file_format: FileFormat;
  notebook_id?: string;
}

// Storage configuration
export interface StorageConfig {
  backend: StorageBackend;
  sqlite?: {
    database_path: string;
  };
  file?: {
    base_path: string; // appconfig/notes/
    supported_formats: FileFormat[];
    auto_sync: boolean;
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

  // Notebooks (file-based only)
  getNotebooks?(): Promise<StorageResult<Notebook[]>>;
  getNotebook?(id: string): Promise<StorageResult<Notebook | null>>;
  createNotebook?(name: string, path?: string): Promise<StorageResult<Notebook>>;

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

// File format handlers
export interface FileFormatHandler {
  format: FileFormat;
  extension: string;
  mimeType: string;

  // Convert from custom format to file format
  serialize(note: Note): Promise<string>;

  // Convert from file format to Note object
  deserialize(content: string, filePath: string): Promise<Note>;

  // Extract metadata from file content
  extractMetadata(content: string): Promise<{
    title?: string;
    created_at?: string;
    updated_at?: string;
    tags?: string[];
  }>;

  // Check if content is valid for this format
  validate(content: string): Promise<{ isValid: boolean; errors: string[] }>;
}