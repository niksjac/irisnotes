import { useMemo } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import type { HotkeyAction, HotkeyBinding } from '../types';

export interface LocalShortcutsOptions {
	enableOnContentEditable?: boolean;
	enableOnFormTags?: boolean;
	enableOnTags?: string[];
	ignoredElementDataAttribute?: string;
	context?: string;
	scopes?: string[];
	splitKey?: string;
	ignoreModifiers?: boolean;
}

export class LocalShortcutsManager {
	private static actions = new Map<string, HotkeyAction>();

	static registerAction(action: HotkeyAction): void {
		LocalShortcutsManager.actions.set(action.id, action);
	}

	static unregisterAction(actionId: string): void {
		LocalShortcutsManager.actions.delete(actionId);
	}

	static getAction(actionId: string): HotkeyAction | undefined {
		return LocalShortcutsManager.actions.get(actionId);
	}

	static getAllActions(): Map<string, HotkeyAction> {
		return new Map(LocalShortcutsManager.actions);
	}

	static convertBindingToHotkeyFormat(binding: HotkeyBinding): string | null {
		if (Array.isArray(binding.keys)) {
			// Sequences handled separately
			return null;
		}

		// react-hotkeys-hook uses lowercase format
		return binding.keys.toLowerCase();
	}

	static getBindingOptions(binding: HotkeyBinding): LocalShortcutsOptions {
		return {
			enableOnContentEditable: binding.allowInInputs || false,
			enableOnFormTags: binding.allowInInputs || false,
			ignoreModifiers: false,
			...(binding.context && { context: binding.context }),
		};
	}

	static emitEvent(type: string, binding: HotkeyBinding): void {
		if (typeof window !== 'undefined') {
			const event = new CustomEvent('hotkey-event', {
				detail: {
					type,
					binding,
					scope: binding.scope,
					context: binding.context,
					timestamp: Date.now(),
				},
			});
			window.dispatchEvent(event);
		}
	}
}

/**
 * Hook for registering local shortcuts
 */
export function useLocalShortcuts(
	bindings: HotkeyBinding[],
	actions: Map<string, HotkeyAction>,
	options: LocalShortcutsOptions = {}
) {
	// Filter bindings for local scope only
	const localBindings = useMemo(
		() =>
			bindings.filter(
				b => (b.scope === 'local' || b.scope === 'editor') && b.enabled && !Array.isArray(b.keys) // Exclude sequences
			),
		[bindings]
	);

	// Create handlers for each binding
	const handlers = useMemo(() => {
		const handlerMap = new Map<string, () => void>();

		localBindings.forEach(binding => {
			const action = actions.get(binding.action);
			if (action) {
				const handler = () => {
					try {
						action.handler(binding.payload);
						LocalShortcutsManager.emitEvent('executed', binding);
					} catch (error) {
						console.error(`Error executing local shortcut ${binding.id}:`, error);
					}
				};
				handlerMap.set(binding.id, handler);
			}
		});

		return handlerMap;
	}, [localBindings, actions]);

	// Create a combined keys string and handler for react-hotkeys-hook
	const combinedKeys = useMemo(() => {
		const keysList: string[] = [];
		localBindings.forEach(binding => {
			const keys = LocalShortcutsManager.convertBindingToHotkeyFormat(binding);
			if (keys) {
				keysList.push(keys);
			}
		});
		return keysList.join(',');
	}, [localBindings]);

	// Single useHotkeys call with combined handler
	const combinedHandler = useMemo(() => {
		return (_keyEvent: KeyboardEvent, hotkey: any) => {
			// Find the matching binding based on the triggered hotkey
			const matchingBinding = localBindings.find(binding => {
				const keys = LocalShortcutsManager.convertBindingToHotkeyFormat(binding);
				return keys === hotkey.keys?.join('+')?.toLowerCase();
			});

			if (matchingBinding) {
				const handler = handlers.get(matchingBinding.id);
				if (handler) {
					handler();
				}
			}
		};
	}, [localBindings, handlers]);

	// Apply default options from bindings
	const mergedOptions = useMemo(() => {
		const firstBinding = localBindings[0];
		const defaultOptions = firstBinding ? LocalShortcutsManager.getBindingOptions(firstBinding) : {};

		return {
			...defaultOptions,
			...options,
			preventDefault: true,
		};
	}, [localBindings, options]);

	// Register the combined shortcuts
	useHotkeys(combinedKeys, combinedHandler, mergedOptions, [combinedHandler, combinedKeys]);

	return {
		registeredBindings: localBindings,
		availableActions: actions,
	};
}

/**
 * Hook for context-specific shortcuts
 */
export function useContextualShortcuts(
	context: string,
	bindings: HotkeyBinding[],
	actions: Map<string, HotkeyAction>,
	options: LocalShortcutsOptions = {}
) {
	// Filter bindings for specific context
	const contextualBindings = useMemo(
		() => bindings.filter(b => b.context === context && b.enabled && !Array.isArray(b.keys)),
		[bindings, context]
	);

	return useLocalShortcuts(contextualBindings, actions, {
		...options,
		context,
	});
}

/**
 * Hook for editor-specific shortcuts
 */
export function useEditorShortcuts(
	bindings: HotkeyBinding[],
	actions: Map<string, HotkeyAction>,
	options: LocalShortcutsOptions = {}
) {
	const editorBindings = useMemo(
		() => bindings.filter(b => b.scope === 'editor' && b.enabled && !Array.isArray(b.keys)),
		[bindings]
	);

	const editorOptions: LocalShortcutsOptions = {
		enableOnContentEditable: true,
		enableOnFormTags: true,
		...options,
	};

	return useLocalShortcuts(editorBindings, actions, editorOptions);
}

/**
 * Hook for navigation shortcuts
 */
export function useNavigationShortcuts(
	bindings: HotkeyBinding[],
	actions: Map<string, HotkeyAction>,
	options: LocalShortcutsOptions = {}
) {
	const navigationBindings = useMemo(
		() => bindings.filter(b => b.category === 'navigation' && b.enabled && !Array.isArray(b.keys)),
		[bindings]
	);

	const navigationOptions: LocalShortcutsOptions = {
		enableOnContentEditable: false,
		enableOnFormTags: false,
		...options,
	};

	return useLocalShortcuts(navigationBindings, actions, navigationOptions);
}
