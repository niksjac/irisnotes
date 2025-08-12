import type { TreeContextData } from "@/types/context-menu";
import { TreeNodeContent } from "./tree-node-content";
import type { TreeNodeProps } from "./types";

export function TreeNode({ node, style, dragHandle, onContextMenu }: TreeNodeProps) {
	const isFolder = node.isInternal;
	const isExpanded = node.isOpen;
	const nodeType = node.data.type;
	const isCategory = nodeType === "category";
	const isEditing = node.isEditing;

	const handleSubmit = (value: string) => {
		if (node.submit) {
			node.submit(value);
		}
	};

	const handleCancel = () => {
		if (node.reset) {
			node.reset();
		}
	};

	// Create dynamic className based on node state
	const getNodeClassName = () => {
		const baseClasses =
			"flex items-center gap-2 h-9 px-2 cursor-pointer transition-all duration-200 ease-in-out rounded-md relative";

		// Drop target highlighting (highest priority)
		if (node.willReceiveDrop || node.isDropTarget) {
			return `${baseClasses} bg-green-100 dark:bg-green-900/60 text-green-900 dark:text-green-100 ring-2 ring-green-500 ring-inset shadow-lg transform scale-[1.02] border-l-4 border-green-500`;
		}

		if (node.isDragging) {
			return `${baseClasses} opacity-40 bg-gray-100 dark:bg-gray-800 transform rotate-2 shadow-xl z-50 border border-gray-300 dark:border-gray-600`;
		}

		if (node.isSelected) {
			return `${baseClasses} bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100 border-l-4 border-blue-500`;
		}

		if (node.isFocused) {
			return `${baseClasses} bg-gray-200 dark:bg-gray-700 ring-2 ring-blue-500/50 ring-inset`;
		}

		return `${baseClasses} hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-sm`;
	};

	const handleContextMenu = (event: React.MouseEvent) => {
		if (onContextMenu) {
			const contextData: TreeContextData = {
				nodeId: node.data.id,
				nodeType: isCategory ? "category" : "note",
				nodeName: node.data.name,
			};
			onContextMenu(event, contextData);
		}
	};

	return (
		<div
			ref={dragHandle}
			style={style}
			className={getNodeClassName()}
			onClick={() => node.toggle()}
			onContextMenu={handleContextMenu}
		>
			<TreeNodeContent
				name={node.data.name}
				isFolder={isFolder}
				isExpanded={isExpanded}
				isCategory={isCategory}
				isEditing={isEditing || false}
				onSubmit={handleSubmit}
				onCancel={handleCancel}
			/>
		</div>
	);
}
