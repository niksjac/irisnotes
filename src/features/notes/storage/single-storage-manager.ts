import type { StorageAdapter, SingleStorageManager, StorageConfig, StorageResult, VoidStorageResult } from './types';
import type { Note, NoteFilters, CreateNoteParams, UpdateNoteParams, Category, Tag, CreateCategoryParams, CreateTagParams } from '../../../types/database';
import { SQLiteStorageAdapter } from './adapters/sqlite-storage';

export class SingleStorageManagerImpl implements SingleStorageManager {
  private activeStorage: StorageAdapter | null = null;
  private activeConfig: StorageConfig | null = null;

  async setActiveStorage(config: StorageConfig): Promise<VoidStorageResult> {
    try {

      // Create the appropriate storage adapter based on config
      let adapter: StorageAdapter;

      switch (config.backend) {
        case 'sqlite':
          if (!config.sqlite?.database_path) {
            return { success: false, error: 'SQLite database path is required' };
          }
          adapter = new SQLiteStorageAdapter(config);
          break;

        case 'file-system':
          if (!config.fileSystem?.notes_directory) {
            return { success: false, error: 'File system notes directory is required' };
          }
          // TODO: Implement FileSystemStorageAdapter
          return { success: false, error: 'File system storage not yet implemented' };

        case 'cloud':
          if (!config.cloud?.provider) {
            return { success: false, error: 'Cloud provider is required' };
          }
          // TODO: Implement CloudStorageAdapter
          return { success: false, error: 'Cloud storage not yet implemented' };

        default:
          return { success: false, error: `Unsupported storage backend: ${config.backend}` };
      }

      // Initialize the new storage adapter
      const initResult = await adapter.init();

      if (!initResult.success) {
        console.error('❌ Storage adapter initialization failed:', initResult.error);
        return { success: false, error: `Failed to initialize ${config.backend} storage: ${initResult.error}` };
      }

      // Set as active storage
      this.activeStorage = adapter;
      this.activeConfig = config;

      return { success: true };
    } catch (error) {
      console.error('❌ Failed to set active storage:', error);
      return { success: false, error: `Failed to set active storage: ${error}` };
    }
  }

  getActiveStorage(): StorageAdapter | null {
    return this.activeStorage;
  }

  getActiveStorageConfig(): StorageConfig | null {
    return this.activeConfig;
  }

  // Helper method to ensure storage is active
  private ensureActiveStorage(): StorageResult<StorageAdapter> {
    if (!this.activeStorage) {
      return { success: false, error: 'No active storage. Please configure a storage backend first.' };
    }
    return { success: true, data: this.activeStorage };
  }

  // Notes operations - delegate to active storage
  async getNotes(filters?: NoteFilters): Promise<StorageResult<Note[]>> {
    const storageResult = this.ensureActiveStorage();
    if (!storageResult.success) {
      return { success: false, error: storageResult.error };
    }
    return await storageResult.data.getNotes(filters);
  }

  async getNote(id: string): Promise<StorageResult<Note | null>> {
    const storageResult = this.ensureActiveStorage();
    if (!storageResult.success) {
      return { success: false, error: storageResult.error };
    }
    return await storageResult.data.getNote(id);
  }

  async createNote(params: CreateNoteParams): Promise<StorageResult<Note>> {
    const storageResult = this.ensureActiveStorage();
    if (!storageResult.success) {
      return { success: false, error: storageResult.error };
    }
    return await storageResult.data.createNote(params);
  }

  async updateNote(params: UpdateNoteParams): Promise<StorageResult<Note>> {
    const storageResult = this.ensureActiveStorage();
    if (!storageResult.success) {
      return { success: false, error: storageResult.error };
    }
    return await storageResult.data.updateNote(params);
  }

  async deleteNote(id: string): Promise<VoidStorageResult> {
    const storageResult = this.ensureActiveStorage();
    if (!storageResult.success) {
      return { success: false, error: storageResult.error };
    }
    return await storageResult.data.deleteNote(id);
  }

  async searchNotes(query: string, filters?: NoteFilters): Promise<StorageResult<Note[]>> {
    const storageResult = this.ensureActiveStorage();
    if (!storageResult.success) {
      return { success: false, error: storageResult.error };
    }
    return await storageResult.data.searchNotes(query, filters);
  }

  // Categories operations
  async getCategories(): Promise<StorageResult<Category[]>> {
    const storageResult = this.ensureActiveStorage();
    if (!storageResult.success) {
      return { success: false, error: storageResult.error };
    }
    return await storageResult.data.getCategories();
  }

  async createCategory(params: CreateCategoryParams): Promise<StorageResult<Category>> {
    const storageResult = this.ensureActiveStorage();
    if (!storageResult.success) {
      return { success: false, error: storageResult.error };
    }
    return await storageResult.data.createCategory(params);
  }

  async updateCategory(id: string, params: Partial<CreateCategoryParams>): Promise<StorageResult<Category>> {
    const storageResult = this.ensureActiveStorage();
    if (!storageResult.success) {
      return { success: false, error: storageResult.error };
    }
    return await storageResult.data.updateCategory(id, params);
  }

  async deleteCategory(id: string): Promise<VoidStorageResult> {
    const storageResult = this.ensureActiveStorage();
    if (!storageResult.success) {
      return { success: false, error: storageResult.error };
    }
    return await storageResult.data.deleteCategory(id);
  }

  // Tags operations
  async getTags(): Promise<StorageResult<Tag[]>> {
    const storageResult = this.ensureActiveStorage();
    if (!storageResult.success) {
      return { success: false, error: storageResult.error };
    }
    return await storageResult.data.getTags();
  }

  async createTag(params: CreateTagParams): Promise<StorageResult<Tag>> {
    const storageResult = this.ensureActiveStorage();
    if (!storageResult.success) {
      return { success: false, error: storageResult.error };
    }
    return await storageResult.data.createTag(params);
  }

  async updateTag(id: string, params: Partial<CreateTagParams>): Promise<StorageResult<Tag>> {
    const storageResult = this.ensureActiveStorage();
    if (!storageResult.success) {
      return { success: false, error: storageResult.error };
    }
    return await storageResult.data.updateTag(id, params);
  }

  async deleteTag(id: string): Promise<VoidStorageResult> {
    const storageResult = this.ensureActiveStorage();
    if (!storageResult.success) {
      return { success: false, error: storageResult.error };
    }
    return await storageResult.data.deleteTag(id);
  }

  // Utility operations
  async sync(): Promise<VoidStorageResult> {
    const storageResult = this.ensureActiveStorage();
    if (!storageResult.success) {
      return { success: false, error: storageResult.error };
    }

    if (storageResult.data.sync) {
      return await storageResult.data.sync();
    }

    return { success: true }; // No-op if storage doesn't support sync
  }

  async getStorageInfo(): Promise<StorageResult<{
    backend: 'sqlite' | 'file-system' | 'cloud';
    note_count: number;
    category_count: number;
    tag_count: number;
    attachment_count: number;
    last_sync?: string;
    storage_size?: number;
  }>> {
    const storageResult = this.ensureActiveStorage();
    if (!storageResult.success) {
      return { success: false, error: storageResult.error };
    }
    return await storageResult.data.getStorageInfo();
  }
}