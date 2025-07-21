import { useEffect, useRef } from 'react';
import { Tree } from 'react-arborist';
import type { TreeNode } from '../types';
import { TreeNode as TreeNodeComponent } from './tree-node';
import type { TreeState } from '../hooks/use-tree-state';

interface TreeContainerProps {
  treeData: TreeNode[];
  treeState: TreeState;
  selectedItemId?: string | null | undefined;
  selectedNoteId?: string | null | undefined;
  nodeRefsMap: React.MutableRefObject<Map<string, { startEditing: () => void }>>;
  onItemSelect: (id: string, type: 'note' | 'category') => void;
  onNoteSelect: (id: string) => void;
  toggleNodeExpansion: (id: string) => void;
  onRenameNote: (id: string, name: string) => void;
  onRenameCategory: (id: string, name: string) => void;
  onCreateNote: (id: string) => void;
  onCreateFolder: (id: string) => void;
  onMove: (args: any) => void;
  setTreeHeight: (height: number) => void;
  setEditingItemId: (id: string | null) => void;
}

export function TreeContainer({
  treeData,
  treeState,
  selectedItemId,
  selectedNoteId,
  nodeRefsMap,
  onItemSelect,
  onNoteSelect,
  toggleNodeExpansion,
  onRenameNote,
  onRenameCategory,
  onCreateNote,
  onCreateFolder,
  onMove,
  setTreeHeight,
  setEditingItemId,
}: TreeContainerProps) {
  const treeRef = useRef<any>(null);
  const treeContainerRef = useRef<HTMLDivElement>(null);

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
  }, [setTreeHeight]);

  const Node = (props: any) => (
    <TreeNodeComponent
      {...props}
      navigatedItemId={treeState.navigatedItemId}
      selectedItemId={selectedItemId}
      selectedNoteId={selectedNoteId}
      expandedNodes={treeState.expandedNodes}
      editingItemId={treeState.editingItemId}
      setEditingItemId={setEditingItemId}
      nodeRefsMap={nodeRefsMap}
      onItemSelect={onItemSelect}
      onNoteSelect={onNoteSelect}
      toggleNodeExpansion={toggleNodeExpansion}
      onRenameNote={onRenameNote}
      onRenameCategory={onRenameCategory}
      onCreateNote={onCreateNote}
      onCreateFolder={onCreateFolder}
    />
  );

  return (
    <div ref={treeContainerRef} className="flex-1 overflow-hidden p-1">
      <Tree
        ref={treeRef}
        data={treeData}
        openByDefault={true}
        width="100%"
        height={treeState.treeHeight}
        indent={20}
        rowHeight={32}
        onMove={onMove}
        disableEdit
        disableMultiSelection
      >
        {Node}
      </Tree>
    </div>
  );
}