import { invoke } from '@tauri-apps/api/core';

/**
 * Open app config folder in system file manager
 */
export async function openAppConfigFolder(): Promise<void> {
	try {
		await invoke('open_app_config_folder');
	} catch (error) {
		console.error('Failed to open app config folder:', error);

		// Fallback: emit custom event for React components to handle
		if (typeof window !== 'undefined') {
			const event = new CustomEvent('hotkey-open-config', {
				detail: {
					action: 'open-app-config-folder',
					error,
					timestamp: Date.now(),
				},
			});
			window.dispatchEvent(event);
		}
	}
}
