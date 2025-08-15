import { useCallback } from "react";
import type { StorageAdapter } from "@/storage";

interface UseNotesHandlersProps {
	storageAdapter: StorageAdapter | null;
	setSelectedItemId: (itemId: string | null) => void;
	updateItemTitle: (itemId: string, title: string) => void;
	updateItemContent: (itemId: string, content: string) => void;
	createNote: () => Promise<{ success: boolean; data?: any }>;
	loadAllItems: () => Promise<void>;
}

export function useNotesHandlers({
	storageAdapter,
	setSelectedItemId,
	updateItemTitle,
	updateItemContent,
	createNote,
	loadAllItems,
}: UseNotesHandlersProps) {
	const handleItemClick = useCallback(
		(itemId: string) => {
			setSelectedItemId(itemId);
		},
		[setSelectedItemId]
	);

	const handleItemSelect = useCallback(
		(itemId: string, itemType: "note" | "book" | "section") => {
			// Handle item selection for proper navigation state
			if (itemType === "book" || itemType === "section") {
				// For books/sections, we don't load them in the editor, just select them
				setSelectedItemId(null);
			} else if (itemType === "note") {
				// For notes, update the selection
				setSelectedItemId(itemId);
			}
		},
		[setSelectedItemId]
	);

	const handleTitleChange = useCallback(
		(itemId: string, title: string) => {
			updateItemTitle(itemId, title);
		},
		[updateItemTitle]
	);

	const handleContentChange = useCallback(
		(itemId: string, content: string) => {
			updateItemContent(itemId, content);
		},
		[updateItemContent]
	);

	const handleContainerSelect = useCallback(
		(_itemId: string) => {
			setSelectedItemId(null);
		},
		[setSelectedItemId]
	);

	const handleCreateNote = useCallback(
		async (_parentId?: string) => {
			try {
				const result = await createNote();
				if (result.success) {
					// Note: parent_id is now handled directly in createNote
					await loadAllItems();
				}
			} catch (error) {
				console.error("Failed to create note:", error);
			}
		},
		[createNote, loadAllItems]
	);

	const handleDeleteItem = useCallback(
		async (itemId: string) => {
			if (!storageAdapter) return;

			try {
				// Get item to determine type for proper deletion
				const items = await storageAdapter.getTreeData();
				if (items.success) {
					const item = items.data.find(i => i.id === itemId);
					if (!item) return;

					if (item.type === 'note') {
						await storageAdapter.deleteNote(itemId);
					} else {
						      await storageAdapter.deleteItem(itemId);
					}

					await loadAllItems();
				}
			} catch (error) {
				console.error("Failed to delete item:", error);
			}
		},
		[storageAdapter, loadAllItems]
	);

	const handleRenameItem = useCallback(
		async (itemId: string, newTitle: string) => {
			await updateItemTitle(itemId, newTitle);
		},
		[updateItemTitle]
	);

	return {
		handleItemClick,
		handleItemSelect,
		handleTitleChange,
		handleContentChange,
		handleContainerSelect,
		handleCreateNote,
		handleDeleteItem,
		handleRenameItem,
		// Legacy aliases for backward compatibility
		handleNoteClick: handleItemClick,
		handleFolderSelect: handleContainerSelect,
		handleDeleteNote: handleDeleteItem,
		handleRenameNote: handleRenameItem,
	};
}
