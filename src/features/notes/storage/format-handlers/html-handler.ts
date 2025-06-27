import type { FileFormatHandler, FileFormat } from '../types';
import type { Note } from '../../../../types/database';

export class HtmlFormatHandler implements FileFormatHandler {
  format: FileFormat = 'html';
  extension: string = '.html';
  mimeType: string = 'text/html';

  async serialize(note: Note): Promise<string> {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${note.title}</title>
  <meta name="created" content="${note.created_at}">
  <meta name="updated" content="${note.updated_at}">
</head>
<body>
  ${note.content}
</body>
</html>`;
    return html;
  }

  async deserialize(content: string, filePath: string): Promise<Note> {
    const extractedTitle = this.extractTitle(content);
    const title = extractedTitle || this.extractTitleFromPath(filePath);
    const bodyContent = this.extractBodyContent(content);
    const plainText = bodyContent.replace(/<[^>]*>/g, '');

    return {
      id: this.generateIdFromPath(filePath),
      title,
      content: bodyContent,
      content_type: 'html',
      content_raw: content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_pinned: false,
      is_archived: false,
      word_count: plainText.split(/\s+/).filter(w => w.length > 0).length,
      character_count: plainText.length,
      content_plaintext: plainText
    };
  }

  async extractMetadata(content: string): Promise<{
    title?: string;
    created_at?: string;
    updated_at?: string;
    tags?: string[];
  }> {
    const title = this.extractTitle(content);
    const createdAt = this.extractMetaContent(content, 'created');
    const updatedAt = this.extractMetaContent(content, 'updated');

    const result: {
      title?: string;
      created_at?: string;
      updated_at?: string;
      tags?: string[];
    } = {};

    if (title) result.title = title;
    if (createdAt) result.created_at = createdAt;
    if (updatedAt) result.updated_at = updatedAt;

    return result;
  }

  async validate(content: string): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];
    if (!content.includes('<html') && !content.includes('<body')) {
      errors.push('Invalid HTML structure');
    }
    return { isValid: errors.length === 0, errors };
  }

  private extractTitle(content: string): string | null {
    const match = content.match(/<title>(.*?)<\/title>/i);
    return match?.[1] ?? null;
  }

  private extractBodyContent(content: string): string {
    const match = content.match(/<body[^>]*>(.*?)<\/body>/is);
    return match?.[1]?.trim() ?? content;
  }

  private extractMetaContent(content: string, name: string): string | null {
    const match = content.match(new RegExp(`<meta name="${name}" content="([^"]*)"`, 'i'));
    return match?.[1] ?? null;
  }

  private extractTitleFromPath(filePath: string): string {
    const pathParts = filePath.split('/');
    const filename = pathParts[pathParts.length - 1];

    if (!filename) {
      return 'Untitled';
    }

    return filename.replace(/\.html$/, '').replace(/[_-]/g, ' ');
  }

  private generateIdFromPath(filePath: string): string {
    const pathParts = filePath.split('/');
    const filename = pathParts[pathParts.length - 1];

    if (!filename) {
      return 'untitled';
    }

    return filename.replace(/\.html$/, '');
  }
}