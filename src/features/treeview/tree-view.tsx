import { useState } from 'react';
import { Tree } from 'react-arborist';
import useResizeObserver from 'use-resize-observer';
import { TreeNode } from './tree-node';
import { useTreeData } from './hooks';
import { useNotesSelection } from '../notes/hooks';
import type { PaneId } from '@/types';

interface TreeViewProps {
	isDualPaneMode?: boolean;
	activePaneId?: PaneId | null;
}

export function TreeView({ isDualPaneMode = false, activePaneId }: TreeViewProps) {
	const { treeData, isLoading, error } = useTreeData();
	const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
	const { ref, width, height } = useResizeObserver();
	const { setSelectedNoteId, openNoteInPane } = useNotesSelection();

	// Loading state
	if (isLoading) {
		return (
			<div
				ref={ref}
				className='flex flex-col h-full bg-white dark:bg-gray-900'
			>
				<div className='flex items-center justify-center h-full'>
					<div className='text-center'>
						<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2'></div>
						<p className='text-sm text-gray-500 dark:text-gray-400'>Loading notes...</p>
					</div>
				</div>
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div
				ref={ref}
				className='flex flex-col h-full bg-white dark:bg-gray-900'
			>
				<div className='flex items-center justify-center h-full'>
					<div className='text-center text-red-500 dark:text-red-400'>
						<p className='text-sm'>Failed to load tree data</p>
						<p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>{error}</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div
			ref={ref}
			className='flex flex-col h-full bg-white dark:bg-gray-900'
		>
			<div className='flex-1 overflow-hidden'>
				{width && height && (
					<Tree
						data={treeData}
						openByDefault={true}
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
							// Handle note selection for the appropriate pane
							if (node.data.type === 'note') {
								if (isDualPaneMode && activePaneId) {
									openNoteInPane(node.data.id, activePaneId);
								} else {
									setSelectedNoteId(node.data.id);
								}
							}
							console.log('Activated node:', node.data.name, 'type:', node.data.type);
						}}
						onFocus={node => {
							console.log('Focused node:', node.data.name, 'type:', node.data.type);
						}}
					>
						{TreeNode}
					</Tree>
				)}
			</div>
		</div>
	);
}
