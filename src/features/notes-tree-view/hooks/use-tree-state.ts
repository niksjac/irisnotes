import { useState, useCallback } from 'react';
import type { TreeNode } from '../types';

export interface TreeState {
  sortAlphabetically: boolean;
  allExpanded: boolean;
  navigatedItemId: string | null;
  hoistedFolderId: string | null;
  editingItemId: string | null;
  treeHeight: number;
  expandedNodes: Set<string>;
}

export interface TreeStateActions {
  setSortAlphabetically: (sort: boolean) => void;
  setAllExpanded: (expanded: boolean) => void;
  setNavigatedItemId: (id: string | null) => void;
  setHoistedFolderId: (id: string | null) => void;
  setEditingItemId: (id: string | null) => void;
  setTreeHeight: (height: number) => void;
  setExpandedNodes: (nodes: Set<string>) => void;
  toggleNodeExpansion: (nodeId: string) => void;
  toggleSort: () => void;
  toggleExpandAll: (treeData: TreeNode[], treeRef: React.RefObject<any>) => void;
  initializeExpandedState: (baseTreeData: TreeNode[]) => void;
}

export function useTreeState() {
  const [sortAlphabetically, setSortAlphabetically] = useState(false);
  const [allExpanded, setAllExpanded] = useState(false);
  const [navigatedItemId, setNavigatedItemId] = useState<string | null>(null);
  const [hoistedFolderId, setHoistedFolderId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [treeHeight, setTreeHeight] = useState(400);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => new Set());

  const toggleNodeExpansion = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const toggleSort = useCallback(() => {
    setSortAlphabetically(prev => !prev);
  }, []);

  const toggleExpandAll = useCallback((treeData: TreeNode[], treeRef: React.RefObject<any>) => {
    if (treeRef.current) {
      if (allExpanded) {
        treeRef.current.closeAll();
        setExpandedNodes(new Set());
      } else {
        treeRef.current.openAll();
        const allCategoryIds = new Set<string>();
        const collectCategories = (nodes: TreeNode[]) => {
          nodes.forEach(node => {
            if (node.type === 'category') {
              allCategoryIds.add(node.id);
              if (node.children) {
                collectCategories(node.children);
              }
            }
          });
        };
        collectCategories(treeData);
        setExpandedNodes(allCategoryIds);
      }
      setAllExpanded(!allExpanded);
    }
  }, [allExpanded]);

  const initializeExpandedState = useCallback((baseTreeData: TreeNode[]) => {
    if (baseTreeData.length > 0 && expandedNodes.size === 0) {
      const initialExpanded = new Set<string>();
      const addExpandedCategories = (nodes: TreeNode[]) => {
        nodes.forEach(node => {
          if (node.type === 'category') {
            initialExpanded.add(node.id);
            if (node.children) {
              addExpandedCategories(node.children);
            }
          }
        });
      };
      addExpandedCategories(baseTreeData);
      setExpandedNodes(initialExpanded);
      setAllExpanded(true);
    }
  }, [expandedNodes.size]);

  const state: TreeState = {
    sortAlphabetically,
    allExpanded,
    navigatedItemId,
    hoistedFolderId,
    editingItemId,
    treeHeight,
    expandedNodes,
  };

  const actions: TreeStateActions = {
    setSortAlphabetically,
    setAllExpanded,
    setNavigatedItemId,
    setHoistedFolderId,
    setEditingItemId,
    setTreeHeight,
    setExpandedNodes,
    toggleNodeExpansion,
    toggleSort,
    toggleExpandAll,
    initializeExpandedState,
  };

  return { state, actions };
}