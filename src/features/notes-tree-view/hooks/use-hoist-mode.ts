import { useMemo } from 'react';
import type { Category } from '../../../types/database';
import type { TreeNode } from '../types';

export function useHoistMode(hoistedFolderId: string | null, categories: Category[]) {
  const hoistedFolder = useMemo(() => {
    if (!hoistedFolderId) return null;

    const findFolder = (nodes: TreeNode[]): TreeNode | null => {
      for (const node of nodes) {
        if (node.id === hoistedFolderId && node.type === 'category') {
          return node;
        }
        if (node.children) {
          const found = findFolder(node.children);
          if (found) return found;
        }
      }
      return null;
    };

    // Build original tree structure to search in
    const originalRootNodes: TreeNode[] = [];
    const categoryMap = new Map<string, TreeNode>();

    categories.forEach(category => {
      const categoryNode: TreeNode = {
        id: category.id,
        name: category.name,
        type: 'category',
        data: category,
        parent: category.parent_id || null,
        children: [],
      };
      categoryMap.set(category.id, categoryNode);
    });

    categories.forEach(category => {
      const categoryNode = categoryMap.get(category.id);
      if (categoryNode) {
        if (category.parent_id) {
          const parentNode = categoryMap.get(category.parent_id);
          if (parentNode) {
            parentNode.children!.push(categoryNode);
          } else {
            originalRootNodes.push(categoryNode);
          }
        } else {
          originalRootNodes.push(categoryNode);
        }
      }
    });

    return findFolder(originalRootNodes);
  }, [hoistedFolderId, categories]);

  const isHoistModeActive = hoistedFolderId !== null;

  return {
    hoistedFolder,
    isHoistModeActive,
  };
}
