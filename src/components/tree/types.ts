import type { MutableRefObject } from "react";
import type { TreeContextData } from "@/types";

// ============================================================================
// Tree Component Types
// ============================================================================

/**
 * Props for the main TreeView component
 */
export type TreeViewProps = Record<string, never>;

/**
 * React Arborist node shape with tree-specific data
 */
export interface TreeNodeData {
	id: string;
	name: string;
	type?: "category" | "note";
}

/**
 * React Arborist node API interface
 */
export interface TreeNodeAPI {
	id: string;
	isInternal: boolean;
	isOpen: boolean;
	isFocused: boolean;
	isSelected: boolean;
	isDragging: boolean;
	isEditing?: boolean;
	// Drop zone states for visual feedback
	willReceiveDrop?: boolean;
	isDropTarget?: boolean;
	data: TreeNodeData;
	toggle: () => void;
	edit?: () => void;
	submit?: (value: string) => void;
	reset?: () => void;
}

/**
 * Props for the TreeNode component
 */
export interface TreeNodeProps {
	node: TreeNodeAPI;
	style: React.CSSProperties;
	dragHandle?: (el: HTMLDivElement | null) => void;
	onContextMenu?: (event: React.MouseEvent, data: TreeContextData) => void;
}

// ============================================================================
// Tree Sub-Component Types
// ============================================================================

/**
 * Props for TreeNodeContent component
 */
export interface TreeNodeContentProps {
	name: string;
	isFolder: boolean;
	isExpanded: boolean;
	isCategory: boolean;
	isEditing: boolean;
	onSubmit?: (value: string) => void;
	onCancel?: () => void;
}

/**
 * Props for TreeNodeEditor component
 */
export interface TreeNodeEditorProps {
	initialValue: string;
	onSubmit: (value: string) => void;
	onCancel: () => void;
}

/**
 * Props for TreeNodeIcon component
 */
export interface TreeNodeIconProps {
	isFolder: boolean;
	isExpanded: boolean;
	isCategory: boolean;
}

// ============================================================================
// Hook Types
// ============================================================================

/**
 * Props for useTreeKeyboard hook
 */
export interface UseTreeKeyboardProps {
	treeRef: MutableRefObject<any>;
}

/**
 * Return type for useTreeRename hook
 */
export interface UseTreeRenameReturn {
	handleRename: ({ node, name }: { node: any; name: string }) => Promise<void>;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Type for tree rename operation parameters
 */
export interface TreeRenameParams {
	node: any; // React Arborist node - keeping as any due to external library
	name: string;
}
