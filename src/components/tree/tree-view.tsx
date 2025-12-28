import { useAtomValue, useSetAtom } from "jotai";
import { useTree } from "@headless-tree/react";
import {
	syncDataLoaderFeature,
	hotkeysCoreFeature,
	selectionFeature,
	dragAndDropFeature,
	type TreeState,
} from "@headless-tree/core";
import { itemsAtom, selectedItemIdAtom } from "@/atoms/items";
import type { FlexibleItem } from "@/types/items";
import {
	ChevronRight,
	ChevronDown,
	FileText,
	Book,
	FolderOpen,
	Folder,
	Scissors,
} from "lucide-react";
import { useMemo, useState, useEffect, useRef } from "react";
import { useTabManagement, useItems } from "@/hooks";
import { canBeChildOf } from "@/storage/hierarchy";

export function TreeView() {
	const items = useAtomValue(itemsAtom);
	const setSelectedItemId = useSetAtom(selectedItemIdAtom);
	const { openNoteInTab } = useTabManagement();
	const { moveItem } = useItems();

	// Unified controlled state for headless-tree (follows library pattern)
	const [treeState, setTreeState] = useState<Partial<TreeState<FlexibleItem>>>({});

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

		// Sort children by sort_order
		for (const children of map.values()) {
			children.sort((a, b) => {
				const itemA = itemMap.get(a);
				const itemB = itemMap.get(b);
				return (itemA?.sort_order || 0) - (itemB?.sort_order || 0);
			});
		}

		return map;
	}, [items, itemMap]);

	// Find root items (items without parent_id or with null parent_id)
	const rootItemIds = useMemo(() => {
		return items
			.filter((item) => !item.parent_id)
			.sort((a, b) => a.sort_order - b.sort_order)
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
		// Handle Enter/Space key to open notes
		onPrimaryAction: (item) => {
			const itemData = item.getItemData();
			if (itemData.type === "note") {
				openNoteInTab(itemData);
			}
		},
		// Custom hotkeys for cut/paste operations
		hotkeys: {
			// Cut selected items (Ctrl+X)
			customCut: {
				hotkey: "Control+KeyX",
				handler: (_e, treeInstance) => {
					const selectedItems = treeInstance.getSelectedItems();
					if (selectedItems.length > 0) {
						// Use multi-selected items
						const ids = selectedItems.map((item) => item.getId());
						setClipboardItemIds(ids);
					} else {
						// Fall back to focused item if no selection
						const focusedId = treeInstance.getState().focusedItem;
						if (focusedId && focusedId !== "root") {
							setClipboardItemIds([focusedId]);
						}
					}
				},
			},
			// Paste cut items (Ctrl+V)
			customPaste: {
				hotkey: "Control+KeyV",
				handler: async (_e, treeInstance) => {
					if (clipboardItemIds.length === 0) return;

					// Get the focused item as target
					const focusedItem = treeInstance.getState().focusedItem;
					if (!focusedItem) return;

					const targetData = itemMap.get(focusedItem);
					if (!targetData) return;

					// Target must be a folder (book or section)
					if (targetData.type !== "book" && targetData.type !== "section") {
						return;
					}

					// Move all clipboard items to the target
					for (const itemId of clipboardItemIds) {
						const sourceData = itemMap.get(itemId);
						if (sourceData && canBeChildOf(sourceData.type, targetData.type)) {
							await moveItem(itemId, focusedItem);
						}
					}

					// Clear clipboard after paste
					setClipboardItemIds([]);
				},
			},
			// Move focused item up within its parent (Ctrl+Up)
			customMoveUp: {
				hotkey: "Control+ArrowUp",
				handler: async (_e, treeInstance) => {
					const focusedId = treeInstance.getState().focusedItem;
					if (!focusedId || focusedId === "root") return;

					const focusedData = itemMap.get(focusedId);
					if (!focusedData) return;

					// Get siblings (items with same parent)
					const parentId = focusedData.parent_id || "root";
					const siblings = childrenMap.get(parentId) || [];

					const currentIndex = siblings.indexOf(focusedId);
					if (currentIndex <= 0) return; // Already at top

					// Move to position above current
					await moveItem(focusedId, focusedData.parent_id, currentIndex - 1);
				},
			},
			// Move focused item down within its parent (Ctrl+Down)
			customMoveDown: {
				hotkey: "Control+ArrowDown",
				handler: async (_e, treeInstance) => {
					const focusedId = treeInstance.getState().focusedItem;
					if (!focusedId || focusedId === "root") return;

					const focusedData = itemMap.get(focusedId);
					if (!focusedData) return;

					// Get siblings (items with same parent)
					const parentId = focusedData.parent_id || "root";
					const siblings = childrenMap.get(parentId) || [];

					const currentIndex = siblings.indexOf(focusedId);
					if (currentIndex < 0 || currentIndex >= siblings.length - 1) return; // Already at bottom

					// Move to position below current (need index + 2 because we're inserting after removal)
					await moveItem(focusedId, focusedData.parent_id, currentIndex + 2);
				},
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

			// Perform the move
			await moveItem(draggedData.id, newParentId);
		},
		dataLoader: {
			getItem: (itemId: string): FlexibleItem => {
				if (itemId === "root") {
					// Return a virtual root item
					return {
						id: "root",
						type: "book",
						title: "Root",
						sort_order: 0,
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
						sort_order: 0,
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

	// Handle single click - just focus/select in tree, don't open note
	const handleItemClick = (item: any, _itemId: string) => {
		// Use headless-tree's selection system for tree highlighting only
		// Do NOT update selectedItemIdAtom - that would trigger opening the note
		item.select();
	};

	// Handle double-click or Enter - open the note in editor
	const handleItemOpen = (itemId: string) => {
		const itemData = itemMap.get(itemId);
		if (itemData?.type === "note") {
			// Update selectedItemId to trigger view change to editor
			setSelectedItemId(itemId);
			openNoteInTab(itemData);
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

			{/* Tree Content */}
			<div className="flex-1 overflow-auto p-2">
				{/* Root drop zone - visible when dragging */}
				<div
					className="mb-2 p-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded text-center text-xs text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
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
							const draggedData = draggedItems[0].getItemData();
							// Only allow notes and books at root (not sections)
							if (draggedData.type === "note" || draggedData.type === "book") {
								await moveItem(draggedData.id, null);
							}
						}
					}}
				>
					Drop here for root level
				</div>
				<div {...tree.getContainerProps()} className="relative font-mono min-h-[100px]">
					{visibleItems.map((item) => {
						const itemData = item.getItemData();
						const level = item.getItemMeta().level;

						// Check if item can be expanded/collapsed (has children)
						const hasChildren = (childrenMap.get(itemData.id)?.length ?? 0) > 0;
						const isFolder =
							itemData.type === "book" || itemData.type === "section";
						
						// Drag state for visual feedback (from headless-tree)
						const isDragTarget = item.isDragTarget?.() ?? false;

						// Get the props from headless-tree (includes ALL handlers: drag, drop, etc.)
						const itemProps = item.getProps();
						
						// Compose onClick handler - call library's handler (handles expand/collapse) then ours
						const handleClick = (e: React.MouseEvent) => {
							// Call library's onClick - it handles focus, selection, and expand/collapse
							itemProps.onClick?.(e);
							// Update our global selection state
							handleItemClick(item, itemData.id);
						};

						return (
							<button
								key={itemData.id}
								// Spread ALL library props (drag handlers, etc.)
								{...itemProps}

								type="button"
								className={`
                  w-full flex items-center gap-1 py-0.5 px-1 rounded cursor-pointer transition-colors text-left
                  ${
										isDragTarget
											? "bg-blue-100/70 dark:bg-blue-900/30 border-l-2 border-blue-400"
											: clipboardItemIds.includes(itemData.id)
												? "opacity-50 bg-gray-100 dark:bg-gray-800"
												: item.isFocused?.()
													? "bg-blue-50 dark:bg-blue-900/30"
													: "hover:bg-gray-100 dark:hover:bg-gray-800/50"
									}
                  focus:outline-none focus:ring-1 focus:ring-blue-400 focus:bg-blue-50/50 dark:focus:bg-blue-900/20
                  select-none
                `}
								style={{
									paddingLeft: `${level * 16 + 4}px`,
								}}
								onClick={handleClick}
								onDoubleClick={() => {
									handleItemOpen(itemData.id);
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
		</div>
	);
}
