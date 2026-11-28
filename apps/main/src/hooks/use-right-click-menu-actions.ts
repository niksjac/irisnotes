import { useCallback } from "react";
import {
	FileText,
	Edit3,
	Trash2,
	Copy,
	Scissors,
	ClipboardPaste,
	Book,
	FolderOpen,
	PanelLeft,
	PanelRight,
	Hash,
	ListX,
	ListCollapse,
	RemoveFormatting,
	ArrowDownAZ,
	ArrowDownZA,
	ArrowUpDown,
	ListChecks,
	WrapText,
	Paintbrush,
} from "lucide-react";
import type { Command } from "prosemirror-state";
import {
	removeEmptyLines,
	collapseEmptyLines,
	trimTrailingWhitespace,
	sortLinesAscending,
	sortLinesDescending,
	reverseLines,
	removeDuplicateLines,
	joinLines,
} from "@/components/editor/plugins/text-block-commands";
import { pasteKeepingSourceFormatting } from "@/components/editor/paste-html";
import { copyFormatting, applyFormatting, getFormatPainterState } from "@/components/editor/plugins/format-painter";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { confirmDeleteItem } from "@/utils/confirm-delete";
import type {
	MenuGroup,
	MenuItem,
	TreeRightClickData,
	EditorRightClickData,
} from "@/types/right-click-menu";
import { useItems } from "./use-items";

interface UseRightClickMenuActionsProps {
	onCreateNote?: (parentId?: string) => void;
	onCreateBook?: (parentId?: string) => void;
	onCreateSection?: (parentId?: string) => void;
	onDeleteItem?: (itemId: string) => void | Promise<void>;
	onRenameItem?: (itemId: string, newTitle: string) => void;
	onOpenInPane?: (
		itemId: string,
		itemTitle: string,
		itemType: "note" | "book" | "section",
		pane: 0 | 1,
	) => void;
}

export function useRightClickMenuActions({
	onCreateNote,
	onCreateBook,
	onCreateSection,
	onDeleteItem,
	onRenameItem,
	onOpenInPane,
}: UseRightClickMenuActionsProps = {}) {
	const { createNote, createBook, createSection, deleteItem, updateItemTitle } =
		useItems();

	const handleDeleteAction = useCallback(
		async (data: TreeRightClickData) => {
			const confirmed = await confirmDeleteItem(data.nodeType, data.nodeName);
			if (!confirmed) return;

			if (onDeleteItem) {
				await onDeleteItem(data.nodeId);
			} else {
				await deleteItem(data.nodeId);
			}
		},
		[onDeleteItem, deleteItem]
	);

	const handleRenameAction = useCallback(
		(data: TreeRightClickData) => {
			const newName = prompt(
				`Enter new name for ${data.nodeName}:`,
				data.nodeName
			);
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
				createNote({
					title: "Untitled Note",
					content: "",
					parent_id: parentId,
				});
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

			// Open in pane actions - only if an item is selected and callback provided
			if (data.nodeId && onOpenInPane) {
				groups.push({
					id: "open",
					items: [
						{
							id: "open-pane-1",
							label: "Open in Pane 1",
							icon: PanelLeft,
							shortcut: "Enter",
							action: () =>
								onOpenInPane(data.nodeId, data.nodeName, data.nodeType, 0),
						},
						{
							id: "open-pane-2",
							label: "Open in Pane 2",
							icon: PanelRight,
							shortcut: "Ctrl+Enter",
							action: () =>
								onOpenInPane(data.nodeId, data.nodeName, data.nodeType, 1),
						},
					],
				});
			}

			// Create/Add actions - different options based on what can be created inside
			if (isContainer || !data.nodeId) {
				// Root level or inside containers
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
					{
						id: "copy-id",
						label: "Copy ID",
						icon: Hash,
						action: async () => {
							try {
								await writeText(data.nodeId);
							} catch {
								// Fallback for web/non-Tauri
								navigator.clipboard.writeText(data.nodeId);
							}
						},
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
		[
			handleCreateNoteAction,
			handleCreateBookAction,
			handleCreateSectionAction,
			handleRenameAction,
			handleDeleteAction,
			onOpenInPane,
		]
	);

	const getEditorMenuGroups = useCallback(
		(data: EditorRightClickData): MenuGroup[] => {
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
					...(data.editorView
						? [
								{
									id: "paste-keep-formatting",
									label: "Paste keeping source formatting",
									icon: ClipboardPaste,
									shortcut: "Ctrl+Shift+Alt+V",
									action: () => {
										const view = data.editorView;
										if (!view) return;
										pasteKeepingSourceFormatting(view).catch((err) =>
											console.error("Paste keeping formatting failed:", err),
										);
									},
								},
							]
						: []),
				],
			});

			// Line commands: on the selected lines, or the whole note without a selection
			const view = data.editorView;
			if (view) {
				const scope = data.hasSelection ? "" : " (whole note)";
				const lineItem = (id: string, label: string, icon: MenuItem["icon"], command: Command): MenuItem => ({
					id,
					label: label + scope,
					icon,
					disabled: !command(view.state),
					action: () => {
						command(view.state, view.dispatch);
						view.focus();
					},
				});
				groups.push({
					id: "format-painter",
					items: [
						{
							id: "copy-formatting",
							label: "Copy formatting",
							icon: Paintbrush,
							shortcut: "Shift+Alt+C",
							action: () => {
								copyFormatting(view.state, view.dispatch);
								view.focus();
							},
						},
						{
							id: "apply-formatting",
							label: "Apply copied formatting",
							icon: Paintbrush,
							shortcut: "Shift+Alt+V",
							disabled: !getFormatPainterState(view.state)?.marks,
							action: () => {
								applyFormatting(view.state, view.dispatch);
								view.focus();
							},
						},
					],
				});
				groups.push({
					id: "lines",
					items: [
						lineItem("remove-empty-lines", "Remove empty lines", ListX, removeEmptyLines),
						lineItem("collapse-empty-lines", "Collapse empty lines", ListCollapse, collapseEmptyLines),
						lineItem("trim-trailing-whitespace", "Trim trailing spaces", RemoveFormatting, trimTrailingWhitespace),
						lineItem("remove-duplicate-lines", "Remove duplicate lines", ListChecks, removeDuplicateLines),
					],
				});
				groups.push({
					id: "lines-order",
					items: [
						lineItem("sort-lines-asc", "Sort lines A→Z", ArrowDownAZ, sortLinesAscending),
						lineItem("sort-lines-desc", "Sort lines Z→A", ArrowDownZA, sortLinesDescending),
						lineItem("reverse-lines", "Reverse lines", ArrowUpDown, reverseLines),
						lineItem("join-lines", "Join lines", WrapText, joinLines),
					],
				});
			}

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
		},
		[]
	);

	return {
		getTreeNodeMenuGroups,
		getEditorMenuGroups,
	};
}
