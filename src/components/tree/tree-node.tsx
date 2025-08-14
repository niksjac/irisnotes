import { TreeNodeContent } from "./tree-node-content";

interface TreeNodeProps {
  node: {
    id: string;
    name: string;
    type: "category" | "note";
  };
  level: number;
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

export function TreeNode({
  node,
  level,
  isExpanded,
  isSelected,
  isFocused,
  isEditing,
  isDragging,
  isDropTarget,
  dropPosition,
  onToggle,
  onSelect,
  onFocus,
  onEdit,
  onSubmitEdit,
  onCancelEdit,
  onDragStart,
  onDragOver,
  onDrop,
  onContextMenu,
}: TreeNodeProps) {
  const paddingLeft = level * 20;

  const getNodeClasses = () => {
    const baseClasses = "flex items-center h-8 px-2 cursor-pointer transition-all duration-150 relative select-none";

    if (isDragging) {
      return `${baseClasses} opacity-50 z-10`;
    }

    if (isDropTarget && dropPosition) {
      const dropClasses = {
        before: "border-t-2 border-blue-500",
        after: "border-b-2 border-blue-500",
        inside: "bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-500 ring-inset"
      };
      return `${baseClasses} ${dropClasses[dropPosition]}`;
    }

    if (isSelected) {
      return `${baseClasses} bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100`;
    }

    if (isFocused) {
      return `${baseClasses} bg-gray-100 dark:bg-gray-700 ring-1 ring-blue-500`;
    }

    return `${baseClasses} hover:bg-gray-50 dark:hover:bg-gray-800`;
  };

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onSelect(node.id);
    onFocus(node.id);
  };

  const handleDoubleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (node.type === "category") {
      onToggle(node.id);
    } else {
      onEdit(node.id);
    }
  };

  const handleToggleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (node.type === "category") {
      onToggle(node.id);
    }
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onContextMenu(node.id, node.type, event);
  };

  const handleDragStart = (event: React.DragEvent) => {
    onDragStart(node.id, event);
  };

  const handleDragOver = (event: React.DragEvent) => {
    onDragOver(node.id, event);
  };

  const handleDrop = (event: React.DragEvent) => {
    onDrop(node.id, event);
  };

  const handleSubmitEdit = (newName: string) => {
    onSubmitEdit(node.id, newName);
  };

  return (
    <div
      className={getNodeClasses()}
      style={{ paddingLeft }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      draggable={!isEditing}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      tabIndex={isFocused ? 0 : -1}
      data-tree-node="true"
      data-node-id={node.id}
      data-tree-level={level}
      data-tree-expanded={isExpanded}
      data-tree-has-children={node.type === "category"}
      data-tree-focused={isFocused}
      data-tree-selected={isSelected}
      role="treeitem"
      aria-level={level + 1}
      aria-expanded={node.type === "category" ? isExpanded : undefined}
      aria-selected={isSelected}
    >
      <div onClick={handleToggleClick} className="flex-shrink-0">
        {/* TreeNodeContent handles the icon which includes expand/collapse */}
      </div>

      <TreeNodeContent
        name={node.name}
        type={node.type}
        isExpanded={isExpanded}
        isEditing={isEditing}
        onSubmitEdit={handleSubmitEdit}
        onCancelEdit={onCancelEdit}
      />
    </div>
  );
}
