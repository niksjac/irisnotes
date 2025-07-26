import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import {
  HotkeyConfiguration,
  HotkeyBinding,
  HotkeyAction,
  HotkeySequenceState,
  HotkeyEvent,
  HotkeyConflict,
  DEFAULT_CATEGORIES,
  DEFAULT_CONTEXTS,
  GlobalShortcutRegistration,
} from './types';
import { getDefaultBindings } from './config/default-bindings';

// Core configuration atom with persistence
export const hotkeyConfigurationAtom = atomWithStorage<HotkeyConfiguration>('hotkey-config', {
  version: '1.0.0',
  categories: DEFAULT_CATEGORIES,
  contexts: DEFAULT_CONTEXTS,
  bindings: getDefaultBindings(),
});

// Runtime state atoms (not persisted)
export const registeredActionsAtom = atom<Map<string, HotkeyAction>>(new Map());
export const sequenceStateAtom = atom<HotkeySequenceState>({
  currentSequence: [],
  isWaitingForNext: false,
  matchingBindings: [],
});

export const globalShortcutsAtom = atom<Map<string, GlobalShortcutRegistration>>(new Map());
export const hotkeyEventsAtom = atom<HotkeyEvent[]>([]);
export const conflictsAtom = atom<HotkeyConflict[]>([]);

// Derived atoms for easy access
export const enabledBindingsAtom = atom(get => {
  const config = get(hotkeyConfigurationAtom);
  return config.bindings.filter(binding => binding.enabled);
});

export const bindingsByScopeAtom = atom(get => {
  const bindings = get(enabledBindingsAtom);
  return {
    global: bindings.filter(b => b.scope === 'global'),
    local: bindings.filter(b => b.scope === 'local'),
    editor: bindings.filter(b => b.scope === 'editor'),
    sequence: bindings.filter(b => b.scope === 'sequence'),
  };
});

export const bindingsByContextAtom = atom(get => {
  const bindings = get(enabledBindingsAtom);
  const byContext = new Map<string, HotkeyBinding[]>();

  bindings.forEach(binding => {
    const context = binding.context || 'global';
    if (!byContext.has(context)) {
      byContext.set(context, []);
    }
    byContext.get(context)!.push(binding);
  });

  return byContext;
});

// Action atoms for configuration management
export const addBindingAtom = atom(null, (get, set, binding: HotkeyBinding) => {
  const config = get(hotkeyConfigurationAtom);
  const updatedConfig = {
    ...config,
    bindings: [...config.bindings, binding],
  };
  set(hotkeyConfigurationAtom, updatedConfig);
});

export const updateBindingAtom = atom(null, (get, set, updatedBinding: HotkeyBinding) => {
  const config = get(hotkeyConfigurationAtom);
  const updatedConfig = {
    ...config,
    bindings: config.bindings.map(binding => (binding.id === updatedBinding.id ? updatedBinding : binding)),
  };
  set(hotkeyConfigurationAtom, updatedConfig);
});

export const removeBindingAtom = atom(null, (get, set, bindingId: string) => {
  const config = get(hotkeyConfigurationAtom);
  const updatedConfig = {
    ...config,
    bindings: config.bindings.filter(binding => binding.id !== bindingId),
  };
  set(hotkeyConfigurationAtom, updatedConfig);
});

export const registerActionAtom = atom(null, (get, set, action: HotkeyAction) => {
  const actions = get(registeredActionsAtom);
  const newActions = new Map(actions);
  newActions.set(action.id, action);
  set(registeredActionsAtom, newActions);
});

export const unregisterActionAtom = atom(null, (get, set, actionId: string) => {
  const actions = get(registeredActionsAtom);
  const newActions = new Map(actions);
  newActions.delete(actionId);
  set(registeredActionsAtom, newActions);
});

export const addEventAtom = atom(null, (get, set, event: HotkeyEvent) => {
  const events = get(hotkeyEventsAtom);
  const maxEvents = 100; // Keep last 100 events
  const newEvents = [event, ...events].slice(0, maxEvents);
  set(hotkeyEventsAtom, newEvents);
});

export const clearEventsAtom = atom(null, (_get, set) => {
  set(hotkeyEventsAtom, []);
});

export const updateSequenceStateAtom = atom(null, (get, set, update: Partial<HotkeySequenceState>) => {
  const current = get(sequenceStateAtom);
  set(sequenceStateAtom, { ...current, ...update });
});

export const resetSequenceStateAtom = atom(null, (get, set) => {
  const current = get(sequenceStateAtom);
  if (current.timeout) {
    clearTimeout(current.timeout);
  }
  set(sequenceStateAtom, {
    currentSequence: [],
    isWaitingForNext: false,
    matchingBindings: [],
  });
});

// Utility atoms for conflict detection
export const detectConflictsAtom = atom(get => {
  const bindings = get(enabledBindingsAtom);
  const conflicts: HotkeyConflict[] = [];

  for (let i = 0; i < bindings.length; i++) {
    for (let j = i + 1; j < bindings.length; j++) {
      const binding1 = bindings[i];
      const binding2 = bindings[j];

      if (!binding1 || !binding2) continue;

      // Check if bindings conflict
      if (binding1.scope === binding2.scope && binding1.context === binding2.context) {
        const keys1 = Array.isArray(binding1.keys) ? binding1.keys : [binding1.keys];
        const keys2 = Array.isArray(binding2.keys) ? binding2.keys : [binding2.keys];

        // For sequence shortcuts, check if they have overlapping prefixes
        if (binding1.scope === 'sequence' && binding2.scope === 'sequence') {
          const minLength = Math.min(keys1.length, keys2.length);
          let hasConflict = true;

          for (let k = 0; k < minLength; k++) {
            if (keys1[k] !== keys2[k]) {
              hasConflict = false;
              break;
            }
          }

          if (hasConflict) {
            conflicts.push({
              binding1,
              binding2,
              keys: keys1.slice(0, minLength),
              scope: binding1.scope,
            });
          }
        } else {
          // For non-sequence shortcuts, check exact key match
          if (keys1.length === 1 && keys2.length === 1 && keys1[0] === keys2[0] && keys1[0]) {
            conflicts.push({
              binding1,
              binding2,
              keys: keys1[0],
              scope: binding1.scope,
            });
          }
        }
      }
    }
  }

  return conflicts;
});

// Export all atoms for easier imports
export const hotkeyAtoms = {
  configuration: hotkeyConfigurationAtom,
  enabledBindings: enabledBindingsAtom,
  bindingsByScope: bindingsByScopeAtom,
  bindingsByContext: bindingsByContextAtom,
  registeredActions: registeredActionsAtom,
  sequenceState: sequenceStateAtom,
  globalShortcuts: globalShortcutsAtom,
  events: hotkeyEventsAtom,
  conflicts: conflictsAtom,
  detectConflicts: detectConflictsAtom,

  // Actions
  addBinding: addBindingAtom,
  updateBinding: updateBindingAtom,
  removeBinding: removeBindingAtom,
  registerAction: registerActionAtom,
  unregisterAction: unregisterActionAtom,
  addEvent: addEventAtom,
  clearEvents: clearEventsAtom,
  updateSequenceState: updateSequenceStateAtom,
  resetSequenceState: resetSequenceStateAtom,
};
