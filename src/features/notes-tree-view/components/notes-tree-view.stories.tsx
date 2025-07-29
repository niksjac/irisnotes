import type { Meta, StoryObj } from '@storybook/react';
import { NotesTreeView } from './notes-tree-view';
import type { NotesTreeViewProps } from '../types';

const meta: Meta<typeof NotesTreeView> = {
	title: 'Components/NotesTreeView',
	component: NotesTreeView,
	parameters: {
		layout: 'padded',
	},
	argTypes: {
		tree: {
			description: 'Tree structure with notes and categories',
		},
		selectedNodeId: {
			control: 'text',
			description: 'ID of currently selected node',
		},
		searchQuery: {
			control: 'text',
			description: 'Search query to filter notes',
		},
	},
};

export default meta;
type Story = StoryObj<NotesTreeViewProps>;

const defaultProps: NotesTreeViewProps = {
	tree: [],
	selectedNodeId: null,
	onNodeSelect: (nodeId: string, type: 'note' | 'category') => {
		console.log('Node selected:', nodeId, type);
	},
	onNoteSelect: (noteId: string) => {
		console.log('Note selected:', noteId);
	},
	onFolderSelect: (folderId: string) => {
		console.log('Folder selected:', folderId);
	},
	onTitleChange: (noteId: string, title: string) => {
		console.log('Title changed:', noteId, title);
	},
	onCreateNote: (parentCategoryId?: string) => {
		console.log('Create note:', parentCategoryId);
	},
	onDeleteNote: (noteId: string) => {
		console.log('Delete note:', noteId);
	},
	onRenameNote: (noteId: string, newTitle: string) => {
		console.log('Rename note:', noteId, newTitle);
	},
};

export const Empty: Story = {
	args: defaultProps,
};

export const BasicUsage: Story = {
	args: defaultProps,
};

export const WithSelection: Story = {
	args: {
		...defaultProps,
		selectedNodeId: 'note-1',
	},
};

export const WithSearch: Story = {
	args: {
		...defaultProps,
		searchQuery: 'project',
	},
};

export const Interactive: Story = {
	render: () => {
		return (
			<div className='h-96 w-80 border border-gray-300 dark:border-gray-600'>
				<NotesTreeView {...defaultProps} />
			</div>
		);
	},
};
