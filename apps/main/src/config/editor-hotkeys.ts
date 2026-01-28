/**
 * Editor Hotkeys Configuration
 *
 * This file exports all ProseMirror editor hotkeys for display in the HotkeysView.
 * These are keyboard shortcuts that work within the rich text editor.
 */

export interface EditorHotkeyConfig {
	key: string; // Display-friendly key combination
	description: string;
	category: string;
}

/**
 * ProseMirror editor hotkeys - formatting and editing commands
 */
export const PROSEMIRROR_HOTKEYS: EditorHotkeyConfig[] = [
	// Text formatting (marks)
	{ key: "Ctrl+B", description: "Bold", category: "Formatting" },
	{ key: "Ctrl+I", description: "Italic", category: "Formatting" },
	{ key: "Ctrl+`", description: "Inline Code", category: "Formatting" },
	{ key: "Ctrl+U", description: "Underline", category: "Formatting" },
	{ key: "Ctrl+Shift+S", description: "Strikethrough", category: "Formatting" },
	{
		key: "Ctrl+Shift+L",
		description: "Convert URL to Link",
		category: "Formatting",
	},

	// Block formatting
	// Note: No heading shortcuts - use font size instead
	{ key: "Ctrl+Shift+0", description: "Paragraph", category: "Blocks" },
	{ key: "Alt+L", description: "Bullet List", category: "Blocks" },
	{ key: "Alt+O", description: "Numbered List", category: "Blocks" },
	{ key: "Ctrl+Shift+.", description: "Blockquote", category: "Blocks" },
	{ key: "Ctrl+Shift+C", description: "Code Block", category: "Blocks" },

	// Line operations
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
	{
		key: "Shift+Delete",
		description: "Delete Line",
		category: "Line Operations",
	},
	{
		key: "Ctrl+D",
		description: "Select Word / Next Occurrence",
		category: "Line Operations",
	},
	{
		key: "Ctrl+Shift+D",
		description: "Select Previous Occurrence",
		category: "Line Operations",
	},
	{
		key: "Ctrl+A",
		description: "Smart Select All (progressive)",
		category: "Line Operations",
	},

	// History
	{ key: "Ctrl+Z", description: "Undo", category: "History" },
	{ key: "Ctrl+Y", description: "Redo", category: "History" },
	{
		key: "Ctrl+Shift+Z",
		description: "Redo (alternative)",
		category: "History",
	},

	// Lists & Indentation
	{ key: "Tab", description: "Indent (list item or text)", category: "Indentation" },
	{ key: "Shift+Tab", description: "Outdent (list item or text)", category: "Indentation" },
	{
		key: "Enter",
		description: "New List Item / Split Block",
		category: "Lists",
	},

	// Links
	{ key: "Ctrl+Click", description: "Open Link in Browser", category: "Links" },
	{
		key: "Ctrl+Enter",
		description: "Open Link (when cursor on link)",
		category: "Links",
	},
];

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
