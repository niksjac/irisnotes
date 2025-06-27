import type { FileFormatHandler, FileFormat } from '../types';
import { CustomFormatHandler } from './custom-format-handler';
import { MarkdownFormatHandler } from './markdown-handler';
import { HtmlFormatHandler } from './html-handler';
import { JsonFormatHandler } from './json-handler';
import { TextFormatHandler } from './text-handler';

// Registry of format handlers
const formatHandlers = new Map<FileFormat, FileFormatHandler>();

// Register default handlers
formatHandlers.set('custom', new CustomFormatHandler());
formatHandlers.set('markdown', new MarkdownFormatHandler());
formatHandlers.set('html', new HtmlFormatHandler());
formatHandlers.set('json', new JsonFormatHandler());
formatHandlers.set('txt', new TextFormatHandler());

/**
 * Get a format handler for the specified format
 */
export function getFileFormatHandler(format: FileFormat): FileFormatHandler {
  const handler = formatHandlers.get(format);
  if (!handler) {
    throw new Error(`No handler found for format: ${format}`);
  }
  return handler;
}

/**
 * Register a custom format handler
 */
export function registerFormatHandler(format: FileFormat, handler: FileFormatHandler): void {
  formatHandlers.set(format, handler);
}

/**
 * Get all supported formats
 */
export function getSupportedFormats(): FileFormat[] {
  return Array.from(formatHandlers.keys());
}

/**
 * Check if a format is supported
 */
export function isFormatSupported(format: string): format is FileFormat {
  return formatHandlers.has(format as FileFormat);
}

/**
 * Get format handler information
 */
export function getFormatInfo(format: FileFormat): {
  format: FileFormat;
  extension: string;
  mimeType: string;
} | null {
  const handler = formatHandlers.get(format);
  if (!handler) {
    return null;
  }

  return {
    format: handler.format,
    extension: handler.extension,
    mimeType: handler.mimeType
  };
}

/**
 * Auto-detect format from file extension
 */
export function detectFormatFromExtension(extension: string): FileFormat | null {
  const extensionMap: Record<string, FileFormat> = {
    '.txt': 'custom',
    '.md': 'markdown',
    '.html': 'html',
    '.json': 'json'
  };

  return extensionMap[extension.toLowerCase()] || null;
}

/**
 * Auto-detect format from content
 */
export async function detectFormatFromContent(content: string): Promise<FileFormat | null> {
  // Try to detect format based on content patterns
  const trimmedContent = content.trim();

  // JSON format
  if ((trimmedContent.startsWith('{') && trimmedContent.endsWith('}')) ||
      (trimmedContent.startsWith('[') && trimmedContent.endsWith(']'))) {
    try {
      JSON.parse(content);
      return 'json';
    } catch {
      // Not valid JSON, continue checking
    }
  }

  // HTML format
  if (trimmedContent.includes('<html') || trimmedContent.includes('<!DOCTYPE html') ||
      (trimmedContent.includes('<') && trimmedContent.includes('>'))) {
    return 'html';
  }

  // Markdown format
  if (trimmedContent.includes('# ') || trimmedContent.includes('## ') ||
      trimmedContent.includes('**') || trimmedContent.includes('*') ||
      trimmedContent.includes('[') && trimmedContent.includes('](')) {
    return 'markdown';
  }

  // Custom format
  if (trimmedContent.includes('{color:') || trimmedContent.includes('{bold}') ||
      trimmedContent.includes('{size:') || trimmedContent.includes('{font:')) {
    return 'custom';
  }

  // Default to plain text
  return 'txt';
}