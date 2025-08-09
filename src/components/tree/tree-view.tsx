import { useState, useRef } from "react";
import { Tree } from "react-arborist";
import useResizeObserver from "use-resize-observer";
import { useHotkeys } from "react-hotkeys-hook";
import { TreeNode } from "./tree-node";
import { useTreeData, useNotesSelection, useContextMenu, useContextMenuActions, useNotesActions } from "@/hooks";
import type { PaneId, TreeContextData } from "@/types";
import { ContextMenu } from "../context-menu";

interface TreeViewProps {
	isDualPaneMode?: boolean;
	activePaneId?: PaneId | null;
}

export function TreeView({ isDualPaneMode = false, activePaneId }: TreeViewProps) {
	const { treeData, isLoading, error, refreshData } = useTreeData();
	const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
	const { ref, width, height } = useResizeObserver();
	const { setSelectedNoteId, openNoteInPane } = useNotesSelection();
	const { contextMenu, handleContextMenu, hideContextMenu } = useContextMenu();
	const { getTreeNodeMenuGroups } = useContextMenuActions();
	const { updateNoteTitle } = useNotesActions();
	const treeRef = useRef<any>(null);

	// Handle F2 key for renaming
	useHotkeys(
		"f2",
		() => {
			const tree = treeRef.current;
			if (tree && selectedId) {
				// Find the selected node and trigger edit
				const selectedNodes = tree.selectedNodes;
				if (selectedNodes && selectedNodes.length === 1) {
					const node = selectedNodes[0];
					node.edit();
				}
			}
		},
		{
			preventDefault: true,
			enableOnContentEditable: false,
			enableOnFormTags: false,
		}
	);

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

	// Handle rename operation
	const handleRename = async ({ node, name }: { node: any; name: string }) => {
		if (node.data.type === "note") {
			try {
				await updateNoteTitle(node.data.id, name);
				// Refresh tree data to show updated name
				await refreshData();
			} catch (error) {
				console.error("Failed to rename note:", error);
			}
		} else if (node.data.type === "category") {
			// TODO: Add category renaming support when category management is implemented
			console.log("Category renaming not yet implemented");
		}
	};

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
							onSelect={(nodes) => {
								setSelectedId(nodes[0]?.id);
							}}
							onActivate={(node) => {
								// Handle note selection for the appropriate pane
								if (node.data.type === "note") {
									if (isDualPaneMode && activePaneId) {
										openNoteInPane(node.data.id, activePaneId);
									} else {
										setSelectedNoteId(node.data.id);
									}
								}
								console.log("Activated node:", node.data.name, "type:", node.data.type);
							}}
							onFocus={(node) => {
								console.log("Focused node:", node.data.name, "type:", node.data.type);
							}}
							onRename={handleRename}
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
