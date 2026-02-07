// Re-export database types for backward compatibility
export type {
	AppSettings,
	BackupData,
	CreateNoteParams,
	CreateTagParams,
	DatabaseInfo,
	Note,
	NoteFilters,
	NoteSortOptions,
	NoteWithRelations,
	SearchResult,
	Tag,
	TagWithNotes,
	UpdateNoteParams,
} from "./database";

// Re-export context menu types
export type {
	MenuItem,
	MenuGroup,
	RightClickMenuPosition,
	RightClickMenuData,
	TreeRightClickData,
	EditorRightClickData,
	RightClickMenuType,
} from "./right-click-menu";

// Hotkey configuration types
export interface HotkeyConfig {
	key: string; // Key combination like "ctrl+b", "ctrl+shift+alt+left"
	description: string; // Human-readable description
	category: string; // Category for organization
	global?: boolean; // Whether hotkey works in form fields
}

export interface HotkeyMapping {
	// Layout hotkeys
	toggleSidebar: HotkeyConfig;
	toggleActivityBar: HotkeyConfig;
	expandActivityBar: HotkeyConfig;

	// Tab hotkeys
	closeTab: HotkeyConfig;
	reopenLastClosedTab: HotkeyConfig;
	newTab: HotkeyConfig;
	moveTabLeft: HotkeyConfig;
	moveTabRight: HotkeyConfig;

	// Pane hotkeys
	toggleDualPane: HotkeyConfig;
	paneResizeLeft: HotkeyConfig;
	paneResizeRight: HotkeyConfig;

	// Editor hotkeys
	toggleEditorView: HotkeyConfig;
	toggleLineWrapping: HotkeyConfig;
	toggleToolbar: HotkeyConfig;
	toggleTitleBar: HotkeyConfig;

	// Sidebar resizing hotkeys
	sidebarResizeLeft: HotkeyConfig;
	sidebarResizeRight: HotkeyConfig;

	// Pane focus hotkeys
	focusPane1: HotkeyConfig;
	focusPane2: HotkeyConfig;

	// Tab movement between panes
	moveTabToPaneLeft: HotkeyConfig;
	moveTabToPaneRight: HotkeyConfig;

	// Tab focus by number
	focusTab1: HotkeyConfig;
	focusTab2: HotkeyConfig;
	focusTab3: HotkeyConfig;
	focusTab4: HotkeyConfig;
	focusTab5: HotkeyConfig;
	focusTab6: HotkeyConfig;
	focusTab7: HotkeyConfig;
	focusTab8: HotkeyConfig;
	focusTab9: HotkeyConfig;

	// Tab navigation
	focusNextTab: HotkeyConfig;
	focusPreviousTab: HotkeyConfig;
	focusNextSpawnedTab: HotkeyConfig;
	focusPreviousSpawnedTab: HotkeyConfig;

	// Focus hotkeys
	focusTreeView: HotkeyConfig;
	focusEditor: HotkeyConfig;
	toggleEditorTreeFocus: HotkeyConfig;
	focusToolbar: HotkeyConfig;
	focusEditorTitle: HotkeyConfig;
	focusTabBar: HotkeyConfig;

	// Tab bar visibility
	toggleTabBar: HotkeyConfig;

	// App hotkeys
	refreshApp: HotkeyConfig;

	// Views hotkeys
	openSettings: HotkeyConfig;
	openHotkeys: HotkeyConfig;
	showQuickHotkeys: HotkeyConfig;

	// Notes hotkeys
	newNote: HotkeyConfig;
	newNoteWithLocation: HotkeyConfig;

	// Font size hotkeys
	increaseFontSize: HotkeyConfig;
	decreaseFontSize: HotkeyConfig;

	// Search hotkeys
	quickSearch: HotkeyConfig;
	fullTextSearch: HotkeyConfig;

	// Tree view hotkeys
	revealActiveInTree: HotkeyConfig;
	toggleHoist: HotkeyConfig;
}

export interface AppHotkeysProps {
	// Layout hotkeys
	onToggleSidebar?: () => void;
	onToggleActivityBar?: () => void;
	onExpandActivityBar?: () => void;

	// Tab hotkeys
	onCloseTab?: () => void;
	onReopenLastClosedTab?: () => void;
	onNewTab?: () => void;
	onMoveTabLeft?: () => void;
	onMoveTabRight?: () => void;

	// Pane hotkeys
	onToggleDualPane?: () => void;
	onPaneResizeLeft?: () => void;
	onPaneResizeRight?: () => void;

	// Sidebar resizing hotkeys
	onSidebarResizeLeft?: () => void;
	onSidebarResizeRight?: () => void;

	// Pane focus hotkeys
	onFocusPane1?: () => void;
	onFocusPane2?: () => void;

	// Tab movement between panes hotkeys
	onMoveTabToPaneLeft?: () => void;
	onMoveTabToPaneRight?: () => void;

	// Tab focus by number hotkeys
	onFocusTab1?: () => void;
	onFocusTab2?: () => void;
	onFocusTab3?: () => void;
	onFocusTab4?: () => void;
	onFocusTab5?: () => void;
	onFocusTab6?: () => void;
	onFocusTab7?: () => void;
	onFocusTab8?: () => void;
	onFocusTab9?: () => void;

	// Tab navigation hotkeys
	onFocusNextTab?: () => void;
	onFocusPreviousTab?: () => void;
	onFocusNextSpawnedTab?: () => void;
	onFocusPreviousSpawnedTab?: () => void;

	// Focus hotkeys
	onFocusTreeView?: () => void;
	onFocusEditor?: () => void;
	onToggleEditorTreeFocus?: () => void;
	onFocusToolbar?: () => void;
	onFocusEditorTitle?: () => void;
	onFocusTabBar?: () => void;

	// Tab bar visibility
	onToggleTabBar?: () => void;

	// App hotkeys
	onRefreshApp?: () => void;

	// Editor hotkeys
	onToggleEditorView?: () => void;
	onToggleLineWrapping?: () => void;
	onToggleToolbar?: () => void;
	onToggleTitleBar?: () => void;
	onIncreaseFontSize?: () => void;
	onDecreaseFontSize?: () => void;

	// Editor hotkeys (future)
	// onSave?: () => void;
	// onUndo?: () => void;
	// onRedo?: () => void;

	// Navigation hotkeys (future)
	// onFocusEditor?: () => void;
	// onFocusSidebar?: () => void;

	// Notes hotkeys
	onNewNote?: () => void;
	onNewNoteWithLocation?: () => void;

	// Views hotkeys
	onOpenSettings?: () => void;
	onOpenHotkeys?: () => void;
	onShowQuickHotkeys?: () => void;

	// Search hotkeys
	onQuickSearch?: () => void;
	onFullTextSearch?: () => void;

	// Tree view hotkeys
	onRevealActiveInTree?: () => void;
	onToggleHoist?: () => void;
}

// Storage configuration types
export interface StorageSettings {
	backend: "sqlite"; // SQLite only - use export/import for file-based backup
	sqlite?: {
		database_path: string;
	};
}

export interface AppConfig {
	theme?: "light" | "dark" | "system"; // Theme mode setting
	editor: {
		lineWrapping: boolean;
		toolbarVisible: boolean;
		titleBarVisible?: boolean;
	};
	debug: {
		enableExampleNote: boolean;
	};
	storage: StorageSettings;
	hotkeys?: HotkeyMapping; // Optional hotkey configuration
	layout?: {
		sidebarWidth?: number;
		activityBarVisible?: boolean;
		sidebarCollapsed?: boolean;
	};
	development: {
		useLocalConfig: boolean;
		configPath: string;
	};
	production: {
		customConfigPath?: string;
		customDatabasePath?: string;
		customNotesPath?: string;
	};
}

// UI and Layout types
export type ViewType =
	| "config-view"
	| "hotkeys-view"
	| "editor-rich-view"
	| "editor-source-view"
	| "section-view"
	| "book-view"
	| "empty-view";

// Tree view types
export interface TreeData {
	id: string;
	name: string;
	type: "note" | "book" | "section";
	parent_id?: string | null;
	sort_order: string; // Fractional index string for sync-safe ordering
	custom_icon?: string | null;
	custom_text_color?: string | null;
	is_pinned?: boolean | null;
	children?: TreeData[];
	data?: {
		id: string;
		name: string;
		type: "note" | "book" | "section";
	};
}

// Pane and Tab types
export interface Tab {
	id: string;
	title: string;
	viewType: ViewType;
	viewData?: any; // For note IDs, folder IDs, etc.
	isDirty?: boolean;
	editorMode?: "rich" | "source"; // Track which editor view to use
	openedAt: number; // Timestamp when tab was opened (for spawn-order navigation)
}

export interface PaneState {
	count: 1 | 2; // 1 or 2 panes
	activePane: 0 | 1; // 0 or 1
	splitDirection: "horizontal"; // Future: could add vertical
}

// Test comment for prettier hook
