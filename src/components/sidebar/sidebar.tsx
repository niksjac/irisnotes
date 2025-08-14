import type React from "react";
import {
	useNotesData,
	useNotesStorage,
	useNotesSelection,
	useContextMenu,
	useContextMenuActions
} from "@/hooks";
import { TreeView } from "../tree";
import { ContextMenu } from "../context-menu";

export const Sidebar: React.FC = () => {
	const { isInitialized } = useNotesStorage();
	const { isLoading } = useNotesData();
	const { setSelectedNoteId } = useNotesSelection();
	const { contextMenu, handleContextMenu, hideContextMenu } = useContextMenu();
	const { getTreeNodeMenuGroups } = useContextMenuActions();

	// Auto-initialization is now handled in useNotesActions

	if (!isInitialized || isLoading) {
		return (
			<div className="flex items-center justify-center h-full">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
					<p className="text-sm text-gray-500">Loading notes...</p>
				</div>
			</div>
		);
	}

	const handleNodeSelect = (_nodeId: string) => {
		// Could handle selection state here if needed
	};

	const handleNodeActivate = (nodeId: string, nodeType: "category" | "note") => {
		if (nodeType === "note") {
			setSelectedNoteId(nodeId);
		}
	};

	const handleNodeContextMenu = (nodeId: string, nodeType: "category" | "note", event: React.MouseEvent) => {
		const menuGroups = getTreeNodeMenuGroups({
			nodeId,
			nodeType,
			nodeName: "", // We'd need to get this from the tree data
		});

		handleContextMenu(event, {
			targetId: nodeId,
			targetType: nodeType,
			menuGroups,
		});
	};

	return (
		<>
			<div className="flex flex-col h-full bg-white dark:bg-gray-900">
				<TreeView
					onNodeSelect={handleNodeSelect}
					onNodeActivate={handleNodeActivate}
					onContextMenu={handleNodeContextMenu}
					className="flex-1"
				/>
			</div>
			<ContextMenu data={contextMenu} onClose={hideContextMenu} />
		</>
	);
};
