import type { Schema } from "prosemirror-model";
import type { Plugin } from "prosemirror-state";
import { keymap } from "prosemirror-keymap";
import { history } from "prosemirror-history";
import { baseKeymap } from "prosemirror-commands";
import { dropCursor } from "prosemirror-dropcursor";
import { gapCursor } from "prosemirror-gapcursor";
import { buildInputRules } from "prosemirror-example-setup";
import { buildKeymap } from "prosemirror-example-setup";

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

	return plugins;
}
