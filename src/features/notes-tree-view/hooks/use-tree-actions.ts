import { useCallback } from 'react';
import type { TreeNode } from '../types';
import type { TreeStateActions } from './use-tree-state';

export interface TreeActionsProps {
  selectedItemId?: string | null | undefined;
  selectedItemType?: 'note' | 'category' | null;
  treeData: TreeNode[];
  treeStateActions: TreeStateActions;
  onDeleteNote: (noteId: string) => void;
  onDeleteCategory: (categoryId: string) => void;
  onMoveNote: (noteId: string, categoryId: string | null) => void;
  onItemSelect?: ((itemId: string, itemType: 'note' | 'category') => void) | undefined;
}

export function useTreeActions({
  selectedItemId,
  selectedItemType,
  treeData,
  treeStateActions,
  onDeleteNote,
  onDeleteCategory,
  onMoveNote,
  onItemSelect,
}: TreeActionsProps) {
  const handleDeleteSelected = useCallback(() => {
    if (!selectedItemId) return;

    const findSelectedItem = (nodes: TreeNode[]): TreeNode | null => {
      for (const node of nodes) {
        if (node.id === selectedItemId) return node;
        if (node.children) {
          const found = findSelectedItem(node.children);
          if (found) return found;
        }
      }
      return null;
    };

    const selectedItem = findSelectedItem(treeData);
    if (selectedItem) {
      if (selectedItem.type === 'note') {
        onDeleteNote(selectedItemId);
      } else {
        onDeleteCategory(selectedItemId);
      }
    }
  }, [selectedItemId, treeData, onDeleteNote, onDeleteCategory]);

  const handleHoistFolder = useCallback(() => {
    if (selectedItemId && selectedItemType === 'category') {
      treeStateActions.setHoistedFolderId(selectedItemId);
    }
  }, [selectedItemId, selectedItemType, treeStateActions]);

  const handleExitHoist = useCallback(() => {
    treeStateActions.setHoistedFolderId(null);
  }, [treeStateActions]);

  const handleMove = useCallback(
    (args: any) => {
      const { dragIds, parentId } = args;
      const dragId = dragIds[0];

      const findNode = (nodes: TreeNode[]): TreeNode | null => {
        for (const node of nodes) {
          if (node.id === dragId) return node;
          if (node.children) {
            const found = findNode(node.children);
            if (found) return found;
          }
        }
        return null;
      };

      const dragNode = findNode(treeData);
      if (dragNode && dragNode.type === 'note') {
        onMoveNote(dragId, parentId);
      }
    },
    [onMoveNote, treeData]
  );

  const findParentFolder = useCallback(
    (noteId: string): TreeNode | null => {
      const findParent = (nodes: TreeNode[]): TreeNode | null => {
        for (const node of nodes) {
          if (node.type === 'category' && node.children) {
            const containsNote = node.children.some(child => child.id === noteId && child.type === 'note');
            if (containsNote) {
              return node;
            }
            const found = findParent(node.children);
            if (found) return found;
          }
        }
        return null;
      };

      return findParent(treeData);
    },
    [treeData]
  );

  const handleItemSelect = useCallback(
    (id: string, type: 'note' | 'category') => {
      treeStateActions.setNavigatedItemId(id);
      onItemSelect?.(id, type);
    },
    [treeStateActions, onItemSelect]
  );

  return {
    handleDeleteSelected,
    handleHoistFolder,
    handleExitHoist,
    handleMove,
    findParentFolder,
    handleItemSelect,
  };
}
