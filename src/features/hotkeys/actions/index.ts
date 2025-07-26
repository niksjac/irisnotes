import { HotkeyAction } from '../types';
import { openAppConfigFolder } from './app-actions';
import {
  toggleSidebar,
  toggleActivityBar,
  toggleDualPane,
  reloadNote,
  toggleLineWrapping,
  increaseFontSize,
  decreaseFontSize,
} from './layout-actions';
import { focusEditor, focusSidebar, focusActivityBar } from './navigation-actions';
import {
  editorBold,
  editorItalic,
  editorCode,
  editorHeading1,
  editorHeading2,
  editorHeading3,
  editorHeading4,
  editorHeading5,
  editorHeading6,
  editorParagraph,
  editorBulletList,
  editorOrderedList,
} from './editor-actions';
import { treeExpandAll, treeCollapseAll } from './tree-actions';

/**
 * Registry of all available hotkey actions
 */
export const hotkeyActions: HotkeyAction[] = [
  // Application Actions
  {
    id: 'open-app-config-folder',
    name: 'Open App Config Folder',
    description: 'Open the application configuration folder in the system file manager',
    scope: 'sequence',
    handler: openAppConfigFolder,
  },

  // Layout Actions
  {
    id: 'toggle-sidebar',
    name: 'Toggle Sidebar',
    description: 'Show or hide the notes sidebar',
    scope: 'global',
    handler: toggleSidebar,
  },
  {
    id: 'toggle-activity-bar',
    name: 'Toggle Activity Bar',
    description: 'Show or hide the activity bar',
    scope: 'global',
    handler: toggleActivityBar,
  },
  {
    id: 'toggle-dual-pane',
    name: 'Toggle Dual Pane',
    description: 'Switch between single and dual pane editor mode',
    scope: 'global',
    handler: toggleDualPane,
  },
  {
    id: 'reload-note',
    name: 'Reload Note',
    description: 'Reload the current note',
    scope: 'global',
    handler: reloadNote,
  },
  {
    id: 'toggle-line-wrapping',
    name: 'Toggle Line Wrapping',
    description: 'Enable or disable line wrapping in the editor',
    scope: 'global',
    handler: toggleLineWrapping,
  },
  {
    id: 'increase-font-size',
    name: 'Increase Font Size',
    description: 'Increase the editor font size',
    scope: 'global',
    handler: increaseFontSize,
  },
  {
    id: 'decrease-font-size',
    name: 'Decrease Font Size',
    description: 'Decrease the editor font size',
    scope: 'global',
    handler: decreaseFontSize,
  },

  // Navigation Actions
  {
    id: 'focus-editor',
    name: 'Focus Editor',
    description: 'Focus the main editor',
    scope: 'local',
    handler: focusEditor,
  },
  {
    id: 'focus-sidebar',
    name: 'Focus Sidebar',
    description: 'Focus the sidebar',
    scope: 'local',
    handler: focusSidebar,
  },
  {
    id: 'focus-activity-bar',
    name: 'Focus Activity Bar',
    description: 'Focus the activity bar',
    scope: 'local',
    handler: focusActivityBar,
  },

  // Editor Actions
  {
    id: 'editor-bold',
    name: 'Bold',
    description: 'Apply bold formatting to selected text',
    scope: 'editor',
    handler: editorBold,
  },
  {
    id: 'editor-italic',
    name: 'Italic',
    description: 'Apply italic formatting to selected text',
    scope: 'editor',
    handler: editorItalic,
  },
  {
    id: 'editor-code',
    name: 'Inline Code',
    description: 'Apply inline code formatting to selected text',
    scope: 'editor',
    handler: editorCode,
  },
  {
    id: 'editor-heading-1',
    name: 'Heading 1',
    description: 'Convert current line to heading 1',
    scope: 'editor',
    handler: editorHeading1,
  },
  {
    id: 'editor-heading-2',
    name: 'Heading 2',
    description: 'Convert current line to heading 2',
    scope: 'editor',
    handler: editorHeading2,
  },
  {
    id: 'editor-heading-3',
    name: 'Heading 3',
    description: 'Convert current line to heading 3',
    scope: 'editor',
    handler: editorHeading3,
  },
  {
    id: 'editor-heading-4',
    name: 'Heading 4',
    description: 'Convert current line to heading 4',
    scope: 'editor',
    handler: editorHeading4,
  },
  {
    id: 'editor-heading-5',
    name: 'Heading 5',
    description: 'Convert current line to heading 5',
    scope: 'editor',
    handler: editorHeading5,
  },
  {
    id: 'editor-heading-6',
    name: 'Heading 6',
    description: 'Convert current line to heading 6',
    scope: 'editor',
    handler: editorHeading6,
  },
  {
    id: 'editor-paragraph',
    name: 'Paragraph',
    description: 'Convert current line to paragraph',
    scope: 'editor',
    handler: editorParagraph,
  },
  {
    id: 'editor-bullet-list',
    name: 'Bullet List',
    description: 'Create or toggle bullet list',
    scope: 'editor',
    handler: editorBulletList,
  },
  {
    id: 'editor-ordered-list',
    name: 'Ordered List',
    description: 'Create or toggle ordered list',
    scope: 'editor',
    handler: editorOrderedList,
  },

  // Tree Actions
  {
    id: 'tree-expand-all',
    name: 'Expand All',
    description: 'Expand all tree nodes',
    scope: 'local',
    handler: treeExpandAll,
  },
  {
    id: 'tree-collapse-all',
    name: 'Collapse All',
    description: 'Collapse all tree nodes',
    scope: 'local',
    handler: treeCollapseAll,
  },
];

/**
 * Get action by ID
 */
export function getActionById(id: string): HotkeyAction | undefined {
  return hotkeyActions.find(action => action.id === id);
}

/**
 * Get actions by scope
 */
export function getActionsByScope(scope: string): HotkeyAction[] {
  return hotkeyActions.filter(action => action.scope === scope);
}

/**
 * Get all action IDs
 */
export function getActionIds(): string[] {
  return hotkeyActions.map(action => action.id);
}

/**
 * Create actions map
 */
export function createActionsMap(): Map<string, HotkeyAction> {
  const map = new Map<string, HotkeyAction>();
  hotkeyActions.forEach(action => map.set(action.id, action));
  return map;
}

export { hotkeyActions as default };
