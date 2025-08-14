// Tree Component Types - Clean separation of concerns
// ============================================================================
// Core Tree Data Types
// ============================================================================

export interface TreeNodeData {
  id: string;
  name: string;
  type: "category" | "note";
  children?: TreeNodeData[];
}

// ============================================================================
// Tree State Management Types
// ============================================================================

export interface TreeState {
  expandedIds: Set<string>;
  selectedId: string | null;
  focusedId: string | null;
  editingId: string | null;
  dragState: DragState | null;
}

export interface DragState {
  draggedId: string;
  dropTargetId: string | null;
  dropPosition: "before" | "after" | "inside" | null;
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface TreeViewProps {
  data: TreeNodeData[];
  onNodeSelect?: (nodeId: string) => void;
  onNodeActivate?: (nodeId: string, nodeType: "category" | "note") => void;
  onNodeRename?: (nodeId: string, newName: string) => void;
  onNodeMove?: (nodeId: string, targetParentId: string | null, position: number) => void;
  onContextMenu?: (nodeId: string, nodeType: "category" | "note", event: React.MouseEvent) => void;
  className?: string;
}

export interface TreeNodeProps {
  node: TreeNodeData;
  level: number;
  index: number;
  isExpanded: boolean;
  isSelected: boolean;
  isFocused: boolean;
  isEditing: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  dropPosition: "before" | "after" | "inside" | null;
  onToggle: (nodeId: string) => void;
  onSelect: (nodeId: string) => void;
  onFocus: (nodeId: string) => void;
  onEdit: (nodeId: string) => void;
  onSubmitEdit: (nodeId: string, newName: string) => void;
  onCancelEdit: () => void;
  onDragStart: (nodeId: string, event: React.DragEvent) => void;
  onDragOver: (nodeId: string, event: React.DragEvent) => void;
  onDrop: (nodeId: string, event: React.DragEvent) => void;
  onContextMenu: (nodeId: string, nodeType: "category" | "note", event: React.MouseEvent) => void;
}

export interface TreeNodeContentProps {
  name: string;
  type: "category" | "note";
  isExpanded: boolean;
  isEditing: boolean;
  onSubmitEdit: (name: string) => void;
  onCancelEdit: () => void;
}

// ============================================================================
// Hook Types
// ============================================================================

export interface UseTreeStateOptions {
  initialExpandedIds?: string[];
  initialSelectedId?: string | null;
  onSelectionChange?: (nodeId: string | null) => void;
}

export interface UseTreeKeyboardOptions {
  containerRef: React.RefObject<HTMLDivElement>;
  onNodeSelect: (nodeId: string) => void;
  onNodeActivate: (nodeId: string) => void;
  onNodeEdit: (nodeId: string) => void;
  onNodeToggle: (nodeId: string) => void;
}

export interface UseTreeDragDropOptions {
  onNodeMove: (nodeId: string, targetParentId: string | null, position: number) => void;
  isValidDrop?: (draggedId: string, targetId: string) => boolean;
}

// ============================================================================
// Utility Types
// ============================================================================

export interface FlatTreeNode extends TreeNodeData {
  level: number;
  parentId: string | null;
  index: number;
  hasChildren: boolean;
}

export interface DropTargetInfo {
  nodeId: string;
  position: "before" | "after" | "inside";
  valid: boolean;
}
