import type { FileFormatHandler, FileFormat } from '../types';
import type { Note } from '../../../../types/database';
import { parseTextWithColors, extractPlainText, parseCustomFormatMetadata, validateCustomFormat } from '../../../../utils/text-parser';
import { CustomFormatHandler as UtilCustomFormatHandler } from '../../../../utils/custom-format-handler';

export class CustomFormatHandler implements FileFormatHandler {
  format: FileFormat = 'custom';
  extension: string = '.txt';
  mimeType: string = 'text/plain';

  async serialize(note: Note): Promise<string> {
    // If note already has raw custom format, use that
    if (note.content_type === 'custom' && note.content_raw) {
      return this.addFileMetadata(note, note.content_raw);
    }

    // Try to convert HTML content back to custom format
    if (note.content) {
      const customText = UtilCustomFormatHandler.convertHtmlToCustomFormat(note);
      return this.addFileMetadata(note, customText);
    }

    return this.addFileMetadata(note, '');
  }

  async deserialize(content: string, filePath: string): Promise<Note> {
    // Extract metadata and content
    const { metadata, customContent } = this.parseFileContent(content);

    // Parse custom format to HTML
    const htmlContent = parseTextWithColors(customContent);
    const plainText = extractPlainText(customContent);
    const formatMetadata = parseCustomFormatMetadata(customContent);

    const now = new Date().toISOString();

    return {
      id: this.generateIdFromPath(filePath),
      title: metadata.title || this.extractTitleFromPath(filePath),
      content: htmlContent,
      content_type: 'custom',
      content_raw: customContent,
      created_at: metadata.created_at || now,
      updated_at: metadata.updated_at || now,
      deleted_at: null,
      is_pinned: false,
      is_archived: false,
      word_count: formatMetadata.wordCount,
      character_count: formatMetadata.characterCount,
      content_plaintext: plainText
    };
  }

  async extractMetadata(content: string): Promise<{
    title?: string;
    created_at?: string;
    updated_at?: string;
    tags?: string[];
  }> {
    const { metadata } = this.parseFileContent(content);
    return metadata;
  }

  async validate(content: string): Promise<{ isValid: boolean; errors: string[] }> {
    const { customContent } = this.parseFileContent(content);
    return validateCustomFormat(customContent);
  }

  private addFileMetadata(note: Note, customContent: string): string {
    const metadata = [
      `---`,
      `title: ${note.title}`,
      `created_at: ${note.created_at}`,
      `updated_at: ${note.updated_at}`,
      `content_type: custom`,
      `---`,
      '',
      customContent
    ].join('\n');

    return metadata;
  }

  private parseFileContent(content: string): {
    metadata: {
      title?: string;
      created_at?: string;
      updated_at?: string;
      tags?: string[];
    };
    customContent: string;
  } {
    const lines = content.split('\n');

    // Check if file starts with metadata block
    if (lines[0]?.trim() === '---') {
      const metadataEndIndex = lines.findIndex((line, index) =>
        index > 0 && line.trim() === '---'
      );

      if (metadataEndIndex > 0) {
        // Parse metadata
        const metadataLines = lines.slice(1, metadataEndIndex);
        const metadata: any = {};

        for (const line of metadataLines) {
          const [key, ...valueParts] = line.split(':');
          if (key && valueParts.length > 0) {
            const value = valueParts.join(':').trim();
            metadata[key.trim()] = value;
          }
        }

        // Parse tags if present
        if (metadata.tags) {
          try {
            metadata.tags = JSON.parse(metadata.tags);
          } catch {
            metadata.tags = [metadata.tags];
          }
        }

        // Get content after metadata
        const customContent = lines.slice(metadataEndIndex + 1).join('\n').trim();

        return { metadata, customContent };
      }
    }

    // No metadata block found, return entire content
    return { metadata: {}, customContent: content };
  }

  private generateIdFromPath(filePath: string): string {
    // Extract filename without extension and use as ID
    const pathParts = filePath.split('/');
    const filename = pathParts[pathParts.length - 1];

    if (!filename) {
      return 'untitled';
    }

    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');

    // Include parent directory if not root
    if (pathParts.length > 1) {
      const parentDir = pathParts[pathParts.length - 2];
      if (parentDir) {
        return `${parentDir}/${nameWithoutExt}`;
      }
    }

    return nameWithoutExt;
  }

  private extractTitleFromPath(filePath: string): string {
    const pathParts = filePath.split('/');
    const filename = pathParts[pathParts.length - 1];

    if (!filename) {
      return 'Untitled';
    }

    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');

    // Convert underscores and hyphens to spaces and capitalize
    return nameWithoutExt
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }
}