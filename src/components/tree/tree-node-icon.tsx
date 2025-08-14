import { ChevronRight, FileText, Folder } from "lucide-react";

interface TreeNodeIconProps {
  type: "category" | "note";
  isExpanded: boolean;
  hasChildren: boolean;
}

export function TreeNodeIcon({ type, isExpanded, hasChildren }: TreeNodeIconProps) {
  return (
    <div className="flex items-center gap-1">
      {hasChildren ? (
        <ChevronRight
          className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform ${
            isExpanded ? "rotate-90" : ""
          }`}
        />
      ) : (
        <div className="w-4" />
      )}

      {type === "category" ? (
        <Folder className="h-4 w-4 text-blue-500 dark:text-blue-400" />
      ) : (
        <FileText className="h-4 w-4 text-gray-600 dark:text-gray-300" />
      )}
    </div>
  );
}
