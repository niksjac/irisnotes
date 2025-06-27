import {
  parseTextWithColors,
  serializeToCustomFormat,
  extractPlainText,
  parseCustomFormatMetadata,
  validateCustomFormat
} from './text-parser';
import type { Note, CreateNoteParams, UpdateNoteParams } from '../types/database';

/**
 * Custom Format Handler
 * Utilities for working with the custom color markup format in notes
 */

export class CustomFormatHandler {
  /**
   * Create a note from custom format text
   */
  static createNoteFromCustomFormat(customText: string, title?: string): CreateNoteParams {
    const metadata = parseCustomFormatMetadata(customText);
    const htmlContent = parseTextWithColors(customText);

    return {
      title: title || 'Untitled Note',
      content: htmlContent,
      content_type: 'custom',
      content_raw: customText
    };
  }

  /**
   * Update note content with custom format
   */
  static updateNoteWithCustomFormat(noteId: string, customText: string, title?: string): UpdateNoteParams {
    const metadata = parseCustomFormatMetadata(customText);
    const htmlContent = parseTextWithColors(customText);

    const params: UpdateNoteParams = {
      id: noteId,
      content: htmlContent,
      content_type: 'custom',
      content_raw: customText
    };

    if (title) {
      params.title = title;
    }

    return params;
  }

  /**
   * Convert HTML note to custom format
   */
  static convertHtmlToCustomFormat(note: Note): string {
    if (note.content_type === 'custom' && note.content_raw) {
      return note.content_raw;
    }

    return serializeToCustomFormat(note.content);
  }

  /**
   * Get the raw custom format text from a note
   */
  static getCustomFormatText(note: Note): string | null {
    if (note.content_type === 'custom' && note.content_raw) {
      return note.content_raw;
    }
    return null;
  }

  /**
   * Validate and prepare custom format for storage
   */
  static validateAndPrepareCustomFormat(customText: string): {
    isValid: boolean;
    errors: string[];
    prepared?: {
      customText: string;
      htmlContent: string;
      plainText: string;
      wordCount: number;
      characterCount: number;
    };
  } {
    const validation = validateCustomFormat(customText);

    if (!validation.isValid) {
      return validation;
    }

    const metadata = parseCustomFormatMetadata(customText);
    const htmlContent = parseTextWithColors(customText);

    return {
      isValid: true,
      errors: [],
      prepared: {
        customText,
        htmlContent,
        plainText: metadata.plainText,
        wordCount: metadata.wordCount,
        characterCount: metadata.characterCount
      }
    };
  }

  /**
   * Create a complete Note object from custom format
   */
  static createCompleteNoteFromCustomFormat(
    id: string,
    customText: string,
    title: string = 'Untitled Note'
  ): Note {
    const validation = this.validateAndPrepareCustomFormat(customText);

    if (!validation.isValid || !validation.prepared) {
      throw new Error(`Invalid custom format: ${validation.errors.join(', ')}`);
    }

    const now = new Date().toISOString();

    return {
      id,
      title,
      content: validation.prepared.htmlContent,
      content_type: 'custom',
      content_raw: validation.prepared.customText,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      is_pinned: false,
      is_archived: false,
      word_count: validation.prepared.wordCount,
      character_count: validation.prepared.characterCount,
      content_plaintext: validation.prepared.plainText
    };
  }

    /**
   * Get sample custom format text for demonstration
   */
  static getSampleCustomFormat(): string {
    return `Welcome to {color:blue}{bold}IrisNotes{/bold}{/color}!

This is a comprehensive demonstration of the custom formatting system.

{bold}Text Formatting:{/bold}
- {bold}Bold text{/bold}
- {italic}Italic text{/italic}
- {strike}Strikethrough text{/strike}
- {underline}Underlined text{/underline}
- {code}Code/monospace text{/code}
- H{sup}2{/sup}O and CO{sub}2{/sub} (superscript/subscript)

{bold}Colors:{/bold}
{color:red}red{/color}, {color:green}green{/color}, {color:blue}blue{/color}, {color:yellow}yellow{/color}, {color:purple}purple{/color}, {color:cyan}cyan{/color}, {color:gray}gray{/color}, {color:black}black{/color}

{bold}Background Colors:{/bold}
{bg:yellow}highlighted text{/bg}, {bg:red}important{/bg}, {bg:green}success{/bg}, {bg:blue}info{/bg}

{bold}Font Sizes:{/bold}
{size:tiny}tiny{/size}, {size:small}small{/size}, {size:normal}normal{/size}, {size:large}large{/size}, {size:huge}huge{/size}, {size:xl}extra large{/size}

{bold}Font Families:{/bold}
{font:Arial}Arial text{/font}, {font:Georgia}Georgia text{/font}, {font:Courier New}Courier New text{/font}

{bold}Combining Formats:{/bold}
{color:red}{bold}{bg:yellow}Important highlighted bold red text{/bg}{/bold}{/color}

{bold}Perfect for:{/bold}
- {color:blue}Quick notes{/color} with {italic}visual emphasis{/italic}
- {bg:yellow}Highlighted{/bg} information
- {color:red}{bold}Critical{/bold}{/color} points and {strike}corrections{/strike}
- {code}Code snippets{/code} and technical notes

The text remains readable in plain format while providing rich visual formatting!`;
  }

  /**
   * Check if a note uses custom format
   */
  static isCustomFormat(note: Note): boolean {
    return note.content_type === 'custom' && !!note.content_raw;
  }

  /**
   * Export custom format note to file
   */
  static exportToFile(note: Note): { filename: string; content: string; mimeType: string } {
    const customText = this.getCustomFormatText(note);

    if (!customText) {
      throw new Error('Note is not in custom format');
    }

    const filename = `${note.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;

    return {
      filename,
      content: customText,
      mimeType: 'text/plain'
    };
  }
}