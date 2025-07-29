import type { Note, Category } from '../../types/database';

export interface TreeNode {
	id: string;
	name: string;
	type: 'note' | 'category';
	children?: TreeNode[];
	data?: Note | Category;
	parent?: string | null;
}

export interface NotesTreeViewProps {
	tree: TreeNode[] | null;
	selectedNodeId: string | null;
	onNodeSelect: (nodeId: string, type: 'note' | 'category') => void;
	onNoteSelect: (noteId: string) => void;
	onFolderSelect: (folderId: string) => void;
	onTitleChange: (noteId: string, title: string) => void;
	onCreateNote: (parentCategoryId?: string) => void;
	onDeleteNote: (noteId: string) => void;
	onRenameNote: (noteId: string, newTitle: string) => void;
	searchQuery?: string;
}
