import { useState, useRef } from "react";
import { Tree } from "react-arborist";
import useResizeObserver from "use-resize-observer";
import { TreeNode } from "./tree-node";
import { useNotesSelection, useContextMenu, useContextMenuActions, useNotesStorage } from "@/hooks";
import { useCategoriesActions } from "@/hooks";
import type { TreeContextData } from "@/types";
import { ContextMenu } from "../context-menu";
import { useTreeData } from "./use-tree-data";
import { useTreeKeyboard } from "./use-tree-keyboard";
import { useTreeRename } from "./use-tree-rename";

export function TreeView() {
	const { treeData, isLoading, error } = useTreeData();
	const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
	const { ref, width, height } = useResizeObserver();
	const { setSelectedNoteId } = useNotesSelection();
	const { contextMenu, handleContextMenu, hideContextMenu } = useContextMenu();
	const { getTreeNodeMenuGroups } = useContextMenuActions();
	const { moveNote } = useCategoriesActions();
	const { storageAdapter } = useNotesStorage();
	const treeRef = useRef<any>(null);

	// Extract keyboard handling
	useTreeKeyboard({ treeRef });

	// Extract rename handling
	const { handleRename } = useTreeRename();

	const handleActivate = (node: any) => {
		// Handle note selection
		if (node.data.type === "note") {
			setSelectedNoteId(node.data.id);
		}
	};

	// Simple drag and drop with timestamp-based ordering
	const handleMove = async ({ dragIds, parentId }: { dragIds: string[]; parentId: string | null }) => {
		if (dragIds.length !== 1) return;
		const noteId = dragIds[0];
		if (!noteId) return;

		// Move to category and update sort order with current timestamp
		await moveNote(noteId, parentId);
		await storageAdapter?.updateNoteSortOrder(noteId, Date.now());
	};

	// Loading state
	if (isLoading) {
		return (
			<div ref={ref} className="flex flex-col h-full bg-white dark:bg-gray-900">
				<div className="flex items-center justify-center h-full">
					<div className="text-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
						<p className="text-sm text-gray-500 dark:text-gray-400">Loading notes...</p>
					</div>
				</div>
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div ref={ref} className="flex flex-col h-full bg-white dark:bg-gray-900">
				<div className="flex items-center justify-center h-full">
					<div className="text-center text-red-500 dark:text-red-400">
						<p className="text-sm">Failed to load tree data</p>
						<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{error}</p>
					</div>
				</div>
			</div>
		);
	}

	const handleTreeContextMenu = (event: React.MouseEvent, data: TreeContextData) => {
		const menuGroups = getTreeNodeMenuGroups(data);
		handleContextMenu(event, {
			targetId: data.nodeId,
			targetType: data.nodeType,
			menuGroups,
		});
	};

	return (
		<>
			<div ref={ref} className="flex flex-col h-full bg-white dark:bg-gray-900">
				<div className="flex-1 overflow-hidden">
					{width && height && (
						<Tree
							ref={treeRef}
							data={treeData}
							openByDefault={true}
							width={width}
							height={height}
							indent={16}
							rowHeight={36}
							selection={selectedId}
							selectionFollowsFocus={false}
							className="[&_*]:!outline-none [&_*]:!outline-offset-0"
							onSelect={(nodes) => setSelectedId(nodes[0]?.id)}
							onActivate={handleActivate}
							onRename={handleRename}
							onMove={handleMove}
						>
							{(props) => <TreeNode {...props} onContextMenu={handleTreeContextMenu} />}
						</Tree>
					)}
				</div>
			</div>
			<ContextMenu data={contextMenu} onClose={hideContextMenu} />
		</>
	);
}
