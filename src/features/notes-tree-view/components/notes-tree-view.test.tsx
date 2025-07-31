import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NotesTreeViewProps } from '../types';
import { NotesTreeView } from './notes-tree-view';

const mockProps: NotesTreeViewProps = {
	tree: [],
	selectedNodeId: null,
	onNodeSelect: vi.fn(),
	onNoteSelect: vi.fn(),
	onFolderSelect: vi.fn(),
	onTitleChange: vi.fn(),
	onCreateNote: vi.fn(),
	onDeleteNote: vi.fn(),
	onRenameNote: vi.fn(),
};

describe('NotesTreeView', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders without crashing', () => {
		render(<NotesTreeView {...mockProps} />);
		expect(screen.getByRole('tree', { hidden: true })).toBeInTheDocument();
	});

	it('handles empty tree data', () => {
		render(
			<NotesTreeView
				{...mockProps}
				tree={[]}
			/>
		);
		expect(screen.getByRole('tree', { hidden: true })).toBeInTheDocument();
	});

	it('handles search query', () => {
		render(
			<NotesTreeView
				{...mockProps}
				searchQuery='project'
			/>
		);
		expect(screen.getByRole('tree', { hidden: true })).toBeInTheDocument();
	});
});
