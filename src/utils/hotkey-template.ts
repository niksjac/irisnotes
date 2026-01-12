import { DEFAULT_HOTKEYS } from "@/config/default-hotkeys";

/**
 * Generate a complete hotkeys template with all available actions
 * Users can copy this to hotkeys.toml and modify only what they want to change
 */
export function generateHotkeyTemplate(): string {
	const template = {
		_comment:
			"Copy this file to 'hotkeys.toml' and customize the key combinations you want to change. Remove any hotkeys you want to keep as defaults.",
		...DEFAULT_HOTKEYS,
	};

	return JSON.stringify(template, null, 2);
}

/**
 * Get a simplified list of all available hotkey actions with their current bindings
 * Useful for documentation or UI display
 */
export function getAvailableHotkeyActions(): Array<{
	action: string;
	key: string;
	description: string;
	category: string;
}> {
	return Object.entries(DEFAULT_HOTKEYS).map(([action, config]) => ({
		action,
		key: config.key,
		description: config.description,
		category: config.category,
	}));
}

/**
 * Validate a user's hotkey configuration
 */
export function validateHotkeyConfig(userConfig: any): {
	valid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	if (typeof userConfig !== "object" || userConfig === null) {
		return {
			valid: false,
			errors: ["Configuration must be a valid JSON object"],
		};
	}

	// Check each hotkey configuration
	Object.entries(userConfig).forEach(([action, config]: [string, any]) => {
		// Skip comments
		if (action.startsWith("_")) return;

		// Check if action exists in defaults
		if (!(action in DEFAULT_HOTKEYS)) {
			errors.push(`Unknown action: ${action}`);
			return;
		}

		// Validate config structure
		if (typeof config !== "object" || config === null) {
			errors.push(`Action ${action}: configuration must be an object`);
			return;
		}

		// Required fields
		if (!config.key || typeof config.key !== "string") {
			errors.push(`Action ${action}: missing or invalid 'key' field`);
		}

		if (!config.description || typeof config.description !== "string") {
			errors.push(`Action ${action}: missing or invalid 'description' field`);
		}

		if (!config.category || typeof config.category !== "string") {
			errors.push(`Action ${action}: missing or invalid 'category' field`);
		}

		// Optional but should be boolean if present
		if (config.global !== undefined && typeof config.global !== "boolean") {
			errors.push(`Action ${action}: 'global' field must be a boolean`);
		}

		// Basic key format validation
		if (config.key && typeof config.key === "string") {
			const keyPattern = /^(ctrl\+|shift\+|alt\+|meta\+)*[a-z0-9]+$/;
			if (!keyPattern.test(config.key.toLowerCase())) {
				errors.push(
					`Action ${action}: invalid key format '${config.key}'. Use lowercase with + separators (e.g., 'ctrl+shift+a')`
				);
			}
		}
	});

	return {
		valid: errors.length === 0,
		errors,
	};
}
