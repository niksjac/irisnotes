import { useAtom, useSetAtom } from 'jotai';
import { useCallback, useEffect, useMemo } from 'react';
import { addEventAtom, hotkeyConfigurationAtom, registeredActionsAtom } from '../atoms';
import type { HotkeyAction, HotkeyBinding, HotkeyEvent, HotkeyManagerOptions } from '../types';
import { globalShortcutsManager } from './global-shortcuts';
import {
	useContextualShortcuts,
	useEditorShortcuts,
	useLocalShortcuts,
	useNavigationShortcuts,
} from './local-shortcuts';
import { useSequenceEvents, useSequenceShortcuts } from './sequence-shortcuts';

export class HotkeyManager {
	private static instance: HotkeyManager | null = null;
	private isInitialized = false;
	private options: HotkeyManagerOptions;

	constructor(options: HotkeyManagerOptions = {}) {
		this.options = {
			enableGlobal: true,
			enableLocal: true,
			enableSequences: true,
			sequenceTimeout: 2000,
			preventConflicts: true,
			...options,
		};
	}

	static getInstance(options?: HotkeyManagerOptions): HotkeyManager {
		if (!HotkeyManager.instance) {
			HotkeyManager.instance = new HotkeyManager(options);
		}
		return HotkeyManager.instance;
	}

	async initialize(actions: HotkeyAction[]): Promise<void> {
		if (this.isInitialized) return;

		try {
			// Register all actions
			for (const action of actions) {
				await this.registerAction(action);
			}

			this.isInitialized = true;
			console.log('HotkeyManager initialized successfully');
		} catch (error) {
			console.error('Failed to initialize HotkeyManager:', error);
			throw error;
		}
	}

	async registerAction(_action: HotkeyAction): Promise<void> {
		// This would be called from the Jotai context
		// Implementation handled by the React hooks
	}

	async unregisterAction(_actionId: string): Promise<void> {
		// Implementation handled by the React hooks
	}

	getConfiguration(): HotkeyManagerOptions {
		return { ...this.options };
	}

	updateConfiguration(newOptions: Partial<HotkeyManagerOptions>): void {
		this.options = { ...this.options, ...newOptions };
	}
}

/**
 * Main hook for using the hotkey system
 */
export function useHotkeyManager(actions: HotkeyAction[], options: HotkeyManagerOptions = {}) {
	const [configuration] = useAtom(hotkeyConfigurationAtom);
	const [registeredActions, setRegisteredActions] = useAtom(registeredActionsAtom);
	const addEvent = useSetAtom(addEventAtom);

	// Create actions map
	const actionsMap = useMemo(() => {
		const map = new Map<string, HotkeyAction>();
		actions.forEach(action => map.set(action.id, action));
		return map;
	}, [actions]);

	// Register actions in state
	useEffect(() => {
		const newActions = new Map(registeredActions);
		actions.forEach(action => {
			newActions.set(action.id, action);
		});
		setRegisteredActions(newActions);

		return () => {
			const cleanedActions = new Map(registeredActions);
			actions.forEach(action => {
				cleanedActions.delete(action.id);
			});
			setRegisteredActions(cleanedActions);
		};
	}, [actions, registeredActions, setRegisteredActions]);

	// Setup global shortcuts
	useEffect(() => {
		if (!options.enableGlobal) return;

		const setupGlobalShortcuts = async () => {
			try {
				await globalShortcutsManager.cleanup();
				await globalShortcutsManager.registerShortcuts(configuration.bindings, actionsMap);
			} catch (error) {
				console.error('Failed to setup global shortcuts:', error);
			}
		};

		setupGlobalShortcuts();

		return () => {
			globalShortcutsManager.cleanup();
		};
	}, [configuration.bindings, actionsMap, options.enableGlobal]);

	// Event logging
	const logEvent = useCallback(
		(type: string, binding?: HotkeyBinding, context?: string) => {
			if (!binding) return;

			const event: HotkeyEvent = {
				type: type as any,
				binding,
				...(context && { context }),
				timestamp: Date.now(),
			};
			addEvent(event);
		},
		[addEvent]
	);

	// Listen to global hotkey events
	useEffect(() => {
		const handleHotkeyEvent = (event: CustomEvent) => {
			const { type, binding, context } = event.detail;
			logEvent(type, binding, context);
		};

		window.addEventListener('hotkey-event', handleHotkeyEvent as EventListener);

		return () => {
			window.removeEventListener('hotkey-event', handleHotkeyEvent as EventListener);
		};
	}, [logEvent]);

	return {
		configuration,
		registeredActions: actionsMap,
		logEvent,
		manager: HotkeyManager.getInstance(options),
	};
}

/**
 * Hook for application-level shortcuts (combines all types)
 */
export function useApplicationShortcuts(actions: HotkeyAction[], options: HotkeyManagerOptions = {}) {
	const { configuration, registeredActions, logEvent } = useHotkeyManager(actions, options);

	// Local shortcuts
	const localShortcuts = useLocalShortcuts(configuration.bindings, registeredActions, {
		enableOnContentEditable: false,
		enableOnFormTags: false,
	});

	// Sequence shortcuts
	const sequenceShortcuts = useSequenceShortcuts(configuration.bindings, registeredActions, {
		timeout: options.sequenceTimeout || 2000,
		enableOnContentEditable: false,
		enableOnFormTags: false,
	});

	// Listen to sequence events
	useSequenceEvents(
		detail => logEvent('sequence-started', detail.binding),
		detail => logEvent('sequence-completed', detail.binding),
		detail => logEvent('sequence-timeout', detail.binding),
		detail => logEvent('sequence-reset', detail.binding)
	);

	return {
		configuration,
		localShortcuts,
		sequenceShortcuts,
		registeredActions,
		logEvent,
	};
}

/**
 * Hook for editor-specific shortcuts
 */
export function useEditorShortcutsManager(actions: HotkeyAction[]) {
	const { configuration, registeredActions } = useHotkeyManager(actions);

	const editorShortcuts = useEditorShortcuts(configuration.bindings, registeredActions, {
		enableOnContentEditable: true,
		enableOnFormTags: true,
	});

	return {
		configuration,
		editorShortcuts,
		registeredActions,
	};
}

/**
 * Hook for navigation shortcuts
 */
export function useNavigationShortcutsManager(actions: HotkeyAction[]) {
	const { configuration, registeredActions } = useHotkeyManager(actions);

	const navigationShortcuts = useNavigationShortcuts(configuration.bindings, registeredActions, {
		enableOnContentEditable: false,
		enableOnFormTags: false,
	});

	return {
		configuration,
		navigationShortcuts,
		registeredActions,
	};
}

/**
 * Hook for context-specific shortcuts
 */
export function useContextShortcuts(context: string, actions: HotkeyAction[]) {
	const { configuration, registeredActions } = useHotkeyManager(actions);

	const contextShortcuts = useContextualShortcuts(context, configuration.bindings, registeredActions, {
		enableOnContentEditable: false,
		enableOnFormTags: false,
		context,
	});

	return {
		configuration,
		contextShortcuts,
		registeredActions,
	};
}

// Export singleton instance
export const hotkeyManager = HotkeyManager.getInstance();
