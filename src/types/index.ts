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
} from './database';

// Storage configuration types
export interface StorageSettings {
	backend: 'sqlite' | 'file-system' | 'cloud'; // Available storage backends
	sqlite?: {
		database_path: string;
	};
	fileSystem?: {
		notes_directory: string;
	};
	cloud?: {
		provider: 'google-drive' | 'dropbox' | 'onedrive';
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
export type PaneId = 'left' | 'right';

export type ViewType =
	| 'config-view'
	| 'hotkeys-view'
	| 'folder-view'
	| 'editor-rich-view'
	| 'editor-source-view'
	| 'welcome-view';

export interface ContentProps {
	paneId?: PaneId | undefined;
}

// Test comment for prettier hook
