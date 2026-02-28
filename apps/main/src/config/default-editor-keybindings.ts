/**
 * Default ProseMirror Editor Keybindings
 *
 * These define the default keyboard shortcuts for the rich text editor.
 * Users can override these in hotkeys.toml under the [editor] section.
 *
 * Key format follows ProseMirror conventions:
 *   Mod- = Ctrl on Linux/Windows, Cmd on Mac
 *   Shift-, Alt- can be combined: "Mod-Shift-s"
 *   Arrow keys: ArrowUp, ArrowDown, ArrowLeft, ArrowRight
 *   Special: Delete, Backspace, Enter, Escape, Tab, Space
 */

export interface EditorKeybindingDef {
	key: string; // ProseMirror key string (e.g., "Mod-b")
	description: string;
	category: string;
}

/**
 * All overridable editor keybinding action IDs
 */
export type EditorKeybindingId =
	// Formatting
	| "bold"
	| "italic"
	| "code"
	| "underline"
	| "strikethrough"
	| "linkify"
	// Blocks
	| "paragraph"
	| "bulletList"
	| "orderedList"
	| "blockquote"
	| "codeBlock"
	// Indentation
	| "indent"
	| "outdent"
	// Line Operations
	| "moveLineUp"
	| "moveLineDown"
	| "copyLineUp"
	| "copyLineDown"
	| "selectWord"
	| "selectPrevious"
	| "deleteLine"
	| "smartSelectAll"
	// History
	| "undo"
	| "redo"
	// Search
	| "findInNote";

export type EditorKeybindings = Record<EditorKeybindingId, EditorKeybindingDef>;
export type EditorKeybindingOverrides = Partial<Record<EditorKeybindingId, string>>;

export const DEFAULT_EDITOR_KEYBINDINGS: EditorKeybindings = {
	// Formatting (marks)
	bold: { key: "Mod-b", description: "Bold", category: "Formatting" },
	italic: { key: "Mod-i", description: "Italic", category: "Formatting" },
	code: { key: "Mod-`", description: "Inline Code", category: "Formatting" },
	underline: {
		key: "Mod-u",
		description: "Underline",
		category: "Formatting",
	},
	strikethrough: {
		key: "Mod-Shift-s",
		description: "Strikethrough",
		category: "Formatting",
	},
	linkify: {
		key: "Mod-Shift-l",
		description: "Convert URL to Link",
		category: "Formatting",
	},

	// Block formatting
	paragraph: {
		key: "Mod-Shift-0",
		description: "Paragraph",
		category: "Blocks",
	},
	bulletList: {
		key: "Alt-l",
		description: "Bullet List",
		category: "Blocks",
	},
	orderedList: {
		key: "Alt-o",
		description: "Numbered List",
		category: "Blocks",
	},
	blockquote: {
		key: "Mod-Shift-.",
		description: "Blockquote",
		category: "Blocks",
	},
	codeBlock: {
		key: "Mod-Shift-c",
		description: "Code Block",
		category: "Blocks",
	},

	// Indentation (Mod key shortcuts; Tab/Shift-Tab are structural and always bound)
	indent: { key: "Mod-]", description: "Indent", category: "Indentation" },
	outdent: { key: "Mod-[", description: "Outdent", category: "Indentation" },

	// Line Operations
	moveLineUp: {
		key: "Alt-ArrowUp",
		description: "Move Line Up",
		category: "Line Operations",
	},
	moveLineDown: {
		key: "Alt-ArrowDown",
		description: "Move Line Down",
		category: "Line Operations",
	},
	copyLineUp: {
		key: "Shift-Alt-ArrowUp",
		description: "Copy Line Up",
		category: "Line Operations",
	},
	copyLineDown: {
		key: "Shift-Alt-ArrowDown",
		description: "Copy Line Down",
		category: "Line Operations",
	},
	selectWord: {
		key: "Mod-d",
		description: "Select Word / Next Occurrence",
		category: "Line Operations",
	},
	selectPrevious: {
		key: "Mod-Shift-d",
		description: "Select Previous Occurrence",
		category: "Line Operations",
	},
	deleteLine: {
		key: "Shift-Delete",
		description: "Delete Line",
		category: "Line Operations",
	},
	smartSelectAll: {
		key: "Mod-a",
		description: "Smart Select All (progressive)",
		category: "Line Operations",
	},

	// History
	undo: { key: "Mod-z", description: "Undo", category: "History" },
	redo: { key: "Mod-y", description: "Redo", category: "History" },

	// Search
	findInNote: {
		key: "Mod-f",
		description: "Find in Note",
		category: "Search",
	},
};

/**
 * Convert a ProseMirror key string to a human-readable display format.
 * e.g., "Mod-Shift-s" → "Ctrl+Shift+S", "Alt-ArrowUp" → "Alt+↑"
 */
export function pmKeyToDisplay(pmKey: string): string {
	const parts = pmKey.split("-");
	const displayParts = parts.map((part) => {
		if (part === "Mod") return "Ctrl";
		if (part === "Shift") return "Shift";
		if (part === "Alt") return "Alt";
		if (part === "ArrowUp") return "↑";
		if (part === "ArrowDown") return "↓";
		if (part === "ArrowLeft") return "←";
		if (part === "ArrowRight") return "→";
		if (part === "Delete") return "Delete";
		if (part === "Backspace") return "Backspace";
		if (part === "Enter") return "Enter";
		if (part === "Escape") return "Escape";
		if (part === "Tab") return "Tab";
		if (part === "Space") return "Space";
		// Single letter keys → uppercase
		if (part.length === 1 && /[a-z]/i.test(part)) return part.toUpperCase();
		return part;
	});
	return displayParts.join("+");
}

/**
 * Merge user overrides with default keybindings.
 * Only the `key` field is overridden; description/category are preserved.
 */
export function mergeEditorKeybindings(
	overrides: EditorKeybindingOverrides,
): EditorKeybindings {
	const merged = { ...DEFAULT_EDITOR_KEYBINDINGS };
	for (const [id, key] of Object.entries(overrides)) {
		if (id in merged && key) {
			merged[id as EditorKeybindingId] = {
				...merged[id as EditorKeybindingId],
				key,
			};
		}
	}
	return merged;
}
