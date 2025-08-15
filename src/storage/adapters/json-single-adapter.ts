// JSON Single File Storage Adapter
// Stores all data in a single JSON file for rapid prototyping

import type {
	Attachment,
	CreateNoteParams,
	Note,
	NoteFilters,
	NoteRelationship,
	NoteVersion,
	Setting,
	Tag,
	UpdateNoteParams,
} from "../../types/database";
import type {
	StorageAdapter,
	StorageConfig,
	StorageResult,
	VoidStorageResult,
} from "../types";
import type { TreeData } from "../../types";
import type { FlexibleItem, CreateItemParams } from "../../types/items";
import { canBeChildOf } from "../hierarchy";

interface JsonStorageData {
	items: FlexibleItem[];
	tags: Tag[];
	settings: Setting[];
	version: string;
	last_modified: string;
}

/**
 * JSON Single File Storage Adapter
 * All data stored in one JSON file for easy inspection and rapid prototyping
 */
export class JsonSingleStorageAdapter implements StorageAdapter {
	private config: StorageConfig;
	private data: JsonStorageData;
	private filePath: string;

	constructor(config: StorageConfig) {
		this.config = config;
		this.filePath = config.jsonSingle?.file_path || './dev/storage.json';
		this.data = this.getDefaultData();
	}

	private getDefaultData(): JsonStorageData {
		return {
			items: [],
			tags: [],
			settings: [],
			version: '1.0.0',
			last_modified: new Date().toISOString(),
		};
	}

	async init(): Promise<VoidStorageResult> {
		try {
			await this.loadData();
			return { success: true };
		} catch (error) {
			console.error("❌ Failed to initialize JSON storage:", error);
			return {
				success: false,
				error: `Failed to initialize storage: ${error}`,
			};
		}
	}

	private async loadData(): Promise<void> {
		try {
			// TODO: Implement actual file loading with Tauri fs API
			// For now, start with default data and add some samples
			console.log("📁 Loading JSON storage from:", this.filePath);
			this.data = this.getDefaultData();
			this.addSampleData();
		} catch (error) {
			console.warn("⚠️ Could not load existing data, starting fresh:", error);
			this.data = this.getDefaultData();
			this.addSampleData();
		}
	}

	private addSampleData(): void {
		const now = new Date().toISOString();

		// Sample book
		const bookId = `book_${Date.now()}`;
		this.data.items.push({
			id: bookId,
			type: 'book',
			title: 'Learning Journal',
			parent_id: null,
			sort_order: 0,
			metadata: {
				custom_icon: '📚',
				custom_text_color: '#2563eb',
				description: 'My personal learning notes',
				author: 'Me',
			},
			created_at: now,
			updated_at: now,
		});

		// Sample section
		const sectionId = `section_${Date.now() + 1}`;
		this.data.items.push({
			id: sectionId,
			type: 'section',
			title: 'JavaScript Concepts',
			parent_id: bookId,
			sort_order: 0,
			metadata: {
				custom_icon: '⚡',
				custom_text_color: '#f59e0b',
				difficulty: 'intermediate',
			},
			created_at: now,
			updated_at: now,
		});

		// Sample note
		this.data.items.push({
			id: `note_${Date.now() + 2}`,
			type: 'note',
			title: 'Closures in JavaScript',
			content: '# Closures\n\nA closure is a function that has access to variables in its outer scope...',
			content_type: 'markdown',
			content_plaintext: 'Closures A closure is a function that has access to variables in its outer scope...',
			parent_id: sectionId,
			sort_order: 0,
			metadata: {
				custom_icon: '🔒',
				custom_text_color: '#10b981',
				difficulty: 'intermediate',
				word_count: 150,
				character_count: 800,
			},
			created_at: now,
			updated_at: now,
		});
	}

	private async saveData(): Promise<void> {
		this.data.last_modified = new Date().toISOString();

		// TODO: Implement actual file saving with Tauri fs API
		// await writeTextFile(this.filePath, JSON.stringify(this.data, null, 2));

		console.log("💾 JSON storage saved (simulated)");
	}

	getConfig(): StorageConfig {
		return this.config;
	}

	// ===== FLEXIBLE ITEM OPERATIONS =====

	async createItem(params: CreateItemParams): Promise<StorageResult<FlexibleItem>> {
		try {
			// Validate hierarchy
			if (params.parent_id) {
				const parent = this.data.items.find(item => item.id === params.parent_id);
				if (!parent) {
					return { success: false, error: 'Parent item not found' };
				}

				if (!canBeChildOf(params.type, parent.type)) {
					return { success: false, error: `${params.type}s cannot be placed in ${parent.type}s` };
				}
			}

			const now = new Date().toISOString();
			const id = `${params.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

			const newItem: FlexibleItem = {
				id,
				type: params.type,
				title: params.title,
				content: params.content,
				content_type: params.content_type,
				content_raw: params.content_raw,
				content_plaintext: this.extractPlaintext(params.content || ''),
				parent_id: params.parent_id || null,
				sort_order: this.getNextSortOrder(params.parent_id || null),
				metadata: params.metadata || {},
				created_at: now,
				updated_at: now,
			};

			this.data.items.push(newItem);
			await this.saveData();

			return { success: true, data: newItem };
		} catch (error) {
			return { success: false, error: `Failed to create item: ${error}` };
		}
	}

	async updateItem(id: string, params: Partial<FlexibleItem>): Promise<StorageResult<FlexibleItem>> {
		try {
			const itemIndex = this.data.items.findIndex(item => item.id === id);

			if (itemIndex === -1) {
				return { success: false, error: "Item not found" };
			}

			const item = this.data.items[itemIndex];
			if (!item) {
				return { success: false, error: "Item not found" };
			}

			const now = new Date().toISOString();

			// Update fields
			if (params.title !== undefined) item.title = params.title;
			if (params.content !== undefined) {
				item.content = params.content;
				item.content_plaintext = this.extractPlaintext(params.content);
			}
			if (params.content_raw !== undefined) item.content_raw = params.content_raw;
			if (params.type !== undefined) item.type = params.type;
			if (params.parent_id !== undefined) item.parent_id = params.parent_id;
			if (params.sort_order !== undefined) item.sort_order = params.sort_order;
			if (params.metadata !== undefined) {
				item.metadata = { ...item.metadata, ...params.metadata };
			}
			item.updated_at = now;

			await this.saveData();

			return { success: true, data: item };
		} catch (error) {
			return { success: false, error: `Failed to update item: ${error}` };
		}
	}

	async deleteItem(id: string): Promise<VoidStorageResult> {
		try {
			const itemIndex = this.data.items.findIndex(item => item.id === id);

			if (itemIndex === -1) {
				return { success: false, error: "Item not found" };
			}

			this.data.items.splice(itemIndex, 1);
			await this.saveData();
			return { success: true };
		} catch (error) {
			return { success: false, error: `Failed to delete item: ${error}` };
		}
	}

	private extractPlaintext(content: string): string {
		// Simple plaintext extraction (remove markdown/html)
		return content.replace(/[#*_`[\]()]/g, '').replace(/\n+/g, ' ').trim();
	}

	private getNextSortOrder(parentId: string | null): number {
		const siblings = this.data.items.filter(item =>
			item.parent_id === parentId && !item.deleted_at
		);
		return siblings.length > 0 ? Math.max(...siblings.map(s => s.sort_order)) + 1 : 0;
	}

	// ===== ADAPTER INTERFACE IMPLEMENTATION =====
	// Convert between FlexibleItem and legacy Note/Category interfaces

	async getNotes(_filters?: NoteFilters): Promise<StorageResult<Note[]>> {
		try {
			const items = this.data.items.filter(item =>
				item.type === 'note' && !item.deleted_at
			);

			const notes: Note[] = items.map(item => this.itemToNote(item));
			return { success: true, data: notes };
		} catch (error) {
			return { success: false, error: `Failed to get notes: ${error}` };
		}
	}

	async getNote(id: string): Promise<StorageResult<Note | null>> {
		try {
			const item = this.data.items.find(item => item.id === id && item.type === 'note');
			if (!item) return { success: true, data: null };

			return { success: true, data: this.itemToNote(item) };
		} catch (error) {
			return { success: false, error: `Failed to get note: ${error}` };
		}
	}

	async createNote(params: CreateNoteParams): Promise<StorageResult<Note>> {
		const result = await this.createItem({
			type: 'note',
			title: params.title || 'Untitled Note',
			content: params.content || '',
			content_type: params.content_type || 'html',
			content_raw: params.content_raw,
			metadata: {},
		});

		if (!result.success) return result;
		return { success: true, data: this.itemToNote(result.data) };
	}

		async updateNote(params: UpdateNoteParams): Promise<StorageResult<Note>> {
		try {
			const itemIndex = this.data.items.findIndex(item => item.id === params.id);
			if (itemIndex === -1) {
				return { success: false, error: 'Note not found' };
			}

			const item = this.data.items[itemIndex];
			if (!item) {
				return { success: false, error: 'Note not found' };
			}

			const updatedItem: FlexibleItem = {
				...item,
				title: params.title ?? item.title,
				content: params.content ?? item.content,
				content_type: params.content_type ?? item.content_type,
				content_raw: params.content_raw ?? item.content_raw,
				content_plaintext: params.content ? this.extractPlaintext(params.content) : (item.content_plaintext || ''),
				metadata: {
					...item.metadata,
					is_pinned: params.is_pinned ?? item.metadata.is_pinned,
					is_archived: params.is_archived ?? item.metadata.is_archived,
				},
				updated_at: new Date().toISOString(),
			};

			this.data.items[itemIndex] = updatedItem;
			await this.saveData();

			return { success: true, data: this.itemToNote(updatedItem) };
		} catch (error) {
			return { success: false, error: `Failed to update note: ${error}` };
		}
	}

	async deleteNote(id: string): Promise<VoidStorageResult> {
		try {
			const itemIndex = this.data.items.findIndex(item => item.id === id);
			if (itemIndex === -1) {
				return { success: false, error: 'Note not found' };
			}

			const item = this.data.items[itemIndex];
			if (!item) {
				return { success: false, error: 'Note not found' };
			}

			this.data.items[itemIndex] = {
				...item,
				deleted_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			await this.saveData();
			return { success: true };
		} catch (error) {
			return { success: false, error: `Failed to delete note: ${error}` };
		}
	}

	async searchNotes(query: string, _filters?: NoteFilters): Promise<StorageResult<Note[]>> {
		try {
			const items = this.data.items.filter(item =>
				item.type === 'note' &&
				!item.deleted_at &&
				(item.title.toLowerCase().includes(query.toLowerCase()) ||
				 item.content?.toLowerCase().includes(query.toLowerCase()) ||
				 item.content_plaintext?.toLowerCase().includes(query.toLowerCase()))
			);

			const notes: Note[] = items.map(item => this.itemToNote(item));
			return { success: true, data: notes };
		} catch (error) {
			return { success: false, error: `Failed to search notes: ${error}` };
		}
	}



	async getTreeData(): Promise<StorageResult<TreeData[]>> {
		try {
			const items = this.data.items.filter(item => !item.deleted_at);

						// Build tree structure
			const itemsByParent = new Map<string | null, FlexibleItem[]>();

			for (const item of items) {
				const parentId: string | null = item.parent_id || null;
				const siblings = itemsByParent.get(parentId) || [];
				siblings.push(item);
				itemsByParent.set(parentId, siblings);
			}

			// Sort siblings by sort_order
			for (const [, siblings] of itemsByParent.entries()) {
				siblings.sort((a, b) => a.sort_order - b.sort_order);
			}

			const buildTree = (parentId: string | null): TreeData[] => {
				const items = itemsByParent.get(parentId) || [];
				return items.map(item => {
					const treeNode: TreeData = {
						id: item.id,
						name: item.title,
						type: item.type,
						parent_id: item.parent_id,
						sort_order: item.sort_order,
						custom_icon: item.metadata.custom_icon || null,
						custom_text_color: item.metadata.custom_text_color || null,
						is_pinned: item.metadata.is_pinned || null,
					};

					// Add children for container types
					if (item.type === 'book' || item.type === 'section') {
						const children = buildTree(item.id);
						if (children.length > 0) {
							treeNode.children = children;
						}
					}

					return treeNode;
				});
			};

			const treeData = buildTree(null);
			return { success: true, data: treeData };
		} catch (error) {
			return { success: false, error: `Failed to get tree data: ${error}` };
		}
	}

	// Helper conversion methods
	private itemToNote(item: FlexibleItem): Note {
		return {
			id: item.id,
			title: item.title,
			content: item.content || '',
			content_type: (item.content_type as any) || 'html',
			content_raw: item.content_raw || null,
			created_at: item.created_at,
			updated_at: item.updated_at,
			deleted_at: item.deleted_at || null,
			is_pinned: item.metadata.is_pinned || false,
			is_archived: item.metadata.is_archived || false,
			word_count: item.metadata.word_count || 0,
			character_count: item.metadata.character_count || 0,
			content_plaintext: item.content_plaintext || '',
			sort_order: item.sort_order,
			parent_category_id: item.parent_id,
		};
	}




	async moveTreeItem(): Promise<VoidStorageResult> { throw new Error("Not implemented"); }
	async reorderTreeItem(): Promise<VoidStorageResult> { throw new Error("Not implemented"); }
	async getTags(): Promise<StorageResult<Tag[]>> { return { success: true, data: this.data.tags }; }
	async getTag(): Promise<StorageResult<Tag | null>> { throw new Error("Not implemented"); }
	async createTag(): Promise<StorageResult<Tag>> { throw new Error("Not implemented"); }
	async updateTag(): Promise<StorageResult<Tag>> { throw new Error("Not implemented"); }
	async deleteTag(): Promise<VoidStorageResult> { throw new Error("Not implemented"); }
	async getTagNotes(): Promise<StorageResult<Note[]>> { throw new Error("Not implemented"); }
	async addNoteTag(): Promise<VoidStorageResult> { throw new Error("Not implemented"); }
	async removeNoteTag(): Promise<VoidStorageResult> { throw new Error("Not implemented"); }
	async getNoteRelationships(): Promise<StorageResult<NoteRelationship[]>> { throw new Error("Not implemented"); }
	async createNoteRelationship(): Promise<StorageResult<NoteRelationship>> { throw new Error("Not implemented"); }
	async deleteNoteRelationship(): Promise<VoidStorageResult> { throw new Error("Not implemented"); }
	async getNoteAttachments(): Promise<StorageResult<Attachment[]>> { throw new Error("Not implemented"); }
	async createAttachment(): Promise<StorageResult<Attachment>> { throw new Error("Not implemented"); }
	async deleteAttachment(): Promise<VoidStorageResult> { throw new Error("Not implemented"); }
	async getNoteVersions(): Promise<StorageResult<NoteVersion[]>> { throw new Error("Not implemented"); }
	async createNoteVersion(): Promise<StorageResult<NoteVersion>> { throw new Error("Not implemented"); }
	async restoreNoteVersion(): Promise<StorageResult<Note>> { throw new Error("Not implemented"); }
	async getSettings(): Promise<StorageResult<Setting[]>> { return { success: true, data: this.data.settings }; }
	async getSetting(): Promise<StorageResult<Setting | null>> { throw new Error("Not implemented"); }
	async setSetting(): Promise<StorageResult<Setting>> { throw new Error("Not implemented"); }
	async deleteSetting(): Promise<VoidStorageResult> { throw new Error("Not implemented"); }
	async sync(): Promise<VoidStorageResult> { await this.saveData(); return { success: true }; }

	async getStorageInfo(): Promise<StorageResult<{
		backend: "sqlite" | "json-single" | "json-hybrid" | "cloud";
		note_count: number;
		category_count: number;
		tag_count: number;
		attachment_count: number;
		last_sync?: string;
		storage_size?: number;
	}>> {
		const notes = this.data.items.filter(i => i.type === 'note' && !i.deleted_at);
		const categories = this.data.items.filter(i => (i.type === 'book' || i.type === 'section') && !i.deleted_at);

		return {
			success: true,
			data: {
				backend: "json-single",
				note_count: notes.length,
				category_count: categories.length,
				tag_count: this.data.tags.length,
				attachment_count: 0,
				last_sync: this.data.last_modified,
			}
		};
	}
}
