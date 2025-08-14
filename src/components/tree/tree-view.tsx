import { useState, useEffect } from "react";
import { ChevronRight, FileText, Folder } from "lucide-react";
import {
  useNotesStorage,
  useNotesSelection,
  useContextMenu,
  useContextMenuActions
} from "@/hooks";
import { ContextMenu } from "../context-menu";
import type { TreeData } from "@/types";

interface TreeNodeData {
  id: string;
  name: string;
  type: "category" | "note";
  children?: TreeNodeData[];
}

export function TreeView() {
  const [treeData, setTreeData] = useState<TreeNodeData[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { storageAdapter } = useNotesStorage();
  const { setSelectedNoteId } = useNotesSelection();
  const { contextMenu, handleContextMenu, hideContextMenu } = useContextMenu();
  const { getTreeNodeMenuGroups } = useContextMenuActions();

  // Load tree data
  useEffect(() => {
    const loadData = async () => {
      if (!storageAdapter) {
        setError("Storage not available");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const result = await storageAdapter.getTreeData();
        if (result.success) {
          const convertedData = result.data.map(convertTreeData);
          setTreeData(convertedData);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError(`Failed to load tree: ${err}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [storageAdapter]);

  // Convert TreeData to TreeNodeData
  const convertTreeData = (item: TreeData): TreeNodeData => ({
    id: item.id,
    name: item.name,
    type: item.type || "note",
    children: item.children?.map(convertTreeData),
  });

  // Toggle node expansion
  const toggleExpanded = (nodeId: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  // Handle node activation
  const handleNodeActivate = (nodeId: string, nodeType: "category" | "note") => {
    if (nodeType === "note") {
      setSelectedNoteId(nodeId);
    } else {
      toggleExpanded(nodeId);
    }
  };

  // Handle context menu
  const handleNodeContextMenu = (nodeId: string, nodeType: "category" | "note", nodeName: string, event: React.MouseEvent) => {
    const menuGroups = getTreeNodeMenuGroups({
      nodeId,
      nodeType,
      nodeName,
    });

    handleContextMenu(event, {
      targetId: nodeId,
      targetType: nodeType,
      menuGroups,
    });
  };

  // Render tree node
  const renderNode = (node: TreeNodeData, level: number = 0) => {
    const isExpanded = expandedIds.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const paddingLeft = level * 20;

    return (
      <div key={node.id}>
        <div
          className="flex items-center h-8 px-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
          style={{ paddingLeft }}
          onClick={() => handleNodeActivate(node.id, node.type)}
          onContextMenu={(e) => handleNodeContextMenu(node.id, node.type, node.name, e)}
        >
          {/* Expand/collapse chevron */}
          {hasChildren ? (
            <ChevronRight
              className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform mr-1 ${
                isExpanded ? "rotate-90" : ""
              }`}
            />
          ) : (
            <div className="w-5" />
          )}

          {/* Icon */}
          {node.type === "category" ? (
            <Folder className="h-4 w-4 text-blue-500 dark:text-blue-400 mr-2" />
          ) : (
            <FileText className="h-4 w-4 text-gray-600 dark:text-gray-300 mr-2" />
          )}

          {/* Name */}
          <span className="text-sm text-gray-900 dark:text-gray-100 truncate">
            {node.name}
          </span>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

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
          <p className="text-sm">Failed to load tree</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-full overflow-auto">
        {treeData.map(node => renderNode(node))}
        {treeData.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
            <p className="text-sm">No items to display</p>
          </div>
        )}
      </div>
      <ContextMenu data={contextMenu} onClose={hideContextMenu} />
    </>
  );
}