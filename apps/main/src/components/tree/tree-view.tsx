import { useAtomValue, useSetAtom, useAtom } from "jotai";
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
import { focusAreaAtom, pane0TabsAtom, pane1TabsAtom, pane0ActiveTabAtom, pane1ActiveTabAtom, hoistedRootIdAtom } from "@/atoms";
import { registerTreeViewCallbacks, unregisterTreeViewCallbacks } from "@/atoms/tree";
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
	ArrowUp,
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

// Custom click behavior based on item type:
// Notes: single-click = focus only, double-click = open in editor
// Books/Sections: single-click = open in view, double-click = toggle expand/collapse
// Selection only happens with Ctrl/Shift modifiers
const singleClickSelectFeature: FeatureImplementation<FlexibleItem> = {
	itemInstance: {
		getProps: ({ item, prev }) => ({
			...prev?.(),
			onClick: (e: MouseEvent) => {
				// Handle selection only with modifiers (Shift/Ctrl)
				if (e.shiftKey) {
					item.selectUpTo(e.ctrlKey || e.metaKey);
				} else if (e.ctrlKey || e.metaKey) {
					item.toggleSelect();
				}
				// Plain click only focuses, does NOT select

				// Focus this item
				item.setFocused();

				// For folders (books/sections): open in view on single click
				if (item.isFolder()) {
					item.primaryAction();
				}
				// For notes: single click only focuses, don't open
			},
			onDoubleClick: (e: MouseEvent) => {
				if (item.isFolder()) {
					// Double-click toggles expand/collapse for folders
					e.preventDefault();
					if (item.isExpanded()) {
						item.collapse();
					} else {
						item.expand();
					}
				} else {
					// Double-click opens notes in editor
					item.primaryAction();
				}
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
	const pane0Tabs = useAtomValue(pane0TabsAtom);
	const pane1Tabs = useAtomValue(pane1TabsAtom);
	
	// Track which items are currently open in editor tabs
	const openedItemIds = useMemo(() => {
		const ids = new Set<string>();
		for (const tab of [...pane0Tabs, ...pane1Tabs]) {
			if (tab.viewData?.noteId) {
				ids.add(tab.viewData.noteId);
			}
		}
		return ids;
	}, [pane0Tabs, pane1Tabs]);
	
	// Track currently active (visible) item in editor/view (can be note, section, or book)
	const pane0ActiveTab = useAtomValue(pane0ActiveTabAtom);
	const pane1ActiveTab = useAtomValue(pane1ActiveTabAtom);
	const activeItemId = useMemo(() => {
		// Find active tab in pane 0 (primary)
		const activeInPane0 = pane0Tabs.find((t) => t.id === pane0ActiveTab);
		if (activeInPane0?.viewData) {
			// Check all possible item types
			const itemId = activeInPane0.viewData.noteId || 
			               activeInPane0.viewData.sectionId || 
			               activeInPane0.viewData.bookId;
			if (itemId) return itemId;
		}
		// Fallback to pane 1
		const activeInPane1 = pane1Tabs.find((t) => t.id === pane1ActiveTab);
		if (activeInPane1?.viewData) {
			const itemId = activeInPane1.viewData.noteId || 
			               activeInPane1.viewData.sectionId || 
			               activeInPane1.viewData.bookId;
			if (itemId) return itemId;
		}
		return null;
	}, [pane0Tabs, pane1Tabs, pane0ActiveTab, pane1ActiveTab]);
	
	// Hoisted root for focusing on a subtree
	const [hoistedRootId, setHoistedRootId] = useAtom(hoistedRootIdAtom);
	
	const setSelectedItemId = useSetAtom(selectedItemIdAtom);
	const { openItemInTab } = useTabManagement();
	const { moveItem, updateItemTitle, deleteItem } = useItems();

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
	// Initialize with empty selectedItems so nothing is selected by default
	const [treeState, setTreeState] = useState<Partial<TreeState<FlexibleItem>>>({
		selectedItems: [],
	});

	// Track if tree has focus via global focus area atom (mutually exclusive with pane focus)
	const [focusArea, setFocusArea] = useAtom(focusAreaAtom);
	const treeHasFocus = focusArea === "tree";

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

	// Find root items - use hoisted root's children if hoisted, otherwise top-level items
	const rootItemIds = useMemo(() => {
		if (hoistedRootId) {
			// When hoisted, show children of the hoisted item as root
			const children = childrenMap.get(hoistedRootId) || [];
			return children; // Already sorted by childrenMap
		}
		// Normal mode: show items without parent
		return items
			.filter((item) => !item.parent_id)
			.sort((a, b) => compareSortOrder(a.sort_order, b.sort_order))
			.map((item) => item.id);
	}, [items, hoistedRootId, childrenMap]);

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
			// Cancel/clear (Escape) - clears clipboard and selection, keeps focus
			customCancel: {
				hotkey: "Escape",
				handler: ((_e, treeInstance) => {
					// Clear clipboard if any
					if (clipboardItemIds.length > 0) {
						setClipboardItemIds([]);
					}
					// Clear multi-selection but keep focus where it is
					treeInstance.setSelectedItems([]);
					// Clear the selectedItemId atom
					setSelectedItemId(null);
				}) as TreeHotkeyHandler,
			},
			// Up arrow navigation - focus first item if nothing focused, else move up
			customFocusOnUp: {
				hotkey: "ArrowUp",
				canRepeat: true,
				handler: ((_e, treeInstance) => {
					const item = treeInstance.getFocusedItem();
					if (!item) {
						// Nothing focused - focus first item
						const visibleItems = treeInstance.getItems();
						const firstItem = visibleItems[0];
						if (firstItem) {
							firstItem.setFocused();
							treeInstance.updateDomFocus();
						}
					} else {
						// Already focused - navigate to previous item
						treeInstance.focusPreviousItem();
						treeInstance.updateDomFocus();
					}
				}) as TreeHotkeyHandler,
			},
			// Down arrow navigation - focus first item if nothing focused, else move down
			customFocusOnDown: {
				hotkey: "ArrowDown",
				canRepeat: true,
				handler: ((_e, treeInstance) => {
					const item = treeInstance.getFocusedItem();
					if (!item) {
						// Nothing focused - focus first item
						const visibleItems = treeInstance.getItems();
						const firstItem = visibleItems[0];
						if (firstItem) {
							firstItem.setFocused();
							treeInstance.updateDomFocus();
						}
					} else {
						// Already focused - navigate to next item
						treeInstance.focusNextItem();
						treeInstance.updateDomFocus();
					}
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
			// Toggle select focused item (Space) - single selection mode
			customSelectItem: {
				hotkey: "Space",
				preventDefault: true,
				handler: ((_e, treeInstance) => {
					const focusedItem = treeInstance.getFocusedItem();
					if (focusedItem) {
						if (focusedItem.isSelected()) {
							// Already selected - deselect it
							treeInstance.setSelectedItems([]);
						} else {
							// Not selected - select it (clears others)
							treeInstance.setSelectedItems([focusedItem.getId()]);
						}
					}
				}) as TreeHotkeyHandler,
			},
			// Rename focused item (F2)
			customRename: {
				hotkey: "F2",
				preventDefault: true,
				handler: ((_e, treeInstance) => {
					const focusedItem = treeInstance.getFocusedItem();
					if (focusedItem) {
						const itemData = focusedItem.getItemData();
						const newName = prompt(
							`Enter new name for "${itemData.title}":`,
							itemData.title,
						);
						if (newName && newName !== itemData.title) {
							updateItemTitle(itemData.id, newName);
						}
					}
				}) as TreeHotkeyHandler,
			},
			// Delete focused item (Shift+Delete)
			customDelete: {
				hotkey: "Shift+Delete",
				preventDefault: true,
				handler: (async (_e, treeInstance) => {
					const focusedItem = treeInstance.getFocusedItem();
					if (focusedItem) {
						const itemData = focusedItem.getItemData();
						const itemType = itemData.type;
						const itemName =
							itemType === "note"
								? "note"
								: itemType === "book"
									? "book"
									: itemType === "section"
										? "section"
										: "item";

						const confirmMessage = `Are you sure you want to delete ${itemName} "${itemData.title}"${
							itemType !== "note" ? " and all its contents" : ""
						}?`;

						if (confirm(confirmMessage)) {
							// Find the item to focus after deletion
							const parentId = itemData.parent_id || "root";
							const siblings = childrenMap.get(parentId) || [];
							const currentIndex = siblings.indexOf(itemData.id);

							let nextFocusId: string | null = null;
							if (currentIndex > 0) {
								// Focus previous sibling
								nextFocusId = siblings[currentIndex - 1] ?? null;
							} else if (siblings.length > 1) {
								// Focus next sibling (will be at index 0 after deletion)
								nextFocusId = siblings[currentIndex + 1] ?? null;
							} else if (parentId !== "root") {
								// No siblings left, focus parent
								nextFocusId = parentId;
							}

							// Set focus via state BEFORE deletion so it persists through re-render
							if (nextFocusId) {
								setTreeState((prev) => ({
									...prev,
									focusedItem: nextFocusId,
								}));
							}

							await deleteItem(itemData.id);

							// Restore DOM focus after React re-renders
							requestAnimationFrame(() => {
								treeInstance.updateDomFocus();
							});
						}
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

	// Rebuild tree when hoist state changes
	useEffect(() => {
		tree.rebuildTree();
	}, [hoistedRootId, tree]);

	// ============================================================================
	// Reveal Active in Tree & Hoist Feature
	// ============================================================================

	/**
	 * Build the chain of parent IDs from an item up to root
	 */
	const getParentChain = useCallback((itemId: string): string[] => {
		const chain: string[] = [];
		let currentId: string | null | undefined = itemId;
		
		while (currentId) {
			const item = itemMap.get(currentId);
			if (!item || !item.parent_id) break;
			chain.push(item.parent_id);
			currentId = item.parent_id;
		}
		return chain;
	}, [itemMap]);

	/**
	 * Check if an item is within the currently hoisted subtree
	 */
	const isItemInHoistedScope = useCallback((itemId: string): boolean => {
		if (!hoistedRootId) return true; // No hoist = everything is in scope
		
		// Check if itemId is the hoisted root or one of its descendants
		let currentId: string | null | undefined = itemId;
		while (currentId) {
			if (currentId === hoistedRootId) return true;
			const item = itemMap.get(currentId);
			if (!item) break;
			currentId = item.parent_id;
		}
		return false;
	}, [hoistedRootId, itemMap]);

	/**
	 * Reveal the active item (note/section/book) in tree view:
	 * 1. Clear hoist if item is outside hoisted scope
	 * 2. Expand all parent folders
	 * 3. Focus the item
	 * 4. Scroll it into view
	 */
	const revealActiveInTree = useCallback(() => {
		if (!activeItemId) {
			return;
		}
		
		// If hoisted and item is outside scope, unhoist first
		if (hoistedRootId && !isItemInHoistedScope(activeItemId)) {
			setHoistedRootId(null);
		}
		
		// Get parent chain and expand all ancestors
		const parentChain = getParentChain(activeItemId);
		
		// Update tree state to expand all ancestors
		setTreeState((prev) => {
			const currentExpanded = prev.expandedItems || [];
			const newExpanded = [...new Set([...currentExpanded, ...parentChain])];
			return { ...prev, expandedItems: newExpanded };
		});

		// Set focus to tree area
		setFocusArea("tree");

		// Focus the item after a short delay to allow tree to re-render with expanded parents
		setTimeout(() => {
			tree.rebuildTree();
			
			setTimeout(() => {
				const visibleItems = tree.getItems();
				const targetItem = visibleItems.find(
					(i) => i.getItemMeta().itemId === activeItemId
				);
				if (targetItem) {
					targetItem.setFocused();
					tree.updateDomFocus();
					// Scroll into view
					requestAnimationFrame(() => {
						const activeElement = document.activeElement;
						if (activeElement && activeElement instanceof HTMLElement) {
							activeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
						}
					});
				}
			}, 50);
		}, 50);
	}, [activeItemId, hoistedRootId, isItemInHoistedScope, setHoistedRootId, getParentChain, tree, setFocusArea]);

	/**
	 * Get the hoistable container for an item:
	 * - For books/sections: return the item itself
	 * - For notes: return the parent container (if any)
	 */
	const getHoistableContainer = useCallback((itemId: string): string | null => {
		const item = itemMap.get(itemId);
		if (!item) return null;
		
		if (item.type === "book" || item.type === "section") {
			// Books and sections can be hoisted directly
			return item.id;
		}
		// Notes: hoist their parent container
		if (item.parent_id) {
			return item.parent_id;
		}
		return null; // Note at root level, nothing to hoist
	}, [itemMap]);

	/**
	 * Toggle hoist mode:
	 * - If already hoisted: unhoist (return to normal view)
	 * - If tree has focus: hoist the focused item's container
	 * - If editor has focus: hoist the active item's container
	 */
	const toggleHoist = useCallback(() => {
		if (hoistedRootId) {
			// Unhoist - return to normal view
			setHoistedRootId(null);
			return;
		}
		
		// Determine which item to hoist based on current focus
		let itemToHoist: string | null = null;
		
		// Check if tree has focus
		const treeContainer = document.querySelector('[data-tree-container="true"]');
		const isTreeFocused = treeContainer?.contains(document.activeElement);
		
		if (isTreeFocused) {
			// Use focused tree item
			const focusedItem = tree.getFocusedItem();
			if (focusedItem) {
				const itemData = focusedItem.getItemData();
				itemToHoist = getHoistableContainer(itemData.id);
			}
		} else {
			// Use active item from editor/view
			if (activeItemId) {
				itemToHoist = getHoistableContainer(activeItemId);
			}
		}
		
		if (itemToHoist) {
			setHoistedRootId(itemToHoist);
			setFocusArea("tree");
			// Focus first item in tree after hoisting
			setTimeout(() => {
				tree.rebuildTree();
				setTimeout(() => {
					const container = document.querySelector('[data-tree-container="true"]');
					if (container) {
						const firstItem = container.querySelector('button[role="treeitem"]') as HTMLElement | null;
						if (firstItem) {
							firstItem.focus();
						}
					}
				}, 50);
			}, 50);
		}
	}, [hoistedRootId, setHoistedRootId, tree, activeItemId, getHoistableContainer, setFocusArea]);

	/**
	 * Expand all folders in the tree
	 */
	const expandAll = useCallback(() => {
		setTreeState((prev) => ({ ...prev, expandedItems: folderIds }));
		// Delay rebuild to allow React to re-render with new state
		setTimeout(() => {
			tree.rebuildTree();
		}, 0);
	}, [folderIds, tree]);

	/**
	 * Collapse all folders in the tree
	 */
	const collapseAll = useCallback(() => {
		setTreeState((prev) => ({ ...prev, expandedItems: [] }));
		// Delay rebuild to allow React to re-render with new state
		setTimeout(() => {
			tree.rebuildTree();
		}, 0);
	}, [tree]);

	// Register callbacks for global hotkey access
	useEffect(() => {
		registerTreeViewCallbacks({
			revealActiveInTree,
			toggleHoist,
			expandAll,
			collapseAll,
		});
		return () => {
			unregisterTreeViewCallbacks();
		};
	}, [revealActiveInTree, toggleHoist, expandAll, collapseAll]);

	// Get the hoisted item's name for display
	const hoistedRootName = useMemo(() => {
		if (!hoistedRootId) return null;
		return itemMap.get(hoistedRootId)?.title || null;
	}, [hoistedRootId, itemMap]);

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

	// Get visible items (excluding root)
	const visibleItems = tree.getItems().filter((item) => item.getId() !== "root");

	// Show loading state if no items yet (AFTER all hooks are called)
	if (items.length === 0) {
		return (
			<div className="w-full h-full flex flex-col">
				<div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
					<p className="text-sm">Loading items...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full h-full flex flex-col">
			{/* Hoist indicator bar - shows when in hoist mode */}
			{hoistedRootId && hoistedRootName && (
				<div className="flex-shrink-0 px-2 py-1.5 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 flex items-center gap-2">
					<span className="text-xs text-amber-700 dark:text-amber-400 flex-1 truncate">
						Focused on: <strong>{hoistedRootName}</strong>
					</span>
					<button
						type="button"
						onClick={() => setHoistedRootId(null)}
						className="p-1 hover:bg-amber-200 dark:hover:bg-amber-800 rounded transition-colors"
						title="Exit focused view (Ctrl+H)"
					>
						<ArrowUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
					</button>
				</div>
			)}
			{/* Tree Content - flex container to fill available space */}
			<div className="flex-1 min-h-0 overflow-auto p-2 flex flex-col">
				<div 
					{...tree.getContainerProps()} 
					data-tree-container="true"
					className="relative font-mono flex-1 min-h-[100px] focus:outline-none rounded-sm cursor-default"
					onFocus={() => setFocusArea("tree")}
					onClick={(e) => {
						// If clicking on empty space in container (not on an item)
						if (e.target === e.currentTarget) {
							// Restore focus to previously focused item, or first item as fallback
							const focusedItem = tree.getFocusedItem();
							if (focusedItem) {
								tree.updateDomFocus();
							} else {
								const firstItem = tree.getItems()[0];
								if (firstItem) {
									firstItem.setFocused();
									tree.updateDomFocus();
								}
							}
							// Don't clear selection - just refocus
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
						// Use library's isFocused which falls back to first item when focusedItem is null
						const isFocused = item.isFocused?.() ?? false;
						const isInClipboard = clipboardItemIds.includes(itemData.id);
						const isOpenInEditor = openedItemIds.has(itemData.id);
						const isActiveItem = itemData.id === activeItemId;

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
                  ${isDragTarget ? "bg-blue-100/70 dark:bg-blue-900/30 border-l-2 border-blue-400" : ""}
                  ${!isDragTarget && isSelected && treeHasFocus ? "bg-blue-500/20 dark:bg-blue-500/30" : ""}
                  ${!isDragTarget && isSelected && !treeHasFocus ? "bg-blue-500/10 dark:bg-blue-500/15" : ""}
                  ${!isDragTarget && !isSelected && isInClipboard ? "bg-gray-100 dark:bg-gray-800" : ""}
                  ${!isDragTarget && !isSelected && !isInClipboard ? "hover:bg-gray-100 dark:hover:bg-gray-800/50" : ""}
                  ${isFocused && treeHasFocus ? "ring-2 ring-blue-500 ring-inset" : ""}
                  ${isFocused && !treeHasFocus ? "ring-1 ring-gray-400 dark:ring-gray-600 ring-inset" : ""}
                  focus:outline-none
                  select-none
                `}
								style={{
									paddingLeft: `${level * 16 + 4}px`,
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
									<span
										className="flex-shrink-0 w-4 h-4 -ml-0.5 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
										onClick={(e) => {
											e.stopPropagation();
											if (item.isExpanded()) {
												item.collapse();
											} else {
												item.expand();
											}
										}}
									>
										{item.isExpanded() ? (
											<ChevronDown className="w-2.5 h-2.5 text-gray-400" />
										) : (
											<ChevronRight className="w-2.5 h-2.5 text-gray-400" />
										)}
									</span>
								) : (
									<span className="w-4 -ml-0.5" />
								)}
								<span className="flex-shrink-0">
									{getItemIcon(itemData, item.isExpanded())}
								</span>
								<span className="flex-1 truncate text-xs text-gray-800 dark:text-gray-200">
									{itemData.title}
								</span>
								{isActiveItem ? (
									<span 
										className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 ring-2 ring-blue-300 dark:ring-blue-400" 
										title="Currently visible in editor"
									/>
								) : isOpenInEditor ? (
									<span 
										className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 flex-shrink-0" 
										title="Open in tab"
									/>
								) : null}
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
