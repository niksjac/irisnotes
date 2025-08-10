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
		const baseClasses = "flex items-center gap-2 h-9 px-2 cursor-pointer transition-colors";

		if (node.isSelected) {
			return `${baseClasses} bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100`;
		}

		if (node.isFocused) {
			return `${baseClasses} bg-gray-200 dark:bg-gray-700 ring-2 ring-blue-500 ring-inset`;
		}

		if (node.isDragging) {
			return `${baseClasses} opacity-50 bg-gray-100 dark:bg-gray-800`;
		}

		return `${baseClasses} hover:bg-gray-100 dark:hover:bg-gray-800`;
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
