import type { FileFormatHandler, FileFormat } from '../types';
import type { Note } from '../../../../types/database';

export class MarkdownFormatHandler implements FileFormatHandler {
  format: FileFormat = 'markdown';
  extension: string = '.md';
  mimeType: string = 'text/markdown';

  async serialize(note: Note): Promise<string> {
    // Convert HTML content to markdown (basic conversion)
    let markdownContent = note.content_raw || this.htmlToMarkdown(note.content);

    // Add frontmatter metadata
    const frontmatter = [
      '---',
      `title: "${note.title}"`,
      `created_at: ${note.created_at}`,
      `updated_at: ${note.updated_at}`,
      `id: ${note.id}`,
      '---',
      '',
      markdownContent
    ].join('\n');

    return frontmatter;
  }

  async deserialize(content: string, filePath: string): Promise<Note> {
    const { metadata, markdownContent } = this.parseFrontmatter(content);

    // Convert markdown to HTML for display
    const htmlContent = this.markdownToHtml(markdownContent);
    const plainText = this.markdownToPlainText(markdownContent);

    const now = new Date().toISOString();

    return {
      id: metadata.id || this.generateIdFromPath(filePath),
      title: metadata.title || this.extractTitleFromContent(markdownContent) || this.extractTitleFromPath(filePath),
      content: htmlContent,
      content_type: 'markdown',
      content_raw: markdownContent,
      created_at: metadata.created_at || now,
      updated_at: metadata.updated_at || now,
      deleted_at: null,
      is_pinned: false,
      is_archived: false,
      word_count: plainText.split(/\s+/).filter(word => word.length > 0).length,
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
    const { metadata, markdownContent } = this.parseFrontmatter(content);

    // If no title in metadata, try to extract from content
    if (!metadata.title) {
      const extractedTitle = this.extractTitleFromContent(markdownContent);
      if (extractedTitle) {
        metadata.title = extractedTitle;
      }
    }

    return metadata;
  }

  async validate(content: string): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Basic markdown validation
    try {
      this.parseFrontmatter(content);
    } catch (error) {
      errors.push(`Invalid frontmatter: ${error}`);
    }

    // Check for common markdown issues
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      // Check for unclosed links
      const linkMatches = line.match(/\[([^\]]*)\]/g);
      const urlMatches = line.match(/\]\(([^)]*)\)/g);
      if (linkMatches && urlMatches && linkMatches.length !== urlMatches.length) {
        errors.push(`Line ${i + 1}: Unclosed markdown link`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private parseFrontmatter(content: string): {
    metadata: {
      title?: string;
      created_at?: string;
      updated_at?: string;
      tags?: string[];
      id?: string;
    };
    markdownContent: string;
  } {
    const lines = content.split('\n');

    if (lines[0]?.trim() === '---') {
      const metadataEndIndex = lines.findIndex((line, index) =>
        index > 0 && line.trim() === '---'
      );

      if (metadataEndIndex > 0) {
        const metadataLines = lines.slice(1, metadataEndIndex);
        const metadata: any = {};

        for (const line of metadataLines) {
          const colonIndex = line.indexOf(':');
          if (colonIndex > 0) {
            const key = line.substring(0, colonIndex).trim();
            let value = line.substring(colonIndex + 1).trim();

            // Remove quotes from title
            if (key === 'title' && value.startsWith('"') && value.endsWith('"')) {
              value = value.slice(1, -1);
            }

            // Parse tags array
            if (key === 'tags' && value.startsWith('[') && value.endsWith(']')) {
              try {
                metadata[key] = JSON.parse(value);
              } catch {
                metadata[key] = [value];
              }
            } else {
              metadata[key] = value;
            }
          }
        }

        const markdownContent = lines.slice(metadataEndIndex + 1).join('\n').trim();
        return { metadata, markdownContent };
      }
    }

    return { metadata: {}, markdownContent: content };
  }

  private extractTitleFromContent(markdownContent: string): string | null {
    const lines = markdownContent.split('\n');

    // Look for first heading
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('# ')) {
        return trimmedLine.substring(2).trim();
      }
    }

    return null;
  }

  private extractTitleFromPath(filePath: string): string {
    const pathParts = filePath.split('/');
    const filename = pathParts[pathParts.length - 1] || 'untitled';
    const nameWithoutExt = filename.replace(/\.md$/, '');

    return nameWithoutExt
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  private generateIdFromPath(filePath: string): string {
    const pathParts = filePath.split('/');
    const filename = pathParts[pathParts.length - 1] || 'untitled';
    const nameWithoutExt = filename.replace(/\.md$/, '');

    if (pathParts.length > 1) {
      const parentDir = pathParts[pathParts.length - 2];
      return `${parentDir}/${nameWithoutExt}`;
    }

    return nameWithoutExt;
  }

  private markdownToHtml(markdown: string): string {
    // Basic markdown to HTML conversion
    let html = markdown
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      // Code
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      // Strikethrough
      .replace(/~~(.*?)~~/g, '<del>$1</del>');

    // Convert paragraphs
    const paragraphs = html.split('\n\n')
      .map(para => para.trim())
      .filter(para => para.length > 0)
      .map(para => `<p>${para}</p>`)
      .join('\n');

    return paragraphs || '<p></p>';
  }

  private htmlToMarkdown(html: string): string {
    // Basic HTML to markdown conversion
    return html
      .replace(/<h1>(.*?)<\/h1>/g, '# $1')
      .replace(/<h2>(.*?)<\/h2>/g, '## $1')
      .replace(/<h3>(.*?)<\/h3>/g, '### $1')
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<em>(.*?)<\/em>/g, '*$1*')
      .replace(/<code>(.*?)<\/code>/g, '`$1`')
      .replace(/<del>(.*?)<\/del>/g, '~~$1~~')
      .replace(/<a href="([^"]+)">(.*?)<\/a>/g, '[$2]($1)')
      .replace(/<p>(.*?)<\/p>/g, '$1\n\n')
      .replace(/<[^>]*>/g, '') // Remove remaining HTML tags
      .trim();
  }

  private markdownToPlainText(markdown: string): string {
    return markdown
      .replace(/^#+\s+/gm, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Extract link text
      .replace(/~~(.*?)~~/g, '$1') // Remove strikethrough
      .trim();
  }
}