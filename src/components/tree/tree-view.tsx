import { useState, useRef } from "react";
import { Tree } from "react-arborist";
import useResizeObserver from "use-resize-observer";
import { TreeNode } from "./tree-node";
import { useNotesSelection, useContextMenu, useContextMenuActions, useAppInfo } from "@/hooks";
import type { TreeContextData } from "@/types";
import { ContextMenu } from "../context-menu";
import { useTreeData } from "./use-tree-data";
import { useTreeKeyboard } from "./use-tree-keyboard";

export function TreeView() {
	const { treeData, isLoading, error, updateNodeName, moveNode } = useTreeData();
	const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
	const { ref, width, height } = useResizeObserver();
	const { setSelectedNoteId } = useNotesSelection();
	const { contextMenu, handleContextMenu, hideContextMenu } = useContextMenu();
	const { getTreeNodeMenuGroups } = useContextMenuActions();
	const { appInfo } = useAppInfo();
	const treeRef = useRef<any>(null);

	// Extract keyboard handling
	useTreeKeyboard({ treeRef });

	// Simple rename handler for example data
	const handleRename = async ({ node, name }: { node: any; name: string }) => {
		updateNodeName(node.id, name);
	};

	const handleActivate = (node: any) => {
		// Handle note selection
		if (node.data.type === "note") {
			setSelectedNoteId(node.data.id);
		}
	};

	// Optimized move handler for real database
	const handleMove = async ({ dragIds, parentId }: { dragIds: string[]; parentId: string | null }) => {
		// Only support single item moves for simplicity
		if (dragIds.length !== 1) return;

		const nodeId = dragIds[0];
		if (!nodeId) return;

		// Move the node in database
		await moveNode(nodeId, parentId);
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
				{/* Debug info */}
				<div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-200 dark:border-gray-700">
					Tree: {treeData.length} items | {appInfo?.development_mode ? "Dev" : "Prod"}
				</div>
				<div className="flex-1 overflow-hidden">
					{width && height && (
						<Tree
							ref={treeRef}
							data={treeData}
							openByDefault={true}
							width={width}
							height={height}
							indent={20}
							rowHeight={40}
							selection={selectedId}
							selectionFollowsFocus={false}
							disableEdit={false}
							disableDrag={false}
							disableDrop={false}
							searchTerm=""
							searchMatch={(node, term) => node.data.name.toLowerCase().includes(term.toLowerCase())}
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
