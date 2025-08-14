import { TreeNodeIcon } from "./tree-node-icon";
import { TreeNodeEditor } from "./tree-node-editor";

interface TreeNodeContentProps {
  name: string;
  type: "category" | "note";
  isExpanded: boolean;
  isEditing: boolean;
  onSubmitEdit: (name: string) => void;
  onCancelEdit: () => void;
}

export function TreeNodeContent({
  name,
  type,
  isExpanded,
  isEditing,
  onSubmitEdit,
  onCancelEdit,
}: TreeNodeContentProps) {
  const hasChildren = type === "category";

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <TreeNodeIcon
        type={type}
        isExpanded={isExpanded}
        hasChildren={hasChildren}
      />

      {isEditing ? (
        <TreeNodeEditor
          initialValue={name}
          onSubmit={onSubmitEdit}
          onCancel={onCancelEdit}
        />
      ) : (
        <span className="flex-1 truncate text-sm text-gray-900 dark:text-gray-100">
          {name}
        </span>
      )}
    </div>
  );
}
