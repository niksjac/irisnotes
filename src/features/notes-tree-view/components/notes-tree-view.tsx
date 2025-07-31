import { useRef } from 'react';
import { cn } from '@/shared/utils/cn';
import type { NotesTreeViewProps } from '../types';
import { TreeContainer } from './tree-container';
import { TreeHeader } from './tree-header';

export function NotesTreeView({ tree, selectedNodeId, onNodeSelect, onNoteSelect }: NotesTreeViewProps) {
	const containerRef = useRef<HTMLDivElement>(null);

	const handleContainerClick = () => {
		// Handle container click if needed
	};

	const handleContainerFocus = () => {
		// Handle container focus if needed
	};

	return (
		<div
			ref={containerRef}
			className={cn('flex flex-col h-full overflow-hidden outline-none')}
			tabIndex={0}
			onClick={handleContainerClick}
			onFocus={handleContainerFocus}
		>
			<TreeHeader
				hoistedFolder={null}
				handleExitHoist={() => {}}
				selectedItemType={null}
				handleHoistFolder={() => {}}
				allExpanded={false}
				handleToggleExpandAll={() => {}}
				sortAlphabetically={false}
				handleToggleSort={() => {}}
				handleDeleteSelected={() => {}}
				selectedItemId={selectedNodeId || null}
				onCreateNote={() => {}}
				onCreateFolder={() => {}}
			/>

			<TreeContainer
				treeData={tree || []}
				treeState={null}
				selectedItemId={selectedNodeId}
				selectedNoteId={null}
				nodeRefsMap={{ current: new Map() }}
				onItemSelect={onNodeSelect}
				onNoteSelect={onNoteSelect}
				toggleNodeExpansion={() => {}}
				onRenameNote={() => {}}
				onRenameCategory={() => {}}
				onCreateNote={() => {}}
				onCreateFolder={() => {}}
				onMove={() => {}}
				setTreeHeight={() => {}}
				setEditingItemId={() => {}}
			/>
		</div>
	);
}
