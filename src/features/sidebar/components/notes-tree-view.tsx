import React, { useState, useCallback, useMemo } from 'react';
import { Tree } from 'react-arborist';
import { Plus, Folder, FileText, MoreVertical, ChevronRight, ChevronDown } from 'lucide-react';
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
}: NotesTreeViewProps) {
  const [searchQuery, setSearchQuery] = useState('');

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
      return filterNodes(rootNodes);
    }

    return rootNodes;
  }, [notes, categories, searchQuery, noteCategories]);

  const Node = ({ node, style, dragHandle }: any) => {
    // Get the actual node data from react-arborist
    const nodeData = node.data;
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(nodeData.name);

    const handleDoubleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
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
      if (nodeData.type === 'note' && !isEditing) {
        onNoteSelect(nodeData.id);
      }
    };

    const handleToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      node.toggle();
    };

    const hasChildren = node.children && node.children.length > 0;

    return (
      <div
        ref={dragHandle}
        style={style}
        className={`tree-node ${nodeData.type} ${selectedNoteId === nodeData.id ? 'selected' : ''}`}
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

          <button
            className="tree-node-action"
            onClick={(e) => {
              e.stopPropagation();
              if (nodeData.type === 'note') {
                onDeleteNote(nodeData.id);
              } else {
                onDeleteCategory(nodeData.id);
              }
            }}
            title="Delete"
          >
            <MoreVertical size={12} />
          </button>
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

  return (
    <div className="notes-tree-view">
      <div className="tree-header">
        <div className="tree-title">
          <h3>Notes</h3>
        </div>
        <div className="tree-actions">
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

      <div className="tree-search">
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="tree-search-input"
        />
      </div>

      <div className="tree-container">
        <Tree
          data={treeData}
          openByDefault={true}
          width="100%"
          height={400}
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