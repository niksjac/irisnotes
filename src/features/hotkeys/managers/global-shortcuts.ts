import { isRegistered, register, unregister } from '@tauri-apps/plugin-global-shortcut';
import type { GlobalShortcutRegistration, HotkeyAction, HotkeyBinding } from '../types';

export class GlobalShortcutsManager {
	private registrations = new Map<string, GlobalShortcutRegistration>();
	private actions = new Map<string, HotkeyAction>();
	private isEnabled = true;

	constructor() {
		this.setupErrorHandling();
	}

	private setupErrorHandling() {
		// Handle app shutdown cleanup
		if (typeof window !== 'undefined') {
			window.addEventListener('beforeunload', () => {
				this.cleanup();
			});
		}
	}

	/**
	 * Register a global shortcut
	 */
	async registerShortcut(binding: HotkeyBinding, action: HotkeyAction): Promise<boolean> {
		if (!this.isEnabled || binding.scope !== 'global') {
			return false;
		}

		try {
			// Convert keys to Tauri format
			const shortcut = this.convertKeysToTauriFormat(binding.keys);
			if (!shortcut) {
				console.warn(`Invalid shortcut format for binding: ${binding.id}`);
				return false;
			}

			// Check if already registered
			if (await isRegistered(shortcut)) {
				console.warn(`Shortcut ${shortcut} is already registered`);
				return false;
			}

			// Create handler
			const handler = async () => {
				try {
					await action.handler(binding.payload);
					this.emitEvent('executed', binding);
				} catch (error) {
					console.error(`Error executing global shortcut ${binding.id}:`, error);
				}
			};

			// Register with Tauri
			await register(shortcut, handler);

			// Store registration
			const registration: GlobalShortcutRegistration = {
				id: binding.id,
				shortcut,
				handler,
			};

			this.registrations.set(binding.id, registration);
			this.actions.set(action.id, action);

			console.log(`Registered global shortcut: ${binding.id} (${shortcut})`);
			this.emitEvent('registered', binding);

			return true;
		} catch (error) {
			console.error(`Failed to register global shortcut ${binding.id}:`, error);
			return false;
		}
	}

	/**
	 * Unregister a global shortcut
	 */
	async unregisterShortcut(bindingId: string): Promise<boolean> {
		const registration = this.registrations.get(bindingId);
		if (!registration) {
			return false;
		}

		try {
			await unregister(registration.shortcut);
			this.registrations.delete(bindingId);

			console.log(`Unregistered global shortcut: ${bindingId}`);
			this.emitEvent('unregistered', undefined, bindingId);

			return true;
		} catch (error) {
			console.error(`Failed to unregister global shortcut ${bindingId}:`, error);
			return false;
		}
	}

	/**
	 * Update a global shortcut
	 */
	async updateShortcut(binding: HotkeyBinding, action: HotkeyAction): Promise<boolean> {
		// Unregister old shortcut
		await this.unregisterShortcut(binding.id);

		// Register new shortcut
		return await this.registerShortcut(binding, action);
	}

	/**
	 * Register multiple shortcuts
	 */
	async registerShortcuts(bindings: HotkeyBinding[], actions: Map<string, HotkeyAction>): Promise<void> {
		const globalBindings = bindings.filter(b => b.scope === 'global' && b.enabled);

		for (const binding of globalBindings) {
			const action = actions.get(binding.action);
			if (action) {
				await this.registerShortcut(binding, action);
			} else {
				console.warn(`No action found for global shortcut: ${binding.id}`);
			}
		}
	}

	/**
	 * Clean up all registered shortcuts
	 */
	async cleanup(): Promise<void> {
		const registrationIds = Array.from(this.registrations.keys());

		for (const id of registrationIds) {
			await this.unregisterShortcut(id);
		}

		this.registrations.clear();
		this.actions.clear();
	}

	/**
	 * Enable or disable global shortcuts
	 */
	setEnabled(enabled: boolean): void {
		this.isEnabled = enabled;

		if (!enabled) {
			this.cleanup();
		}
	}

	/**
	 * Get all registered shortcuts
	 */
	getRegistrations(): Map<string, GlobalShortcutRegistration> {
		return new Map(this.registrations);
	}

	/**
	 * Check if a shortcut is registered
	 */
	isShortcutRegistered(bindingId: string): boolean {
		return this.registrations.has(bindingId);
	}

	/**
	 * Convert hotkey format to Tauri global shortcut format
	 */
	private convertKeysToTauriFormat(keys: string | string[]): string | null {
		if (Array.isArray(keys)) {
			// Sequences not supported for global shortcuts
			return null;
		}

		// Convert from react-hotkeys-hook format to Tauri format
		let shortcut = keys.toLowerCase();

		// Map common modifiers
		shortcut = shortcut.replace(/mod\+/g, this.getPlatformModifier() + '+');
		shortcut = shortcut.replace(/ctrl\+/g, 'CommandOrControl+');
		shortcut = shortcut.replace(/cmd\+/g, 'Command+');
		shortcut = shortcut.replace(/alt\+/g, 'Option+');
		shortcut = shortcut.replace(/shift\+/g, 'Shift+');

		// Map special keys
		shortcut = shortcut.replace(/plus/g, 'Plus');
		shortcut = shortcut.replace(/minus/g, 'Minus');
		shortcut = shortcut.replace(/equal/g, 'Equal');
		shortcut = shortcut.replace(/space/g, 'Space');
		shortcut = shortcut.replace(/enter/g, 'Return');
		shortcut = shortcut.replace(/escape/g, 'Escape');
		shortcut = shortcut.replace(/tab/g, 'Tab');
		shortcut = shortcut.replace(/backspace/g, 'Backspace');

		// Convert function keys
		shortcut = shortcut.replace(/f(\d+)/g, 'F$1');

		// Capitalize first letter of non-modifier keys
		const parts = shortcut.split('+');
		const lastPart = parts[parts.length - 1];
		if (lastPart && lastPart.length === 1 && /[a-z]/.test(lastPart)) {
			parts[parts.length - 1] = lastPart.toUpperCase();
			shortcut = parts.join('+');
		}

		return shortcut;
	}

	/**
	 * Get platform-specific modifier
	 */
	private getPlatformModifier(): string {
		if (typeof window !== 'undefined' && window.navigator) {
			const platform = window.navigator.platform.toLowerCase();
			if (platform.includes('mac')) {
				return 'Command';
			}
		}
		return 'CommandOrControl';
	}

	/**
	 * Emit hotkey events (for integration with main hotkey system)
	 */
	private emitEvent(type: string, binding?: HotkeyBinding, bindingId?: string): void {
		if (typeof window !== 'undefined') {
			const event = new CustomEvent('hotkey-event', {
				detail: {
					type,
					binding,
					bindingId,
					scope: 'global',
					timestamp: Date.now(),
				},
			});
			window.dispatchEvent(event);
		}
	}
}

// Singleton instance
export const globalShortcutsManager = new GlobalShortcutsManager();
