import type {
	Attachment,
	CreateNoteParams,
	CreateTagParams,
	Note,
	NoteFilters,
	NoteRelationship,
	NoteVersion,
	Setting,
	Tag,
	UpdateNoteParams,
} from "../types/database";
import type { FlexibleItem, CreateItemParams } from "../types/items";
import type { TreeData } from "../types";

// Storage backend type - SQLite only (export/import for file-based backup)
export type StorageBackend = "sqlite";

// Storage configuration
export interface StorageConfig {
	backend: StorageBackend;
	sqlite?: {
		database_path: string;
	};
}

// Storage operation results - discriminated union for type safety
export type StorageResult<T> =
	| { success: true; data: T }
	| { success: false; error: string };

// Specific type for void operations
export type VoidStorageResult =
	| { success: true }
	| { success: false; error: string };

// Core storage interface - clean and focused
export interface StorageAdapter {
	// Configuration
	init(): Promise<VoidStorageResult>;
	getConfig(): StorageConfig;

	// Notes operations
	getNotes(filters?: NoteFilters): Promise<StorageResult<Note[]>>;
	getNote(id: string): Promise<StorageResult<Note | null>>;
	createNote(params: CreateNoteParams): Promise<StorageResult<Note>>;
	updateNote(params: UpdateNoteParams): Promise<StorageResult<Note>>;
	deleteNote(id: string): Promise<VoidStorageResult>;
	searchNotes(
		query: string,
		filters?: NoteFilters
	): Promise<StorageResult<Note[]>>;

	// Items operations (books, sections - unified with notes)
	getAllItems(): Promise<StorageResult<FlexibleItem[]>>;
	createItem(params: CreateItemParams): Promise<StorageResult<FlexibleItem>>;
	updateItem(
		id: string,
		params: Partial<FlexibleItem>
	): Promise<StorageResult<FlexibleItem>>;
	deleteItem(id: string): Promise<VoidStorageResult>;

	// Full-text search for items
	searchItems(
		query: string,
		options?: { types?: Array<"note" | "book" | "section">; limit?: number }
	): Promise<StorageResult<FlexibleItem[]>>;

	// FTS index management
	rebuildSearchIndex(): Promise<VoidStorageResult>;

	// Tree operations
	getTreeData(): Promise<StorageResult<TreeData[]>>;
	moveTreeItem(
		itemId: string,
		itemType: "note" | "book" | "section",
		newParentId: string | null,
		insertIndex?: number
	): Promise<VoidStorageResult>;
	reorderTreeItem(
		itemId: string,
		itemType: "note" | "book" | "section",
		newIndex: number,
		parentId: string | null
	): Promise<VoidStorageResult>;

	// Tags operations
	getTags(): Promise<StorageResult<Tag[]>>;
	getTag(id: string): Promise<StorageResult<Tag | null>>;
	createTag(params: CreateTagParams): Promise<StorageResult<Tag>>;
	updateTag(
		id: string,
		params: Partial<CreateTagParams>
	): Promise<StorageResult<Tag>>;
	deleteTag(id: string): Promise<VoidStorageResult>;
	getTagNotes(tagId: string): Promise<StorageResult<Note[]>>;
	addNoteTag(noteId: string, tagId: string): Promise<VoidStorageResult>;
	removeNoteTag(noteId: string, tagId: string): Promise<VoidStorageResult>;

	// Note relationships
	getNoteRelationships(
		noteId: string
	): Promise<StorageResult<NoteRelationship[]>>;
	createNoteRelationship(
		sourceId: string,
		targetId: string,
		type: "reference" | "child" | "related",
		description?: string
	): Promise<StorageResult<NoteRelationship>>;
	deleteNoteRelationship(id: string): Promise<VoidStorageResult>;

	// Attachments
	getNoteAttachments(noteId: string): Promise<StorageResult<Attachment[]>>;
	createAttachment(
		noteId: string,
		filename: string,
		originalFilename: string,
		filePath: string,
		mimeType: string,
		size: number
	): Promise<StorageResult<Attachment>>;
	deleteAttachment(id: string): Promise<VoidStorageResult>;

	// Versioning
	getNoteVersions(noteId: string): Promise<StorageResult<NoteVersion[]>>;
	createNoteVersion(
		noteId: string,
		content: string,
		contentRaw?: string,
		comment?: string
	): Promise<StorageResult<NoteVersion>>;
	restoreNoteVersion(
		noteId: string,
		versionId: string
	): Promise<StorageResult<Note>>;

	// Settings
	getSettings(): Promise<StorageResult<Setting[]>>;
	getSetting(key: string): Promise<StorageResult<Setting | null>>;
	setSetting(key: string, value: string): Promise<StorageResult<Setting>>;
	deleteSetting(key: string): Promise<VoidStorageResult>;

	// Utility operations
	sync?(): Promise<VoidStorageResult>; // Optional - for cloud storage
	getStorageInfo(): Promise<
		StorageResult<{
			backend: StorageBackend;
			note_count: number;
			category_count: number;
			tag_count: number;
			attachment_count: number;
			last_sync?: string;
			storage_size?: number;
		}>
	>;
}
