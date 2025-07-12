import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Folder, FileText, Plus } from 'lucide-react';
import type { TreeNode as TreeNodeType } from '../types';

interface TreeNodeProps {
  node: any;
  style: React.CSSProperties;
  dragHandle: (el: HTMLDivElement | null) => void;
  navigatedItemId: string | null;
  selectedItemId: string | null;
  selectedNoteId: string | null;
  expandedNodes: Set<string>;
  editingItemId: string | null;
  setEditingItemId: (id: string | null) => void;
  nodeRefsMap: React.MutableRefObject<Map<string, { startEditing: () => void; }>>;
  onItemSelect: (id: string, type: 'note' | 'category') => void;
  onNoteSelect: (id: string) => void;
  toggleNodeExpansion: (id: string) => void;
  onRenameNote: (id: string, name: string) => void;
  onRenameCategory: (id: string, name: string) => void;
  onCreateNote: (id: string) => void;
  onCreateFolder: (id: string) => void;
}

export const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  style,
  dragHandle,
  navigatedItemId,
  selectedItemId,
  selectedNoteId,
  expandedNodes,
  editingItemId,
  setEditingItemId,
  nodeRefsMap,
  onItemSelect,
  onNoteSelect,
  toggleNodeExpansion,
  onRenameNote,
  onRenameCategory,
  onCreateNote,
  onCreateFolder,
}) => {
  const nodeData = node.data as TreeNodeType;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(nodeData.name);
  const isFocused = navigatedItemId === nodeData.id;
  const isOpen = nodeData.type === 'note' && selectedNoteId === nodeData.id;

  React.useEffect(() => {
    const nodeRef = {
      startEditing: () => {
        setIsEditing(true);
        setEditValue(nodeData.name);
      },
    };
    nodeRefsMap.current.set(nodeData.id, nodeRef);

    return () => {
      nodeRefsMap.current.delete(nodeData.id);
    };
  }, [nodeData.id, nodeData.name, nodeRefsMap]);

  React.useEffect(() => {
    if (editingItemId === nodeData.id) {
      setIsEditing(true);
      setEditValue(nodeData.name);
      setTimeout(() => setEditingItemId(null), 0);
    }
  }, [editingItemId, nodeData.id, nodeData.name, setEditingItemId]);

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
    if (!isEditing) {
      onItemSelect(nodeData.id, nodeData.type);
      if (nodeData.type === 'note') {
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
        {nodeData.type === 'category' && (
          <div
            className="tree-node-arrow"
            onClick={handleToggle}
            style={{
              opacity: hasChildren ? 1 : 0.3,
              cursor: hasChildren ? 'pointer' : 'default',
            }}
          >
            {hasChildren ? (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <ChevronRight size={14} />}
          </div>
        )}
        {nodeData.type === 'note' && (
          <div className="tree-node-arrow" style={{ opacity: 0 }}>
            <ChevronRight size={14} />
          </div>
        )}
        <div className="tree-node-icon">
          {nodeData.type === 'category' ? <Folder size={16} /> : <FileText size={16} />}
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
          <span className="tree-node-name">{nodeData.name}</span>
        )}
      </div>
      <div className="tree-node-actions">
        {nodeData.type === 'category' && (
          <>
            <button
              className="tree-node-action"
              onClick={(e) => {
                e.stopPropagation();
                onCreateNote(nodeData.id);
              }}
              title="Add note"
            >
              <Plus size={12} />
            </button>
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
          </>
        )}
      </div>
    </div>
  );
};