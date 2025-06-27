import type { FileFormatHandler, FileFormat } from '../types';
import type { Note } from '../../../../types/database';

export class TextFormatHandler implements FileFormatHandler {
  format: FileFormat = 'txt';
  extension: string = '.txt';
  mimeType: string = 'text/plain';

  async serialize(note: Note): Promise<string> {
    const header = [
      `Title: ${note.title}`,
      `Created: ${note.created_at}`,
      `Updated: ${note.updated_at}`,
      '',
      '---',
      ''
    ].join('\n');

    const plainContent = note.content_plaintext || note.content.replace(/<[^>]*>/g, '');
    return header + plainContent;
  }

  async deserialize(content: string, filePath: string): Promise<Note> {
    const { metadata, textContent } = this.parseTextContent(content);

    return {
      id: this.generateIdFromPath(filePath),
      title: metadata.title || this.extractTitleFromPath(filePath),
      content: `<p>${textContent.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`,
      content_type: 'plain',
      content_raw: textContent,
      created_at: metadata.created_at || new Date().toISOString(),
      updated_at: metadata.updated_at || new Date().toISOString(),
      deleted_at: null,
      is_pinned: false,
      is_archived: false,
      word_count: textContent.split(/\s+/).filter(w => w.length > 0).length,
      character_count: textContent.length,
      content_plaintext: textContent
    };
  }

  async extractMetadata(_content: string): Promise<{
    title?: string;
    created_at?: string;
    updated_at?: string;
    tags?: string[];
  }> {
    const { metadata } = this.parseTextContent(_content);
    return metadata;
  }

  async validate(_content: string): Promise<{ isValid: boolean; errors: string[] }> {
    return { isValid: true, errors: [] }; // Plain text is always valid
  }

  private parseTextContent(content: string): {
    metadata: {
      title?: string;
      created_at?: string;
      updated_at?: string;
    };
    textContent: string;
  } {
    const lines = content.split('\n');
    const metadata: any = {};
    let contentStartIndex = 0;

    // Look for header pattern
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const line = lines[i];
      if (line && line.startsWith('Title: ')) {
        metadata.title = line.substring(7);
      } else if (line && line.startsWith('Created: ')) {
        metadata.created_at = line.substring(9);
      } else if (line && line.startsWith('Updated: ')) {
        metadata.updated_at = line.substring(9);
      } else if (line === '---') {
        contentStartIndex = i + 1;
        break;
      }
    }

    const textContent = lines.slice(contentStartIndex).join('\n').trim();
    return { metadata, textContent };
  }

  private extractTitleFromPath(filePath: string): string {
    const pathParts = filePath.split('/');
    const filename = pathParts[pathParts.length - 1];
    if (!filename) {
      return 'Untitled';
    }
    return filename.replace(/\.txt$/, '').replace(/[_-]/g, ' ');
  }

  private generateIdFromPath(filePath: string): string {
    const pathParts = filePath.split('/');
    const filename = pathParts[pathParts.length - 1];
    if (!filename) {
      return 'untitled';
    }
    return filename.replace(/\.txt$/, '');
  }
}