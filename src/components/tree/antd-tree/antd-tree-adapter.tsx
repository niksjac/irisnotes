import type { FlexibleItem } from '../../../types/items';
import type { TreeDataNode } from 'antd';

export interface AntdTreeItemData extends TreeDataNode {
  key: string;
  title: string;
  children?: AntdTreeItemData[];
  type: 'book' | 'section' | 'note';
  originalItem: FlexibleItem;
  isLeaf?: boolean;
}

export function adaptFlexibleItemsToAntdTree(items: FlexibleItem[]): AntdTreeItemData[] {
  // Build tree structure
  const buildTree = (parentId: string | null = null): AntdTreeItemData[] => {
    return items
      .filter(item => item.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(item => {
        const children = buildTree(item.id);

        return {
          key: item.id,
          title: item.title,
          children: children.length > 0 ? children : undefined,
          type: item.type,
          originalItem: item,
          isLeaf: item.type === 'note'
        };
      });
  };

  return buildTree();
}
