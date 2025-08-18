import type { FlexibleItem } from '../../../types/items';
import type { TreeItem, TreeItemIndex } from 'react-complex-tree';

export interface TreeItemData {
  id: string;
  title: string;
  type: 'book' | 'section' | 'note';
  originalItem: FlexibleItem;
}

export function adaptFlexibleItemsToComplexTree(items: FlexibleItem[]): { rootItem: TreeItemIndex; items: Record<TreeItemIndex, TreeItem<TreeItemData>> } {
  const treeItems: Record<string, TreeItem<TreeItemData>> = {};

  // Add root item
  treeItems.root = {
    index: 'root',
    isFolder: true,
    children: [],
    data: {
      id: 'root',
      title: 'Root',
      type: 'book',
      originalItem: {} as FlexibleItem
    }
  };

  // Convert all items
  items.forEach(item => {
    treeItems[item.id] = {
      index: item.id,
      isFolder: item.type !== 'note',
      children: [],
      data: {
        id: item.id,
        title: item.title,
        type: item.type,
        originalItem: item
      }
    };
  });

  // Build hierarchy
  items.forEach(item => {
    const parentId = item.parent_id || 'root';
    if (treeItems[parentId]) {
      treeItems[parentId].children?.push(item.id);
    }
  });

  // Sort children by sort_order
  Object.values(treeItems).forEach(treeItem => {
    if (treeItem.children) {
      treeItem.children.sort((a, b) => {
        const itemA = items.find(i => i.id === a);
        const itemB = items.find(i => i.id === b);
        return (itemA?.sort_order || 0) - (itemB?.sort_order || 0);
      });
    }
  });

  return {
    rootItem: 'root',
    items: treeItems
  };
}
