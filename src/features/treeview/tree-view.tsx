import { useState } from 'react';
import { Tree } from 'react-arborist';
import useResizeObserver from 'use-resize-observer';
import { TreeNode } from './tree-node';
import { type TreeData, sampleData } from '@/features/treeview';

export function TreeView() {
	const [data] = useState<TreeData[]>(sampleData);
	const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
	const { ref, width, height } = useResizeObserver();

	return (
		<div
			ref={ref}
			className='flex flex-col h-full bg-white dark:bg-gray-900 border border-white'
		>
			<div className='flex-1 overflow-hidden'>
				{width && height && (
					<Tree
						data={data}
						openByDefault={false}
						width={width}
						height={height}
						indent={16}
						rowHeight={36}
						selection={selectedId}
						selectionFollowsFocus={false}
						className='[&_*]:!outline-none [&_*]:!outline-offset-0'
						onSelect={nodes => {
							setSelectedId(nodes[0]?.id);
						}}
						onActivate={node => {
							console.log('Activated node:', node.data.name);
						}}
						onFocus={node => {
							console.log('Focused node:', node.data.name);
						}}
					>
						{TreeNode}
					</Tree>
				)}
			</div>
		</div>
	);
}
