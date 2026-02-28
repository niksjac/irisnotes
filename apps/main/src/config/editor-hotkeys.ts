/**
 * Editor Hotkeys Configuration
 *
 * This file exports ProseMirror editor hotkeys for display in the HotkeysView.
 * Overridable keybindings are derived from DEFAULT_EDITOR_KEYBINDINGS.
 * Non-overridable structural bindings are listed separately.
 */

import {
	DEFAULT_EDITOR_KEYBINDINGS,
	pmKeyToDisplay,
	type EditorKeybindings,
} from "./default-editor-keybindings";

export interface EditorHotkeyConfig {
	key: string; // Display-friendly key combination
	description: string;
	category: string;
}

/**
 * Non-overridable structural editor hotkeys (always the same key)
 */
const STRUCTURAL_HOTKEYS: EditorHotkeyConfig[] = [
	{ key: "Tab", description: "Indent (list item or text)", category: "Indentation" },
	{ key: "Shift+Tab", description: "Outdent (list item or text)", category: "Indentation" },
	{ key: "Enter", description: "New List Item / Split Block", category: "Lists" },
	{ key: "Ctrl+Click", description: "Open Link in Browser", category: "Links" },
	{ key: "Ctrl+Enter", description: "Open Link (when cursor on link)", category: "Links" },
];

/**
 * Build the ProseMirror hotkey display list from an EditorKeybindings config.
 * This allows the hotkeys view to show user-overridden keys.
 */
export function buildProsemirrorHotkeys(kb: EditorKeybindings): EditorHotkeyConfig[] {
	const overridable = Object.values(kb).map((def) => ({
		key: pmKeyToDisplay(def.key),
		description: def.description,
		category: def.category,
	}));
	return [...overridable, ...STRUCTURAL_HOTKEYS];
}

/**
 * ProseMirror editor hotkeys - default configuration for display
 */
export const PROSEMIRROR_HOTKEYS: EditorHotkeyConfig[] =
	buildProsemirrorHotkeys(DEFAULT_EDITOR_KEYBINDINGS);

/**
 * CodeMirror source editor hotkeys
 */
export const CODEMIRROR_HOTKEYS: EditorHotkeyConfig[] = [
	{ key: "Ctrl+Z", description: "Undo", category: "History" },
	{ key: "Ctrl+Y", description: "Redo", category: "History" },
	{ key: "Ctrl+/", description: "Toggle Line Comment", category: "Editing" },
	{
		key: "Ctrl+D",
		description: "Select Word / Next Occurrence",
		category: "Selection",
	},
	{ key: "Ctrl+F", description: "Find", category: "Search" },
	{ key: "Ctrl+H", description: "Find and Replace", category: "Search" },
	{ key: "Alt+↑", description: "Move Line Up", category: "Line Operations" },
	{ key: "Alt+↓", description: "Move Line Down", category: "Line Operations" },
	{
		key: "Alt+Shift+↑",
		description: "Copy Line Up",
		category: "Line Operations",
	},
	{
		key: "Alt+Shift+↓",
		description: "Copy Line Down",
		category: "Line Operations",
	},
];

/**
 * System/Browser hotkeys - common shortcuts for reference
 */
export const SYSTEM_HOTKEYS: EditorHotkeyConfig[] = [
	{ key: "Ctrl+C", description: "Copy", category: "Clipboard" },
	{ key: "Ctrl+X", description: "Cut", category: "Clipboard" },
	{ key: "Ctrl+V", description: "Paste", category: "Clipboard" },
	{
		key: "Ctrl+Shift+V",
		description: "Paste Without Formatting",
		category: "Clipboard",
	},
	{
		key: "Ctrl+A",
		description: "Smart Select All (line → paragraph → all)",
		category: "Selection",
	},
	{
		key: "Escape",
		description: "Close Modal / Cancel",
		category: "Navigation",
	},
	{ key: "F2", description: "Rename Selected Item", category: "Navigation" },
	{
		key: "Delete",
		description: "Delete Selected Item",
		category: "Navigation",
	},
	{ key: "↑/↓", description: "Navigate Tree", category: "Navigation" },
	{ key: "Enter", description: "Open Selected Item", category: "Navigation" },
];

/**
 * Group hotkeys by category
 */
export function groupHotkeysByCategory(
	hotkeys: EditorHotkeyConfig[]
): Record<string, EditorHotkeyConfig[]> {
	const grouped: Record<string, EditorHotkeyConfig[]> = {};
	for (const hotkey of hotkeys) {
		const category = hotkey.category;
		if (!(category in grouped)) {
			grouped[category] = [];
		}
		(grouped[category] as EditorHotkeyConfig[]).push(hotkey);
	}
	return grouped;
}
