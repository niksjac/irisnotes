// Database schema types for IrisNotes
// These interfaces match the SQLite database schema

export interface Note {
	id: string;
	title: string;
	content: string;
	content_type: "html" | "markdown" | "plain" | "custom";
	content_raw?: string | null; // original custom format when content_type is 'custom'
	created_at: string;
	updated_at: string;
	deleted_at?: string | null;
	is_pinned: boolean;
	is_archived: boolean;
	word_count: number;
	character_count: number;
	content_plaintext: string;
	sort_order: number;
	parent_category_id?: string | null; // NEW: Direct parent-child relationship for tree views
}

export interface Category {
	id: string;
	name: string;
	description: string;
	color?: string | null;
	icon?: string | null;
	parent_id?: string | null;
	sort_order: number;
	created_at: string;
	updated_at: string;
}

export interface Tag {
	id: string;
	name: string;
	color?: string | null;
	description: string;
	created_at: string;
	updated_at: string;
}

export interface NoteCategory {
	note_id: string;
	category_id: string;
	created_at: string;
}

export interface NoteTag {
	note_id: string;
	tag_id: string;
	created_at: string;
}

export interface NoteRelationship {
	id: string;
	source_note_id: string;
	target_note_id: string;
	relationship_type: "reference" | "child" | "related";
	description: string;
	created_at: string;
}

export interface Attachment {
	id: string;
	note_id: string;
	filename: string;
	original_filename: string;
	file_path: string;
	mime_type: string;
	file_size: number;
	created_at: string;
}

export interface NoteVersion {
	id: string;
	note_id: string;
	title: string;
	content: string;
	version_number: number;
	created_at: string;
}

export interface Setting {
	key: string;
	value: string;
	created_at: string;
	updated_at: string;
}

// Extended types with relationships
export interface NoteWithRelations extends Note {
	categories?: Category[];
	tags?: Tag[];
	attachments?: Attachment[];
	parent_notes?: Note[];
	child_notes?: Note[];
	related_notes?: Note[];
}

export interface CategoryWithNotes extends Category {
	notes?: Note[];
	subcategories?: Category[];
	parent_category?: Category;
}

export interface TagWithNotes extends Tag {
	notes?: Note[];
}

// Search and filter types
export interface SearchResult {
	note: Note;
	score: number;
	highlights: {
		title?: string;
		content?: string;
	};
}

export interface NoteFilters {
	categories?: string[];
	tags?: string[];
	is_pinned?: boolean;
	is_archived?: boolean;
	date_range?: {
		start: string;
		end: string;
	};
	search_query?: string;
}

export interface NoteSortOptions {
	field: "created_at" | "updated_at" | "title" | "word_count";
	direction: "asc" | "desc";
}

// Database operation types
export interface CreateNoteParams {
	title?: string;
	content?: string;
	content_type?: "html" | "markdown" | "plain" | "custom";
	content_raw?: string; // original custom format when content_type is 'custom'
	category_ids?: string[];
	tag_ids?: string[];
}

export interface UpdateNoteParams {
	id: string;
	title?: string;
	content?: string;
	content_type?: "html" | "markdown" | "plain" | "custom";
	content_raw?: string; // original custom format when content_type is 'custom'
	is_pinned?: boolean;
	is_archived?: boolean;
}

export interface CreateCategoryParams {
	name: string;
	description?: string;
	color?: string;
	icon?: string;
	parent_id?: string;
	sort_order?: number;
}

export interface CreateTagParams {
	name: string;
	color?: string;
	description?: string;
}

// App configuration types
export interface AppSettings {
	theme: string;
	editor_mode: "rich" | "source" | "split";
	line_wrapping: boolean;
	auto_save: boolean;
	auto_save_interval: number;
	show_word_count: boolean;
	default_category: string;
}

// Migration and backup types
export interface DatabaseInfo {
	version: number;
	created_at: string;
	last_backup: string;
	note_count: number;
	category_count: number;
	tag_count: number;
}

export interface BackupData {
	notes: Note[];
	categories: Category[];
	tags: Tag[];
	note_categories: NoteCategory[];
	note_tags: NoteTag[];
	note_relationships: NoteRelationship[];
	settings: Setting[];
	created_at: string;
	version: string;
}
