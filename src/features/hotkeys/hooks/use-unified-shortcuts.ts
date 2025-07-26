import React from 'react';
import { useApplicationShortcuts } from '../managers/hotkey-manager';
import { hotkeyActions } from '../actions';
import { HotkeyManagerOptions } from '../types';

interface UseUnifiedShortcutsProps {
  onToggleSidebar?: () => void;
  onToggleActivityBar?: () => void;
  onToggleDualPane?: () => void;
  onReloadNote?: () => void;
  onToggleLineWrapping?: () => void;
  onIncreaseFontSize?: () => void;
  onDecreaseFontSize?: () => void;
  options?: HotkeyManagerOptions;
}

/**
 * Unified shortcuts hook that provides a simplified API for common hotkey actions.
 * This hook provides backward compatibility while using the new hotkey system.
 */
export function useUnifiedShortcuts({
  onToggleSidebar,
  onToggleActivityBar,
  onToggleDualPane,
  onReloadNote,
  onToggleLineWrapping,
  onIncreaseFontSize,
  onDecreaseFontSize,
  options = {},
}: UseUnifiedShortcutsProps = {}) {
  // Use the new application shortcuts system
  const { configuration, localShortcuts, sequenceShortcuts, registeredActions } = useApplicationShortcuts(
    hotkeyActions,
    {
      enableGlobal: true,
      enableLocal: true,
      enableSequences: true,
      sequenceTimeout: 2000,
      preventConflicts: true,
      ...options,
    }
  );

  // Set up event listeners for backward compatibility
  // This allows existing components to still use callback props
  React.useEffect(() => {
    const handleHotkeyEvent = (event: CustomEvent) => {
      const { binding } = event.detail;

      if (!binding) return;

      switch (binding.action) {
        case 'toggle-sidebar':
          onToggleSidebar?.();
          break;
        case 'toggle-activity-bar':
          onToggleActivityBar?.();
          break;
        case 'toggle-dual-pane':
          onToggleDualPane?.();
          break;
        case 'reload-note':
          onReloadNote?.();
          break;
        case 'toggle-line-wrapping':
          onToggleLineWrapping?.();
          break;
        case 'increase-font-size':
          onIncreaseFontSize?.();
          break;
        case 'decrease-font-size':
          onDecreaseFontSize?.();
          break;
      }
    };

    window.addEventListener('hotkey-event', handleHotkeyEvent as EventListener);

    return () => {
      window.removeEventListener('hotkey-event', handleHotkeyEvent as EventListener);
    };
  }, [
    onToggleSidebar,
    onToggleActivityBar,
    onToggleDualPane,
    onReloadNote,
    onToggleLineWrapping,
    onIncreaseFontSize,
    onDecreaseFontSize,
  ]);

  return {
    configuration,
    localShortcuts,
    sequenceShortcuts,
    registeredActions,

    // For debugging and monitoring
    getActiveBindings: () => configuration.bindings.filter(b => b.enabled),
    getGlobalBindings: () => configuration.bindings.filter(b => b.scope === 'global' && b.enabled),
    getLocalBindings: () => configuration.bindings.filter(b => b.scope === 'local' && b.enabled),
    getSequenceBindings: () => configuration.bindings.filter(b => b.scope === 'sequence' && b.enabled),
  };
}

// Re-export for backward compatibility
export { useUnifiedShortcuts as useShortcuts };
