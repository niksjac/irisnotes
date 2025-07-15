import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Tree } from 'react-arborist';
import clsx from 'clsx';
import { NotesTreeViewProps, TreeNode } from '../types';
import { useTreeData } from '../hooks/use-tree-data';
import { useTreeTransformations } from '../hooks/use-tree-transformations';
import { useTreeKeyboardNavigation } from '../hooks/use-tree-keyboard-navigation';
import { TreeHeader } from './tree-header';
import { TreeNode as TreeNodeComponent } from './tree-node';

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
  const [sortAlphabetically, setSortAlphabetically] = useState(false);
  const [allExpanded, setAllExpanded] = useState(false);

  // Unified navigation state - single source of truth for keyboard focus
  const [navigatedItemId, setNavigatedItemId] = useState<string | null>(null);

  const [hoistedFolderId, setHoistedFolderId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [treeHeight, setTreeHeight] = useState(400); // Default height

  const baseTreeData = useTreeData(notes, categories, noteCategories);
  const treeData = useTreeTransformations(baseTreeData, hoistedFolderId, searchQuery, sortAlphabetically);

  // Track expanded state internally for reliable navigation
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    // Initialize empty - will be populated after baseTreeData is available
    return new Set<string>();
  });

  const nodeRefsMap = useRef<Map<string, { startEditing: () => void }>>(new Map());
  const treeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const treeContainerRef = useRef<HTMLDivElement>(null);

  // Register with focus management
  useEffect(() => {
    if (onRegisterElement && containerRef.current) {
      onRegisterElement(containerRef.current);
    }
  }, [onRegisterElement]);

  // Dynamic height calculation
  useEffect(() => {
    const updateTreeHeight = () => {
      if (treeContainerRef.current) {
        const containerHeight = treeContainerRef.current.clientHeight;
        if (containerHeight > 0) {
          setTreeHeight(containerHeight);
        }
      }
    };

    updateTreeHeight();

    // Use ResizeObserver to watch for container size changes
    let resizeObserver: ResizeObserver | null = null;
    if (treeContainerRef.current) {
      resizeObserver = new ResizeObserver(updateTreeHeight);
      resizeObserver.observe(treeContainerRef.current);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []); // Only run once on mount

  // Initialize expanded state when tree data first becomes available
  useEffect(() => {
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
      setAllExpanded(true); // Since we're starting with all expanded
    }
  }, [baseTreeData, expandedNodes.size]);

  // Synchronously calculate flattened items for reliable keyboard navigation
  const flattenedItems = useMemo(() => {
    if (!treeData.length) return [];

    const items: TreeNode[] = [];
    const flatten = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        items.push(node);
        // Only include children if the node is a category and is expanded
        if (node.type === 'category' && node.children && node.children.length > 0) {
          const isExpanded = expandedNodes.has(node.id);
          if (isExpanded) {
            flatten(node.children);
          }
        }
      });
    };
    flatten(treeData);
    return items;
  }, [treeData, expandedNodes]);

  // Helper function to toggle node expansion with immediate state update
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

    // Also toggle in react-arborist for visual consistency
    if (treeRef.current) {
      const node = treeRef.current.get(nodeId);
      if (node) {
        node.toggle();
      }
    }
  }, []);

  // Get the currently hoisted folder info
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
    // Need to search in the original data before hoist filtering
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

  // Helper function to find the parent folder of a note
  const findParentFolder = useCallback((noteId: string): TreeNode | null => {
    const findParent = (nodes: TreeNode[]): TreeNode | null => {
      for (const node of nodes) {
        if (node.type === 'category' && node.children) {
          // Check if this folder contains the note
          const containsNote = node.children.some(child => child.id === noteId && child.type === 'note');
          if (containsNote) {
            return node;
          }
          // Recursively search in child folders
          const found = findParent(node.children);
          if (found) return found;
        }
      }
      return null;
    };

    return findParent(treeData);
  }, [treeData]);

  // Ensure navigation stays on visible items
  const ensureValidNavigation = useCallback(() => {
    if (navigatedItemId) {
      const isVisible = flattenedItems.some(item => item.id === navigatedItemId);
      if (!isVisible && flattenedItems.length > 0) {
        // Try to find parent folder or move to first item
        const parentFolder = findParentFolder(navigatedItemId);
        const fallbackId = parentFolder ? parentFolder.id : flattenedItems[0]?.id;
        const fallbackItem = fallbackId ? flattenedItems.find(item => item.id === fallbackId) : null;

        if (fallbackItem) {
          setNavigatedItemId(fallbackItem.id);
          onItemSelect?.(fallbackItem.id, fallbackItem.type);
        }
      }
    }
  }, [navigatedItemId, flattenedItems, findParentFolder, onItemSelect]);

  // Ensure valid navigation when flattened items change
  useEffect(() => {
    ensureValidNavigation();
  }, [ensureValidNavigation]);

  useTreeKeyboardNavigation({
    containerRef,
    navigatedItemId,
    flattenedItems,
    expandedNodes,
    onItemSelect: (id, type) => {
      setNavigatedItemId(id);
      if (onItemSelect) {
        onItemSelect(id, type);
      }
    },
    onNoteSelect: onNoteSelect,
    toggleNodeExpansion,
    findParentFolder,
    handleHoistFolder: () => {
      if (selectedItemId && selectedItemType === 'category') {
        setHoistedFolderId(selectedItemId);
      }
    },
    hoistedFolderId,
    setHoistedFolderId,
    setEditingItemId,
    nodeRefsMap,
  });

  // Initialize navigation state from selection
  useEffect(() => {
    if (selectedItemId && !navigatedItemId) {
      setNavigatedItemId(selectedItemId);
    }
  }, [selectedItemId, navigatedItemId]);

  const handleDeleteSelected = () => {
    if (selectedItemId) {
      // Find the selected item to determine its type
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
    }
  };

  const handleToggleSort = () => {
    setSortAlphabetically(!sortAlphabetically);
  };

  const handleToggleExpandAll = () => {
    if (treeRef.current) {
      if (allExpanded) {
        treeRef.current.closeAll();
        setExpandedNodes(new Set()); // Clear all expanded nodes
      } else {
        treeRef.current.openAll();
        // Collect all category IDs to mark as expanded
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
  };

  const handleHoistFolder = () => {
    if (selectedItemId && selectedItemType === 'category') {
      setHoistedFolderId(selectedItemId);
    }
  };

  const handleExitHoist = () => {
    setHoistedFolderId(null);
  };

  const Node = (props: any) => (
    <TreeNodeComponent
      {...props}
      navigatedItemId={navigatedItemId}
      selectedItemId={selectedItemId}
      selectedNoteId={selectedNoteId}
      expandedNodes={expandedNodes}
      editingItemId={editingItemId}
      setEditingItemId={setEditingItemId}
      nodeRefsMap={nodeRefsMap}
      onItemSelect={(id, type) => {
        setNavigatedItemId(id);
        if (onItemSelect) {
          onItemSelect(id, type);
        }
      }}
      onNoteSelect={onNoteSelect}
      toggleNodeExpansion={toggleNodeExpansion}
      onRenameNote={onRenameNote}
      onRenameCategory={onRenameCategory}
      onCreateNote={onCreateNote}
      onCreateFolder={onCreateFolder}
    />
  );

  const onMove = useCallback((args: any) => {
    const { dragIds, parentId } = args;
    const dragId = dragIds[0];

    // Find the dragged node by searching through all nodes recursively
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
  }, [onMoveNote, treeData]);

    const handleContainerClick = () => {
    // Set focus from click - focus management handles the DOM focus
    if (onSetFocusFromClick) {
      onSetFocusFromClick();
    }
  };

  const handleContainerFocus = () => {
    // When focused via tab navigation, ensure the tree is ready
    if (flattenedItems.length > 0 && !navigatedItemId) {
      const firstItem = flattenedItems[0];
      if (firstItem) {
        setNavigatedItemId(firstItem.id);
        if (onItemSelect) {
          onItemSelect(firstItem.id, firstItem.type);
        }
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={clsx("flex flex-col h-full overflow-hidden outline-none", focusClasses)}
      tabIndex={0}
      onClick={handleContainerClick}
      onFocus={handleContainerFocus}
    >
      <TreeHeader
        hoistedFolder={hoistedFolder}
        handleExitHoist={handleExitHoist}
        selectedItemType={selectedItemType}
        handleHoistFolder={handleHoistFolder}
        allExpanded={allExpanded}
        handleToggleExpandAll={handleToggleExpandAll}
        sortAlphabetically={sortAlphabetically}
        handleToggleSort={handleToggleSort}
        handleDeleteSelected={handleDeleteSelected}
        selectedItemId={selectedItemId || null}
        onCreateNote={() => onCreateNote()}
        onCreateFolder={() => onCreateFolder()}
      />

      {hoistedFolder && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900 border-b border-blue-200 dark:border-blue-700 text-center">
          <span className="text-sm text-blue-600 dark:text-blue-300">Showing contents of: <strong className="text-blue-700 dark:text-blue-200">{hoistedFolder.name}</strong></span>
          <small className="block text-xs text-blue-500 dark:text-blue-400">Press Escape to exit hoist mode</small>
        </div>
      )}

      <div ref={treeContainerRef} className="flex-1 overflow-hidden p-1">
        <Tree
          ref={treeRef}
          data={treeData}
          openByDefault={true}
          width="100%"
          height={treeHeight}
          indent={20}
          rowHeight={32}
          onMove={onMove}
          disableEdit
          disableMultiSelection
        >
          {Node}
        </Tree>
      </div>
    </div>
  );
}
