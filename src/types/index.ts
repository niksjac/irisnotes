// Re-export database types for backward compatibility
export type {
	AppSettings,
	BackupData,
	Category,
	CategoryWithNotes,
	CreateCategoryParams,
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
	ContextMenuPosition,
	ContextMenuData,
	TreeContextData,
	EditorContextData,
	ContextMenuType,
} from "./context-menu";

// Storage configuration types
export interface StorageSettings {
	backend: "sqlite" | "file-system" | "cloud"; // Available storage backends
	sqlite?: {
		database_path: string;
	};
	fileSystem?: {
		notes_directory: string;
	};
	cloud?: {
		provider: "google-drive" | "dropbox" | "onedrive";
		credentials?: any; // Provider-specific credentials
	};
}

export interface AppConfig {
	editor: {
		lineWrapping: boolean;
		toolbarVisible: boolean;
	};
	debug: {
		enableExampleNote: boolean;
	};
	storage: StorageSettings;
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
	| "folder-view"
	| "editor-rich-view"
	| "editor-source-view"
	| "welcome-view";

// Tree view types
export interface TreeData {
	id: string;
	name: string;
	type?: "note" | "category";
	children?: TreeData[];
	data?: {
		id: string;
		name: string;
		type?: "note" | "category";
	};
}

// Pane and Tab types
export interface Tab {
	id: string;
	title: string;
	viewType: ViewType;
	viewData?: any; // For note IDs, folder IDs, etc.
	isDirty?: boolean;
	canClose?: boolean;
}

export interface PaneState {
	count: 1 | 2; // 1 or 2 panes
	activePane: 0 | 1; // 0 or 1
	splitDirection: 'horizontal'; // Future: could add vertical
}

// Test comment for prettier hook
