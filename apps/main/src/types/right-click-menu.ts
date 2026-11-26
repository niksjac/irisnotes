// Right-click menu types for the application
import type { EditorView } from "prosemirror-view";

export interface MenuItem {
	id: string;
	label: string;
	icon?: React.ComponentType<{ className?: string }>;
	action: () => void | Promise<void>;
	disabled?: boolean;
	separator?: boolean;
	shortcut?: string;
}

export interface MenuGroup {
	id: string;
	items: MenuItem[];
}

export interface RightClickMenuPosition {
	x: number;
	y: number;
}

export interface RightClickMenuData {
	targetId?: string;
	targetType?: "note" | "book" | "section" | "editor" | "general" | "tree";
	position: RightClickMenuPosition;
	menuGroups: MenuGroup[];
}

// Data types for different areas of the app
export type TreeRightClickData = {
	nodeId: string;
	nodeType: "note" | "book" | "section";
	nodeName: string;
};

export type EditorRightClickData = {
	noteId?: string;
	selectedText?: string;
	hasSelection: boolean;
	/** The rich editor that was clicked; enables the line commands */
	editorView?: EditorView;
};

export type RightClickMenuType = "tree-node" | "editor" | "general";
