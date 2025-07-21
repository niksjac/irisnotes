import { useMemo, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { NotesTreeViewProps, TreeNode } from '../types';
import { useTreeData } from '../hooks/use-tree-data';
import { useTreeTransformations } from '../hooks/use-tree-transformations';
import { useTreeKeyboardNavigation } from '../hooks/use-tree-keyboard-navigation';
import { useTreeState } from '../hooks/use-tree-state';
import { useHoistMode } from '../hooks/use-hoist-mode';
import { useTreeActions } from '../hooks/use-tree-actions';
import { TreeHeader } from './tree-header';
import { TreeContainer } from './tree-container';

export function NotesTreeView({
  notes,
  categories,
  selectedNoteId,
  onNoteSelect,
  onCreateNote,
  onCreateFolder,
  onMoveNote,
  onDeleteNote,
  onDeleteCategory,
  onRenameNote,
  onRenameCategory,
  noteCategories = [],
  selectedItemId = selectedNoteId,
  selectedItemType = null,
  onItemSelect,
  focusClasses = {},
  onRegisterElement,
  onSetFocusFromClick,
  searchQuery = '',
}: NotesTreeViewProps) {
  const { state: treeState, actions: treeStateActions } = useTreeState();
  const nodeRefsMap = useRef<Map<string, { startEditing: () => void }>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  const baseTreeData = useTreeData(notes, categories, noteCategories);
  const treeData = useTreeTransformations(
    baseTreeData,
    treeState.hoistedFolderId,
    searchQuery,
    treeState.sortAlphabetically
  );

  const { hoistedFolder } = useHoistMode(treeState.hoistedFolderId, categories);

  const treeActions = useTreeActions({
    selectedItemId,
    selectedItemType,
    treeData,
    treeStateActions,
    onDeleteNote,
    onDeleteCategory,
    onMoveNote,
    onItemSelect,
  });

  // Initialize expanded state when tree data first becomes available
  useEffect(() => {
    treeStateActions.initializeExpandedState(baseTreeData);
  }, [baseTreeData, treeStateActions]);

  // Register with focus management
  useEffect(() => {
    if (onRegisterElement && containerRef.current) {
      onRegisterElement(containerRef.current);
    }
  }, [onRegisterElement]);

  // Initialize navigation state from selection
  useEffect(() => {
    if (selectedItemId && !treeState.navigatedItemId) {
      treeStateActions.setNavigatedItemId(selectedItemId);
    }
  }, [selectedItemId, treeState.navigatedItemId, treeStateActions]);

  // Calculate flattened items for keyboard navigation
  const flattenedItems = useMemo(() => {
    if (!treeData.length) return [];

    const items: TreeNode[] = [];
    const flatten = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        items.push(node);
        if (node.type === 'category' && node.children && node.children.length > 0) {
          const isExpanded = treeState.expandedNodes.has(node.id);
          if (isExpanded) {
            flatten(node.children);
          }
        }
      });
    };
    flatten(treeData);
    return items;
  }, [treeData, treeState.expandedNodes]);

  // Ensure navigation stays on visible items
  useEffect(() => {
    if (treeState.navigatedItemId) {
      const isVisible = flattenedItems.some(item => item.id === treeState.navigatedItemId);
      if (!isVisible && flattenedItems.length > 0) {
        const parentFolder = treeActions.findParentFolder(treeState.navigatedItemId);
        const fallbackId = parentFolder ? parentFolder.id : flattenedItems[0]?.id;
        const fallbackItem = fallbackId ? flattenedItems.find(item => item.id === fallbackId) : null;

        if (fallbackItem) {
          treeStateActions.setNavigatedItemId(fallbackItem.id);
          onItemSelect?.(fallbackItem.id, fallbackItem.type);
        }
      }
    }
  }, [treeState.navigatedItemId, flattenedItems, treeActions, treeStateActions, onItemSelect]);

  useTreeKeyboardNavigation({
    containerRef,
    navigatedItemId: treeState.navigatedItemId,
    flattenedItems,
    expandedNodes: treeState.expandedNodes,
    onItemSelect: treeActions.handleItemSelect,
    onNoteSelect: onNoteSelect,
    toggleNodeExpansion: treeStateActions.toggleNodeExpansion,
    findParentFolder: treeActions.findParentFolder,
    handleHoistFolder: treeActions.handleHoistFolder,
    hoistedFolderId: treeState.hoistedFolderId,
    setHoistedFolderId: treeStateActions.setHoistedFolderId,
    setEditingItemId: treeStateActions.setEditingItemId,
    nodeRefsMap,
  });

  const handleContainerClick = () => {
    if (onSetFocusFromClick) {
      onSetFocusFromClick();
    }
  };

  const handleContainerFocus = () => {
    if (flattenedItems.length > 0 && !treeState.navigatedItemId) {
      const firstItem = flattenedItems[0];
      if (firstItem) {
        treeStateActions.setNavigatedItemId(firstItem.id);
        onItemSelect?.(firstItem.id, firstItem.type);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={clsx('flex flex-col h-full overflow-hidden outline-none', focusClasses)}
      tabIndex={0}
      onClick={handleContainerClick}
      onFocus={handleContainerFocus}
    >
      <TreeHeader
        hoistedFolder={hoistedFolder}
        handleExitHoist={treeActions.handleExitHoist}
        selectedItemType={selectedItemType}
        handleHoistFolder={treeActions.handleHoistFolder}
        allExpanded={treeState.allExpanded}
        handleToggleExpandAll={() => treeStateActions.toggleExpandAll(treeData, { current: null })}
        sortAlphabetically={treeState.sortAlphabetically}
        handleToggleSort={treeStateActions.toggleSort}
        handleDeleteSelected={treeActions.handleDeleteSelected}
        selectedItemId={selectedItemId || null}
        onCreateNote={() => onCreateNote()}
        onCreateFolder={() => onCreateFolder()}
      />

      {hoistedFolder && (
        <div className='px-4 py-2 bg-blue-50 dark:bg-blue-900 border-b border-blue-200 dark:border-blue-700 text-center'>
          <span className='text-sm text-blue-600 dark:text-blue-300'>
            Showing contents of: <strong className='text-blue-700 dark:text-blue-200'>{hoistedFolder.name}</strong>
          </span>
          <small className='block text-xs text-blue-500 dark:text-blue-400'>Press Escape to exit hoist mode</small>
        </div>
      )}

      <TreeContainer
        treeData={treeData}
        treeState={treeState}
        selectedItemId={selectedItemId}
        selectedNoteId={selectedNoteId}
        nodeRefsMap={nodeRefsMap}
        onItemSelect={treeActions.handleItemSelect}
        onNoteSelect={onNoteSelect}
        toggleNodeExpansion={treeStateActions.toggleNodeExpansion}
        onRenameNote={onRenameNote}
        onRenameCategory={onRenameCategory}
        onCreateNote={onCreateNote}
        onCreateFolder={onCreateFolder}
        onMove={treeActions.handleMove}
        setTreeHeight={treeStateActions.setTreeHeight}
        setEditingItemId={treeStateActions.setEditingItemId}
      />
    </div>
  );
}
