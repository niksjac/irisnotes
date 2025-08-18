import type { FlexibleItem } from '../../../types/items';
import type { TreeViewBaseItem } from '@mui/x-tree-view/models';

export interface MuiTreeItemData extends TreeViewBaseItem {
  id: string;
  label: string;
  children?: MuiTreeItemData[];
  type: 'book' | 'section' | 'note';
  originalItem: FlexibleItem;
}

export function adaptFlexibleItemsToMuiTree(items: FlexibleItem[]): MuiTreeItemData[] {
  // Create a map for quick lookup
  const itemMap = new Map<string, FlexibleItem>();
  items.forEach(item => itemMap.set(item.id, item));

  // Build tree structure
  const buildTree = (parentId: string | null = null): MuiTreeItemData[] => {
    return items
      .filter(item => item.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(item => {
        const children = buildTree(item.id);

        return {
          id: item.id,
          label: item.title,
          children: children.length > 0 ? children : undefined,
          type: item.type,
          originalItem: item
        };
      });
  };

  return buildTree();
}
