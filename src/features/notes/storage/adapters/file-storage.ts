import { readTextFile, writeTextFile, exists, create, readDir } from '@tauri-apps/plugin-fs';
import { BaseDirectory } from '@tauri-apps/api/path';
import type { StorageAdapter, StorageConfig, StorageResult, FileNote, Notebook, FileFormat } from '../types';
import type { Note, CreateNoteParams, UpdateNoteParams, NoteFilters } from '../../../../types/database';
import { getFileFormatHandler } from '../format-handlers';

export class FileStorageAdapter implements StorageAdapter {
  private config: StorageConfig;
  private basePath: string;
  private notebooks: Map<string, Notebook> = new Map();
  private notes: Map<string, FileNote> = new Map();
  private initialized = false;
  private loadingPromise: Promise<void> | null = null;
  private metadataCache: Map<string, { mtime: number; size: number }> = new Map();
  private loadedPaths: Set<string> = new Set();

  constructor(config: StorageConfig) {
    this.config = config;
    this.basePath = config.file?.base_path || 'notes';
  }

  async init(): Promise<StorageResult<void>> {
    if (this.initialized) return { success: true };

    // Prevent multiple initializations
    if (this.loadingPromise) {
      await this.loadingPromise;
      return { success: true };
    }

    this.loadingPromise = this.performInit();
    await this.loadingPromise;
    this.loadingPromise = null;

    return { success: true };
  }

  private async performInit(): Promise<void> {
    try {
      // Ensure base directory exists
      if (!(await exists(this.basePath, { baseDir: BaseDirectory.AppConfig }))) {
        await create(this.basePath, { baseDir: BaseDirectory.AppConfig });
      }

      // Load notebooks first (lightweight)
      await this.loadNotebooks();

      // Load notes lazily - only metadata initially
      await this.loadNoteMetadata();

      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize file storage: ${error}`);
    }
  }

  getConfig(): StorageConfig {
    return this.config;
  }

  private async loadNotebooks(): Promise<void> {
    this.notebooks.clear();

    // Add root notebook
    const rootNotebook: Notebook = {
      id: 'root',
      name: 'Root',
      path: '',
      isRoot: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.notebooks.set('root', rootNotebook);

    // Load subdirectories as notebooks
    try {
      const entries = await readDir(this.basePath, { baseDir: BaseDirectory.AppConfig });

      for (const entry of entries) {
        if (entry.isDirectory && entry.name) {
          const notebook: Notebook = {
            id: entry.name,
            name: entry.name,
            path: entry.name,
            isRoot: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          this.notebooks.set(entry.name, notebook);
        }
      }
    } catch (error) {
      console.warn('Failed to load notebooks:', error);
    }
  }

  // Load only metadata initially for better performance
  private async loadNoteMetadata(): Promise<void> {
    this.notes.clear();

    // Load metadata from root directory
    await this.loadNoteMetadataFromPath('', 'root');

    // Load metadata from each notebook directory
    for (const [notebookId, notebook] of this.notebooks) {
      if (!notebook.isRoot) {
        await this.loadNoteMetadataFromPath(notebook.path, notebookId);
      }
    }
  }

  private async loadNoteMetadataFromPath(relativePath: string, notebookId: string): Promise<void> {
    try {
      const fullPath = relativePath ? `${this.basePath}/${relativePath}` : this.basePath;
      const entries = await readDir(fullPath, { baseDir: BaseDirectory.AppConfig });

      // Process files in batches to avoid blocking
      const batchSize = 10;
      for (let i = 0; i < entries.length; i += batchSize) {
        const batch = entries.slice(i, i + batchSize);

        await Promise.all(batch.map(async (entry) => {
          if (entry.isFile && entry.name) {
            const extension = this.getFileExtension(entry.name).toLowerCase();
            const format = this.getFormatFromExtension(extension);

            if (format) {
              try {
                // Create lightweight note with metadata only
                const id = this.generateNoteId(entry.name, relativePath);
                const filePath = relativePath ? `${this.basePath}/${relativePath}/${entry.name}` : `${this.basePath}/${entry.name}`;

                const fileNote: FileNote = {
                  id,
                  title: this.getFileBasename(entry.name),
                  content: '', // Will be loaded lazily
                  content_type: this.mapFormatToContentType(format),
                  content_raw: null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  deleted_at: null,
                  is_pinned: false,
                  is_archived: false,
                  word_count: 0,
                  character_count: 0,
                  content_plaintext: '',
                  file_path: filePath,
                  file_format: format,
                  loaded: false, // Mark as not loaded
                  ...(notebookId !== 'root' && { notebook_id: notebookId })
                };

                this.notes.set(id, fileNote);
              } catch (error) {
                console.warn(`Failed to load metadata for ${entry.name}:`, error);
              }
            }
          }
        }));

        // Yield control between batches
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    } catch (error) {
      console.warn(`Failed to load note metadata from path ${relativePath}:`, error);
    }
  }

  // Lazy load full note content when needed
  private async loadFullNote(noteId: string): Promise<FileNote | null> {
    const note = this.notes.get(noteId);
    if (!note || note.loaded) return note || null;

    try {
      const content = await readTextFile(note.file_path, { baseDir: BaseDirectory.AppConfig });
      const handler = getFileFormatHandler(note.file_format);
      const fullNote = await handler.deserialize(content, note.file_path);

      const updatedNote: FileNote = {
        ...note,
        ...fullNote,
        loaded: true
      };

      this.notes.set(noteId, updatedNote);
      return updatedNote;
    } catch (error) {
      console.error(`Failed to load full note ${noteId}:`, error);
      return null;
    }
  }

  private getFormatFromExtension(extension: string): FileFormat | null {
    const formatMap: Record<string, FileFormat> = {
      '.txt': 'custom',
      '.md': 'markdown',
      '.html': 'html',
      '.json': 'json'
    };
    return formatMap[extension] || null;
  }

  private generateNoteId(filename: string, relativePath: string): string {
    const baseName = this.getFileBasename(filename);
    return relativePath ? `${relativePath}/${baseName}` : baseName;
  }

  async getNotes(filters?: NoteFilters): Promise<StorageResult<Note[]>> {
    if (!this.initialized) {
      await this.init();
    }

    try {
      let notes = Array.from(this.notes.values()) as Note[];

      // Apply filters on metadata only (fast)
      if (filters) {
        if (filters.is_pinned !== undefined) {
          notes = notes.filter(note => note.is_pinned === filters.is_pinned);
        }
        if (filters.is_archived !== undefined) {
          notes = notes.filter(note => note.is_archived === filters.is_archived);
        }
        if (filters.search_query) {
          const query = filters.search_query.toLowerCase();
          // Search in titles first (fast), then load content for full-text search
          notes = notes.filter(note => note.title.toLowerCase().includes(query));

          // If no title matches, search in content (slower)
          if (notes.length === 0) {
            const contentMatches = [];
            for (const note of Array.from(this.notes.values())) {
              if (!note.loaded) {
                const fullNote = await this.loadFullNote(note.id);
                if (fullNote && fullNote.content_plaintext.toLowerCase().includes(query)) {
                  contentMatches.push(fullNote);
                }
              } else if (note.content_plaintext.toLowerCase().includes(query)) {
                contentMatches.push(note);
              }
            }
            notes = contentMatches;
          }
        }
      }

      // Sort by updated_at for better UX
      notes.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

      return { success: true, data: notes };
    } catch (error) {
      return { success: false, error: `Failed to get notes: ${error}` };
    }
  }

  async getNote(id: string): Promise<StorageResult<Note | null>> {
    if (!this.initialized) {
      await this.init();
    }

    try {
      const note = await this.loadFullNote(id);
      return { success: true, data: note };
    } catch (error) {
      return { success: false, error: `Failed to get note: ${error}` };
    }
  }

  async createNote(params: CreateNoteParams): Promise<StorageResult<Note>> {
    if (!this.initialized) {
      await this.init();
    }

    try {
      const now = new Date().toISOString();
      const title = params.title || 'Untitled Note';
      const content = params.content || '';
      const contentType = params.content_type || 'custom';

      // Generate filename and ID
      const filename = this.sanitizeFilename(title);
      const format = this.mapContentTypeToFormat(contentType);
      const extension = this.getExtensionForFormat(format);
      const fullFilename = `${filename}${extension}`;
      const id = this.generateNoteId(fullFilename, '');

      // Create note object
      const note: FileNote = {
        id,
        title,
        content,
        content_type: contentType,
        content_raw: params.content_raw || null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
        is_pinned: false,
        is_archived: false,
        word_count: content.split(/\s+/).filter(word => word.length > 0).length,
        character_count: content.length,
        content_plaintext: content.replace(/<[^>]*>/g, ''),
        file_path: `${this.basePath}/${fullFilename}`,
        file_format: format,
        loaded: true
      };

      // Save to file
      const handler = getFileFormatHandler(format);
      const fileContent = await handler.serialize(note);

      await writeTextFile(
        `${this.basePath}/${fullFilename}`,
        fileContent,
        { baseDir: BaseDirectory.AppConfig }
      );

      // Add to cache
      this.notes.set(id, note);

      return { success: true, data: note };
    } catch (error) {
      return { success: false, error: `Failed to create note: ${error}` };
    }
  }

  async updateNote(params: UpdateNoteParams): Promise<StorageResult<Note>> {
    if (!this.initialized) {
      await this.init();
    }

    try {
      const existingNote = await this.loadFullNote(params.id);
      if (!existingNote) {
        return { success: false, error: 'Note not found' };
      }

      // Update note properties
      const content = params.content || existingNote.content;
      const updatedNote: FileNote = {
        ...existingNote,
        ...params,
        updated_at: new Date().toISOString(),
        word_count: content.split(/\s+/).filter(word => word.length > 0).length,
        character_count: content.length,
        content_plaintext: content.replace(/<[^>]*>/g, ''),
        loaded: true
      };

      // Handle file renaming if title changed
      if (params.title && params.title !== existingNote.title) {
        const newFilename = this.sanitizeFilename(params.title);
        const extension = this.getExtensionForFormat(existingNote.file_format);
        const newFullFilename = `${newFilename}${extension}`;
        const newFilePath = `${this.basePath}/${newFullFilename}`;

        // Update file path and ID
        updatedNote.file_path = newFilePath;
        updatedNote.id = this.generateNoteId(newFullFilename, '');
      }

      // Save to file
      const handler = getFileFormatHandler(existingNote.file_format);
      const fileContent = await handler.serialize(updatedNote);

      await writeTextFile(
        updatedNote.file_path,
        fileContent,
        { baseDir: BaseDirectory.AppConfig }
      );

      // Update cache
      if (updatedNote.id !== params.id) {
        this.notes.delete(params.id);
      }
      this.notes.set(updatedNote.id, updatedNote);

      return { success: true, data: updatedNote };
    } catch (error) {
      return { success: false, error: `Failed to update note: ${error}` };
    }
  }

  async deleteNote(id: string): Promise<StorageResult<void>> {
    if (!this.initialized) {
      await this.init();
    }

    try {
      const note = this.notes.get(id);
      if (!note) {
        return { success: false, error: 'Note not found' };
      }

      // Remove from cache immediately
      this.notes.delete(id);

      // TODO: Implement actual file removal when Tauri supports it
      console.warn('File removal not fully implemented in current Tauri version');

      return { success: true };
    } catch (error) {
      return { success: false, error: `Failed to delete note: ${error}` };
    }
  }

  async searchNotes(query: string, filters?: NoteFilters): Promise<StorageResult<Note[]>> {
    if (!this.initialized) {
      await this.init();
    }

    try {
      const results: Note[] = [];
      const searchQuery = query.toLowerCase();

      // Search in loaded notes first
      for (const note of this.notes.values()) {
        if (note.loaded) {
          if (note.title.toLowerCase().includes(searchQuery) ||
              note.content_plaintext.toLowerCase().includes(searchQuery)) {
            results.push(note);
          }
        }
      }

      // If we need more results, search in unloaded notes
      if (results.length < 10) {
        const unloadedNotes = Array.from(this.notes.values()).filter(note => !note.loaded);

        // Search in batches to avoid blocking
        const batchSize = 5;
        for (let i = 0; i < unloadedNotes.length && results.length < 10; i += batchSize) {
          const batch = unloadedNotes.slice(i, i + batchSize);

          await Promise.all(batch.map(async (note) => {
            if (results.length >= 10) return;

            const fullNote = await this.loadFullNote(note.id);
            if (fullNote &&
                (fullNote.title.toLowerCase().includes(searchQuery) ||
                 fullNote.content_plaintext.toLowerCase().includes(searchQuery))) {
              results.push(fullNote);
            }
          }));
        }
      }

      // Apply additional filters
      let filteredResults = results;
      if (filters) {
        if (filters.is_pinned !== undefined) {
          filteredResults = filteredResults.filter(note => note.is_pinned === filters.is_pinned);
        }
        if (filters.is_archived !== undefined) {
          filteredResults = filteredResults.filter(note => note.is_archived === filters.is_archived);
        }
      }

      return { success: true, data: filteredResults };
    } catch (error) {
      return { success: false, error: `Failed to search notes: ${error}` };
    }
  }

  async getNotebooks(): Promise<StorageResult<Notebook[]>> {
    if (!this.initialized) {
      await this.init();
    }

    return { success: true, data: Array.from(this.notebooks.values()) };
  }

  async getNotebook(id: string): Promise<StorageResult<Notebook | null>> {
    if (!this.initialized) {
      await this.init();
    }

    const notebook = this.notebooks.get(id);
    return { success: true, data: notebook || null };
  }

  async createNotebook(name: string, path?: string): Promise<StorageResult<Notebook>> {
    if (!this.initialized) {
      await this.init();
    }

    try {
      const notebookPath = path || name;
      const fullPath = `${this.basePath}/${notebookPath}`;

      // Create directory
      await create(fullPath, { baseDir: BaseDirectory.AppConfig });

      const notebook: Notebook = {
        id: name,
        name,
        path: notebookPath,
        isRoot: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      this.notebooks.set(name, notebook);
      return { success: true, data: notebook };
    } catch (error) {
      return { success: false, error: `Failed to create notebook: ${error}` };
    }
  }

  async sync(): Promise<StorageResult<void>> {
    try {
      // Clear caches and reload
      this.notes.clear();
      this.notebooks.clear();
      this.metadataCache.clear();
      this.loadedPaths.clear();
      this.initialized = false;

      await this.init();
      return { success: true };
    } catch (error) {
      return { success: false, error: `Failed to sync: ${error}` };
    }
  }

  async getStorageInfo(): Promise<StorageResult<{
    backend: 'file';
    note_count: number;
    last_sync?: string;
    storage_size?: number;
  }>> {
    if (!this.initialized) {
      await this.init();
    }

    return {
      success: true,
      data: {
        backend: 'file',
        note_count: this.notes.size,
        last_sync: new Date().toISOString()
      }
    };
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 100);
  }

  private mapFormatToContentType(format: FileFormat): 'html' | 'markdown' | 'plain' | 'custom' {
    const formatMap: Record<FileFormat, 'html' | 'markdown' | 'plain' | 'custom'> = {
      'custom': 'custom',
      'markdown': 'markdown',
      'html': 'html',
      'json': 'plain',
      'txt': 'plain'
    };
    return formatMap[format] || 'plain';
  }

  private mapContentTypeToFormat(contentType: 'html' | 'markdown' | 'plain' | 'custom'): FileFormat {
    const contentTypeMap: Record<'html' | 'markdown' | 'plain' | 'custom', FileFormat> = {
      'custom': 'custom',
      'markdown': 'markdown',
      'html': 'html',
      'plain': 'txt'
    };
    return contentTypeMap[contentType] || 'custom';
  }

  private getExtensionForFormat(format: FileFormat): string {
    const extensionMap: Record<FileFormat, string> = {
      'custom': '.txt',
      'markdown': '.md',
      'html': '.html',
      'json': '.json',
      'txt': '.txt'
    };
    return extensionMap[format] || '.txt';
  }

  private getFileExtension(filename: string): string {
    return filename.substring(filename.lastIndexOf('.'));
  }

  private getFileBasename(filename: string): string {
    return filename.substring(0, filename.lastIndexOf('.'));
  }
}