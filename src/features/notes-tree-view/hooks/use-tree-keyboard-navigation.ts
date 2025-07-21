import { useEffect } from 'react';
import type { TreeNode } from '../types';

export function useTreeKeyboardNavigation({
  containerRef,
  navigatedItemId,
  flattenedItems,
  expandedNodes,
  onItemSelect,
  onNoteSelect,
  toggleNodeExpansion,
  findParentFolder,
  handleHoistFolder,
  hoistedFolderId,
  setHoistedFolderId,
  setEditingItemId,
  nodeRefsMap,
}: {
  containerRef: React.RefObject<HTMLDivElement>;
  navigatedItemId: string | null;
  flattenedItems: TreeNode[];
  expandedNodes: Set<string>;
  onItemSelect: (id: string, type: 'note' | 'category') => void;
  onNoteSelect: (id: string) => void;
  toggleNodeExpansion: (id: string) => void;
  findParentFolder: (id: string) => TreeNode | null;
  handleHoistFolder: () => void;
  hoistedFolderId: string | null;
  setHoistedFolderId: (id: string | null) => void;
  setEditingItemId: (id: string | null) => void;
  nodeRefsMap: React.RefObject<Map<string, { startEditing: () => void }>>;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) return;

      let shouldPreventDefault = false;
      const currentIndex = navigatedItemId ? flattenedItems.findIndex(item => item.id === navigatedItemId) : -1;
      const currentItem = navigatedItemId ? flattenedItems.find(item => item.id === navigatedItemId) : null;

      switch (e.key) {
        case 'ArrowDown':
          shouldPreventDefault = true;
          if (currentIndex < flattenedItems.length - 1) {
            const nextItem = flattenedItems[currentIndex + 1];
            if (nextItem) {
              onItemSelect(nextItem.id, nextItem.type);
            }
          }
          break;

        case 'ArrowUp':
          shouldPreventDefault = true;
          if (currentIndex > 0) {
            const prevItem = flattenedItems[currentIndex - 1];
            if (prevItem) {
              onItemSelect(prevItem.id, prevItem.type);
            }
          }
          break;

        case 'ArrowRight':
          shouldPreventDefault = true;
          if (currentItem?.type === 'category') {
            const isExpanded = expandedNodes.has(currentItem.id);
            if (!isExpanded) {
              toggleNodeExpansion(currentItem.id);
            }
          }
          break;

        case 'ArrowLeft':
          shouldPreventDefault = true;
          if (currentItem) {
            if (currentItem.type === 'category') {
              const isExpanded = expandedNodes.has(currentItem.id);
              if (isExpanded) {
                toggleNodeExpansion(currentItem.id);
              }
            } else if (currentItem.type === 'note') {
              const parentFolder = findParentFolder(currentItem.id);
              if (parentFolder) {
                onItemSelect(parentFolder.id, parentFolder.type);
                const isExpanded = expandedNodes.has(parentFolder.id);
                if (isExpanded) {
                  toggleNodeExpansion(parentFolder.id);
                }
              }
            }
          }
          break;

        case 'Enter':
        case ' ':
          shouldPreventDefault = true;
          if (currentItem) {
            if (currentItem.type === 'note') {
              onNoteSelect(currentItem.id);
            } else if (currentItem.type === 'category') {
              toggleNodeExpansion(currentItem.id);
            }
          }
          break;

        case 'F2':
          shouldPreventDefault = true;
          if (currentItem) {
            const nodeRef = nodeRefsMap.current?.get(currentItem.id);
            if (nodeRef) {
              nodeRef.startEditing();
            } else {
              setEditingItemId(currentItem.id);
            }
          }
          break;

        case 'h':
          if (e.ctrlKey || e.metaKey) {
            shouldPreventDefault = true;
            handleHoistFolder();
          }
          break;

        case 'Escape':
          if (hoistedFolderId) {
            shouldPreventDefault = true;
            setHoistedFolderId(null);
          }
          break;
      }

      if (shouldPreventDefault) {
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    containerRef,
    navigatedItemId,
    flattenedItems,
    expandedNodes,
    onItemSelect,
    onNoteSelect,
    toggleNodeExpansion,
    findParentFolder,
    handleHoistFolder,
    hoistedFolderId,
    setHoistedFolderId,
    setEditingItemId,
    nodeRefsMap,
  ]);
}
