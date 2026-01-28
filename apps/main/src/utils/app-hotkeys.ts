/**
 * App-level hotkey detection for CodeMirror integration
 * 
 * This module provides a function to check if a keyboard event matches
 * an app-level hotkey that should propagate to react-hotkeys-hook handlers
 * instead of being consumed by CodeMirror.
 * 
 * The hotkey patterns are dynamically updated when user hotkey config changes,
 * ensuring custom keybindings work correctly in CodeMirror contexts.
 */

import { DEFAULT_HOTKEYS } from "@/config/default-hotkeys";
import type { HotkeyMapping } from "@/types";

/**
 * Parsed hotkey pattern for efficient matching
 */
interface ParsedHotkey {
	key: string;
	ctrl: boolean;
	shift: boolean;
	alt: boolean;
}

/**
 * Parse a hotkey string (e.g., "ctrl+shift+e") into a structured format
 */
function parseHotkeyString(hotkeyStr: string): ParsedHotkey {
	const parts = hotkeyStr.toLowerCase().split("+");
	const key = parts[parts.length - 1] ?? "";
	
	return {
		key,
		ctrl: parts.includes("ctrl") || parts.includes("meta") || parts.includes("mod"),
		shift: parts.includes("shift"),
		alt: parts.includes("alt"),
	};
}

/**
 * Parse a HotkeyMapping into an array of ParsedHotkey patterns
 */
function parseHotkeyMapping(mapping: HotkeyMapping): ParsedHotkey[] {
	return Object.values(mapping)
		.filter(config => config.global !== false) // Include all global hotkeys
		.map(config => parseHotkeyString(config.key));
}

/**
 * Current hotkey patterns - starts with defaults, updated when user config loads
 * This is a module-level variable that gets updated by updateAppHotkeyPatterns()
 */
let currentHotkeyPatterns: ParsedHotkey[] = parseHotkeyMapping(DEFAULT_HOTKEYS);

/**
 * Update the app hotkey patterns when hotkey configuration changes
 * Call this from useHotkeysConfig when hotkeys are loaded/updated
 * 
 * @param hotkeys - The merged hotkey mapping (defaults + user overrides)
 */
export function updateAppHotkeyPatterns(hotkeys: HotkeyMapping): void {
	currentHotkeyPatterns = parseHotkeyMapping(hotkeys);
}

/**
 * Check if a keyboard event matches an app-level hotkey
 * 
 * App-level hotkeys are those defined in the hotkey config that control
 * the application (layout, navigation, etc.) rather than editor content.
 * 
 * This function is used by CodeMirror to determine which keyboard events
 * should propagate to the app's hotkey handlers instead of being consumed.
 * 
 * @param e - The keyboard event to check
 * @returns true if the event matches an app hotkey, false otherwise
 */
export function isAppHotkey(e: KeyboardEvent): boolean {
	const key = e.key.toLowerCase();
	const ctrl = e.ctrlKey || e.metaKey;
	const shift = e.shiftKey;
	const alt = e.altKey;
	
	// Special handling for Tab key - these are for tab switching
	// and should work in editors too (Ctrl+Tab, Ctrl+Shift+Tab)
	if (key === "tab" && ctrl) {
		return true;
	}
	
	// Check against all parsed hotkey patterns
	return currentHotkeyPatterns.some(pattern => {
		// Match the key
		if (pattern.key !== key) return false;
		
		// Match modifier keys exactly
		if (pattern.ctrl !== ctrl) return false;
		if (pattern.shift !== shift) return false;
		if (pattern.alt !== alt) return false;
		
		return true;
	});
}

/**
 * Get all app hotkey patterns for debugging/display
 */
export function getAppHotkeyPatterns(): ParsedHotkey[] {
	return [...currentHotkeyPatterns];
}
