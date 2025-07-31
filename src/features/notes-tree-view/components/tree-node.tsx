import { ChevronDown, ChevronRight, FileText, Folder, Plus } from 'lucide-react';
import React, { useState } from 'react';
import type { TreeNode as TreeNodeType } from '../types';

interface TreeNodeProps {
	node: any;
	style: React.CSSProperties;
	dragHandle: (el: HTMLDivElement | null) => void;
	navigatedItemId: string | null;
	selectedItemId: string | null;
	selectedNoteId: string | null;
	expandedNodes: Set<string>;
	editingItemId: string | null;
	setEditingItemId: (id: string | null) => void;
	nodeRefsMap: React.MutableRefObject<Map<string, { startEditing: () => void }>>;
	onItemSelect: (id: string, type: 'note' | 'category') => void;
	onNoteSelect: (id: string) => void;
	toggleNodeExpansion: (id: string) => void;
	onRenameNote: (id: string, name: string) => void;
	onRenameCategory: (id: string, name: string) => void;
	onCreateNote: (id: string) => void;
	onCreateFolder: (id: string) => void;
}

export const TreeNode: React.FC<TreeNodeProps> = ({
	node,
	style,
	dragHandle,
	navigatedItemId,
	selectedItemId,
	selectedNoteId,
	expandedNodes,
	editingItemId,
	setEditingItemId,
	nodeRefsMap,
	onItemSelect,
	onNoteSelect,
	toggleNodeExpansion,
	onRenameNote,
	onRenameCategory,
	onCreateNote,
	onCreateFolder,
}) => {
	const nodeData = node.data as TreeNodeType;
	const [isEditing, setIsEditing] = useState(false);
	const [editValue, setEditValue] = useState(nodeData.name);
	const isFocused = navigatedItemId === nodeData.id;
	const isOpen = nodeData.type === 'note' && selectedNoteId === nodeData.id;

	React.useEffect(() => {
		const nodeRef = {
			startEditing: () => {
				setIsEditing(true);
				setEditValue(nodeData.name);
			},
		};
		nodeRefsMap.current.set(nodeData.id, nodeRef);
		const refMap = nodeRefsMap.current;

		return () => {
			refMap.delete(nodeData.id);
		};
	}, [nodeData.id, nodeData.name, nodeRefsMap]);

	React.useEffect(() => {
		if (editingItemId === nodeData.id) {
			setIsEditing(true);
			setEditValue(nodeData.name);
			setTimeout(() => setEditingItemId(null), 0);
		}
	}, [editingItemId, nodeData.id, nodeData.name, setEditingItemId]);

	const handleDoubleClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		setIsEditing(true);
		setEditValue(nodeData.name);
	};

	const handleEditSubmit = () => {
		if (editValue.trim() && editValue !== nodeData.name) {
			if (nodeData.type === 'note') {
				onRenameNote(nodeData.id, editValue.trim());
			} else {
				onRenameCategory(nodeData.id, editValue.trim());
			}
		}
		setIsEditing(false);
	};

	const handleEditCancel = () => {
		setIsEditing(false);
		setEditValue(nodeData.name);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleEditSubmit();
		} else if (e.key === 'Escape') {
			handleEditCancel();
		}
	};

	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!isEditing) {
			onItemSelect(nodeData.id, nodeData.type);
			if (nodeData.type === 'note') {
				onNoteSelect(nodeData.id);
			}
		}
	};

	const handleToggle = (e: React.MouseEvent) => {
		e.stopPropagation();
		toggleNodeExpansion(nodeData.id);
	};

	const hasChildren = node.children && node.children.length > 0;
	const isExpanded = nodeData.type === 'category' ? expandedNodes.has(nodeData.id) : false;

	return (
		<div
			ref={dragHandle}
			style={style}
			className={`flex items-center justify-between px-2 py-1 my-0.5 rounded cursor-pointer transition-all duration-200 relative hover:bg-gray-200 dark:hover:bg-gray-700 ${selectedItemId === nodeData.id ? 'outline-2 outline-blue-500 outline-offset-[-2px]' : ''} ${nodeData.type === 'category' ? 'font-medium' : ''} ${isFocused ? 'outline-2 outline-blue-500 outline-offset-[-2px] bg-gray-200 dark:bg-gray-700' : ''} ${isOpen ? 'text-green-500 font-bold' : ''}`}
			onClick={handleClick}
			onDoubleClick={handleDoubleClick}
		>
			<div className='flex items-center gap-1 flex-1 min-w-0'>
				{nodeData.type === 'category' && (
					<div
						className='flex items-center justify-center w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0 transition-colors duration-200 hover:text-gray-900 dark:hover:text-gray-100'
						onClick={handleToggle}
						style={{
							opacity: hasChildren ? 1 : 0.3,
							cursor: hasChildren ? 'pointer' : 'default',
						}}
					>
						{hasChildren ? (
							isExpanded ? (
								<ChevronDown size={14} />
							) : (
								<ChevronRight size={14} />
							)
						) : (
							<ChevronRight size={14} />
						)}
					</div>
				)}
				{nodeData.type === 'note' && (
					<div
						className='flex items-center justify-center w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0'
						style={{ opacity: 0 }}
					>
						<ChevronRight size={14} />
					</div>
				)}
				<div
					className={`flex items-center justify-center w-5 h-5 flex-shrink-0 ${nodeData.type === 'category' ? 'text-blue-500' : 'text-gray-600 dark:text-gray-400'} ${selectedItemId === nodeData.id ? 'text-blue-500' : ''} ${isOpen && nodeData.type === 'note' ? 'text-green-500' : ''}`}
				>
					{nodeData.type === 'category' ? <Folder size={16} /> : <FileText size={16} />}
				</div>
				{isEditing ? (
					<input
						type='text'
						value={editValue}
						onChange={e => setEditValue(e.target.value)}
						onBlur={handleEditSubmit}
						onKeyDown={handleKeyDown}
						autoFocus
						className='flex-1 px-1 py-0.5 border border-blue-500 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs font-mono outline-none'
					/>
				) : (
					<span
						className={`text-xs font-mono whitespace-nowrap overflow-hidden text-ellipsis min-w-0 ${isOpen && nodeData.type === 'note' ? 'text-green-500 font-bold' : 'text-gray-900 dark:text-gray-100'}`}
					>
						{nodeData.name}
					</span>
				)}
			</div>
			<div className='flex gap-0.5 opacity-100 transition-opacity duration-200 items-center'>
				{nodeData.type === 'category' && (
					<>
						<button
							className='flex items-center justify-center w-5 h-5 border-none rounded-sm bg-transparent text-gray-600 dark:text-gray-400 cursor-pointer transition-all duration-200 hover:bg-gray-300 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-gray-100'
							onClick={e => {
								e.stopPropagation();
								onCreateNote(nodeData.id);
							}}
							title='Add note'
						>
							<Plus size={12} />
						</button>
						<button
							className='flex items-center justify-center w-5 h-5 border-none rounded-sm bg-transparent text-gray-600 dark:text-gray-400 cursor-pointer transition-all duration-200 hover:bg-gray-300 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-gray-100'
							onClick={e => {
								e.stopPropagation();
								onCreateFolder(nodeData.id);
							}}
							title='Add folder'
						>
							<Folder size={12} />
						</button>
					</>
				)}
			</div>
		</div>
	);
};
