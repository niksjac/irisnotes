import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import type { Category, Note } from '../../../types/database';
import { TreeNode } from './tree-node';

const meta = {
	title: 'Features/NotesTreeView/TreeNode',
	component: TreeNode,
	parameters: {
		layout: 'padded',
		docs: {
			description: {
				component:
					'A tree node component that represents either a note or category in the notes tree view. Supports editing, drag & drop, selection states, focus management, and interactive operations.',
			},
		},
	},
	tags: ['autodocs'],
} satisfies Meta<typeof TreeNode>;

export default meta;
type Story = StoryObj<typeof meta>;

// React-arborist node structure
interface ArboristNode {
	id: string;
	data: Note | Category;
	children: ArboristNode[];
	isLeaf: boolean;
	isOpen: boolean;
	level: number;
}

// Helper to create mock note data
const createMockNote = (id: string, name: string): ArboristNode => ({
	id,
	data: {
		id,
		title: name,
		content: `<p>${name} content</p>`,
		content_type: 'html' as const,
		created_at: '2024-01-01T00:00:00Z',
		updated_at: '2024-01-01T00:00:00Z',
		is_pinned: false,
		is_archived: false,
		word_count: 2,
		character_count: name.length + 8,
		content_plaintext: `${name} content`,
	} as Note,
	children: [],
	isLeaf: true,
	isOpen: false,
	level: 0,
});

// Helper to create mock category data
const createMockCategory = (id: string, name: string, hasChildren = false): ArboristNode => ({
	id,
	data: {
		id,
		name,
		parent_id: null,
		created_at: '2024-01-01T00:00:00Z',
		updated_at: '2024-01-01T00:00:00Z',
		description: `${name} description`,
		sort_order: 0,
	} as Category,
	children: hasChildren
		? [
				{
					id: `${id}-child`,
					data: {} as Note,
					children: [],
					isLeaf: true,
					isOpen: false,
					level: 1,
				},
			]
		: [],
	isLeaf: !hasChildren,
	isOpen: false,
	level: 0,
});

// Default props
const defaultProps = {
	node: createMockNote('default-note', 'Default Note'),
	style: { height: 32 },
	dragHandle: () => {},
	navigatedItemId: null,
	selectedItemId: null,
	selectedNoteId: null,
	expandedNodes: new Set<string>(),
	editingItemId: null,
	setEditingItemId: () => {},
	nodeRefsMap: { current: new Map() } as React.MutableRefObject<Map<string, { startEditing: () => void }>>,
	onItemSelect: () => {},
	onNoteSelect: () => {},
	toggleNodeExpansion: () => {},
	onRenameNote: () => {},
	onRenameCategory: () => {},
	onCreateNote: () => {},
	onCreateFolder: () => {},
};

// Basic Note Stories
export const NoteDefault: Story = {
	args: {
		...defaultProps,
		node: createMockNote('note-1', 'Meeting Notes'),
	},
};

export const NoteSelected: Story = {
	args: {
		...defaultProps,
		node: createMockNote('note-1', 'Meeting Notes'),
		selectedItemId: 'note-1',
	},
};

export const NoteFocused: Story = {
	args: {
		...defaultProps,
		node: createMockNote('note-1', 'Meeting Notes'),
		navigatedItemId: 'note-1',
	},
};

export const NoteSelectedAndFocused: Story = {
	args: {
		...defaultProps,
		node: createMockNote('note-1', 'Meeting Notes'),
		selectedItemId: 'note-1',
		navigatedItemId: 'note-1',
	},
};

export const NoteOpen: Story = {
	args: {
		...defaultProps,
		node: createMockNote('note-1', 'Meeting Notes'),
		selectedNoteId: 'note-1',
	},
};

export const NoteEditing: Story = {
	args: {
		...defaultProps,
		node: createMockNote('note-1', 'Meeting Notes'),
		editingItemId: 'note-1',
	},
};

export const NoteLongTitle: Story = {
	args: {
		...defaultProps,
		node: createMockNote('note-1', 'This is a very long note title that should be truncated with ellipsis'),
	},
};

// Basic Category Stories
export const CategoryCollapsed: Story = {
	args: {
		...defaultProps,
		node: createMockCategory('cat-1', 'Documents', true),
	},
};

export const CategoryExpanded: Story = {
	args: {
		...defaultProps,
		node: createMockCategory('cat-1', 'Documents', true),
		expandedNodes: new Set(['cat-1']),
	},
};

export const CategoryEmpty: Story = {
	args: {
		...defaultProps,
		node: createMockCategory('cat-1', 'Empty Folder', false),
	},
};

export const CategorySelected: Story = {
	args: {
		...defaultProps,
		node: createMockCategory('cat-1', 'Documents', true),
		selectedItemId: 'cat-1',
	},
};

export const CategoryFocused: Story = {
	args: {
		...defaultProps,
		node: createMockCategory('cat-1', 'Documents', true),
		navigatedItemId: 'cat-1',
	},
};

export const CategoryEditing: Story = {
	args: {
		...defaultProps,
		node: createMockCategory('cat-1', 'Documents', true),
		editingItemId: 'cat-1',
	},
};

export const CategorySelectedAndExpanded: Story = {
	args: {
		...defaultProps,
		node: createMockCategory('cat-1', 'Documents', true),
		selectedItemId: 'cat-1',
		expandedNodes: new Set(['cat-1']),
	},
};

// Interactive Stories
export const InteractiveNote: Story = {
	args: defaultProps,
	render: () => {
		const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
		const [navigatedItemId, setNavigatedItemId] = useState<string | null>(null);
		const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
		const [editingItemId, setEditingItemId] = useState<string | null>(null);

		const nodeRefsMap = { current: new Map() };
		const node = createMockNote('note-1', 'Interactive Note');

		return (
			<div className='w-80 p-4 border rounded-lg'>
				<div className='mb-4 space-y-2 text-sm'>
					<div>
						State:{' '}
						{selectedNoteId
							? 'Open'
							: selectedItemId
								? 'Selected'
								: navigatedItemId
									? 'Focused'
									: editingItemId
										? 'Editing'
										: 'Default'}
					</div>
					<div className='flex gap-2'>
						<button
							onClick={() => {
								setSelectedItemId('note-1');
								setNavigatedItemId('note-1');
							}}
							className='px-2 py-1 bg-blue-500 text-white rounded text-xs'
						>
							Select
						</button>
						<button
							onClick={() => setSelectedNoteId('note-1')}
							className='px-2 py-1 bg-green-500 text-white rounded text-xs'
						>
							Open
						</button>
						<button
							onClick={() => setEditingItemId('note-1')}
							className='px-2 py-1 bg-orange-500 text-white rounded text-xs'
						>
							Edit
						</button>
						<button
							onClick={() => {
								setSelectedItemId(null);
								setNavigatedItemId(null);
								setSelectedNoteId(null);
								setEditingItemId(null);
							}}
							className='px-2 py-1 bg-gray-500 text-white rounded text-xs'
						>
							Reset
						</button>
					</div>
				</div>

				<TreeNode
					node={node}
					style={{ height: 32 }}
					dragHandle={() => {}}
					navigatedItemId={navigatedItemId}
					selectedItemId={selectedItemId}
					selectedNoteId={selectedNoteId}
					expandedNodes={new Set()}
					editingItemId={editingItemId}
					setEditingItemId={setEditingItemId}
					nodeRefsMap={nodeRefsMap}
					onItemSelect={(id, type) => {
						setSelectedItemId(id);
						setNavigatedItemId(id);
						console.log('Item selected:', id, type);
					}}
					onNoteSelect={id => {
						setSelectedNoteId(id);
						console.log('Note opened:', id);
					}}
					toggleNodeExpansion={() => {}}
					onRenameNote={(id, name) => {
						console.log('Note renamed:', id, name);
						setEditingItemId(null);
					}}
					onRenameCategory={() => {}}
					onCreateNote={() => {}}
					onCreateFolder={() => {}}
				/>
			</div>
		);
	},
	parameters: {
		docs: {
			description: {
				story:
					'Interactive note node demonstrating all possible states and interactions. Click buttons to change state and interact with the node.',
			},
		},
	},
};

export const InteractiveCategory: Story = {
	args: defaultProps,
	render: () => {
		const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
		const [navigatedItemId, setNavigatedItemId] = useState<string | null>(null);
		const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
		const [editingItemId, setEditingItemId] = useState<string | null>(null);

		const nodeRefsMap = { current: new Map() };
		const node = createMockCategory('cat-1', 'Interactive Category', true);

		const toggleExpansion = () => {
			setExpandedNodes(prev => {
				const newSet = new Set(prev);
				if (newSet.has('cat-1')) {
					newSet.delete('cat-1');
				} else {
					newSet.add('cat-1');
				}
				return newSet;
			});
		};

		return (
			<div className='w-80 p-4 border rounded-lg'>
				<div className='mb-4 space-y-2 text-sm'>
					<div>
						State: {editingItemId ? 'Editing' : selectedItemId ? 'Selected' : navigatedItemId ? 'Focused' : 'Default'}
					</div>
					<div>Expanded: {expandedNodes.has('cat-1') ? 'Yes' : 'No'}</div>
					<div className='flex gap-2 flex-wrap'>
						<button
							onClick={() => {
								setSelectedItemId('cat-1');
								setNavigatedItemId('cat-1');
							}}
							className='px-2 py-1 bg-blue-500 text-white rounded text-xs'
						>
							Select
						</button>
						<button
							onClick={toggleExpansion}
							className='px-2 py-1 bg-purple-500 text-white rounded text-xs'
						>
							Toggle
						</button>
						<button
							onClick={() => setEditingItemId('cat-1')}
							className='px-2 py-1 bg-orange-500 text-white rounded text-xs'
						>
							Edit
						</button>
						<button
							onClick={() => {
								setSelectedItemId(null);
								setNavigatedItemId(null);
								setEditingItemId(null);
							}}
							className='px-2 py-1 bg-gray-500 text-white rounded text-xs'
						>
							Reset
						</button>
					</div>
				</div>

				<TreeNode
					node={node}
					style={{ height: 32 }}
					dragHandle={() => {}}
					navigatedItemId={navigatedItemId}
					selectedItemId={selectedItemId}
					selectedNoteId={null}
					expandedNodes={expandedNodes}
					editingItemId={editingItemId}
					setEditingItemId={setEditingItemId}
					nodeRefsMap={nodeRefsMap}
					onItemSelect={(id, type) => {
						setSelectedItemId(id);
						setNavigatedItemId(id);
						console.log('Item selected:', id, type);
					}}
					onNoteSelect={() => {}}
					toggleNodeExpansion={toggleExpansion}
					onRenameNote={() => {}}
					onRenameCategory={(id, name) => {
						console.log('Category renamed:', id, name);
						setEditingItemId(null);
					}}
					onCreateNote={() => {}}
					onCreateFolder={() => {}}
				/>
			</div>
		);
	},
	parameters: {
		docs: {
			description: {
				story:
					'Interactive category node with expansion/collapse functionality. Demonstrates all category states and interactions.',
			},
		},
	},
};

// Comparison Stories
export const AllStates: Story = {
	args: defaultProps,
	render: () => (
		<div className='space-y-4'>
			<h3 className='text-lg font-semibold'>Note States</h3>
			<div className='grid grid-cols-2 gap-4'>
				<div>
					<h4 className='text-sm font-medium mb-2'>Default Note</h4>
					<TreeNode
						{...defaultProps}
						node={createMockNote('note-1', 'Default Note')}
					/>
				</div>
				<div>
					<h4 className='text-sm font-medium mb-2'>Selected Note</h4>
					<TreeNode
						{...defaultProps}
						node={createMockNote('note-2', 'Selected Note')}
						selectedItemId='note-2'
					/>
				</div>
				<div>
					<h4 className='text-sm font-medium mb-2'>Focused Note</h4>
					<TreeNode
						{...defaultProps}
						node={createMockNote('note-3', 'Focused Note')}
						navigatedItemId='note-3'
					/>
				</div>
				<div>
					<h4 className='text-sm font-medium mb-2'>Open Note</h4>
					<TreeNode
						{...defaultProps}
						node={createMockNote('note-4', 'Open Note')}
						selectedNoteId='note-4'
					/>
				</div>
			</div>

			<h3 className='text-lg font-semibold mt-8'>Category States</h3>
			<div className='grid grid-cols-2 gap-4'>
				<div>
					<h4 className='text-sm font-medium mb-2'>Collapsed Category</h4>
					<TreeNode
						{...defaultProps}
						node={createMockCategory('cat-1', 'Collapsed', true)}
					/>
				</div>
				<div>
					<h4 className='text-sm font-medium mb-2'>Expanded Category</h4>
					<TreeNode
						{...defaultProps}
						node={createMockCategory('cat-2', 'Expanded', true)}
						expandedNodes={new Set(['cat-2'])}
					/>
				</div>
				<div>
					<h4 className='text-sm font-medium mb-2'>Selected Category</h4>
					<TreeNode
						{...defaultProps}
						node={createMockCategory('cat-3', 'Selected', true)}
						selectedItemId='cat-3'
					/>
				</div>
				<div>
					<h4 className='text-sm font-medium mb-2'>Empty Category</h4>
					<TreeNode
						{...defaultProps}
						node={createMockCategory('cat-4', 'Empty', false)}
					/>
				</div>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: 'Comparison of all possible node states side by side.',
			},
		},
	},
};
