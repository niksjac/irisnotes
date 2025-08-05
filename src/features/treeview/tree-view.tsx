import { useState } from 'react';
import { Tree } from 'react-arborist';
import { ChevronRight, FileText, Folder } from 'lucide-react';
import useResizeObserver from 'use-resize-observer';

interface TreeNode {
	id: string;
	name: string;
	children?: TreeNode[];
}

// Clean node component matching app design
function Node({ node, style, dragHandle }: any) {
	const isFolder = node.isInternal;
	const isExpanded = node.isOpen;

	return (
		<div
			ref={dragHandle}
			style={style}
			className='flex items-center gap-2 py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors'
			onClick={() => node.toggle()}
		>
			{isFolder && (
				<ChevronRight
					className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
				/>
			)}

			{!isFolder && <div className='w-4' />}

			{isFolder ? (
				<Folder className='h-4 w-4 text-blue-500 dark:text-blue-400' />
			) : (
				<FileText className='h-4 w-4 text-gray-500 dark:text-gray-400' />
			)}

			<span className='flex-1 truncate text-sm text-gray-900 dark:text-gray-100'>{node.data.name}</span>
		</div>
	);
}

// Mock data for initial testing
const sampleData: TreeNode[] = [
	{
		id: '1',
		name: 'Documents',
		children: [
			{ id: '2', name: 'Meeting Notes.md' },
			{ id: '3', name: 'Project Ideas.md' },
		],
	},
	{
		id: '4',
		name: 'Projects',
		children: [
			{
				id: '5',
				name: 'Web Development',
				children: [
					{ id: '6', name: 'React Tutorial.md' },
					{ id: '7', name: 'CSS Tips.md' },
				],
			},
			{ id: '8', name: 'Personal.md' },
		],
	},
	{ id: '9', name: 'Quick Note.md' },
];

export function TreeView() {
	const [data] = useState<TreeNode[]>(sampleData);
	const { ref, width, height } = useResizeObserver();

	return (
		<div
			ref={ref}
			className='flex flex-col h-full bg-white dark:bg-gray-900'
		>
			<div className='flex-1 overflow-hidden'>
				{width && height && (
					<Tree
						data={data}
						openByDefault={false}
						width={width}
						height={height}
						indent={16}
					>
						{Node}
					</Tree>
				)}
			</div>
		</div>
	);
}
