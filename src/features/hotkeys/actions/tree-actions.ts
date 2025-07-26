/**
 * Helper function to emit tree command events
 */
function emitTreeCommand(command: string, payload?: any): void {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('hotkey-tree-command', {
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
 * Expand all tree nodes
 */
export async function treeExpandAll(): Promise<void> {
  emitTreeCommand('expand-all');
}

/**
 * Collapse all tree nodes
 */
export async function treeCollapseAll(): Promise<void> {
  emitTreeCommand('collapse-all');
}
