import { useEffect, useRef, useMemo } from 'react';
import { HotkeyBinding, HotkeyAction, HotkeySequenceState } from '../types';

export interface SequenceShortcutsOptions {
  timeout?: number;
  enableOnContentEditable?: boolean;
  enableOnFormTags?: boolean;
  context?: string;
}

export class SequenceShortcutsManager {
  private sequenceState: HotkeySequenceState = {
    currentSequence: [],
    isWaitingForNext: false,
    matchingBindings: [],
  };

  private timeout: NodeJS.Timeout | null = null;
  private actions = new Map<string, HotkeyAction>();
  private isEnabled = true;
  private options: SequenceShortcutsOptions;

  constructor(options: SequenceShortcutsOptions = {}) {
    this.options = {
      timeout: 2000,
      enableOnContentEditable: false,
      enableOnFormTags: false,
      ...options,
    };
  }

  registerAction(action: HotkeyAction): void {
    this.actions.set(action.id, action);
  }

  unregisterAction(actionId: string): void {
    this.actions.delete(actionId);
  }

  getSequenceState(): HotkeySequenceState {
    return { ...this.sequenceState };
  }

  private normalizeKey(event: KeyboardEvent): string {
    const modifiers = [];
    if (event.ctrlKey || event.metaKey) modifiers.push('mod');
    if (event.altKey) modifiers.push('alt');
    if (event.shiftKey) modifiers.push('shift');

    let key = event.key.toLowerCase();

    // Normalize special keys
    if (key === ' ') key = 'space';
    else if (key === 'arrowup') key = 'up';
    else if (key === 'arrowdown') key = 'down';
    else if (key === 'arrowleft') key = 'left';
    else if (key === 'arrowright') key = 'right';

    return modifiers.length > 0 ? `${modifiers.join('+')}+${key}` : key;
  }

  private findMatchingSequences(keySequence: string[], bindings: HotkeyBinding[]): HotkeyBinding[] {
    return bindings.filter(binding => {
      if (!Array.isArray(binding.keys) || !binding.enabled) return false;

      // Check if the sequence matches the beginning of the binding
      if (keySequence.length > binding.keys.length) return false;

      return keySequence.every((key, index) => binding.keys[index] === key);
    });
  }

  private findExactMatch(keySequence: string[], bindings: HotkeyBinding[]): HotkeyBinding | null {
    const match = bindings.find(binding => {
      if (!Array.isArray(binding.keys) || !binding.enabled) return false;

      return (
        binding.keys.length === keySequence.length && binding.keys.every((key, index) => key === keySequence[index])
      );
    });

    return match || null;
  }

  private shouldIgnoreEvent(event: KeyboardEvent): boolean {
    if (!this.isEnabled) return true;

    const target = event.target as HTMLElement;

    // Check if we should ignore based on target element
    if (!this.options.enableOnFormTags) {
      const tagName = target.tagName.toUpperCase();
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName)) {
        return true;
      }
    }

    if (!this.options.enableOnContentEditable && target.contentEditable === 'true') {
      return true;
    }

    return false;
  }

  resetSequence(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    this.sequenceState = {
      currentSequence: [],
      isWaitingForNext: false,
      matchingBindings: [],
    };

    this.emitSequenceEvent('sequence-reset');
  }

  private emitSequenceEvent(type: string, binding?: HotkeyBinding): void {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('hotkey-sequence-event', {
        detail: {
          type,
          binding,
          sequenceState: this.getSequenceState(),
          timestamp: Date.now(),
        },
      });
      window.dispatchEvent(event);
    }
  }

  private emitHotkeyEvent(type: string, binding?: HotkeyBinding): void {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('hotkey-event', {
        detail: {
          type,
          binding,
          scope: 'sequence',
          context: this.options.context,
          timestamp: Date.now(),
        },
      });
      window.dispatchEvent(event);
    }
  }

  handleKeyDown(event: KeyboardEvent, bindings: HotkeyBinding[]): void {
    if (this.shouldIgnoreEvent(event)) {
      return;
    }

    const normalizedKey = this.normalizeKey(event);
    const newSequence = [...this.sequenceState.currentSequence, normalizedKey];

    // Clear existing timeout
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    // Find matching sequences
    const matchingBindings = this.findMatchingSequences(newSequence, bindings);
    const exactMatch = this.findExactMatch(newSequence, bindings);

    if (exactMatch) {
      // Execute the exact match
      event.preventDefault();
      const action = this.actions.get(exactMatch.action);

      if (action) {
        try {
          action.handler(exactMatch.payload);
          this.emitHotkeyEvent('executed', exactMatch);
        } catch (error) {
          console.error(`Error executing sequence shortcut ${exactMatch.id}:`, error);
        }
      }

      this.resetSequence();
      return;
    }

    if (matchingBindings.length > 0) {
      // There are partial matches, continue the sequence
      event.preventDefault();

      this.sequenceState = {
        currentSequence: newSequence,
        isWaitingForNext: true,
        matchingBindings,
      };

      this.emitSequenceEvent('sequence-started');

      // Set timeout to reset sequence
      this.timeout = setTimeout(() => {
        this.emitSequenceEvent('sequence-timeout');
        this.resetSequence();
      }, this.options.timeout);
    } else {
      // No matches, reset sequence
      this.resetSequence();
    }
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.resetSequence();
    }
  }

  cleanup(): void {
    this.resetSequence();
    this.actions.clear();
  }
}

/**
 * Hook for sequence shortcuts
 */
export function useSequenceShortcuts(
  bindings: HotkeyBinding[],
  actions: Map<string, HotkeyAction>,
  options: SequenceShortcutsOptions = {}
) {
  const managerRef = useRef<SequenceShortcutsManager | null>(null);

  // Initialize manager
  if (!managerRef.current) {
    managerRef.current = new SequenceShortcutsManager(options);
  }

  const manager = managerRef.current;

  // Filter sequence bindings
  const sequenceBindings = useMemo(
    () => bindings.filter(b => b.scope === 'sequence' && b.enabled && Array.isArray(b.keys)),
    [bindings]
  );

  // Register actions
  useEffect(() => {
    actions.forEach(action => {
      manager.registerAction(action);
    });

    return () => {
      manager.cleanup();
    };
  }, [actions, manager]);

  // Setup keyboard event listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      manager.handleKeyDown(event, sequenceBindings);
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [manager, sequenceBindings]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      manager.cleanup();
    };
  }, [manager]);

  return {
    sequenceState: manager.getSequenceState(),
    registeredBindings: sequenceBindings,
    availableActions: actions,
    resetSequence: () => manager.resetSequence(),
    setEnabled: (enabled: boolean) => manager.setEnabled(enabled),
  };
}

/**
 * Hook for listening to sequence events
 */
export function useSequenceEvents(
  onSequenceStarted?: (detail: any) => void,
  onSequenceCompleted?: (detail: any) => void,
  onSequenceTimeout?: (detail: any) => void,
  onSequenceReset?: (detail: any) => void
) {
  useEffect(() => {
    const handleSequenceEvent = (event: CustomEvent) => {
      const { type, ...detail } = event.detail;

      switch (type) {
        case 'sequence-started':
          onSequenceStarted?.(detail);
          break;
        case 'sequence-completed':
          onSequenceCompleted?.(detail);
          break;
        case 'sequence-timeout':
          onSequenceTimeout?.(detail);
          break;
        case 'sequence-reset':
          onSequenceReset?.(detail);
          break;
      }
    };

    document.addEventListener('hotkey-sequence-event', handleSequenceEvent as EventListener);

    return () => {
      document.removeEventListener('hotkey-sequence-event', handleSequenceEvent as EventListener);
    };
  }, [onSequenceStarted, onSequenceCompleted, onSequenceTimeout, onSequenceReset]);
}
