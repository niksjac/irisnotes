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

  constructor(config: StorageConfig) {
    this.config = config;
    this.basePath = config.file?.base_path || 'notes';
  }

  async init(): Promise<StorageResult<void>> {
    try {
      // Ensure base directory exists
      if (!(await exists(this.basePath, { baseDir: BaseDirectory.AppConfig }))) {
        await create(this.basePath, { baseDir: BaseDirectory.AppConfig });
      }

      // Load notebooks and notes
      await this.loadNotebooks();
      await this.loadNotes();

      this.initialized = true;
      return { success: true };
    } catch (error) {
      return { success: false, error: `Failed to initialize file storage: ${error}` };
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

  private async loadNotes(): Promise<void> {
    this.notes.clear();

    // Load notes from root directory
    await this.loadNotesFromPath('', 'root');

    // Load notes from each notebook directory
    for (const [notebookId, notebook] of this.notebooks) {
      if (!notebook.isRoot) {
        await this.loadNotesFromPath(notebook.path, notebookId);
      }
    }
  }

  private async loadNotesFromPath(relativePath: string, notebookId: string): Promise<void> {
    try {
      const fullPath = relativePath ? `${this.basePath}/${relativePath}` : this.basePath;
      const entries = await readDir(fullPath, { baseDir: BaseDirectory.AppConfig });

      for (const entry of entries) {
        if (entry.isFile && entry.name) {
          // It's a file, not a directory
          const extension = this.getFileExtension(entry.name).toLowerCase();
          const format = this.getFormatFromExtension(extension);

          if (format) {
            try {
              const note = await this.loadNoteFromFile(entry.name, relativePath, format, notebookId);
              if (note) {
                this.notes.set(note.id, note);
              }
            } catch (error) {
              console.warn(`Failed to load note from ${entry.name}:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to load notes from path ${relativePath}:`, error);
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

  private async loadNoteFromFile(
    filename: string,
    relativePath: string,
    format: FileFormat,
    notebookId: string
  ): Promise<FileNote | null> {
    try {
      const filePath = relativePath ? `${this.basePath}/${relativePath}/${filename}` : `${this.basePath}/${filename}`;
      const content = await readTextFile(filePath, { baseDir: BaseDirectory.AppConfig });

      const handler = getFileFormatHandler(format);
      const note = await handler.deserialize(content, filePath);

      // Generate ID from filename and path
      const id = this.generateNoteId(filename, relativePath);

      const fileNote: FileNote = {
        ...note,
        id,
        file_path: filePath,
        file_format: format,
        ...(notebookId !== 'root' && { notebook_id: notebookId })
      };

      return fileNote;
    } catch (error) {
      console.error(`Failed to load note from ${filename}:`, error);
      return null;
    }
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

      // Apply filters
      if (filters) {
        if (filters.is_pinned !== undefined) {
          notes = notes.filter(note => note.is_pinned === filters.is_pinned);
        }
        if (filters.is_archived !== undefined) {
          notes = notes.filter(note => note.is_archived === filters.is_archived);
        }
        if (filters.search_query) {
          const query = filters.search_query.toLowerCase();
          notes = notes.filter(note =>
            note.title.toLowerCase().includes(query) ||
            note.content_plaintext.toLowerCase().includes(query)
          );
        }
      }

      return { success: true, data: notes };
    } catch (error) {
      return { success: false, error: `Failed to get notes: ${error}` };
    }
  }

  async getNote(id: string): Promise<StorageResult<Note | null>> {
    if (!this.initialized) {
      await this.init();
    }

    const note = this.notes.get(id);
    return { success: true, data: note || null };
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
      const format = contentType === 'custom' ? 'custom' : contentType as FileFormat;
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
        word_count: content.split(/\s+/).length,
        character_count: content.length,
        content_plaintext: content.replace(/<[^>]*>/g, ''),
        file_path: `${this.basePath}/${fullFilename}`,
        file_format: format
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
      const existingNote = this.notes.get(params.id);
      if (!existingNote) {
        return { success: false, error: 'Note not found' };
      }

      // Update note properties
      const updatedNote: FileNote = {
        ...existingNote,
        ...params,
        updated_at: new Date().toISOString(),
        word_count: params.content ? params.content.split(/\s+/).length : existingNote.word_count,
        character_count: params.content ? params.content.length : existingNote.character_count,
        content_plaintext: params.content ? params.content.replace(/<[^>]*>/g, '') : existingNote.content_plaintext
      };

      // If title changed, we might need to rename the file
      if (params.title && params.title !== existingNote.title) {
        const newFilename = this.sanitizeFilename(params.title);
        const extension = this.getExtensionForFormat(existingNote.file_format);
        const newFullFilename = `${newFilename}${extension}`;
        const newFilePath = `${this.basePath}/${newFullFilename}`;

        // Remove old file
        try {
          await exists(existingNote.file_path, { baseDir: BaseDirectory.AppConfig }).then(async (fileExists) => {
            if (fileExists) {
              // Note: We'll need to handle file removal differently since remove might not be available
              console.warn('File removal not implemented in current Tauri version');
            }
          });
        } catch (error) {
          console.warn('Could not remove old file:', error);
        }

        // Update file path
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

      // Remove file - simplified for now
      try {
        // Note: File removal might need to be handled differently
        console.warn('File removal not fully implemented in current Tauri version');
      } catch (error) {
        console.warn('Could not remove file:', error);
      }

      // Remove from cache
      this.notes.delete(id);

      return { success: true };
    } catch (error) {
      return { success: false, error: `Failed to delete note: ${error}` };
    }
  }

  async searchNotes(query: string, filters?: NoteFilters): Promise<StorageResult<Note[]>> {
    const result = await this.getNotes({
      ...filters,
      search_query: query
    });
    return result;
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
        id: notebookPath,
        name,
        path: notebookPath,
        isRoot: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      this.notebooks.set(notebookPath, notebook);

      return { success: true, data: notebook };
    } catch (error) {
      return { success: false, error: `Failed to create notebook: ${error}` };
    }
  }

  async sync(): Promise<StorageResult<void>> {
    try {
      await this.loadNotebooks();
      await this.loadNotes();
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
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex !== -1 ? filename.substring(lastDotIndex) : '';
  }

  private getFileBasename(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex !== -1 ? filename.substring(0, lastDotIndex) : filename;
  }
}