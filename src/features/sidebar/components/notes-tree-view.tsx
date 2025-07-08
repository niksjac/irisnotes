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
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);
  const [hoistedFolderId, setHoistedFolderId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [treeHeight, setTreeHeight] = useState(400); // Default height
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

  // Transform data into tree structure
  const treeData = useMemo(() => {
    const rootNodes: TreeNode[] = [];
    const categoryMap = new Map<string, TreeNode>();
    const usedNoteCategories = noteCategories;

    // Create category nodes
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

    // Build category hierarchy
    categories.forEach(category => {
      const categoryNode = categoryMap.get(category.id);
      if (categoryNode) {
        if (category.parent_id) {
          const parentNode = categoryMap.get(category.parent_id);
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

    // Track which notes have been placed in categories
    const placedNotes = new Set<string>();

    // Add notes to their respective categories
    notes.forEach(note => {
      const noteNode: TreeNode = {
        id: note.id,
        name: note.title,
        type: 'note',
        data: note,
        children: [],
      };

      // Find categories for this note
      const noteCategoryIds = usedNoteCategories
        .filter(nc => nc.noteId === note.id)
        .map(nc => nc.categoryId);

      if (noteCategoryIds.length > 0) {
        // Place note in its categories
        noteCategoryIds.forEach(categoryId => {
          const categoryNode = categoryMap.get(categoryId);
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

    // Sort nodes alphabetically if enabled
    const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
      if (!sortAlphabetically) return nodes;

      return [...nodes].sort((a, b) => {
        // Sort categories before notes
        if (a.type !== b.type) {
          return a.type === 'category' ? -1 : 1;
        }
        // Sort alphabetically within same type
        return a.name.localeCompare(b.name);
      }).map(node => ({
        ...node,
        children: node.children ? sortNodes(node.children) : []
      }));
    };

    let finalNodes = sortNodes(rootNodes);

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
    if (searchQuery) {
      const filterNodes = (nodes: TreeNode[]): TreeNode[] => {
        return nodes.filter(node => {
          const matches = node.name.toLowerCase().includes(searchQuery.toLowerCase());
          if (node.children && node.children.length > 0) {
            node.children = filterNodes(node.children);
            return matches || node.children.length > 0;
          }
          return matches;
        });
      };
      return filterNodes(finalNodes);
    }

    return finalNodes;
  }, [notes, categories, searchQuery, noteCategories, sortAlphabetically, hoistedFolderId]);

  // Get flattened list of all visible items for keyboard navigation (respects expanded/collapsed state)
  const [treeStateVersion, setTreeStateVersion] = useState(0);

  const refreshFlattenedItems = useCallback(() => {
    setTreeStateVersion(prev => prev + 1);
  }, []);

  const flattenedItems = useMemo(() => {
    const items: TreeNode[] = [];

    const flatten = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        items.push(node);

        // Only include children if the node is a category and is expanded
        if (node.type === 'category' && node.children && node.children.length > 0) {
          // Check if this node is expanded in the tree
          const treeNode = treeRef.current?.get(node.id);
          const isExpanded = treeNode?.isOpen ?? false;

          if (isExpanded) {
            flatten(node.children);
          }
        }
      });
    };

    flatten(treeData);
    return items;
  }, [treeData, allExpanded, treeStateVersion]); // Include treeStateVersion to trigger recalculation

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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) return;

      const currentIndex = focusedItemId ? flattenedItems.findIndex(item => item.id === focusedItemId) : -1;
      const focusedItem = focusedItemId ? flattenedItems.find(item => item.id === focusedItemId) : null;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < flattenedItems.length - 1) {
            const nextItem = flattenedItems[currentIndex + 1];
            if (nextItem) {
              setFocusedItemId(nextItem.id);
              if (onItemSelect) {
                onItemSelect(nextItem.id, nextItem.type);
              }
            }
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            const prevItem = flattenedItems[currentIndex - 1];
            if (prevItem) {
              setFocusedItemId(prevItem.id);
              if (onItemSelect) {
                onItemSelect(prevItem.id, prevItem.type);
              }
            }
          }
          break;

        case 'ArrowRight':
          e.preventDefault();
          if (focusedItem && focusedItem.type === 'category') {
            // Expand the focused folder
            if (treeRef.current) {
              const node = treeRef.current.get(focusedItem.id);
              if (node && !node.isOpen) {
                node.toggle();
                setTimeout(() => refreshFlattenedItems(), 100);
              }
            }
          }
          break;

        case 'ArrowLeft':
          e.preventDefault();
          if (focusedItem) {
            if (focusedItem.type === 'category') {
              // Collapse the focused folder
              if (treeRef.current) {
                const node = treeRef.current.get(focusedItem.id);
                if (node && node.isOpen) {
                  node.toggle();
                  setTimeout(() => refreshFlattenedItems(), 100);
                }
              }
            } else if (focusedItem.type === 'note') {
              // Jump to parent folder and collapse it
              const parentFolder = findParentFolder(focusedItem.id);
              if (parentFolder) {
                setFocusedItemId(parentFolder.id);
                if (onItemSelect) {
                  onItemSelect(parentFolder.id, parentFolder.type);
                }
                // Collapse the parent folder
                if (treeRef.current) {
                  const node = treeRef.current.get(parentFolder.id);
                  if (node && node.isOpen) {
                    node.toggle();
                    setTimeout(() => refreshFlattenedItems(), 100);
                  }
                }
              }
            }
          }
          break;

        case 'Enter':
        case ' ': // Space key
          e.preventDefault();
          if (focusedItem) {
            if (focusedItem.type === 'note') {
              // Open the selected note
              if (onNoteSelect) {
                onNoteSelect(focusedItem.id);
              }
            } else if (focusedItem.type === 'category') {
              // Toggle expand/collapse for categories
              if (treeRef.current) {
                const node = treeRef.current.get(focusedItem.id);
                if (node) {
                  node.toggle();
                  setTimeout(() => refreshFlattenedItems(), 100);
                }
              }
            }
          }
          break;

        case 'F2':
          e.preventDefault();
          console.log('F2 pressed, focusedItem:', focusedItem); // Debug log
          if (focusedItem) {
            // Try direct approach first
            const nodeRef = nodeRefsMap.current.get(focusedItem.id);
            if (nodeRef) {
              console.log('Using direct node ref to start editing'); // Debug log
              nodeRef.startEditing();
            } else {
              // Fallback to state-based approach
              console.log('Using state-based approach, setting editingItemId to:', focusedItem.id); // Debug log
              setEditingItemId(focusedItem.id);
            }
          }
          break;

        case 'h':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleHoistFolder();
          }
          break;

        case 'Escape':
          if (hoistedFolderId) {
            e.preventDefault();
            setHoistedFolderId(null);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [focusedItemId, flattenedItems, onItemSelect, onNoteSelect, hoistedFolderId, selectedItemId, selectedItemType, refreshFlattenedItems, findParentFolder]);

  // Initialize focused item
  useEffect(() => {
    if (selectedItemId && !focusedItemId) {
      setFocusedItemId(selectedItemId);
    }
  }, [selectedItemId, focusedItemId]);

  // Refresh flattened items when tree data changes
  useEffect(() => {
    // Small delay to ensure tree is ready
    const timeoutId = setTimeout(() => {
      refreshFlattenedItems();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [treeData, refreshFlattenedItems]);

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
      } else {
        treeRef.current.openAll();
      }
      setAllExpanded(!allExpanded);
      // Refresh flattened items after expand/collapse all
      setTimeout(() => refreshFlattenedItems(), 100);
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
    const isFocused = focusedItemId === nodeData.id;
    const isOpen = nodeData.type === 'note' && selectedNoteId === nodeData.id;

    // Register this node's editing function
    React.useEffect(() => {
      const nodeRef = {
        startEditing: () => {
          console.log(`Direct startEditing called for ${nodeData.id}`); // Debug log
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
      console.log(`Node ${nodeData.id}: editingItemId = ${editingItemId}, nodeData.id = ${nodeData.id}`); // Debug log
      if (editingItemId === nodeData.id) {
        console.log(`Starting edit mode for ${nodeData.id}`); // Debug log
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
        setFocusedItemId(nodeData.id);
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
      node.toggle();
      // Refresh flattened items after toggle
      setTimeout(() => refreshFlattenedItems(), 100);
    };

    const hasChildren = node.children && node.children.length > 0;

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
                node.isOpen ? (
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
    // Set focus from click
    if (onSetFocusFromClick) {
      onSetFocusFromClick();
    }

    // Focus the container when clicked to enable keyboard navigation
    if (containerRef.current) {
      containerRef.current.focus();
      console.log('Container focused'); // Debug log
    }
  };

  return (
    <div ref={containerRef} className={clsx("notes-tree-view", focusClasses)} tabIndex={0} onClick={handleContainerClick}>
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