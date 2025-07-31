import type { CreateNoteParams, Note, NoteFilters } from '../../../types/database';
import type { MultiStorageManager, StorageAdapter, StorageResult } from './types';

export class MultiStorageManagerImpl implements MultiStorageManager {
	private storages = new Map<string, StorageAdapter>();
	private defaultStorageName: string | null = null;

	async addStorage(name: string, adapter: StorageAdapter): Promise<StorageResult<void>> {
		try {
			// Initialize the storage adapter
			const initResult = await adapter.init();
			if (!initResult.success) {
				return {
					success: false,
					error: `Failed to initialize storage ${name}: ${initResult.error}`,
				};
			}

			this.storages.set(name, adapter);

			// Set as default if it's the first storage
			if (this.storages.size === 1) {
				this.defaultStorageName = name;
			}

			return { success: true, data: undefined };
		} catch (error) {
			return {
				success: false,
				error: `Failed to add storage ${name}: ${error}`,
			};
		}
	}

	async removeStorage(name: string): Promise<StorageResult<void>> {
		if (!this.storages.has(name)) {
			return { success: false, error: `Storage ${name} not found` };
		}

		this.storages.delete(name);

		// Update default storage if removed
		if (this.defaultStorageName === name) {
			const remainingStorages = Array.from(this.storages.keys());
			this.defaultStorageName = remainingStorages.length > 0 ? (remainingStorages[0] ?? null) : null;
		}

		return { success: true, data: undefined };
	}

	getStorages(): string[] {
		return Array.from(this.storages.keys());
	}

	getStorage(name: string): StorageAdapter | null {
		return this.storages.get(name) || null;
	}

	setDefaultStorage(name: string): void {
		if (this.storages.has(name)) {
			this.defaultStorageName = name;
		} else {
			throw new Error(`Storage ${name} not found`);
		}
	}

	getDefaultStorage(): StorageAdapter | null {
		return this.defaultStorageName ? this.storages.get(this.defaultStorageName) || null : null;
	}

	async getAllNotes(filters?: NoteFilters): Promise<StorageResult<Note[]>> {
		try {
			const allNotes: Note[] = [];
			const errors: string[] = [];

			for (const [name, storage] of this.storages) {
				try {
					const result = await storage.getNotes(filters);
					if (result.success && result.data) {
						// Add storage source to note metadata
						const notesWithSource = result.data.map(note => ({
							...note,
							storage_source: name,
						}));
						allNotes.push(...notesWithSource);
					} else {
						errors.push(`${name}: ${!result.success ? result.error : 'Unknown error'}`);
					}
				} catch (error) {
					errors.push(`${name}: ${error}`);
				}
			}

			// Sort by updated_at descending
			allNotes.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

			if (errors.length > 0) {
				return {
					success: false,
					error: `Some storages failed: ${errors.join(', ')}`,
				};
			}

			return { success: true, data: allNotes };
		} catch (error) {
			return { success: false, error: `Failed to get all notes: ${error}` };
		}
	}

	async searchAllNotes(query: string, filters?: NoteFilters): Promise<StorageResult<Note[]>> {
		try {
			const allResults: Note[] = [];
			const errors: string[] = [];

			for (const [name, storage] of this.storages) {
				try {
					const result = await storage.searchNotes(query, filters);
					if (result.success && result.data) {
						const notesWithSource = result.data.map(note => ({
							...note,
							storage_source: name,
						}));
						allResults.push(...notesWithSource);
					} else {
						errors.push(`${name}: ${!result.success ? result.error : 'Unknown error'}`);
					}
				} catch (error) {
					errors.push(`${name}: ${error}`);
				}
			}

			// Remove duplicates by ID and sort by relevance/updated_at
			const uniqueResults = Array.from(new Map(allResults.map(note => [note.id, note])).values()).sort(
				(a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
			);

			if (errors.length > 0) {
				return {
					success: false,
					error: `Some storages failed: ${errors.join(', ')}`,
				};
			}

			return { success: true, data: uniqueResults };
		} catch (error) {
			return { success: false, error: `Failed to search all notes: ${error}` };
		}
	}

	async moveNote(noteId: string, fromStorage: string, toStorage: string): Promise<StorageResult<void>> {
		try {
			const fromAdapter = this.storages.get(fromStorage);
			const toAdapter = this.storages.get(toStorage);

			if (!fromAdapter || !toAdapter) {
				return {
					success: false,
					error: 'Source or destination storage not found',
				};
			}

			// Get the note from source storage
			const noteResult = await fromAdapter.getNote(noteId);
			if (!noteResult.success || !noteResult.data) {
				return {
					success: false,
					error: `Failed to get note from ${fromStorage}: ${!noteResult.success ? noteResult.error : 'Note not found'}`,
				};
			}

			const note = noteResult.data;

			// Create note in destination storage
			const createParams: CreateNoteParams = {
				title: note.title,
				content: note.content,
				content_type: note.content_type,
			};

			if (note.content_raw) {
				createParams.content_raw = note.content_raw;
			}

			const createResult = await toAdapter.createNote(createParams);

			if (!createResult.success) {
				return {
					success: false,
					error: `Failed to create note in ${toStorage}: ${createResult.error}`,
				};
			}

			// Delete note from source storage
			const deleteResult = await fromAdapter.deleteNote(noteId);
			if (!deleteResult.success) {
				// Try to rollback by deleting the created note
				await toAdapter.deleteNote(createResult.data!.id);
				return {
					success: false,
					error: `Failed to delete note from ${fromStorage}: ${deleteResult.error}`,
				};
			}

			return { success: true, data: undefined };
		} catch (error) {
			return { success: false, error: `Failed to move note: ${error}` };
		}
	}

	async syncAllStorages(): Promise<StorageResult<void>> {
		try {
			const errors: string[] = [];

			for (const [name, storage] of this.storages) {
				if (storage.sync) {
					try {
						const result = await storage.sync();
						if (!result.success) {
							errors.push(`${name}: ${result.error}`);
						}
					} catch (error) {
						errors.push(`${name}: ${error}`);
					}
				}
			}

			if (errors.length > 0) {
				return {
					success: false,
					error: `Some storages failed to sync: ${errors.join(', ')}`,
				};
			}

			return { success: true, data: undefined };
		} catch (error) {
			return { success: false, error: `Failed to sync storages: ${error}` };
		}
	}
}
