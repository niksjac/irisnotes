/**
 * Helper function to emit editor command events
 */
function emitEditorCommand(command: string, payload?: any): void {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('hotkey-editor-command', {
      detail: {
        command,
        payload,
        timestamp: Date.now(),
      },
    });
    window.dispatchEvent(event);
  }
}

/**
 * Apply bold formatting
 */
export async function editorBold(): Promise<void> {
  emitEditorCommand('bold');
}

/**
 * Apply italic formatting
 */
export async function editorItalic(): Promise<void> {
  emitEditorCommand('italic');
}

/**
 * Apply inline code formatting
 */
export async function editorCode(): Promise<void> {
  emitEditorCommand('code');
}

/**
 * Convert to heading 1
 */
export async function editorHeading1(): Promise<void> {
  emitEditorCommand('heading', { level: 1 });
}

/**
 * Convert to heading 2
 */
export async function editorHeading2(): Promise<void> {
  emitEditorCommand('heading', { level: 2 });
}

/**
 * Convert to heading 3
 */
export async function editorHeading3(): Promise<void> {
  emitEditorCommand('heading', { level: 3 });
}

/**
 * Convert to heading 4
 */
export async function editorHeading4(): Promise<void> {
  emitEditorCommand('heading', { level: 4 });
}

/**
 * Convert to heading 5
 */
export async function editorHeading5(): Promise<void> {
  emitEditorCommand('heading', { level: 5 });
}

/**
 * Convert to heading 6
 */
export async function editorHeading6(): Promise<void> {
  emitEditorCommand('heading', { level: 6 });
}

/**
 * Convert to paragraph
 */
export async function editorParagraph(): Promise<void> {
  emitEditorCommand('paragraph');
}

/**
 * Create or toggle bullet list
 */
export async function editorBulletList(): Promise<void> {
  emitEditorCommand('bulletList');
}

/**
 * Create or toggle ordered list
 */
export async function editorOrderedList(): Promise<void> {
  emitEditorCommand('orderedList');
}
