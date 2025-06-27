import type { FileFormatHandler, FileFormat } from '../types';
import type { Note } from '../../../../types/database';

export class JsonFormatHandler implements FileFormatHandler {
  format: FileFormat = 'json';
  extension: string = '.json';
  mimeType: string = 'application/json';

  async serialize(note: Note): Promise<string> {
    const jsonNote = {
      id: note.id,
      title: note.title,
      content: note.content,
      content_type: note.content_type,
      content_raw: note.content_raw,
      created_at: note.created_at,
      updated_at: note.updated_at,
      is_pinned: note.is_pinned,
      is_archived: note.is_archived,
      word_count: note.word_count,
      character_count: note.character_count,
      content_plaintext: note.content_plaintext
    };
    return JSON.stringify(jsonNote, null, 2);
  }

  async deserialize(content: string, filePath: string): Promise<Note> {
    try {
      const jsonNote = JSON.parse(content);
      return {
        id: jsonNote.id || this.generateIdFromPath(filePath),
        title: jsonNote.title || this.extractTitleFromPath(filePath),
        content: jsonNote.content || '',
        content_type: jsonNote.content_type || 'html',
        content_raw: jsonNote.content_raw || null,
        created_at: jsonNote.created_at || new Date().toISOString(),
        updated_at: jsonNote.updated_at || new Date().toISOString(),
        deleted_at: null,
        is_pinned: jsonNote.is_pinned || false,
        is_archived: jsonNote.is_archived || false,
        word_count: jsonNote.word_count || 0,
        character_count: jsonNote.character_count || 0,
        content_plaintext: jsonNote.content_plaintext || ''
      };
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error}`);
    }
  }

  async extractMetadata(content: string): Promise<{
    title?: string;
    created_at?: string;
    updated_at?: string;
    tags?: string[];
  }> {
    try {
      const jsonNote = JSON.parse(content);
      return {
        title: jsonNote.title,
        created_at: jsonNote.created_at,
        updated_at: jsonNote.updated_at,
        tags: jsonNote.tags
      };
    } catch {
      return {};
    }
  }

  async validate(content: string): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];
    try {
      JSON.parse(content);
    } catch (error) {
      errors.push(`Invalid JSON: ${error}`);
    }
    return { isValid: errors.length === 0, errors };
  }

  private extractTitleFromPath(filePath: string): string {
    const pathParts = filePath.split('/');
    const filename = pathParts[pathParts.length - 1] || 'untitled';
    return filename.replace(/\.json$/, '').replace(/[_-]/g, ' ');
  }

  private generateIdFromPath(filePath: string): string {
    const pathParts = filePath.split('/');
    const filename = pathParts[pathParts.length - 1] || 'untitled';
    return filename.replace(/\.json$/, '');
  }
}