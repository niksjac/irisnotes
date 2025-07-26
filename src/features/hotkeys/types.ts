export type HotkeyScope = 'global' | 'local' | 'editor' | 'sequence';

export type PlatformModifier = 'ctrl' | 'cmd' | 'alt' | 'shift';
export type SpecialKey =
  | 'enter'
  | 'escape'
  | 'space'
  | 'tab'
  | 'backspace'
  | 'delete'
  | 'home'
  | 'end'
  | 'pageup'
  | 'pagedown'
  | 'arrowup'
  | 'arrowdown'
  | 'arrowleft'
  | 'arrowright';
export type FunctionKey = 'f1' | 'f2' | 'f3' | 'f4' | 'f5' | 'f6' | 'f7' | 'f8' | 'f9' | 'f10' | 'f11' | 'f12';

export interface HotkeyBinding {
  id: string;
  name: string;
  description: string;
  scope: HotkeyScope;
  category: string;

  // Key combinations
  keys: string | string[]; // For sequences, use array

  // Execution context
  context?: string; // Component context (e.g., 'editor', 'sidebar', 'notes-tree')
  enabled: boolean;

  // Platform-specific overrides
  platformOverrides?: {
    windows?: string | string[];
    macos?: string | string[];
    linux?: string | string[];
  };

  // Action metadata
  action: string; // Action identifier for dispatch
  payload?: any; // Optional payload for action

  // Configuration
  preventDefault?: boolean;
  stopPropagation?: boolean;
  allowInInputs?: boolean;

  // Sequence-specific
  timeout?: number; // For sequence shortcuts
  partial?: boolean; // Allow partial matches
}

export interface HotkeyCategory {
  id: string;
  name: string;
  description: string;
  scope: HotkeyScope;
  priority: number; // Higher priority categories are checked first
}

export interface HotkeyContext {
  id: string;
  name: string;
  description: string;
  selector?: string; // CSS selector for context
  component?: string; // Component name
}

export interface HotkeyConfiguration {
  version: string;
  categories: HotkeyCategory[];
  contexts: HotkeyContext[];
  bindings: HotkeyBinding[];
}

export interface HotkeyAction {
  id: string;
  name: string;
  description: string;
  scope: HotkeyScope;
  handler: (...args: any[]) => void | Promise<void>;
}

export interface HotkeySequenceState {
  currentSequence: string[];
  isWaitingForNext: boolean;
  timeout?: NodeJS.Timeout;
  matchingBindings: HotkeyBinding[];
}

export interface GlobalShortcutRegistration {
  id: string;
  shortcut: string;
  handler: () => void | Promise<void>;
}

export interface HotkeyManagerOptions {
  enableGlobal?: boolean;
  enableLocal?: boolean;
  enableSequences?: boolean;
  sequenceTimeout?: number;
  preventConflicts?: boolean;
}

// Event types for hotkey system
export interface HotkeyEvent {
  type:
    | 'executed'
    | 'registered'
    | 'unregistered'
    | 'conflict'
    | 'sequence-started'
    | 'sequence-completed'
    | 'sequence-timeout';
  binding?: HotkeyBinding;
  sequence?: string[];
  context?: string;
  timestamp: number;
}

export interface HotkeyConflict {
  binding1: HotkeyBinding;
  binding2: HotkeyBinding;
  keys: string | string[];
  scope: HotkeyScope;
}

// Default categories
export const DEFAULT_CATEGORIES: HotkeyCategory[] = [
  {
    id: 'application',
    name: 'Application',
    description: 'Global application shortcuts',
    scope: 'global',
    priority: 100,
  },
  {
    id: 'navigation',
    name: 'Navigation',
    description: 'Navigation and focus management',
    scope: 'local',
    priority: 80,
  },
  {
    id: 'editor',
    name: 'Editor',
    description: 'Text editor shortcuts',
    scope: 'editor',
    priority: 60,
  },
  {
    id: 'formatting',
    name: 'Formatting',
    description: 'Text formatting shortcuts',
    scope: 'editor',
    priority: 50,
  },
  {
    id: 'sequences',
    name: 'Sequences',
    description: 'Multi-key sequence shortcuts',
    scope: 'sequence',
    priority: 90,
  },
];

// Default contexts
export const DEFAULT_CONTEXTS: HotkeyContext[] = [
  {
    id: 'global',
    name: 'Global',
    description: 'Available everywhere in the application',
  },
  {
    id: 'editor',
    name: 'Editor',
    description: 'Available when editor is focused',
    selector: '[data-editor="true"]',
  },
  {
    id: 'sidebar',
    name: 'Sidebar',
    description: 'Available when sidebar is focused',
    selector: '[data-sidebar="true"]',
  },
  {
    id: 'notes-tree',
    name: 'Notes Tree',
    description: 'Available when notes tree is focused',
    selector: '[data-notes-tree="true"]',
  },
  {
    id: 'activity-bar',
    name: 'Activity Bar',
    description: 'Available when activity bar is focused',
    selector: '[data-activity-bar="true"]',
  },
];
