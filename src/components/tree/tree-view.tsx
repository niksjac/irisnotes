import { useState, useRef, useCallback } from "react";
import { TreeNode } from "./tree-node";
import { useTreeData } from "./use-tree-data";
import { useTreeKeyboard } from "./use-tree-keyboard";

interface TreeNodeData {
  id: string;
  name: string;
  type: "category" | "note";
  children?: TreeNodeData[];
}

interface FlatTreeNode extends TreeNodeData {
  level: number;
  parentId: string | null;
}

interface TreeViewProps {
  onNodeSelect?: (nodeId: string) => void;
  onNodeActivate?: (nodeId: string, nodeType: "category" | "note") => void;
  onNodeRename?: (nodeId: string, newName: string) => void;
  onNodeMove?: (nodeId: string, targetParentId: string | null, position: number) => void;
  onContextMenu?: (nodeId: string, nodeType: "category" | "note", event: React.MouseEvent) => void;
  className?: string;
}

export function TreeView({
  onNodeSelect,
  onNodeActivate,
  onNodeRename,
  onNodeMove: _onNodeMove,
  onContextMenu,
  className = "",
}: TreeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    treeData,
    isLoading,
    error,
    updateNodeName,
    moveNode: _dbMoveNode,
  } = useTreeData();

  // Flatten tree data for rendering
  const flattenTreeData = useCallback((
    data: TreeNodeData[],
    expanded: Set<string>,
    parentId: string | null = null,
    level: number = 0
  ): FlatTreeNode[] => {
    const result: FlatTreeNode[] = [];

    data.forEach((node) => {
      const flatNode: FlatTreeNode = {
        ...node,
        level,
        parentId,
      };

      result.push(flatNode);

      if (node.children && expanded.has(node.id)) {
        const childNodes = flattenTreeData(node.children, expanded, node.id, level + 1);
        result.push(...childNodes);
      }
    });

    return result;
  }, []);

  const flatNodes = flattenTreeData(treeData, expandedIds);

  // Event handlers
  const handleNodeToggle = useCallback((nodeId: string) => {
    setExpandedIds(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(nodeId)) {
        newExpanded.delete(nodeId);
      } else {
        newExpanded.add(nodeId);
      }
      return newExpanded;
    });
  }, []);

  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedId(nodeId);
    onNodeSelect?.(nodeId);
  }, [onNodeSelect]);

  const handleNodeFocus = useCallback((nodeId: string) => {
    setFocusedId(nodeId);
  }, []);

  const handleNodeEdit = useCallback((nodeId: string) => {
    setEditingId(nodeId);
  }, []);

  const handleSubmitEdit = useCallback((nodeId: string, newName: string) => {
    setEditingId(null);
    if (onNodeRename) {
      onNodeRename(nodeId, newName);
    } else {
      updateNodeName(nodeId, newName);
    }
  }, [onNodeRename, updateNodeName]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  const handleNodeContextMenu = useCallback((nodeId: string, nodeType: "category" | "note", event: React.MouseEvent) => {
    onContextMenu?.(nodeId, nodeType, event);
  }, [onContextMenu]);

  // Simplified drag handlers
  const handleNodeDragStart = useCallback((_nodeId: string, event: React.DragEvent) => {
    event.dataTransfer.effectAllowed = "move";
  }, []);

  const handleNodeDragOver = useCallback((_nodeId: string, event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const handleNodeDrop = useCallback((_nodeId: string, event: React.DragEvent) => {
    event.preventDefault();
    // Simplified - no actual move logic yet
  }, []);

  // Keyboard navigation
  useTreeKeyboard({
    containerRef,
    onNodeSelect: (nodeId) => {
      handleNodeSelect(nodeId);
      handleNodeFocus(nodeId);
    },
    onNodeActivate: (nodeId) => {
      const node = flatNodes.find(n => n.id === nodeId);
      if (node) {
        onNodeActivate?.(nodeId, node.type);
      }
    },
    onNodeEdit: handleNodeEdit,
    onNodeToggle: handleNodeToggle,
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading tree...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-500 dark:text-red-400">
          <p className="text-sm">Failed to load tree data</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`tree-view h-full overflow-auto focus:outline-none ${className}`}
      role="tree"
      tabIndex={0}
      onFocus={() => {
        if (!focusedId && flatNodes.length > 0) {
          setFocusedId(flatNodes[0]?.id || null);
        }
      }}
    >
      {flatNodes.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          level={node.level}
          isExpanded={expandedIds.has(node.id)}
          isSelected={selectedId === node.id}
          isFocused={focusedId === node.id}
          isEditing={editingId === node.id}
          isDragging={false}
          isDropTarget={false}
          dropPosition={null}
          onToggle={handleNodeToggle}
          onSelect={handleNodeSelect}
          onFocus={handleNodeFocus}
          onEdit={handleNodeEdit}
          onSubmitEdit={handleSubmitEdit}
          onCancelEdit={handleCancelEdit}
          onDragStart={handleNodeDragStart}
          onDragOver={handleNodeDragOver}
          onDrop={handleNodeDrop}
          onContextMenu={handleNodeContextMenu}
        />
      ))}

      {flatNodes.length === 0 && (
        <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
          <p className="text-sm">No items to display</p>
        </div>
      )}
    </div>
  );
}
