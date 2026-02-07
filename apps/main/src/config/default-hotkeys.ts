import type { HotkeyMapping, HotkeyConfig } from "@/types";

/**
 * Default hotkey configuration mapping
 * These are the default key combinations that can be overridden by user configuration
 */
export const DEFAULT_HOTKEYS: HotkeyMapping = {
	// Layout hotkeys
	toggleSidebar: {
		key: "ctrl+g",
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
	expandActivityBar: {
		key: "ctrl+shift+j",
		description: "Expand/Collapse Activity Bar",
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
	reopenLastClosedTab: {
		key: "ctrl+shift+t",
		description: "Reopen Last Closed Tab",
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
		key: "ctrl+alt+d",
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
	toggleToolbar: {
		key: "f9",
		description: "Toggle Editor Toolbar",
		category: "Editor",
		global: true,
	},
	toggleTitleBar: {
		key: "f8",
		description: "Toggle Note Title Bar",
		category: "Editor",
		global: true,
	},
	increaseFontSize: {
		key: "ctrl+alt+up",
		description: "Increase Editor Font Size",
		category: "Editor",
		global: true,
	},
	decreaseFontSize: {
		key: "ctrl+alt+down",
		description: "Decrease Editor Font Size",
		category: "Editor",
		global: true,
	},
	paneResizeLeft: {
		key: "alt+comma",
		description: "Resize Pane Left",
		category: "Panes",
		global: true,
	},
	paneResizeRight: {
		key: "alt+period",
		description: "Resize Pane Right",
		category: "Panes",
		global: true,
	},

	// Sidebar resizing hotkeys
	sidebarResizeLeft: {
		key: "ctrl+comma",
		description: "Resize Sidebar Left",
		category: "Sidebar",
		global: true,
	},
	sidebarResizeRight: {
		key: "ctrl+period",
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
	focusNextSpawnedTab: {
		key: "alt+right",
		description: "Focus Next Tab (by Open Order)",
		category: "Tab Navigation",
		global: true,
	},
	focusPreviousSpawnedTab: {
		key: "alt+left",
		description: "Focus Previous Tab (by Open Order)",
		category: "Tab Navigation",
		global: true,
	},

	// Focus hotkeys
	focusTreeView: {
		key: "f8",
		description: "Focus Tree View",
		category: "Focus",
		global: true,
	},
	focusEditor: {
		key: "f10",
		description: "Focus Editor",
		category: "Focus",
		global: true,
	},
	toggleEditorTreeFocus: {
		key: "f6",
		description: "Toggle Focus: Editor ↔ Tree View",
		category: "Focus",
		global: true,
	},
	focusToolbar: {
		key: "f7",
		description: "Focus Toolbar",
		category: "Focus",
		global: true,
	},
	focusEditorTitle: {
		key: "ctrl+alt+t",
		description: "Focus Note Title",
		category: "Focus",
		global: true,
	},
	focusTabBar: {
		key: "ctrl+alt+o",
		description: "Focus Tab Bar",
		category: "Focus",
		global: true,
	},

	// Tab bar visibility
	toggleTabBar: {
		key: "ctrl+alt+b",
		description: "Toggle Tab Bar Visibility",
		category: "Layout",
		global: true,
	},

	// App hotkeys
	refreshApp: {
		key: "f5",
		description: "Refresh Application",
		category: "App",
		global: true,
	},

	// Views hotkeys
	openSettings: {
		key: "ctrl+shift+comma",
		description: "Open Settings",
		category: "Views",
		global: true,
	},
	openHotkeys: {
		key: "ctrl+shift+period",
		description: "Open Keyboard Shortcuts",
		category: "Views",
		global: true,
	},
	showQuickHotkeys: {
		key: "f1",
		description: "Show Quick Hotkeys Reference",
		category: "Views",
		global: true,
	},

	// Notes hotkeys
	newNote: {
		key: "ctrl+n",
		description: "Create New Note",
		category: "Notes",
		global: true,
	},
	newNoteWithLocation: {
		key: "ctrl+alt+n",
		description: "Create New Note (Pick Location)",
		category: "Notes",
		global: true,
	},

	// Search hotkeys
	quickSearch: {
		key: "ctrl+p",
		description: "Quick Search (by note name)",
		category: "Search",
		global: true,
	},
	fullTextSearch: {
		key: "ctrl+shift+f",
		description: "Full Text Search (in content)",
		category: "Search",
		global: true,
	},

	// Tree view hotkeys
	revealActiveInTree: {
		key: "ctrl+shift+e",
		description: "Reveal Active Note in Tree View",
		category: "Tree View",
		global: true,
	},
	toggleHoist: {
		key: "ctrl+h",
		description: "Hoist/Unhoist Selected Book or Section",
		category: "Tree View",
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
