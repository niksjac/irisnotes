// JSON Hybrid Storage Adapter
// Structure in JSON file + individual content files for Git-friendly storage

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

interface StructureData {
	items: Omit<FlexibleItem, 'content' | 'content_raw' | 'content_plaintext'>[];
	tags: Tag[];
	settings: Setting[];
	version: string;
	last_modified: string;
}

/**
 * JSON Hybrid Storage Adapter
 * Structure and metadata in JSON file, content in separate files
 * Git-friendly and external tool compatible
 */
export class JsonHybridStorageAdapter implements StorageAdapter {
	private config: StorageConfig;
	private structureData: StructureData;
	private structureFile: string;
	private contentDir: string;

	constructor(config: StorageConfig) {
		this.config = config;
		this.structureFile = config.jsonHybrid?.structure_file || './dev/structure.json';
		this.contentDir = config.jsonHybrid?.content_dir || './dev/content/';
		this.structureData = this.getDefaultStructureData();
	}

	private getDefaultStructureData(): StructureData {
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
			await this.loadStructureData();
			await this.ensureContentDirectory();
			return { success: true };
		} catch (error) {
			console.error("❌ Failed to initialize JSON Hybrid storage:", error);
			return {
				success: false,
				error: `Failed to initialize storage: ${error}`,
			};
		}
	}

	private async loadStructureData(): Promise<void> {
		try {
			// TODO: Implement actual file loading with Tauri fs API
			console.log("📁 Loading structure from:", this.structureFile);
			this.structureData = this.getDefaultStructureData();
			this.addSampleStructureData();
		} catch (error) {
			console.warn("⚠️ Could not load existing structure, starting fresh:", error);
			this.structureData = this.getDefaultStructureData();
			this.addSampleStructureData();
		}
	}

	private async ensureContentDirectory(): Promise<void> {
		// TODO: Implement directory creation with Tauri fs API
		console.log("📁 Ensuring content directory:", this.contentDir);
	}

	private addSampleStructureData(): void {
		const now = new Date().toISOString();

		// Sample book structure
		const bookId = `book_${Date.now()}`;
		this.structureData.items.push({
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

		// Sample section structure
		const sectionId = `section_${Date.now() + 1}`;
		this.structureData.items.push({
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

		// Sample note structure (content will be in separate file)
		const noteId = `note_${Date.now() + 2}`;
		this.structureData.items.push({
			id: noteId,
			type: 'note',
			title: 'Closures in JavaScript',
			content_type: 'markdown',
			parent_id: sectionId,
			sort_order: 0,
			metadata: {
				custom_icon: '🔒',
				custom_text_color: '#10b981',
				difficulty: 'intermediate',
				word_count: 150,
				character_count: 800,
				content_file: `${noteId}.md`, // Reference to content file
			},
			created_at: now,
			updated_at: now,
		});
	}

	private async saveStructureData(): Promise<void> {
		this.structureData.last_modified = new Date().toISOString();

		// TODO: Implement actual file saving with Tauri fs API
		// await writeTextFile(this.structureFile, JSON.stringify(this.structureData, null, 2));

		console.log("💾 Structure data saved (simulated)");
	}

	private async loadContent(itemId: string): Promise<string> {
		// TODO: Implement actual file loading with Tauri fs API
		// const contentFile = path.join(this.contentDir, `${itemId}.md`);
		// return await readTextFile(contentFile);

		// For now, return sample content
		return `# Sample Content for ${itemId}\n\nThis content would be loaded from a separate file.`;
	}

		private async saveContent(itemId: string, content: string, contentType: string = 'markdown'): Promise<void> {
		// TODO: Implement actual file saving with Tauri fs API
		const extension = this.getFileExtension(contentType);
		const filename = `${itemId}.${extension}`;

		// const contentFile = path.join(this.contentDir, filename);
		// await writeTextFile(contentFile, content);

		console.log(`💾 Content saved to ${filename} (simulated)`, { contentLength: content.length });
	}

	private getFileExtension(contentType: string): string {
		switch (contentType) {
			case 'markdown': return 'md';
			case 'html': return 'html';
			case 'plain': return 'txt';
			default: return 'txt';
		}
	}

	private extractPlaintext(content: string): string {
		// Simple plaintext extraction (remove markdown/html)
		return content.replace(/[#*_`[\]()]/g, '').replace(/\n+/g, ' ').trim();
	}

	private getNextSortOrder(parentId: string | null): number {
		const siblings = this.structureData.items.filter(item =>
			item.parent_id === parentId && !item.deleted_at
		);
		return siblings.length > 0 ? Math.max(...siblings.map(s => s.sort_order)) + 1 : 0;
	}

	getConfig(): StorageConfig {
		return this.config;
	}

	// ===== FLEXIBLE ITEM OPERATIONS =====

	async getAllItems(): Promise<StorageResult<FlexibleItem[]>> {
		try {
			const items = this.structureData.items.filter(item => !item.deleted_at);
			return { success: true, data: items };
		} catch (error) {
			return { success: false, error: `Failed to get all items: ${error}` };
		}
	}

	async createItem(params: CreateItemParams): Promise<StorageResult<FlexibleItem>> {
		try {
			// Validate hierarchy
			if (params.parent_id) {
				const parent = this.structureData.items.find(item => item.id === params.parent_id);
				if (!parent) {
					return { success: false, error: 'Parent item not found' };
				}

				if (!canBeChildOf(params.type, parent.type)) {
					return { success: false, error: `${params.type}s cannot be placed in ${parent.type}s` };
				}
			}

			const now = new Date().toISOString();
			const id = `${params.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

			// Create structure entry (without content)
			const structureItem = {
				id,
				type: params.type,
				title: params.title,
				content_type: params.content_type,
				parent_id: params.parent_id || null,
				sort_order: this.getNextSortOrder(params.parent_id || null),
				metadata: {
					...params.metadata || {},
					content_file: params.content ? `${id}.${this.getFileExtension(params.content_type || 'markdown')}` : undefined,
				},
				created_at: now,
				updated_at: now,
			};

			this.structureData.items.push(structureItem);

			// Save content to separate file if provided
			if (params.content) {
				await this.saveContent(id, params.content, params.content_type);
			}

			await this.saveStructureData();

			// Return full item with content
			const fullItem: FlexibleItem = {
				...structureItem,
				content: params.content || '',
				content_raw: params.content_raw,
				content_plaintext: params.content ? this.extractPlaintext(params.content) : '',
			};

			return { success: true, data: fullItem };
		} catch (error) {
			return { success: false, error: `Failed to create item: ${error}` };
		}
	}

	async updateItem(id: string, params: Partial<FlexibleItem>): Promise<StorageResult<FlexibleItem>> {
		try {
			const itemIndex = this.structureData.items.findIndex(item => item.id === id);

			if (itemIndex === -1) {
				return { success: false, error: "Item not found" };
			}

			const structureItem = this.structureData.items[itemIndex];
			if (!structureItem) {
				return { success: false, error: "Item not found" };
			}

			const now = new Date().toISOString();

			// Update structure fields
			if (params.title !== undefined) structureItem.title = params.title;
			if (params.type !== undefined) structureItem.type = params.type;
			if (params.parent_id !== undefined) structureItem.parent_id = params.parent_id;
			if (params.sort_order !== undefined) structureItem.sort_order = params.sort_order;
			if (params.metadata !== undefined) {
				structureItem.metadata = { ...structureItem.metadata, ...params.metadata };
			}
			structureItem.updated_at = now;

			// Update content separately if provided
			if (params.content !== undefined) {
				await this.saveContent(id, params.content, structureItem.content_type);
			}

			await this.saveStructureData();

			// Return full item with content
			const content = await this.loadContent(id);
			const fullItem: FlexibleItem = {
				id: structureItem.id,
				type: structureItem.type,
				title: structureItem.title,
				content: content,
				content_type: structureItem.content_type,
				content_raw: params.content_raw || content,
				content_plaintext: this.extractPlaintext(content),
				parent_id: structureItem.parent_id,
				sort_order: structureItem.sort_order,
				metadata: structureItem.metadata,
				created_at: structureItem.created_at,
				updated_at: structureItem.updated_at,
			};

			return { success: true, data: fullItem };
		} catch (error) {
			return { success: false, error: `Failed to update item: ${error}` };
		}
	}

	async deleteItem(id: string): Promise<VoidStorageResult> {
		try {
			const itemIndex = this.structureData.items.findIndex(item => item.id === id);

			if (itemIndex === -1) {
				return { success: false, error: "Item not found" };
			}

			// Remove from structure
			this.structureData.items.splice(itemIndex, 1);

			// Delete content file (if exists)
			try {
				const contentFile = `${this.contentDir}${id}.md`;
				// File deletion would happen here in real implementation
				console.log(`Would delete content file: ${contentFile}`);
			} catch {
				// Content file might not exist, continue
			}

			await this.saveStructureData();
			return { success: true };
		} catch (error) {
			return { success: false, error: `Failed to delete item: ${error}` };
		}
	}

	// ===== ADAPTER INTERFACE IMPLEMENTATION =====

	async getNotes(_filters?: NoteFilters): Promise<StorageResult<Note[]>> {
		try {
			const noteStructures = this.structureData.items.filter(item =>
				item.type === 'note' && !item.deleted_at
			);

			const notes: Note[] = [];
			for (const structure of noteStructures) {
				const content = await this.loadContent(structure.id);
				const note = this.structureToNote(structure, content);
				notes.push(note);
			}

			return { success: true, data: notes };
		} catch (error) {
			return { success: false, error: `Failed to get notes: ${error}` };
		}
	}

	async getNote(id: string): Promise<StorageResult<Note | null>> {
		try {
			const structure = this.structureData.items.find(item => item.id === id && item.type === 'note');
			if (!structure) return { success: true, data: null };

			const content = await this.loadContent(id);
			const note = this.structureToNote(structure, content);

			return { success: true, data: note };
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
			const itemIndex = this.structureData.items.findIndex(item => item.id === params.id);
			if (itemIndex === -1) {
				return { success: false, error: 'Note not found' };
			}

			const structure = this.structureData.items[itemIndex];
			if (!structure) {
				return { success: false, error: 'Note not found' };
			}

			// Update structure
			const updatedStructure = {
				...structure,
				title: params.title ?? structure.title,
				content_type: params.content_type ?? structure.content_type,
				metadata: {
					...structure.metadata,
					is_pinned: params.is_pinned ?? structure.metadata.is_pinned,
					is_archived: params.is_archived ?? structure.metadata.is_archived,
				},
				updated_at: new Date().toISOString(),
			};

			this.structureData.items[itemIndex] = updatedStructure;

			// Update content file if content changed
			let content = '';
			if (params.content !== undefined) {
				content = params.content;
				await this.saveContent(params.id, content, updatedStructure.content_type || 'markdown');
			} else {
				content = await this.loadContent(params.id);
			}

			await this.saveStructureData();

			const note = this.structureToNote(updatedStructure, content);
			return { success: true, data: note };
		} catch (error) {
			return { success: false, error: `Failed to update note: ${error}` };
		}
	}

	async deleteNote(id: string): Promise<VoidStorageResult> {
		try {
			const itemIndex = this.structureData.items.findIndex(item => item.id === id);
			if (itemIndex === -1) {
				return { success: false, error: 'Note not found' };
			}

			const item = this.structureData.items[itemIndex];
			if (!item) {
				return { success: false, error: 'Note not found' };
			}

			this.structureData.items[itemIndex] = {
				...item,
				deleted_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			await this.saveStructureData();
			// Note: Content file is kept for potential recovery

			return { success: true };
		} catch (error) {
			return { success: false, error: `Failed to delete note: ${error}` };
		}
	}

	async searchNotes(query: string, _filters?: NoteFilters): Promise<StorageResult<Note[]>> {
		try {
			const noteStructures = this.structureData.items.filter(item =>
				item.type === 'note' &&
				!item.deleted_at &&
				item.title.toLowerCase().includes(query.toLowerCase())
			);

			const notes: Note[] = [];
			for (const structure of noteStructures) {
				const content = await this.loadContent(structure.id);
				// Also search in content
				if (content.toLowerCase().includes(query.toLowerCase()) ||
					structure.title.toLowerCase().includes(query.toLowerCase())) {
					const note = this.structureToNote(structure, content);
					notes.push(note);
				}
			}

			return { success: true, data: notes };
		} catch (error) {
			return { success: false, error: `Failed to search notes: ${error}` };
		}
	}



	async getTreeData(): Promise<StorageResult<TreeData[]>> {
		try {
			const items = this.structureData.items.filter(item => !item.deleted_at);

			// Build tree structure
			const itemsByParent = new Map<string | null, typeof items>();

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
						custom_icon: (item as any).metadata?.custom_icon || null,
						custom_text_color: (item as any).metadata?.custom_text_color || null,
						is_pinned: (item as any).metadata?.is_pinned || null,
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
	private structureToNote(structure: Omit<FlexibleItem, 'content' | 'content_raw' | 'content_plaintext'>, content: string): Note {
		return {
			id: structure.id,
			title: structure.title,
			content: content,
			content_type: (structure.content_type as any) || 'html',
			content_raw: null, // Could be loaded from separate file if needed
			created_at: structure.created_at,
			updated_at: structure.updated_at,
			deleted_at: structure.deleted_at || null,
			is_pinned: structure.metadata.is_pinned || false,
			is_archived: structure.metadata.is_archived || false,
			word_count: structure.metadata.word_count || 0,
			character_count: structure.metadata.character_count || 0,
			content_plaintext: this.extractPlaintext(content),
			sort_order: structure.sort_order,
			parent_category_id: structure.parent_id,
		};
	}

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
	async getTags(): Promise<StorageResult<Tag[]>> { return { success: true, data: this.structureData.tags }; }
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
	async getSettings(): Promise<StorageResult<Setting[]>> { return { success: true, data: this.structureData.settings }; }
	async getSetting(): Promise<StorageResult<Setting | null>> { throw new Error("Not implemented"); }
	async setSetting(): Promise<StorageResult<Setting>> { throw new Error("Not implemented"); }
	async deleteSetting(): Promise<VoidStorageResult> { throw new Error("Not implemented"); }
	async sync(): Promise<VoidStorageResult> { await this.saveStructureData(); return { success: true }; }

	async getStorageInfo(): Promise<StorageResult<{
		backend: "sqlite" | "json-single" | "json-hybrid" | "cloud";
		note_count: number;
		category_count: number;
		tag_count: number;
		attachment_count: number;
		last_sync?: string;
		storage_size?: number;
	}>> {
		const notes = this.structureData.items.filter(i => i.type === 'note' && !i.deleted_at);
		const categories = this.structureData.items.filter(i => (i.type === 'book' || i.type === 'section') && !i.deleted_at);

		return {
			success: true,
			data: {
				backend: "json-hybrid",
				note_count: notes.length,
				category_count: categories.length,
				tag_count: this.structureData.tags.length,
				attachment_count: 0,
				last_sync: this.structureData.last_modified,
			}
		};
	}
}
