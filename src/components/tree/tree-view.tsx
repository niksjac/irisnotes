import { useState, useRef } from "react";
import { Tree } from "react-arborist";
import useResizeObserver from "use-resize-observer";
import { TreeNode } from "./tree-node";
import {
	useNotesSelection,
	useContextMenu,
	useContextMenuActions,
	useAppInfo,
} from "@/hooks";
import type { TreeContextData } from "@/types";
import { ContextMenu } from "../context-menu";
import { useTreeData } from "./use-tree-data";
import { useTreeKeyboard } from "./use-tree-keyboard";

export function TreeView() {
	const { treeData, isLoading, error, updateNodeName, moveNode } =
		useTreeData();
	const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
	const [dragDebugInfo, setDragDebugInfo] = useState<string[]>([]);
	const { ref, width, height } = useResizeObserver();
	const { setSelectedNoteId } = useNotesSelection();
	const { contextMenu, handleContextMenu, hideContextMenu } = useContextMenu();
	const { getTreeNodeMenuGroups } = useContextMenuActions();
	const { appInfo } = useAppInfo();
	const treeRef = useRef<any>(null);

	// Add drag debug info
	const addDebugInfo = (info: string) => {
		const timestamp = new Date().toLocaleTimeString();
		setDragDebugInfo((prev) => [...prev.slice(-4), `${timestamp}: ${info}`]);
	};

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
	const handleMove = async ({
		dragIds,
		parentId,
		index,
	}: {
		dragIds: string[];
		parentId: string | null;
		index: number;
	}) => {
		const debugMsg = `onMove: ${dragIds[0]} → parent: ${parentId}, index: ${index}`;
		addDebugInfo(debugMsg);

		// Only support single item moves for simplicity
		if (dragIds.length !== 1) return;

		const nodeId = dragIds[0];
		if (!nodeId) return;

		// Move the node in database with specific position
		await moveNode(nodeId, parentId, index);
	};

	// Loading state
	if (isLoading) {
		return (
			<div ref={ref} className="flex flex-col h-full bg-white dark:bg-gray-900">
				<div className="flex items-center justify-center h-full">
					<div className="text-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
						<p className="text-sm text-gray-500 dark:text-gray-400">
							Loading notes...
						</p>
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
						<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
							{error}
						</p>
					</div>
				</div>
			</div>
		);
	}

	const handleTreeContextMenu = (
		event: React.MouseEvent,
		data: TreeContextData
	) => {
		const menuGroups = getTreeNodeMenuGroups(data);
		handleContextMenu(event, {
			targetId: data.nodeId,
			targetType: data.nodeType,
			menuGroups,
		});
	};

	// Custom cursor component for better drop feedback
	const CustomCursor = ({ top, left }: { top: number; left: number }) => (
		<div
			style={{
				position: "absolute",
				top: top - 1,
				left: left,
				right: 20,
				height: "3px",
				backgroundColor: "#3b82f6",
				borderRadius: "2px",
				boxShadow: "0 0 4px rgba(59, 130, 246, 0.5)",
				zIndex: 1000,
			}}
		/>
	);

	return (
		<>
			<div ref={ref} className="flex flex-col h-full bg-white dark:bg-gray-900">
				{/* Debug info */}
				<div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-200 dark:border-gray-700">
					Tree: {treeData.length} items |{" "}
					{appInfo?.development_mode ? "Dev" : "Prod"}
				</div>
				{/* Drag Debug Overlay */}
				{dragDebugInfo.length > 0 && (
					<div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900 border-b border-yellow-200 dark:border-yellow-700">
						<div className="text-xs font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
							Drag & Drop Debug:
						</div>
						{dragDebugInfo.map((info, idx) => (
							<div
								key={idx}
								className="text-xs text-yellow-700 dark:text-yellow-300 font-mono"
							>
								{info}
							</div>
						))}
						<button
							onClick={() => setDragDebugInfo([])}
							className="mt-1 text-xs text-yellow-600 dark:text-yellow-400 hover:underline"
						>
							Clear
						</button>
					</div>
				)}
				<div className="flex-1 overflow-hidden" style={{ minHeight: "400px" }}>
					{width && height && (
						<Tree
							ref={treeRef}
							data={treeData}
							openByDefault={true}
							width={width}
							height={height}
							indent={20}
							rowHeight={20}
							selection={selectedId}
							selectionFollowsFocus={false}
							disableEdit={false}
							disableDrag={false}
							disableDrop={false}
							padding={25}
							searchTerm=""
							searchMatch={(node, term) =>
								node.data.name.toLowerCase().includes(term.toLowerCase())
							}
							className="[&_*]:!outline-none [&_*]:!outline-offset-0 h-full"
							onSelect={(nodes) => setSelectedId(nodes[0]?.id)}
							onActivate={handleActivate}
							onRename={handleRename}
							onMove={handleMove}
							renderCursor={CustomCursor}
						>
							{(props) => (
								<TreeNode {...props} onContextMenu={handleTreeContextMenu} />
							)}
						</Tree>
					)}
				</div>
			</div>
			<ContextMenu data={contextMenu} onClose={hideContextMenu} />
		</>
	);
}
