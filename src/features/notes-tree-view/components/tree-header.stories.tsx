import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import type { TreeNode } from '../types';
import { TreeHeader } from './tree-header';

const meta = {
	title: 'Features/NotesTreeView/TreeHeader',
	component: TreeHeader,
	parameters: {
		layout: 'padded',
		docs: {
			description: {
				component:
					'Header component for the notes tree view with action buttons for managing notes and folders. Includes expand/collapse, sorting, hoist mode, CRUD operations, and dynamic button states based on selection.',
			},
		},
	},
	tags: ['autodocs'],
} satisfies Meta<typeof TreeHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock hoisted folder
const mockHoistedFolder: TreeNode = {
	id: 'cat-1',
	name: 'Work Documents',
	type: 'category',
	children: [],
};

// Default props
const defaultProps = {
	hoistedFolder: null,
	handleExitHoist: () => {},
	selectedItemType: null,
	handleHoistFolder: () => {},
	allExpanded: false,
	handleToggleExpandAll: () => {},
	sortAlphabetically: false,
	handleToggleSort: () => {},
	handleDeleteSelected: () => {},
	selectedItemId: null,
	onCreateNote: () => {},
	onCreateFolder: () => {},
};

// Basic States
export const Default: Story = {
	args: defaultProps,
};

export const AllExpanded: Story = {
	args: {
		...defaultProps,
		allExpanded: true,
	},
};

export const SortingEnabled: Story = {
	args: {
		...defaultProps,
		sortAlphabetically: true,
	},
};

export const AllExpandedAndSorted: Story = {
	args: {
		...defaultProps,
		allExpanded: true,
		sortAlphabetically: true,
	},
};

// Selection States
export const NoteSelected: Story = {
	args: {
		...defaultProps,
		selectedItemId: 'note-1',
		selectedItemType: 'note',
	},
};

export const CategorySelected: Story = {
	args: {
		...defaultProps,
		selectedItemId: 'cat-1',
		selectedItemType: 'category',
	},
};

export const CategorySelectedWithFeatures: Story = {
	args: {
		...defaultProps,
		selectedItemId: 'cat-1',
		selectedItemType: 'category',
		allExpanded: true,
		sortAlphabetically: true,
	},
};

// Hoist Mode
export const HoistMode: Story = {
	args: {
		...defaultProps,
		hoistedFolder: mockHoistedFolder,
	},
};

export const HoistModeWithSelection: Story = {
	args: {
		...defaultProps,
		hoistedFolder: mockHoistedFolder,
		selectedItemId: 'cat-2',
		selectedItemType: 'category',
	},
};

export const HoistModeWithAllFeatures: Story = {
	args: {
		...defaultProps,
		hoistedFolder: mockHoistedFolder,
		selectedItemId: 'cat-2',
		selectedItemType: 'category',
		allExpanded: true,
		sortAlphabetically: true,
	},
};

// Interactive Examples
export const InteractiveHeader: Story = {
	args: defaultProps,
	render: () => {
		const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
		const [selectedItemType, setSelectedItemType] = useState<'note' | 'category' | null>(null);
		const [hoistedFolder, setHoistedFolder] = useState<TreeNode | null>(null);
		const [allExpanded, setAllExpanded] = useState(false);
		const [sortAlphabetically, setSortAlphabetically] = useState(false);

		return (
			<div className='w-full max-w-2xl'>
				<div className='mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg'>
					<h4 className='text-sm font-semibold mb-3'>Controls</h4>
					<div className='grid grid-cols-2 gap-4'>
						<div>
							<h5 className='text-xs font-medium mb-2'>Selection</h5>
							<div className='space-y-1'>
								<button
									onClick={() => {
										setSelectedItemId('note-1');
										setSelectedItemType('note');
									}}
									className='block w-full px-2 py-1 text-xs bg-blue-500 text-white rounded'
								>
									Select Note
								</button>
								<button
									onClick={() => {
										setSelectedItemId('cat-1');
										setSelectedItemType('category');
									}}
									className='block w-full px-2 py-1 text-xs bg-purple-500 text-white rounded'
								>
									Select Category
								</button>
								<button
									onClick={() => {
										setSelectedItemId(null);
										setSelectedItemType(null);
									}}
									className='block w-full px-2 py-1 text-xs bg-gray-500 text-white rounded'
								>
									Clear Selection
								</button>
							</div>
						</div>

						<div>
							<h5 className='text-xs font-medium mb-2'>States</h5>
							<div className='space-y-1'>
								<button
									onClick={() => setHoistedFolder(hoistedFolder ? null : mockHoistedFolder)}
									className='block w-full px-2 py-1 text-xs bg-orange-500 text-white rounded'
								>
									{hoistedFolder ? 'Exit Hoist' : 'Enter Hoist'}
								</button>
								<button
									onClick={() => setAllExpanded(!allExpanded)}
									className='block w-full px-2 py-1 text-xs bg-green-500 text-white rounded'
								>
									Toggle Expand
								</button>
								<button
									onClick={() => setSortAlphabetically(!sortAlphabetically)}
									className='block w-full px-2 py-1 text-xs bg-indigo-500 text-white rounded'
								>
									Toggle Sort
								</button>
							</div>
						</div>
					</div>

					<div className='mt-3 text-xs'>
						<div>Selected: {selectedItemId ? `${selectedItemType} (${selectedItemId})` : 'None'}</div>
						<div>Hoist: {hoistedFolder ? hoistedFolder.name : 'None'}</div>
						<div>Expanded: {allExpanded ? 'All' : 'Some'}</div>
						<div>Sort: {sortAlphabetically ? 'Alphabetical' : 'Default'}</div>
					</div>
				</div>

				<TreeHeader
					hoistedFolder={hoistedFolder}
					handleExitHoist={() => setHoistedFolder(null)}
					selectedItemType={selectedItemType}
					handleHoistFolder={() => {
						if (selectedItemType === 'category') {
							setHoistedFolder(mockHoistedFolder);
						}
					}}
					allExpanded={allExpanded}
					handleToggleExpandAll={() => setAllExpanded(!allExpanded)}
					sortAlphabetically={sortAlphabetically}
					handleToggleSort={() => setSortAlphabetically(!sortAlphabetically)}
					handleDeleteSelected={() => {
						console.log('Delete selected:', selectedItemId);
						setSelectedItemId(null);
						setSelectedItemType(null);
					}}
					selectedItemId={selectedItemId}
					onCreateNote={() => console.log('Create note')}
					onCreateFolder={() => console.log('Create folder')}
				/>
			</div>
		);
	},
	parameters: {
		docs: {
			description: {
				story:
					'Interactive header demonstrating all possible states and transitions. Use the controls to change selection, hoist mode, expansion, and sorting states.',
			},
		},
	},
};

// Button State Combinations
export const AllButtonStates: Story = {
	args: defaultProps,
	render: () => (
		<div className='space-y-6'>
			<div>
				<h4 className='text-sm font-semibold mb-3'>Expansion States</h4>
				<div className='space-y-2'>
					<div>
						<div className='text-xs text-gray-600 mb-1'>Not Expanded</div>
						<TreeHeader
							{...defaultProps}
							allExpanded={false}
						/>
					</div>
					<div>
						<div className='text-xs text-gray-600 mb-1'>All Expanded</div>
						<TreeHeader
							{...defaultProps}
							allExpanded={true}
						/>
					</div>
				</div>
			</div>

			<div>
				<h4 className='text-sm font-semibold mb-3'>Sorting States</h4>
				<div className='space-y-2'>
					<div>
						<div className='text-xs text-gray-600 mb-1'>Default Sort</div>
						<TreeHeader
							{...defaultProps}
							sortAlphabetically={false}
						/>
					</div>
					<div>
						<div className='text-xs text-gray-600 mb-1'>Alphabetical Sort</div>
						<TreeHeader
							{...defaultProps}
							sortAlphabetically={true}
						/>
					</div>
				</div>
			</div>

			<div>
				<h4 className='text-sm font-semibold mb-3'>Selection States</h4>
				<div className='space-y-2'>
					<div>
						<div className='text-xs text-gray-600 mb-1'>No Selection</div>
						<TreeHeader {...defaultProps} />
					</div>
					<div>
						<div className='text-xs text-gray-600 mb-1'>Note Selected</div>
						<TreeHeader
							{...defaultProps}
							selectedItemId='note-1'
							selectedItemType='note'
						/>
					</div>
					<div>
						<div className='text-xs text-gray-600 mb-1'>Category Selected (shows hoist button)</div>
						<TreeHeader
							{...defaultProps}
							selectedItemId='cat-1'
							selectedItemType='category'
						/>
					</div>
				</div>
			</div>

			<div>
				<h4 className='text-sm font-semibold mb-3'>Hoist Mode</h4>
				<div className='space-y-2'>
					<div>
						<div className='text-xs text-gray-600 mb-1'>Normal Mode</div>
						<TreeHeader {...defaultProps} />
					</div>
					<div>
						<div className='text-xs text-gray-600 mb-1'>Hoist Mode</div>
						<TreeHeader
							{...defaultProps}
							hoistedFolder={mockHoistedFolder}
						/>
					</div>
					<div>
						<div className='text-xs text-gray-600 mb-1'>Hoist Mode with Selection</div>
						<TreeHeader
							{...defaultProps}
							hoistedFolder={mockHoistedFolder}
							selectedItemId='cat-2'
							selectedItemType='category'
						/>
					</div>
				</div>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: 'Comparison of all possible button states and combinations.',
			},
		},
	},
};

// Action Testing
export const ActionLogger: Story = {
	args: defaultProps,
	render: () => {
		const [logs, setLogs] = useState<string[]>([]);

		const addLog = (action: string) => {
			setLogs(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${action}`]);
		};

		return (
			<div className='w-full max-w-lg'>
				<TreeHeader
					hoistedFolder={null}
					handleExitHoist={() => addLog('Exit hoist')}
					selectedItemType='category'
					handleHoistFolder={() => addLog('Hoist folder')}
					allExpanded={false}
					handleToggleExpandAll={() => addLog('Toggle expand all')}
					sortAlphabetically={false}
					handleToggleSort={() => addLog('Toggle sort')}
					handleDeleteSelected={() => addLog('Delete selected')}
					selectedItemId='cat-1'
					onCreateNote={() => addLog('Create note')}
					onCreateFolder={() => addLog('Create folder')}
				/>

				<div className='mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg'>
					<h4 className='text-sm font-semibold mb-2'>Action Log</h4>
					<div className='space-y-1 text-xs font-mono'>
						{logs.length === 0 ? (
							<div className='text-gray-500'>Click buttons to see actions...</div>
						) : (
							logs.map((log, index) => (
								<div
									key={index}
									className='text-gray-700 dark:text-gray-300'
								>
									{log}
								</div>
							))
						)}
					</div>
				</div>
			</div>
		);
	},
	parameters: {
		docs: {
			description: {
				story: 'Interactive header with action logging. Click any button to see the action logged below.',
			},
		},
	},
};

// Edge Cases
export const EdgeCases: Story = {
	args: defaultProps,
	render: () => (
		<div className='space-y-6'>
			<div>
				<h4 className='text-sm font-semibold mb-3'>Edge Cases</h4>
				<div className='space-y-4'>
					<div>
						<div className='text-xs text-gray-600 mb-1'>Empty Hoist Folder Name</div>
						<TreeHeader
							{...defaultProps}
							hoistedFolder={{
								id: 'empty',
								name: '',
								type: 'category',
								children: [],
							}}
						/>
					</div>

					<div>
						<div className='text-xs text-gray-600 mb-1'>Very Long Hoist Folder Name</div>
						<TreeHeader
							{...defaultProps}
							hoistedFolder={{
								id: 'long',
								name: 'This is a very long folder name that might cause layout issues',
								type: 'category',
								children: [],
							}}
						/>
					</div>

					<div>
						<div className='text-xs text-gray-600 mb-1'>All Features Active</div>
						<TreeHeader
							{...defaultProps}
							hoistedFolder={mockHoistedFolder}
							selectedItemId='cat-1'
							selectedItemType='category'
							allExpanded={true}
							sortAlphabetically={true}
						/>
					</div>
				</div>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: 'Edge cases and stress testing for the header component.',
			},
		},
	},
};
