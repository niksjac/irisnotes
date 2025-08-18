import { useCallback } from "react";
import { FileText, Edit3, Trash2, Copy, Scissors, ClipboardPaste, Book, FolderOpen } from "lucide-react";
import type { MenuGroup, TreeRightClickData, EditorRightClickData } from "@/types/right-click-menu";
import { useItems } from "./use-items";

interface UseRightClickMenuActionsProps {
	onCreateNote?: (parentId?: string) => void;
	onCreateBook?: (parentId?: string) => void;
	onCreateSection?: (parentId?: string) => void;
	onDeleteItem?: (itemId: string) => void;
	onRenameItem?: (itemId: string, newTitle: string) => void;
}

export function useRightClickMenuActions({
	onCreateNote,
	onCreateBook,
	onCreateSection,
	onDeleteItem,
	onRenameItem
}: UseRightClickMenuActionsProps = {}) {
	const { createNote, createBook, createSection, deleteItem, updateItemTitle } = useItems();

	const handleDeleteAction = useCallback(
		(data: TreeRightClickData) => {
			const itemType = data.nodeType;
			const itemName = itemType === "note" ? "note" :
							 itemType === "book" ? "book" :
							 itemType === "section" ? "section" : "item";

			const confirmMessage = `Are you sure you want to delete ${itemName} "${data.nodeName}"${
				itemType !== "note" ? " and all its contents" : ""
			}?`;

			if (confirm(confirmMessage)) {
				if (onDeleteItem) {
					onDeleteItem(data.nodeId);
				} else {
					deleteItem(data.nodeId);
				}
			}
		},
		[onDeleteItem, deleteItem]
	);

	const handleRenameAction = useCallback(
		(data: TreeRightClickData) => {
			const newName = prompt(`Enter new name for ${data.nodeName}:`, data.nodeName);
			if (newName && newName !== data.nodeName) {
				if (onRenameItem) {
					onRenameItem(data.nodeId, newName);
				} else {
					updateItemTitle(data.nodeId, newName);
				}
			}
		},
		[onRenameItem, updateItemTitle]
	);

	const handleCreateNoteAction = useCallback(
		(parentId?: string) => {
			if (onCreateNote) {
				onCreateNote(parentId);
			} else {
				createNote({ title: "Untitled Note", content: "", parent_id: parentId });
			}
		},
		[onCreateNote, createNote]
	);

	const handleCreateBookAction = useCallback(
		(parentId?: string) => {
			if (onCreateBook) {
				onCreateBook(parentId);
			} else {
				createBook("New Book", parentId);
			}
		},
		[onCreateBook, createBook]
	);

	const handleCreateSectionAction = useCallback(
		(parentId?: string) => {
			if (onCreateSection) {
				onCreateSection(parentId);
			} else {
				createSection("New Section", parentId);
			}
		},
		[onCreateSection, createSection]
	);

	const getTreeNodeMenuGroups = useCallback(
		(data: TreeRightClickData): MenuGroup[] => {
			const itemType = data.nodeType;
			const isNote = itemType === "note";
			const isBook = itemType === "book";
			const isSection = itemType === "section";
			const isContainer = isBook || isSection;

			const groups: MenuGroup[] = [];

			// Create/Add actions - different options based on what can be created inside
			if (isContainer || !data.nodeId) { // Root level or inside containers
				const createItems = [];

				// Notes can be created anywhere
				createItems.push({
					id: "new-note",
					label: "New Note",
					icon: FileText,
					action: () => handleCreateNoteAction(data.nodeId),
				});

				// Books can only be created at root
				if (!data.nodeId) {
					createItems.push({
						id: "new-book",
						label: "New Book",
						icon: Book,
						action: () => handleCreateBookAction(),
					});
				}

				// Sections can be created at root or inside books
				if (!data.nodeId || isBook) {
					createItems.push({
						id: "new-section",
						label: "New Section",
						icon: FolderOpen,
						action: () => handleCreateSectionAction(data.nodeId),
					});
				}

				if (createItems.length > 0) {
					groups.push({
						id: "create",
						items: createItems,
					});
				}
			}

			// Edit actions
			groups.push({
				id: "edit",
				items: [
					{
						id: "rename",
						label: `Rename ${isNote ? "Note" : isBook ? "Book" : isSection ? "Section" : "Item"}`,
						icon: Edit3,
						action: () => handleRenameAction(data),
					},
					{
						id: "duplicate",
						label: "Duplicate",
						icon: Copy,
						action: () => {
							// TODO: Implement duplicate functionality
						},
						disabled: !isNote, // Only enable for notes initially
					},
				],
			});

			// Delete actions
			groups.push({
				id: "delete",
				items: [
					{
						id: "delete",
						label: `Delete ${isNote ? "Note" : isBook ? "Book" : isSection ? "Section" : "Item"}`,
						icon: Trash2,
						action: () => handleDeleteAction(data),
					},
				],
			});

			return groups;
		},
		[handleCreateNoteAction, handleCreateBookAction, handleCreateSectionAction, handleRenameAction, handleDeleteAction]
	);

	const getEditorMenuGroups = useCallback((data: EditorRightClickData): MenuGroup[] => {
		const groups: MenuGroup[] = [];

		// Text editing actions
		if (data.hasSelection) {
			groups.push({
				id: "edit",
				items: [
					{
						id: "cut",
						label: "Cut",
						icon: Scissors,
						shortcut: "Ctrl+X",
						action: () => {
							document.execCommand("cut");
						},
					},
					{
						id: "copy",
						label: "Copy",
						icon: Copy,
						shortcut: "Ctrl+C",
						action: () => {
							document.execCommand("copy");
						},
					},
				],
			});
		}

		// Always show paste if clipboard might have content
		groups.push({
			id: "clipboard",
			items: [
				{
					id: "paste",
					label: "Paste",
					icon: ClipboardPaste,
					shortcut: "Ctrl+V",
					action: () => {
						document.execCommand("paste");
					},
				},
			],
		});

		// Selection actions
		groups.push({
			id: "selection",
			items: [
				{
					id: "select-all",
					label: "Select All",
					shortcut: "Ctrl+A",
					action: () => {
						document.execCommand("selectAll");
					},
				},
			],
		});

		return groups;
	}, []);

	return {
		getTreeNodeMenuGroups,
		getEditorMenuGroups,
	};
}
