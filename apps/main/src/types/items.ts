// Core types for the unified items system
// Pure type definitions - no logic

export type ItemType = "note" | "book" | "section";

export interface FlexibleItem {
	id: string;
	type: ItemType;
	title: string;

	// Content fields (primarily for notes)
	content?: string;
	content_type?: "html" | "markdown" | "plain" | "custom";
	content_raw?: string | null;
	content_plaintext?: string;

	// Hierarchy
	parent_id?: string | null;
	sort_order: string; // Fractional index string for sync-safe ordering

	// Flexible metadata - JSON column for experimentation
	metadata: Record<string, any>;

	// Standard fields
	created_at: string;
	updated_at: string;
	deleted_at?: string | null;
}

// Metadata interface for common fields (optional structure)
export interface ItemMetadata {
	// Appearance customization
	custom_icon?: string;
	custom_text_color?: string;
	custom_background_color?: string;

	// Note-specific metadata
	is_pinned?: boolean;
	is_archived?: boolean;
	word_count?: number;
	character_count?: number;

	// Book/Section metadata
	description?: string;
	author?: string;
	tags?: string[];
	difficulty?: "beginner" | "intermediate" | "advanced";
	estimated_time?: string;
	progress?: number;

	// Any other experimental fields
	[key: string]: any;
}

// Parameters for creating items
export interface CreateItemParams {
	type: ItemType;
	title: string;
	content?: string;
	content_type?: "html" | "markdown" | "plain" | "custom";
	content_raw?: string;
	parent_id?: string | null;
	sort_order?: number;
	metadata?: Record<string, any>;
}

// Parameters for updating items
export interface UpdateItemParams {
	id: string;
	title?: string;
	content?: string;
	content_type?: "html" | "markdown" | "plain" | "custom";
	content_raw?: string;
	parent_id?: string | null;
	metadata?: Record<string, any>;
	is_pinned?: boolean;
	is_archived?: boolean;
}
