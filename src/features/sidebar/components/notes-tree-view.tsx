import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Tree } from 'react-arborist';
import clsx from 'clsx';
import { Plus, Folder, FileText, ChevronRight, ChevronDown, ArrowUpDown, Trash2, Expand, Minimize2, ChevronLeft, Target } from 'lucide-react';
import type { Note, Category } from '../../../types/database';
import './notes-tree-view.css';

interface TreeNode {
  id: string;
  name: string;
  type: 'note' | 'category';
  children?: TreeNode[];
  data?: Note | Category;
  parent?: string | null;
}

interface NotesTreeViewProps {
  notes: Note[];
  categories: Category[];
  selectedNoteId?: string | null;
  onNoteSelect: (noteId: string) => void;
  onCreateNote: (parentCategoryId?: string) => void;
  onCreateFolder: (parentCategoryId?: string) => void;
  onMoveNote: (noteId: string, newCategoryId: string | null) => void;
  onDeleteNote: (noteId: string) => void;
  onDeleteCategory: (categoryId: string) => void;
  onRenameNote: (noteId: string, newTitle: string) => void;
  onRenameCategory: (categoryId: string, newName: string) => void;
  // Add note-category relationships
  noteCategories?: { noteId: string; categoryId: string }[];
  // Add props for folder selection
  selectedItemId?: string | null;
  selectedItemType?: 'note' | 'category' | null;
  onItemSelect?: (itemId: string, itemType: 'note' | 'category') => void;
  // Focus management props
  focusClasses?: Record<string, boolean>;
  onRegisterElement?: (ref: HTMLElement | null) => void;
  onSetFocusFromClick?: () => void;
  // External search query
  searchQuery?: string;
}

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

  // Memoize note category mapping
  const noteCategoryMap = useMemo(() => {
    const map = new Map<string, string[]>();
    noteCategories.forEach(nc => {
      const existing = map.get(nc.noteId) || [];
      existing.push(nc.categoryId);
      map.set(nc.noteId, existing);
    });
    return map;
  }, [noteCategories]);

  // Transform data into tree structure
  const baseTreeData = useMemo(() => {
    const rootNodes: TreeNode[] = [];
    const placedNotes = new Set<string>();

    // Build category hierarchy by first creating a copy of the category map
    const workingCategoryMap = new Map<string, TreeNode>();
    categories.forEach(category => {
      const categoryNode: TreeNode = {
        id: category.id,
        name: category.name,
        type: 'category',
        data: category,
        parent: category.parent_id || null,
        children: [],
      };
      workingCategoryMap.set(category.id, categoryNode);
    });

    // Build hierarchy using the working map
    categories.forEach(category => {
      const categoryNode = workingCategoryMap.get(category.id);
      if (categoryNode) {
        if (category.parent_id) {
          const parentNode = workingCategoryMap.get(category.parent_id);
          if (parentNode) {
            parentNode.children!.push(categoryNode);
          } else {
            rootNodes.push(categoryNode);
          }
        } else {
          rootNodes.push(categoryNode);
        }
      }
    });

    // Add notes to their respective categories
    notes.forEach(note => {
      const noteNode: TreeNode = {
        id: note.id,
        name: note.title,
        type: 'note',
        data: note,
        children: [],
      };

      const noteCategoryIds = noteCategoryMap.get(note.id) || [];

      if (noteCategoryIds.length > 0) {
        noteCategoryIds.forEach(categoryId => {
          const categoryNode = workingCategoryMap.get(categoryId);
          if (categoryNode) {
            categoryNode.children!.push({ ...noteNode });
            placedNotes.add(note.id);
          }
        });
      }
    });

    // Add uncategorized notes to root
    notes.forEach(note => {
      if (!placedNotes.has(note.id)) {
        const noteNode: TreeNode = {
          id: note.id,
          name: note.title,
          type: 'note',
          data: note,
          children: [],
        };
        rootNodes.push(noteNode);
      }
    });

    return rootNodes;
  }, [notes, categories, noteCategoryMap]);

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

  // Apply transformations (hoist, search, sort)
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
      finalNodes = filterNodes(finalNodes);
    }

    // Sort nodes alphabetically if enabled
    if (sortAlphabetically) {
      const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
        return [...nodes].sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === 'category' ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        }).map(node => ({
          ...node,
          children: node.children ? sortNodes(node.children) : []
        }));
      };
      finalNodes = sortNodes(finalNodes);
    }

    return finalNodes;
  }, [baseTreeData, hoistedFolderId, searchQuery, sortAlphabetically]);

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

  // Keyboard navigation with improved synchronization
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
              setNavigatedItemId(nextItem.id);
              onItemSelect?.(nextItem.id, nextItem.type);
            }
          }
          break;

        case 'ArrowUp':
          shouldPreventDefault = true;
          if (currentIndex > 0) {
            const prevItem = flattenedItems[currentIndex - 1];
            if (prevItem) {
              setNavigatedItemId(prevItem.id);
              onItemSelect?.(prevItem.id, prevItem.type);
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
              // Jump to parent folder and collapse it
              const parentFolder = findParentFolder(currentItem.id);
              if (parentFolder) {
                setNavigatedItemId(parentFolder.id);
                onItemSelect?.(parentFolder.id, parentFolder.type);

                // Collapse the parent folder if expanded
                const isExpanded = expandedNodes.has(parentFolder.id);
                if (isExpanded) {
                  toggleNodeExpansion(parentFolder.id);
                }
              }
            }
          }
          break;

        case 'Enter':
        case ' ': // Space key
          shouldPreventDefault = true;
          if (currentItem) {
            if (currentItem.type === 'note') {
              onNoteSelect?.(currentItem.id);
            } else if (currentItem.type === 'category') {
              toggleNodeExpansion(currentItem.id);
            }
          }
          break;

        case 'F2':
          shouldPreventDefault = true;
          if (currentItem) {
            // Try direct approach first
            const nodeRef = nodeRefsMap.current.get(currentItem.id);
            if (nodeRef) {
              nodeRef.startEditing();
            } else {
              // Fallback to state-based approach
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
  }, [navigatedItemId, flattenedItems, expandedNodes, onItemSelect, onNoteSelect, hoistedFolderId, toggleNodeExpansion, findParentFolder]);

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

  const Node = ({ node, style, dragHandle }: any) => {
    // Get the actual node data from react-arborist
    const nodeData = node.data;
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(nodeData.name);
    const isFocused = navigatedItemId === nodeData.id;
    const isOpen = nodeData.type === 'note' && selectedNoteId === nodeData.id;

    // Register this node's editing function
    React.useEffect(() => {
      const nodeRef = {
        startEditing: () => {
          setIsEditing(true);
          setEditValue(nodeData.name);
        }
      };
      nodeRefsMap.current.set(nodeData.id, nodeRef);

      return () => {
        nodeRefsMap.current.delete(nodeData.id);
      };
    }, [nodeData.id, nodeData.name]);

    // Check if this item should enter edit mode (fallback approach)
    React.useEffect(() => {
      if (editingItemId === nodeData.id) {
        setIsEditing(true);
        setEditValue(nodeData.name);
        // Reset the editing trigger using a callback to avoid state conflicts
        setTimeout(() => setEditingItemId(null), 0);
      }
    }, [editingItemId, nodeData.id, nodeData.name]);

    const handleDoubleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      // Double-click always activates rename mode for both notes and folders
      setIsEditing(true);
      setEditValue(nodeData.name);
    };

    const handleEditSubmit = () => {
      if (editValue.trim() && editValue !== nodeData.name) {
        if (nodeData.type === 'note') {
          onRenameNote(nodeData.id, editValue.trim());
        } else {
          onRenameCategory(nodeData.id, editValue.trim());
        }
      }
      setIsEditing(false);
    };

    const handleEditCancel = () => {
      setIsEditing(false);
      setEditValue(nodeData.name);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleEditSubmit();
      } else if (e.key === 'Escape') {
        handleEditCancel();
      }
    };

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isEditing) {
        // Select the item
        setNavigatedItemId(nodeData.id);
        if (onItemSelect) {
          onItemSelect(nodeData.id, nodeData.type);
        }

        // For notes, also open them immediately on single click
        if (nodeData.type === 'note' && onNoteSelect) {
          onNoteSelect(nodeData.id);
        }
      }
    };

    const handleToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleNodeExpansion(nodeData.id);
    };

    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = nodeData.type === 'category' ? expandedNodes.has(nodeData.id) : false;

    return (
      <div
        ref={dragHandle}
        style={style}
        className={`tree-node ${nodeData.type} ${selectedItemId === nodeData.id ? 'selected' : ''} ${isFocused ? 'focused' : ''} ${isOpen ? 'open' : ''}`}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <div className="tree-node-content">
          {/* Expand/collapse arrow for categories with children */}
          {nodeData.type === 'category' && (
            <div
              className="tree-node-arrow"
              onClick={handleToggle}
              style={{
                opacity: hasChildren ? 1 : 0.3,
                cursor: hasChildren ? 'pointer' : 'default'
              }}
            >
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )
              ) : (
                <ChevronRight size={14} />
              )}
            </div>
          )}

          {/* Icon spacing for notes to align with categories */}
          {nodeData.type === 'note' && (
            <div className="tree-node-arrow" style={{ opacity: 0 }}>
              <ChevronRight size={14} />
            </div>
          )}

          <div className="tree-node-icon">
            {nodeData.type === 'category' ? (
              <Folder size={16} />
            ) : (
              <FileText size={16} />
            )}
          </div>

          {isEditing ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleEditSubmit}
              onKeyDown={handleKeyDown}
              autoFocus
              className="tree-node-input"
            />
          ) : (
            <span className="tree-node-name">
              {nodeData.name}
            </span>
          )}
        </div>

        <div className="tree-node-actions">
          <button
            className="tree-node-action"
            onClick={(e) => {
              e.stopPropagation();
              if (nodeData.type === 'category') {
                onCreateNote(nodeData.id);
              }
            }}
            title="Add note"
          >
            <Plus size={12} />
          </button>

          {nodeData.type === 'category' && (
            <button
              className="tree-node-action"
              onClick={(e) => {
                e.stopPropagation();
                onCreateFolder(nodeData.id);
              }}
              title="Add folder"
            >
              <Folder size={12} />
            </button>
          )}
        </div>
      </div>
    );
  };

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
      className={clsx("notes-tree-view", focusClasses)}
      tabIndex={0}
      onClick={handleContainerClick}
      onFocus={handleContainerFocus}
    >
      <div className="tree-header">
        <div className="tree-title">
          <h3>Notes</h3>
          {hoistedFolder && (
            <div className="hoist-breadcrumb">
              <ChevronRight size={12} />
              <span>{hoistedFolder.name}</span>
            </div>
          )}
        </div>
        <div className="tree-actions">
          {hoistedFolder && (
            <button
              className="tree-action-btn"
              onClick={handleExitHoist}
              title="Exit hoist mode"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          {selectedItemType === 'category' && !hoistedFolder && (
            <button
              className="tree-action-btn"
              onClick={handleHoistFolder}
              title="Hoist selected folder (Ctrl+H)"
            >
              <Target size={16} />
            </button>
          )}
          <button
            className="tree-action-btn"
            onClick={handleToggleExpandAll}
            title={allExpanded ? "Collapse all folders" : "Expand all folders"}
          >
            {allExpanded ? <Minimize2 size={16} /> : <Expand size={16} />}
          </button>
          <button
            className="tree-action-btn"
            onClick={handleToggleSort}
            title={sortAlphabetically ? "Disable alphabetical sorting" : "Enable alphabetical sorting"}
          >
            <ArrowUpDown size={16} />
          </button>
          <button
            className="tree-action-btn"
            onClick={handleDeleteSelected}
            disabled={!selectedItemId}
            title="Delete selected note or category"
          >
            <Trash2 size={16} />
          </button>
          <button
            className="tree-action-btn"
            onClick={() => onCreateNote()}
            title="New Note"
          >
            <FileText size={16} />
          </button>
          <button
            className="tree-action-btn"
            onClick={() => onCreateFolder()}
            title="New Folder"
          >
            <Folder size={16} />
          </button>
        </div>
      </div>



      {hoistedFolder && (
        <div className="hoist-indicator">
          <span>Showing contents of: <strong>{hoistedFolder.name}</strong></span>
          <small>Press Escape to exit hoist mode</small>
        </div>
      )}

      <div ref={treeContainerRef} className="tree-container">
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