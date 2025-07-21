import { useMemo } from 'react';
import type { TreeNode } from '../types';

export function useTreeTransformations(
  baseTreeData: TreeNode[],
  hoistedFolderId: string | null,
  searchQuery: string,
  sortAlphabetically: boolean
) {
  const treeData = useMemo(() => {
    let finalNodes = baseTreeData;

    // Apply hoist mode if active
    if (hoistedFolderId) {
      const findHoistedFolder = (nodes: TreeNode[]): TreeNode | null => {
        for (const node of nodes) {
          if (node.id === hoistedFolderId && node.type === 'category') {
            return node;
          }
          if (node.children) {
            const found = findHoistedFolder(node.children);
            if (found) return found;
          }
        }
        return null;
      };

      const hoistedFolder = findHoistedFolder(finalNodes);
      if (hoistedFolder && hoistedFolder.children) {
        finalNodes = hoistedFolder.children;
      }
    }

    // Filter by search query if provided
    if (searchQuery.trim()) {
      const lowerSearchQuery = searchQuery.toLowerCase();
      const filterNodes = (nodes: TreeNode[]): TreeNode[] => {
        return nodes.filter(node => {
          const matches = node.name.toLowerCase().includes(lowerSearchQuery);
          if (node.children && node.children.length > 0) {
            const filteredChildren = filterNodes(node.children);
            if (filteredChildren.length > 0) {
              node.children = filteredChildren;
              return true;
            }
          }
          return matches;
        });
      };
      finalNodes = filterNodes(JSON.parse(JSON.stringify(finalNodes))); // Deep copy
    }

    // Sort nodes alphabetically if enabled
    if (sortAlphabetically) {
      const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
        return [...nodes]
          .sort((a, b) => {
            if (a.type !== b.type) {
              return a.type === 'category' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
          })
          .map(node => ({
            ...node,
            children: node.children ? sortNodes(node.children) : [],
          }));
      };
      finalNodes = sortNodes(finalNodes);
    }

    return finalNodes;
  }, [baseTreeData, hoistedFolderId, searchQuery, sortAlphabetically]);

  return treeData;
}
