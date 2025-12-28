import type { HotkeyMapping, HotkeyConfig } from "@/types";

/**
 * Default hotkey configuration mapping
 * These are the default key combinations that can be overridden by user configuration
 */
export const DEFAULT_HOTKEYS: HotkeyMapping = {
	// Layout hotkeys
	toggleSidebar: {
		key: "ctrl+b",
		description: "Toggle Notes Sidebar",
		category: "Layout",
		global: true,
	},
	toggleActivityBar: {
		key: "ctrl+j",
		description: "Toggle Activity Bar",
		category: "Layout",
		global: true,
	},

	// Tab hotkeys
	closeTab: {
		key: "ctrl+w",
		description: "Close Active Tab",
		category: "Tabs",
		global: true,
	},
	newTab: {
		key: "ctrl+t",
		description: "New Tab",
		category: "Tabs",
		global: true,
	},
	moveTabLeft: {
		key: "ctrl+shift+alt+left",
		description: "Move Tab Left",
		category: "Tabs",
		global: true,
	},
	moveTabRight: {
		key: "ctrl+shift+alt+right",
		description: "Move Tab Right",
		category: "Tabs",
		global: true,
	},

	// Pane hotkeys
	toggleDualPane: {
		key: "ctrl+d",
		description: "Toggle Dual Pane Mode",
		category: "Panes",
		global: true,
	},

	// Editor hotkeys
	toggleEditorView: {
		key: "ctrl+e",
		description: "Toggle Editor View (Rich/Source)",
		category: "Editor",
		global: true,
	},
	toggleLineWrapping: {
		key: "alt+z",
		description: "Toggle Line Wrapping",
		category: "Editor",
		global: true,
	},
	paneResizeLeft: {
		key: "alt+left",
		description: "Resize Pane Left",
		category: "Panes",
		global: true,
	},
	paneResizeRight: {
		key: "alt+right",
		description: "Resize Pane Right",
		category: "Panes",
		global: true,
	},

	// Sidebar resizing hotkeys
	sidebarResizeLeft: {
		key: "ctrl+left",
		description: "Resize Sidebar Left",
		category: "Sidebar",
		global: true,
	},
	sidebarResizeRight: {
		key: "ctrl+right",
		description: "Resize Sidebar Right",
		category: "Sidebar",
		global: true,
	},

	// Pane focus hotkeys
	focusPane1: {
		key: "ctrl+alt+1",
		description: "Focus Pane 1",
		category: "Focus",
		global: true,
	},
	focusPane2: {
		key: "ctrl+alt+2",
		description: "Focus Pane 2",
		category: "Focus",
		global: true,
	},

	// Tab movement between panes
	moveTabToPaneLeft: {
		key: "ctrl+alt+left",
		description: "Move Tab to Left Pane",
		category: "Tab Movement",
		global: true,
	},
	moveTabToPaneRight: {
		key: "ctrl+alt+right",
		description: "Move Tab to Right Pane",
		category: "Tab Movement",
		global: true,
	},

	// Tab focus by number
	focusTab1: {
		key: "ctrl+1",
		description: "Focus Tab 1",
		category: "Tab Focus",
		global: true,
	},
	focusTab2: {
		key: "ctrl+2",
		description: "Focus Tab 2",
		category: "Tab Focus",
		global: true,
	},
	focusTab3: {
		key: "ctrl+3",
		description: "Focus Tab 3",
		category: "Tab Focus",
		global: true,
	},
	focusTab4: {
		key: "ctrl+4",
		description: "Focus Tab 4",
		category: "Tab Focus",
		global: true,
	},
	focusTab5: {
		key: "ctrl+5",
		description: "Focus Tab 5",
		category: "Tab Focus",
		global: true,
	},
	focusTab6: {
		key: "ctrl+6",
		description: "Focus Tab 6",
		category: "Tab Focus",
		global: true,
	},
	focusTab7: {
		key: "ctrl+7",
		description: "Focus Tab 7",
		category: "Tab Focus",
		global: true,
	},
	focusTab8: {
		key: "ctrl+8",
		description: "Focus Tab 8",
		category: "Tab Focus",
		global: true,
	},
	focusTab9: {
		key: "ctrl+9",
		description: "Focus Tab 9",
		category: "Tab Focus",
		global: true,
	},

	// Tab navigation
	focusNextTab: {
		key: "ctrl+tab",
		description: "Focus Next Tab",
		category: "Tab Navigation",
		global: true,
	},
	focusPreviousTab: {
		key: "ctrl+shift+tab",
		description: "Focus Previous Tab",
		category: "Tab Navigation",
		global: true,
	},

	// Focus hotkeys
	focusTreeView: {
		key: "ctrl+shift+e",
		description: "Focus Tree View",
		category: "Focus",
		global: true,
	},

	// App hotkeys
	refreshApp: {
		key: "f5",
		description: "Refresh Application",
		category: "App",
		global: true,
	},
};

/**
 * Get all hotkey categories for organization
 */
export const getHotkeyCategories = (): string[] => {
	const categories = new Set<string>();
	Object.values(DEFAULT_HOTKEYS).forEach((hotkey) => {
		categories.add(hotkey.category);
	});
	return Array.from(categories).sort();
};

/**
 * Get hotkeys by category
 */
export const getHotkeysByCategory = (
	mapping: HotkeyMapping = DEFAULT_HOTKEYS
): Record<string, Array<{ action: string; config: HotkeyConfig }>> => {
	const byCategory: Record<
		string,
		Array<{ action: string; config: HotkeyConfig }>
	> = {};

	Object.entries(mapping).forEach(([action, config]) => {
		if (!byCategory[config.category]) {
			byCategory[config.category] = [];
		}
		byCategory[config.category]?.push({ action, config });
	});

	return byCategory;
};
