import type { Schema } from "prosemirror-model";
import type { Plugin } from "prosemirror-state";
import { keymap } from "prosemirror-keymap";
import { history } from "prosemirror-history";
import { baseKeymap, toggleMark, setBlockType, wrapIn } from "prosemirror-commands";
import { wrapInList, liftListItem, sinkListItem } from "prosemirror-schema-list";
import { dropCursor } from "prosemirror-dropcursor";
import { gapCursor } from "prosemirror-gapcursor";
import { buildInputRules } from "prosemirror-example-setup";
import { buildKeymap } from "prosemirror-example-setup";
import { autolinkPlugin, linkifySelection } from "./plugins/autolink";
import { tightSelectionPlugin } from "./plugins/tight-selection";
import { customCursorPlugin } from "./plugins/custom-cursor";
import { lineCommandsKeymap } from "./plugins/line-commands";

interface SetupOptions {
	schema: Schema;
	history?: boolean;
	// App shortcuts that should be handled by the app, not the editor
	appShortcuts?: string[];
}

/**
 * Custom ProseMirror setup that avoids conflicts with app-level shortcuts
 */
export function customSetup(options: SetupOptions): Plugin[] {
	const plugins: Plugin[] = [];

	// App-aware keymap (must come first to intercept app shortcuts)
	const appShortcuts = options.appShortcuts || [
		"Mod-b", // Toggle sidebar
		"Mod-j", // Toggle activity bar
		"Mod-w", // Close tab
		"Mod-t", // New tab
		"Mod-d", // Toggle dual pane
		"Mod-e", // Toggle editor view
	];

	const appShortcutBindings: { [key: string]: () => boolean } = {};
	appShortcuts.forEach((key) => {
		appShortcutBindings[key] = () => false; // Return false to let event bubble
	});
	plugins.push(keymap(appShortcutBindings));

	// Input rules (markdown-style shortcuts)
	plugins.push(buildInputRules(options.schema));

	// Editor keybindings (but excluding app shortcuts)
	const editorKeymap = buildKeymap(options.schema, {});

	// Remove app shortcuts from editor keymap
	const filteredKeymap: { [key: string]: any } = {};
	Object.keys(editorKeymap).forEach((key) => {
		if (!appShortcuts.includes(key)) {
			filteredKeymap[key] = editorKeymap[key];
		}
	});
	plugins.push(keymap(filteredKeymap));

	// Base keymap (arrows, enter, backspace, etc.)
	plugins.push(keymap(baseKeymap));

	// History (undo/redo)
	if (options.history !== false) {
		plugins.push(history());
	}

	// Drop cursor (shows where dragged content will drop)
	plugins.push(dropCursor());

	// Gap cursor (allows cursor in hard-to-reach places like between blocks)
	plugins.push(gapCursor());

	// Tight selection (VS Code / Notion style - only highlights actual text)
	plugins.push(tightSelectionPlugin());

	// Custom cursor (VS Code style - configurable width, color, animation)
	plugins.push(customCursorPlugin());

	// Auto-link URLs as you type + Ctrl+Click/Ctrl+Enter to open
	plugins.push(...autolinkPlugin(options.schema));

	// Custom keybindings for extended marks
	const customKeybindings: { [key: string]: any } = {
		// Linkify URL at cursor
		"Mod-Shift-l": linkifySelection(options.schema),
	};

	// Add underline shortcut if mark exists
	if (options.schema.marks.underline) {
		customKeybindings["Mod-u"] = toggleMark(options.schema.marks.underline);
	}

	// Add strikethrough shortcut if mark exists
	if (options.schema.marks.strikethrough) {
		customKeybindings["Mod-Shift-s"] = toggleMark(
			options.schema.marks.strikethrough
		);
	}

	// Block formatting shortcuts
	const { nodes } = options.schema;

	// Headings: Ctrl+Shift+1/2/3
	if (nodes.heading) {
		customKeybindings["Mod-Shift-1"] = setBlockType(nodes.heading, { level: 1 });
		customKeybindings["Mod-Shift-2"] = setBlockType(nodes.heading, { level: 2 });
		customKeybindings["Mod-Shift-3"] = setBlockType(nodes.heading, { level: 3 });
	}

	// Paragraph: Ctrl+Shift+0
	if (nodes.paragraph) {
		customKeybindings["Mod-Shift-0"] = setBlockType(nodes.paragraph);
	}

	// Lists: Ctrl+Shift+8 (bullet), Ctrl+Shift+9 (ordered)
	if (nodes.bullet_list) {
		customKeybindings["Mod-Shift-8"] = wrapInList(nodes.bullet_list);
	}
	if (nodes.ordered_list) {
		customKeybindings["Mod-Shift-9"] = wrapInList(nodes.ordered_list);
	}

	// List indent/outdent: Ctrl+] / Ctrl+[
	if (nodes.list_item) {
		customKeybindings["Mod-]"] = sinkListItem(nodes.list_item);
		customKeybindings["Mod-["] = liftListItem(nodes.list_item);
	}

	// Blockquote: Ctrl+Shift+.
	if (nodes.blockquote) {
		customKeybindings["Mod-Shift-."] = wrapIn(nodes.blockquote);
	}

	// Code block: Ctrl+Shift+C
	if (nodes.code_block) {
		customKeybindings["Mod-Shift-c"] = setBlockType(nodes.code_block);
	}

	plugins.push(keymap(customKeybindings));

	// Line commands (Alt+Up/Down to move lines, Alt+Shift+Up/Down to copy, etc.)
	plugins.push(keymap(lineCommandsKeymap));

	return plugins;
}
