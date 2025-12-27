import { useAtomValue, useSetAtom } from "jotai";
import { useTree } from "@headless-tree/react";
import {
	syncDataLoaderFeature,
	hotkeysCoreFeature,
	selectionFeature,
	dragAndDropFeature,
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
} from "lucide-react";
import { useMemo } from "react";
import { useTabManagement } from "@/hooks";

export function TreeView() {
	const items = useAtomValue(itemsAtom);
	const setSelectedItemId = useSetAtom(selectedItemIdAtom);
	const { openNoteInTab } = useTabManagement();

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

	const tree = useTree<FlexibleItem>({
		rootItemId: "root",
		getItemName: (item) => item.getItemData().title,
		isItemFolder: (item) => {
			const itemData = item.getItemData();
			return itemData.type === "book" || itemData.type === "section";
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

	const getItemIcon = (item: FlexibleItem, isExpanded: boolean) => {
		switch (item.type) {
			case "book":
				return <Book className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
			case "section":
				return isExpanded ? (
					<FolderOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
				) : (
					<Folder className="w-4 h-4 text-amber-600 dark:text-amber-400" />
				);
			case "note":
				return (
					<FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
				);
			default:
				return (
					<FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
				);
		}
	};

	const handleItemClick = (item: any, itemId: string) => {
		// Use headless-tree's selection system
		item.select();
		// Also update your global selection state
		if (itemId !== "root") {
			setSelectedItemId(itemId);

			// Open notes in a tab
			const itemData = itemMap.get(itemId);
			if (itemData?.type === "note") {
				openNoteInTab(itemData);
			}
		}
	};

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
				<div {...tree.getContainerProps()} className="space-y-1">
					{tree.getItems().map((item) => {
						const itemData = item.getItemData();
						const level = item.getItemMeta().level;

						// Check if item can be expanded/collapsed (has children)
						const hasChildren = (childrenMap.get(itemData.id)?.length ?? 0) > 0;
						const isFolder =
							itemData.type === "book" || itemData.type === "section";

						// Skip rendering the virtual root item
						if (itemData.id === "root") {
							return null;
						}

						return (
							<div
								key={itemData.id}
								{...item.getProps()}
								className={`
                  flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors
                  ${
										item.isSelected()
											? "bg-blue-100 dark:bg-blue-900/30 border-l-2 border-blue-500"
											: "hover:bg-gray-100 dark:hover:bg-gray-800/50"
									}
                  ${item.isFocused() ? "ring-2 ring-blue-500 ring-opacity-50" : ""}
                  focus:outline-none select-none
                `}
								style={{
									paddingLeft: `${(level - 1) * 1.5 + 0.5}rem`,
								}}
								onClick={() => {
									if (isFolder && hasChildren) {
										if (item.isExpanded()) {
											item.collapse?.();
										} else {
											item.expand?.();
										}
									}
									handleItemClick(item, itemData.id);
								}}
							>
								{isFolder && hasChildren && (
									<div className="flex-shrink-0">
										{item.isExpanded() ? (
											<ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
										) : (
											<ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
										)}
									</div>
								)}
								<div className="flex-shrink-0">
									{getItemIcon(itemData, item.isExpanded())}
								</div>
								<span className="flex-1 truncate text-sm font-medium text-gray-900 dark:text-gray-100">
									{itemData.title}
								</span>
								{itemData.type === "note" && (
									<span className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
										{itemData.content_type || "text"}
									</span>
								)}
							</div>
						);
					})}
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
