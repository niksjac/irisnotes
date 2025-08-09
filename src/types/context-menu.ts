// Context menu types for the application
export interface MenuItem {
	id: string;
	label: string;
	icon?: React.ComponentType<{ className?: string }>;
	action: () => void;
	disabled?: boolean;
	separator?: boolean;
	shortcut?: string;
}

export interface MenuGroup {
	id: string;
	items: MenuItem[];
}

export interface ContextMenuPosition {
	x: number;
	y: number;
}

export interface ContextMenuData {
	targetId?: string;
	targetType?: "note" | "category" | "editor" | "general";
	position: ContextMenuPosition;
	menuGroups: MenuGroup[];
}

// Context types for different areas of the app
export type TreeContextData = {
	nodeId: string;
	nodeType: "note" | "category";
	nodeName: string;
};

export type EditorContextData = {
	noteId?: string;
	selectedText?: string;
	hasSelection: boolean;
};

export type ContextMenuType = "tree-node" | "editor" | "general";
