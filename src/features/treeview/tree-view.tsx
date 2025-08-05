import { useState } from 'react';
import { Tree } from 'react-arborist';
import useResizeObserver from 'use-resize-observer';
import { TreeNode } from './tree-node';

interface TreeData {
	id: string;
	name: string;
	children?: TreeData[];
}

// Mock data for initial testing
const sampleData: TreeData[] = [
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
	const [data] = useState<TreeData[]>(sampleData);
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
						{TreeNode}
					</Tree>
				)}
			</div>
		</div>
	);
}
