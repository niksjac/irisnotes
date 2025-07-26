// Types
export * from './types';

// Atoms and state management
export { hotkeyAtoms } from './atoms';
export {
  hotkeyConfigurationAtom,
  registeredActionsAtom,
  enabledBindingsAtom,
  bindingsByScopeAtom,
  bindingsByContextAtom,
  addBindingAtom,
  updateBindingAtom,
  removeBindingAtom,
  registerActionAtom,
  unregisterActionAtom,
} from './atoms';

// Managers
export { globalShortcutsManager } from './managers/global-shortcuts';
export { LocalShortcutsManager } from './managers/local-shortcuts';
export { SequenceShortcutsManager } from './managers/sequence-shortcuts';
export { hotkeyManager } from './managers/hotkey-manager';

// Hooks
export {
  useLocalShortcuts,
  useEditorShortcuts,
  useNavigationShortcuts,
  useContextualShortcuts,
} from './managers/local-shortcuts';

export { useSequenceShortcuts, useSequenceEvents } from './managers/sequence-shortcuts';

export {
  useHotkeyManager,
  useApplicationShortcuts,
  useEditorShortcutsManager,
  useNavigationShortcutsManager,
  useContextShortcuts,
} from './managers/hotkey-manager';

// Actions
export { hotkeyActions, createActionsMap, getActionById, getActionsByScope } from './actions';

// Configuration
export { getDefaultBindings } from './config/default-bindings';

// Default categories and contexts
export { DEFAULT_CATEGORIES, DEFAULT_CONTEXTS } from './types';

// Components
export { HotkeyConfig } from './components/hotkey-config';
