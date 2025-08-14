import { useState, useEffect, useCallback } from "react";
import { useNotesActions, useCategoriesActions, useNotesStorage, useCategoriesData } from "@/hooks";
import type { TreeData } from "@/types";

interface TreeNodeData {
  id: string;
  name: string;
  type: "category" | "note";
  children?: TreeNodeData[];
}

interface UseTreeDataResult {
  treeData: TreeNodeData[];
  isLoading: boolean;
  error: string | null;
  reloadData: () => Promise<void>;
  updateNodeName: (nodeId: string, newName: string) => Promise<void>;
  moveNode: (nodeId: string, newParentId: string | null, position: number) => Promise<void>;
}

export function useTreeData(): UseTreeDataResult {
  const [treeData, setTreeData] = useState<TreeNodeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { updateNote } = useNotesActions();
  const { updateCategory } = useCategoriesActions();
  const { categories } = useCategoriesData();
  const { storageAdapter } = useNotesStorage();

  // Convert TreeData to TreeNodeData
  const convertTreeData = (data: TreeData[]): TreeNodeData[] => {
    return data.map(item => ({
      id: item.id,
      name: item.name,
      type: item.type || "note",
      children: item.children ? convertTreeData(item.children) : undefined,
    }));
  };

  const loadTreeData = useCallback(async () => {
    if (!storageAdapter) {
      setError("Storage not available");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await storageAdapter.getTreeData();
      if (result.success) {
        setTreeData(convertTreeData(result.data));
      } else {
        setError(`Failed to load tree data: ${result.error}`);
      }
    } catch (err) {
      setError(`Failed to load tree data: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }, [storageAdapter]);

  useEffect(() => {
    loadTreeData();
  }, [loadTreeData]);

  const findNodeType = useCallback(
    (data: TreeNodeData[], targetId: string): "note" | "category" | null => {
      for (const item of data) {
        if (item.id === targetId) {
          return item.type;
        }
        if (item.children) {
          const found = findNodeType(item.children, targetId);
          if (found) return found;
        }
      }
      return null;
    },
    []
  );

  const updateNodeName = useCallback(
    async (nodeId: string, newName: string) => {
      if (!storageAdapter) {
        setError("Storage not available");
        return;
      }

      try {
        const nodeType = findNodeType(treeData, nodeId);

        if (nodeType === "category") {
          const result = await updateCategory(nodeId, { name: newName });
          if (!result || !result.success) {
            setError(`Failed to rename category: ${result?.error || "Unknown error"}`);
            return;
          }
          await loadTreeData();
        } else if (nodeType === "note") {
          const result = await updateNote({ id: nodeId, title: newName });
          if (!result || !result.success) {
            setError(`Failed to rename note: ${result?.error || "Unknown error"}`);
            return;
          }
          await loadTreeData();
        } else {
          setError("Could not determine node type");
        }
      } catch (err) {
        setError(`Failed to rename node: ${err}`);
      }
    },
    [storageAdapter, treeData, updateNote, updateCategory, loadTreeData, findNodeType]
  );

  const moveNode = useCallback(
    async (nodeId: string, newParentId: string | null, position: number) => {
      if (!storageAdapter) {
        setError("Storage not available");
        return;
      }

      try {
        const nodeType = findNodeType(treeData, nodeId);
        if (!nodeType) {
          setError("Could not determine node type");
          return;
        }

        if (nodeType === "category" && newParentId) {
          let currentId = newParentId;
          let depth = 1;
          while (currentId && depth < 4) {
            const parent = categories.find((cat) => cat.id === currentId);
            if (!parent || !parent.parent_id) break;
            currentId = parent.parent_id;
            depth++;
          }
          if (depth >= 3) {
            setError("Cannot nest deeper than 3 levels");
            return;
          }
        }

        const result = await storageAdapter.moveTreeItem(
          nodeId,
          nodeType,
          newParentId,
          position
        );

        if (!result.success) {
          setError(`Failed to move ${nodeType}: ${result.error}`);
          return;
        }

        setError(null);
        await loadTreeData();
      } catch (err) {
        setError(`Failed to move node: ${err}`);
      }
    },
    [storageAdapter, treeData, categories, findNodeType, loadTreeData]
  );

  return {
    treeData,
    isLoading,
    error,
    reloadData: loadTreeData,
    updateNodeName,
    moveNode,
  };
}
