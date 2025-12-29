import { useAtomValue, useSetAtom } from "jotai";
import { useTree } from "@headless-tree/react";
import {
	syncDataLoaderFeature,
	hotkeysCoreFeature,
	selectionFeature,
	dragAndDropFeature,
	type TreeState,
	type FeatureImplementation,
	type TreeInstance,
} from "@headless-tree/core";
import { itemsAtom, selectedItemIdAtom } from "@/atoms/items";
import type { FlexibleItem } from "@/types/items";
import { compareSortOrder } from "@/utils/sort-order";
import {
	ChevronRight,
	ChevronDown,
	FileText,
	Book,
	FolderOpen,
	Folder,
	Scissors,
} from "lucide-react";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import {
	useTabManagement,
	useItems,
	useRightClickMenu,
	useRightClickMenuActions,
} from "@/hooks";
import { canBeChildOf } from "@/storage/hierarchy";
import { RightClickMenu } from "@/components/right-click-menu";
import type { TreeRightClickData } from "@/types/right-click-menu";

/** Type alias for tree hotkey handlers */
type TreeHotkeyHandler = (
	e: KeyboardEvent,
	tree: TreeInstance<FlexibleItem>,
) => void;

// Custom click behavior: single-click only focuses/selects, double-click opens
// This overrides the default behavior where single-click calls primaryAction
const singleClickSelectFeature: FeatureImplementation<FlexibleItem> = {
	itemInstance: {
		getProps: ({ tree, item, prev }) => ({
			...prev?.(),
			onClick: (e: MouseEvent) => {
				// Handle selection (Shift/Ctrl modifiers)
				if (e.shiftKey) {
					item.selectUpTo(e.ctrlKey || e.metaKey);
				} else if (e.ctrlKey || e.metaKey) {
					item.toggleSelect();
				} else {
					tree.setSelectedItems([item.getItemMeta().itemId]);
				}

				// Focus this item
				item.setFocused();

				// Toggle expand/collapse for folders
				if (item.isFolder()) {
					if (item.isExpanded()) {
						item.collapse();
					} else {
						item.expand();
					}
				}
				// NOTE: We intentionally do NOT call item.primaryAction() here
				// That will be triggered by double-click instead
			},
		}),
	},
};

// Custom arrow key navigation for folders only
// Left/Right arrows skip notes and only navigate between expandable items (books/sections)
// Still expands/collapses when applicable
const customArrowNavFeature: FeatureImplementation<FlexibleItem> = {
	hotkeys: {
		collapseOrUp: {
			hotkey: "ArrowLeft",
			canRepeat: true,
			handler: (_e, tree) => {
				const item = tree.getFocusedItem();
				const visibleItems = tree.getItems();

				// If nothing focused, focus first folder
				if (!item) {
					const firstFolder = visibleItems.find((i) => i.isFolder());
					if (firstFolder) {
						firstFolder.setFocused();
						tree.updateDomFocus();
					}
					return;
				}

				// If expanded folder, collapse it
				if (item.isFolder() && item.isExpanded()) {
					item.collapse();
				} else {
					// Navigate to previous expandable item (book/section)
					const currentIndex = visibleItems.findIndex(
						(i) => i.getItemMeta().itemId === item.getItemMeta().itemId,
					);
					// Find previous folder
					for (let i = currentIndex - 1; i >= 0; i--) {
						const prevItem = visibleItems[i];
						if (prevItem?.isFolder()) {
							prevItem.setFocused();
							tree.updateDomFocus();
							break;
						}
					}
				}
			},
		},
		expandOrDown: {
			hotkey: "ArrowRight",
			canRepeat: true,
			handler: (_e, tree) => {
				const item = tree.getFocusedItem();
				const visibleItems = tree.getItems();

				// If nothing focused, focus first folder
				if (!item) {
					const firstFolder = visibleItems.find((i) => i.isFolder());
					if (firstFolder) {
						firstFolder.setFocused();
						tree.updateDomFocus();
					}
					return;
				}

				// If collapsed folder, expand it
				if (item.isFolder() && !item.isExpanded()) {
					item.expand();
				} else {
					// Navigate to next expandable item (book/section)
					const currentIndex = visibleItems.findIndex(
						(i) => i.getItemMeta().itemId === item.getItemMeta().itemId,
					);
					// Find next folder
					for (let i = currentIndex + 1; i < visibleItems.length; i++) {
						const nextItem = visibleItems[i];
						if (nextItem?.isFolder()) {
							nextItem.setFocused();
							tree.updateDomFocus();
							break;
						}
					}
				}
			},
		},
	},
};
export function TreeView() {
	const items = useAtomValue(itemsAtom);
	const setSelectedItemId = useSetAtom(selectedItemIdAtom);
	const { openItemInTab } = useTabManagement();
	const { moveItem } = useItems();

	// Right-click menu handling
	const { rightClickMenu, handleRightClickMenu, hideRightClickMenu } =
		useRightClickMenu();

	// Open in pane callback for context menu
	const handleOpenInPane = useCallback(
		(
			itemId: string,
			itemTitle: string,
			itemType: "note" | "book" | "section",
			pane: 0 | 1,
		) => {
			openItemInTab({
				id: itemId,
				title: itemTitle,
				type: itemType,
				targetPane: pane,
			});
		},
		[openItemInTab],
	);

	const { getTreeNodeMenuGroups } = useRightClickMenuActions({
		onOpenInPane: handleOpenInPane,
	});

	// Unified controlled state for headless-tree (follows library pattern)
	const [treeState, setTreeState] = useState<Partial<TreeState<FlexibleItem>>>({});

	// Track if tree container has DOM focus (to only show focus styling when tree is active)
	const [treeHasFocus, setTreeHasFocus] = useState(false);

	// Clipboard state for cut/paste operations
	const [clipboardItemIds, setClipboardItemIds] = useState<string[]>([]);

	// Workaround for WebKit bug in Tauri on Linux
	// See: https://github.com/tauri-apps/tauri/issues/6695
	// WebKit requires dataTransfer.setData() to be called for drag events to work
	useEffect(() => {
		const handleDragStart = (e: DragEvent) => {
			if (e.target instanceof HTMLElement && e.dataTransfer) {
				// Set data to enable drag events on WebKit/Linux
				e.dataTransfer.setData("text/plain", e.target.id || "draggedElement");
			}
		};
		document.addEventListener("dragstart", handleDragStart);
		return () => {
			document.removeEventListener("dragstart", handleDragStart);
		};
	}, []);

	// Create a lookup map for efficient data access
	const itemMap = useMemo(() => {
		const map = new Map<string, FlexibleItem>();
		for (const item of items) {
			map.set(item.id, item);
		}
		return map;
	}, [items]);

	// Create children lookup map
	const childrenMap = useMemo(() => {
		const map = new Map<string, string[]>();

		// Initialize with empty arrays for all items
		for (const item of items) {
			map.set(item.id, []);
		}

		// Group items by parent_id
		for (const item of items) {
			const parentId = item.parent_id || "root";
			if (!map.has(parentId)) {
				map.set(parentId, []);
			}
			const children = map.get(parentId);
			if (children) {
				children.push(item.id);
			}
		}

		// Sort children by sort_order (ASCII comparison for fractional indexing)
		for (const children of map.values()) {
			children.sort((a, b) => {
				const itemA = itemMap.get(a);
				const itemB = itemMap.get(b);
				return compareSortOrder(itemA?.sort_order || "a0", itemB?.sort_order || "a0");
			});
		}

		return map;
	}, [items, itemMap]);

	// Find root items (items without parent_id or with null parent_id)
	const rootItemIds = useMemo(() => {
		return items
			.filter((item) => !item.parent_id)
			.sort((a, b) => compareSortOrder(a.sort_order, b.sort_order))
			.map((item) => item.id);
	}, [items]);

	// Create a version key based on parent relationships to force tree rebuild
	const dataVersion = useMemo(() => {
		return items.map((i) => `${i.id}:${i.parent_id || "root"}:${i.sort_order}`).join(",");
	}, [items]);

	// Get all book and section IDs for initial expanded state
	const folderIds = useMemo(() => {
		return items
			.filter((item) => item.type === "book" || item.type === "section")
			.map((item) => item.id);
	}, [items]);

	// Initialize expanded items on first render
	useEffect(() => {
		if (!treeState.expandedItems && folderIds.length > 0) {
			setTreeState((prev) => ({ ...prev, expandedItems: folderIds }));
		}
	}, [folderIds, treeState.expandedItems]);

	// ============================================================================
	// Tree Navigation Helpers
	// These reduce code duplication in hotkey handlers
	// ============================================================================

	/** Get the focused item's index in the visible items list */
	const getFocusedIndex = (treeInstance: ReturnType<typeof useTree<FlexibleItem>>) => {
		const focusedItem = treeInstance.getFocusedItem();
		if (!focusedItem) return { focusedItem: null, visibleItems: [] as ReturnType<typeof treeInstance.getItems>, index: -1 };
		const visibleItems = treeInstance.getItems();
		const index = visibleItems.findIndex(
			(i) => i.getItemMeta().itemId === focusedItem.getItemMeta().itemId,
		);
		return { focusedItem, visibleItems, index };
	};

	/** Focus the previous visible item, optionally extending selection */
	const focusPrev = (treeInstance: ReturnType<typeof useTree<FlexibleItem>>, extendSelection = false) => {
		const { visibleItems, index } = getFocusedIndex(treeInstance);
		if (index > 0) {
			const prevItem = visibleItems[index - 1];
			if (prevItem) {
				prevItem.setFocused();
				if (extendSelection) prevItem.selectUpTo(true);
				treeInstance.updateDomFocus();
				return prevItem;
			}
		}
		return null;
	};

	/** Focus the next visible item, optionally extending selection */
	const focusNext = (treeInstance: ReturnType<typeof useTree<FlexibleItem>>, extendSelection = false) => {
		const { visibleItems, index } = getFocusedIndex(treeInstance);
		if (index >= 0 && index < visibleItems.length - 1) {
			const nextItem = visibleItems[index + 1];
			if (nextItem) {
				nextItem.setFocused();
				if (extendSelection) nextItem.selectUpTo(true);
				treeInstance.updateDomFocus();
				return nextItem;
			}
		}
		return null;
	};

	/** Get sibling info for reordering within parent */
	const getSiblingInfo = (focusedId: string) => {
		if (!focusedId || focusedId === "root") return null;
		const focusedData = itemMap.get(focusedId);
		if (!focusedData) return null;
		const parentId = focusedData.parent_id || "root";
		const siblings = childrenMap.get(parentId) || [];
		const currentIndex = siblings.indexOf(focusedId);
		return { focusedData, parentId, siblings, currentIndex };
	};

	const tree = useTree<FlexibleItem>({
		rootItemId: "root",
		// Use unified state/setState pattern from headless-tree
		state: treeState,
		setState: setTreeState,
		getItemName: (item) => item.getItemData().title,
		isItemFolder: (item) => {
			const itemData = item.getItemData();
			return itemData.type === "book" || itemData.type === "section";
		},
		indent: 16,
		canReorder: true,
		// Handle Enter key to open items in appropriate view
		onPrimaryAction: (item) => {
			const itemData = item.getItemData();
			openItemInTab({
				id: itemData.id,
				title: itemData.title,
				type: itemData.type,
			});
		},
		// Custom hotkeys for cut/paste operations
		hotkeys: {
			// Bind Enter key to trigger primaryAction
			customEnter: {
				hotkey: "Enter",
				handler: ((_e, treeInstance) => {
					const focusedItem = treeInstance.getFocusedItem();
					if (focusedItem) {
						focusedItem.primaryAction();
					}
				}) as TreeHotkeyHandler,
			},
			// Ctrl+Enter opens in pane 2 (auto-enables dual-pane if needed)
			customCtrlEnter: {
				hotkey: "Control+Enter",
				handler: ((_e, treeInstance) => {
					const focusedItem = treeInstance.getFocusedItem();
					if (focusedItem) {
						const itemData = focusedItem.getItemData();
						openItemInTab({
							id: itemData.id,
							title: itemData.title,
							type: itemData.type,
							targetPane: 1,
						});
					}
				}) as TreeHotkeyHandler,
			},
			// Cut items (Ctrl+X) - uses selected items if any, otherwise focused item
			customCut: {
				hotkey: "Control+KeyX",
				handler: ((_e, treeInstance) => {
					const selectedItems = treeInstance.getSelectedItems();
					if (selectedItems.length > 0) {
						// Use multi-selected items (Ctrl+Click selection)
						const ids = selectedItems.map((item) => item.getId());
						setClipboardItemIds(ids);
					} else {
						// Fall back to focused item if no selection
						const focusedId = treeInstance.getState().focusedItem;
						if (focusedId && focusedId !== "root") {
							setClipboardItemIds([focusedId]);
						}
					}
				}) as TreeHotkeyHandler,
			},
			// Cancel/clear (Escape) - clears clipboard, selection, and focus
			customCancel: {
				hotkey: "Escape",
				handler: ((_e, treeInstance) => {
					// Clear clipboard if any
					if (clipboardItemIds.length > 0) {
						setClipboardItemIds([]);
					}
					// Clear multi-selection and focused item
					treeInstance.setSelectedItems([]);
					setTreeState((prev) => ({ ...prev, focusedItem: null }));
					// Clear the selectedItemId atom
					setSelectedItemId(null);
				}) as TreeHotkeyHandler,
			},
			// Focus first item when nothing is focused (Up arrow)
			customFocusOnUp: {
				hotkey: "ArrowUp",
				canRepeat: true,
				handler: ((_e, treeInstance) => {
					const item = treeInstance.getFocusedItem();
					if (!item) {
						const visibleItems = treeInstance.getItems();
						const firstItem = visibleItems[0];
						if (firstItem) {
							firstItem.setFocused();
							treeInstance.updateDomFocus();
						}
					}
					// Default behavior handles normal navigation when item is focused
				}) as TreeHotkeyHandler,
			},
			// Focus first item when nothing is focused (Down arrow)
			customFocusOnDown: {
				hotkey: "ArrowDown",
				canRepeat: true,
				handler: ((_e, treeInstance) => {
					const item = treeInstance.getFocusedItem();
					if (!item) {
						const visibleItems = treeInstance.getItems();
						const firstItem = visibleItems[0];
						if (firstItem) {
							firstItem.setFocused();
							treeInstance.updateDomFocus();
						}
					}
					// Default behavior handles normal navigation when item is focused
				}) as TreeHotkeyHandler,
			},
			// Toggle selection of focused item (Ctrl+Space) - for non-consecutive multi-select
			customToggleSelection: {
				hotkey: "Control+Space",
				handler: ((_e, treeInstance) => {
					const focusedItem = treeInstance.getFocusedItem();
					if (focusedItem) {
						focusedItem.toggleSelect();
					}
				}) as TreeHotkeyHandler,
			},
			// Paste cut items (Ctrl+V)
			// If focused on a folder: paste inside
			// If focused on a note: paste as sibling at same level
			customPaste: {
				hotkey: "Control+KeyV",
				handler: (async (_e, treeInstance) => {
					if (clipboardItemIds.length === 0) return;

					// Get the focused item as target
					const focusedId = treeInstance.getState().focusedItem;
					if (!focusedId) return;

					const targetData = itemMap.get(focusedId);
					if (!targetData) return;

					let targetParentId: string | null;
					let insertAfterIndex: number | undefined;

					if (targetData.type === "note") {
						// Paste as sibling at same level (after the focused note)
						targetParentId = targetData.parent_id ?? null;
						const siblings = childrenMap.get(targetParentId || "root") || [];
						insertAfterIndex = siblings.indexOf(focusedId);
					} else {
						// Paste inside the folder
						targetParentId = focusedId;
						insertAfterIndex = undefined; // Append at end
					}

					// Move all clipboard items to the target
					for (const itemId of clipboardItemIds) {
						const sourceData = itemMap.get(itemId);
						if (!sourceData) continue;

						// Check if move is valid using hierarchy rules
						const targetType =
							targetParentId === null
								? null
								: itemMap.get(targetParentId)?.type ?? null;

						// Validate using canBeChildOf for all cases (including root)
						if (!canBeChildOf(sourceData.type, targetType)) {
							continue;
						}

						await moveItem(itemId, targetParentId, insertAfterIndex);

						// Increment index for next item to maintain order
						if (insertAfterIndex !== undefined) {
							insertAfterIndex++;
						}
					}

					// Clear clipboard after paste
					setClipboardItemIds([]);
				}) as TreeHotkeyHandler,
			},
			// Extend selection up (Shift+Up)
			customExtendSelectionUp: {
				hotkey: "Shift+ArrowUp",
				canRepeat: true,
				handler: ((_e, treeInstance) => {
					focusPrev(treeInstance, true);
				}) as TreeHotkeyHandler,
			},
			// Extend selection down (Shift+Down)
			customExtendSelectionDown: {
				hotkey: "Shift+ArrowDown",
				canRepeat: true,
				handler: ((_e, treeInstance) => {
					focusNext(treeInstance, true);
				}) as TreeHotkeyHandler,
			},
			// Navigate up with Ctrl held (for multi-select workflow)
			customCtrlNavigateUp: {
				hotkey: "Control+ArrowUp",
				canRepeat: true,
				handler: ((_e, treeInstance) => {
					focusPrev(treeInstance);
				}) as TreeHotkeyHandler,
			},
			// Navigate down with Ctrl held (for multi-select workflow)
			customCtrlNavigateDown: {
				hotkey: "Control+ArrowDown",
				canRepeat: true,
				handler: ((_e, treeInstance) => {
					focusNext(treeInstance);
				}) as TreeHotkeyHandler,
			},
			// Move focused item up within its parent (Alt+Up)
			customMoveUp: {
				hotkey: "AltLeft+ArrowUp",
				handler: (async (_e, treeInstance) => {
					const focusedId = treeInstance.getState().focusedItem;
					const info = getSiblingInfo(focusedId ?? "");
					if (!info || info.currentIndex <= 0) return;
					await moveItem(focusedId!, info.focusedData.parent_id ?? null, info.currentIndex - 1);
				}) as TreeHotkeyHandler,
			},
			// Move focused item down within its parent (Alt+Down)
			customMoveDown: {
				hotkey: "AltLeft+ArrowDown",
				handler: (async (_e, treeInstance) => {
					const focusedId = treeInstance.getState().focusedItem;
					const info = getSiblingInfo(focusedId ?? "");
					if (!info || info.currentIndex < 0 || info.currentIndex >= info.siblings.length - 1) return;
					await moveItem(focusedId!, info.focusedData.parent_id ?? null, info.currentIndex + 1);
				}) as TreeHotkeyHandler,
			},
		},
		canDrop: (draggedItems, target) => {
			// First check: target must be a folder (book or section), not a note
			if (!target.item.isFolder()) {
				return false;
			}
			// Get the dragged item
			const draggedItem = draggedItems[0];
			if (!draggedItem) return false;

			const draggedData = draggedItem.getItemData();

			// Determine target parent type
			let targetParentType: FlexibleItem["type"] | null = null;
			if (target.item) {
				const targetData = target.item.getItemData();
				if (target.item.getId() !== "root") {
					targetParentType = targetData.type;
				}
			}

			// Validate using hierarchy rules
			return canBeChildOf(draggedData.type, targetParentType);
		},
		onDrop: async (draggedItems, target) => {
			// Get the dragged item
			const draggedItem = draggedItems[0];
			if (!draggedItem) return;

			const draggedData = draggedItem.getItemData();

			// Determine new parent based on drop target
			let newParentId: string | null = null;

			if (target.item) {
				const targetData = target.item.getItemData();
				if (target.item.getId() !== "root") {
					newParentId = targetData.id;
				}
			}

			// Check if this is a reorder operation (has insertionIndex)
			// insertionIndex is provided when canReorder is true and dropping between items
			const insertIndex = "insertionIndex" in target ? target.insertionIndex : undefined;

			// Perform the move with optional position
			await moveItem(draggedData.id, newParentId, insertIndex);
		},
		dataLoader: {
			getItem: (itemId: string): FlexibleItem => {
				if (itemId === "root") {
					// Return a virtual root item
					return {
						id: "root",
						type: "book",
						title: "Root",
						sort_order: "a0",
						metadata: {},
						created_at: new Date().toISOString(),
						updated_at: new Date().toISOString(),
					} as FlexibleItem;
				}
				const item = itemMap.get(itemId);
				if (!item) {
					console.error(
						`Item with id ${itemId} not found. Available items:`,
						Array.from(itemMap.keys())
					);
					// Return a placeholder item instead of throwing to prevent crashes
					return {
						id: itemId,
						type: "note",
						title: `[Missing: ${itemId}]`,
						sort_order: "a0",
						metadata: {},
						created_at: new Date().toISOString(),
						updated_at: new Date().toISOString(),
					} as FlexibleItem;
				}
				return item;
			},
			getChildren: (itemId: string): string[] => {
				if (itemId === "root") {
					return rootItemIds;
				}
				return childrenMap.get(itemId) || [];
			},
		},
		features: [
			syncDataLoaderFeature,
			hotkeysCoreFeature,
			selectionFeature,
			dragAndDropFeature,
			singleClickSelectFeature, // Override default click behavior
			customArrowNavFeature, // Override Left/Right arrows for folder-only navigation
		],
	});

	// Track if this is the first render to skip initial rebuild
	const isFirstRender = useRef(true);

	// Rebuild tree when data changes (skip initial render)
	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false;
			return;
		}
		// Tell headless-tree to rebuild with new data
		tree.rebuildTree();
	}, [dataVersion, tree]);

	const getItemIcon = (item: FlexibleItem, isExpanded: boolean) => {
		switch (item.type) {
			case "book":
				return <Book className="w-3 h-3 text-blue-600 dark:text-blue-400" />;
			case "section":
				return isExpanded ? (
					<FolderOpen className="w-3 h-3 text-amber-600 dark:text-amber-400" />
				) : (
					<Folder className="w-3 h-3 text-amber-600 dark:text-amber-400" />
				);
			case "note":
				return (
					<FileText className="w-3 h-3 text-green-600 dark:text-green-400" />
				);
			default:
				return (
					<FileText className="w-3 h-3 text-gray-600 dark:text-gray-400" />
				);
		}
	};

	// Handle double-click - open item in appropriate view
	const handleItemOpen = (itemId: string) => {
		const itemData = itemMap.get(itemId);
		if (itemData) {
			setSelectedItemId(itemId);
			openItemInTab({
				id: itemData.id,
				title: itemData.title,
				type: itemData.type,
			});
		}
	};

	// Get visible items (excluding root)
	const visibleItems = tree.getItems().filter((item) => item.getId() !== "root");

	// Show loading state if no items yet (AFTER all hooks are called)
	if (items.length === 0) {
		return (
			<div className="w-full h-full flex flex-col">
				<div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
					<h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
						Notes Tree
					</h2>
				</div>
				<div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
					<p className="text-sm">Loading items...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full h-full flex flex-col">
			{/* Tree Header */}
			<div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
				<h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
					Notes Tree
				</h2>
				<div className="text-xs text-gray-500 dark:text-gray-400">
					{items.length} items
				</div>
			</div>

			{/* Tree Content - flex container to fill available space */}
			<div className="flex-1 min-h-0 overflow-auto p-2 flex flex-col">
				{/* Root drop zone - visible when dragging */}
				<div
					className="flex-shrink-0 mb-2 p-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded text-center text-xs text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
					onDragOver={(e) => {
						e.preventDefault();
						e.currentTarget.classList.add("border-blue-500", "bg-blue-100", "dark:bg-blue-900/40");
					}}
					onDragLeave={(e) => {
						e.currentTarget.classList.remove("border-blue-500", "bg-blue-100", "dark:bg-blue-900/40");
					}}
					onDrop={async (e) => {
						e.preventDefault();
						e.currentTarget.classList.remove("border-blue-500", "bg-blue-100", "dark:bg-blue-900/40");
						// Get the dragged item from the tree's drag state
						const draggedItems = tree.getState().dnd?.draggedItems;
						if (draggedItems && draggedItems.length > 0) {
							const firstDragged = draggedItems[0];
							if (!firstDragged) return;
							const draggedData = firstDragged.getItemData();
							// Only allow notes and books at root (not sections)
							if (draggedData.type === "note" || draggedData.type === "book") {
								await moveItem(draggedData.id, null);
							}
						}
					}}
				>
					Drop here for root level
				</div>
				<div 
					{...tree.getContainerProps()} 
					data-tree-container="true"
					tabIndex={0}
					className="relative font-mono flex-1 min-h-[100px] focus:ring-2 focus:ring-blue-400/50 focus:ring-inset focus:outline-none focus-within:ring-2 focus-within:ring-blue-400/50 focus-within:ring-inset rounded-sm cursor-default"
					onFocus={() => setTreeHasFocus(true)}
					onBlur={() => setTreeHasFocus(false)}
					onClick={(e) => {
						// If clicking on empty space in container (not on an item), clear selection
						if (e.target === e.currentTarget) {
							e.currentTarget.focus();
							// Clear selection and focus
							tree.setSelectedItems([]);
							setTreeState((prev) => ({ ...prev, focusedItem: null }));
							setSelectedItemId(null);
						}
					}}
				>
					{visibleItems.map((item) => {
						const itemData = item.getItemData();
						const level = item.getItemMeta().level;

						// Check if item can be expanded/collapsed (has children)
						const hasChildren = (childrenMap.get(itemData.id)?.length ?? 0) > 0;
						const isFolder =
							itemData.type === "book" || itemData.type === "section";
						
						// Drag state for visual feedback (from headless-tree)
						const isDragTarget = item.isDragTarget?.() ?? false;
						const isSelected = item.isSelected?.() ?? false;
						// Check both library state and our controlled state for focus
						const isFocused = (item.isFocused?.() ?? false) && treeState.focusedItem != null;
						const isInClipboard = clipboardItemIds.includes(itemData.id);

						// Get the props from headless-tree (includes ALL handlers: drag, drop, etc.)
						const itemProps = item.getProps();

						return (
							<button
								key={itemData.id}
								// Spread ALL library props (drag handlers, click, etc.)
								// Our singleClickSelectFeature overrides onClick to NOT call primaryAction
								{...itemProps}

								type="button"
								className={`
                  w-full flex items-center gap-1 py-0.5 px-1 rounded cursor-pointer transition-colors text-left
                  ${isInClipboard ? "opacity-50" : ""}
                  ${
										isDragTarget
											? "bg-blue-100/70 dark:bg-blue-900/30 border-l-2 border-blue-400"
											: isSelected
												? "bg-blue-500/20 dark:bg-blue-500/30"
												: isFocused && treeHasFocus
													? "ring-1 ring-blue-400/60 dark:ring-blue-400/50"
													: isInClipboard
														? "bg-gray-100 dark:bg-gray-800"
														: "hover:bg-gray-100 dark:hover:bg-gray-800/50"
									}
                  focus:outline-none
                  select-none
                `}
								style={{
									paddingLeft: `${level * 16 + 4}px`,
								}}
								onDoubleClick={() => {
									handleItemOpen(itemData.id);
								}}
								onContextMenu={(e) => {
									e.preventDefault();
									const rightClickData: TreeRightClickData = {
										nodeId: itemData.id,
										nodeName: itemData.title,
										nodeType: itemData.type,
									};
									const menuGroups = getTreeNodeMenuGroups(rightClickData);
									handleRightClickMenu(e, {
										targetId: itemData.id,
										targetType: "tree",
										menuGroups,
									});
								}}
							>
								{isFolder && hasChildren ? (
									<span className="flex-shrink-0 w-3 h-3 flex items-center justify-center">
										{item.isExpanded() ? (
											<ChevronDown className="w-2.5 h-2.5 text-gray-400" />
										) : (
											<ChevronRight className="w-2.5 h-2.5 text-gray-400" />
										)}
									</span>
								) : (
									<span className="w-3" />
								)}
								<span className="flex-shrink-0">
									{getItemIcon(itemData, item.isExpanded())}
								</span>
								<span className="flex-1 truncate text-xs text-gray-800 dark:text-gray-200">
									{itemData.title}
								</span>
								{clipboardItemIds.includes(itemData.id) && (
									<Scissors className="w-3 h-3 text-orange-500 flex-shrink-0" />
								)}
							</button>
						);
					})}
					{/* Drag line indicator */}
					<div
						style={tree.getDragLineStyle()}
						className="absolute h-0.5 bg-blue-500 pointer-events-none"
					/>
				</div>
			</div>

			{/* Keep old implementation commented out as requested */}
			{/*
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Raw Items Data (JSON)
        </h3>
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto max-h-96">
          <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {JSON.stringify(items, null, 2)}
          </pre>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p>Total items: {items.length}</p>
          <p>Notes: {items.filter(item => item.type === 'note').length}</p>
          <p>Books: {items.filter(item => item.type === 'book').length}</p>
          <p>Sections: {items.filter(item => item.type === 'section').length}</p>
        </div>
      </div>
      */}
			<RightClickMenu data={rightClickMenu} onClose={hideRightClickMenu} />
		</div>
	);
}
