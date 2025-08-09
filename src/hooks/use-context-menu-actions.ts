import { useCallback } from "react";
import { Folder, FileText, Edit3, Trash2, Copy, Scissors, ClipboardPaste } from "lucide-react";
import type { MenuGroup, TreeContextData, EditorContextData } from "@/types/context-menu";
import { useNotesActions } from "./use-notes-actions";

interface UseContextMenuActionsProps {
	onCreateNote?: (parentCategoryId?: string) => void;
	onDeleteNote?: (noteId: string) => void;
	onRenameNote?: (noteId: string, newTitle: string) => void;
}

export function useContextMenuActions({ onCreateNote, onDeleteNote, onRenameNote }: UseContextMenuActionsProps = {}) {
	const { createNewNote, deleteNote, updateNoteTitle } = useNotesActions();

	const handleDeleteAction = useCallback(
		(data: TreeContextData) => {
			const isNote = data.nodeType === "note";
			const confirmMessage = isNote
				? `Are you sure you want to delete "${data.nodeName}"?`
				: `Are you sure you want to delete folder "${data.nodeName}" and all its contents?`;

			if (confirm(confirmMessage)) {
				if (isNote) {
					if (onDeleteNote) {
						onDeleteNote(data.nodeId);
					} else {
						deleteNote(data.nodeId);
					}
				} else {
					// TODO: Implement category deletion
					console.log("Delete category", data.nodeId);
				}
			}
		},
		[onDeleteNote, deleteNote]
	);

	const handleRenameAction = useCallback(
		(data: TreeContextData) => {
			const isNote = data.nodeType === "note";
			const newName = prompt(`Enter new name for ${data.nodeName}:`, data.nodeName);
			if (newName && newName !== data.nodeName) {
				if (isNote) {
					if (onRenameNote) {
						onRenameNote(data.nodeId, newName);
					} else {
						updateNoteTitle(data.nodeId, newName);
					}
				} else {
					// TODO: Implement category rename
					console.log("Rename category", data.nodeId, "to", newName);
				}
			}
		},
		[onRenameNote, updateNoteTitle]
	);

	const handleCreateNoteAction = useCallback(
		(parentCategoryId: string) => {
			if (onCreateNote) {
				onCreateNote(parentCategoryId);
			} else {
				createNewNote();
			}
		},
		[onCreateNote, createNewNote]
	);

	const getTreeNodeMenuGroups = useCallback(
		(data: TreeContextData): MenuGroup[] => {
			const isNote = data.nodeType === "note";
			const isCategory = data.nodeType === "category";

			const groups: MenuGroup[] = [];

			// Create/Add actions
			if (isCategory) {
				groups.push({
					id: "create",
					items: [
						{
							id: "new-note",
							label: "New Note",
							icon: FileText,
							action: () => handleCreateNoteAction(data.nodeId),
						},
						{
							id: "new-folder",
							label: "New Folder",
							icon: Folder,
							action: () => {
								// TODO: Implement create folder functionality
								console.log("Create new folder in", data.nodeId);
							},
						},
					],
				});
			}

			// Edit actions
			groups.push({
				id: "edit",
				items: [
					{
						id: "rename",
						label: isNote ? "Rename Note" : "Rename Folder",
						icon: Edit3,
						action: () => handleRenameAction(data),
					},
					{
						id: "duplicate",
						label: "Duplicate",
						icon: Copy,
						action: () => {
							// TODO: Implement duplicate functionality
							console.log("Duplicate", data.nodeType, data.nodeId);
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
						label: isNote ? "Delete Note" : "Delete Folder",
						icon: Trash2,
						action: () => handleDeleteAction(data),
					},
				],
			});

			return groups;
		},
		[handleCreateNoteAction, handleRenameAction, handleDeleteAction]
	);

	const getEditorMenuGroups = useCallback((data: EditorContextData): MenuGroup[] => {
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
