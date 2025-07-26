import { useState, useCallback } from 'react';
import { EditorContainer } from './editor-container';
import { Note } from '../../../types';
import type { PaneId } from '@/hooks';

interface DualPaneEditorProps {
	leftNote: Note | null;
	rightNote: Note | null;
	activePaneId: PaneId;
	onNoteContentChange: (noteId: string, content: string) => void;
	onNoteTitleChange: (noteId: string, title: string) => void;
	onPaneClick: (paneId: PaneId) => void;
	toolbarVisible?: boolean;
}

export function DualPaneEditor({
	leftNote,
	rightNote,
	activePaneId,
	onNoteContentChange,
	onNoteTitleChange,
	onPaneClick,
	toolbarVisible = true,
}: DualPaneEditorProps) {
	const [leftPaneWidth, setLeftPaneWidth] = useState(50); // percentage

	const handleResize = useCallback((e: React.MouseEvent) => {
		e.preventDefault();

		const handleMouseMove = (e: MouseEvent) => {
			const container = document.querySelector('.dual-pane-container');
			if (!container) return;

			const containerRect = container.getBoundingClientRect();
			const newWidth =
				((e.clientX - containerRect.left) / containerRect.width) * 100;
			const clampedWidth = Math.max(20, Math.min(80, newWidth));
			setLeftPaneWidth(clampedWidth);
		};

		const handleMouseUp = () => {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
	}, []);

	return (
		<div className='dual-pane-container flex h-full w-full bg-gray-50 dark:bg-gray-900'>
			{/* Left Pane */}
			<div
				className={`flex flex-col h-full bg-gray-50 dark:bg-gray-900 border-2 border-transparent transition-colors duration-200 hover:border-gray-300 dark:hover:border-gray-600 ${activePaneId === 'left' ? 'border-blue-500' : ''}`}
				style={{ width: `${leftPaneWidth}%` }}
				onClick={() => onPaneClick('left')}
			>
				<div className='flex-shrink-0 p-4 border-b border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800'>
					{leftNote && (
						<input
							className='w-full bg-transparent border-none text-lg font-semibold text-gray-900 dark:text-gray-100 py-2 focus:outline-none focus:border-b-2 focus:border-blue-500'
							type='text'
							value={leftNote.title}
							onChange={e => onNoteTitleChange(leftNote.id, e.target.value)}
							placeholder='Untitled Note'
							onClick={e => e.stopPropagation()}
						/>
					)}
				</div>
				<div className='flex-1 overflow-hidden relative'>
					{leftNote ? (
						<EditorContainer
							content={leftNote.content}
							onChange={content => onNoteContentChange(leftNote.id, content)}
							placeholder='Start writing your note...'
							toolbarVisible={toolbarVisible}
						/>
					) : (
						<div className='flex items-center justify-center h-full text-gray-500 dark:text-gray-400 italic'>
							<p>No note selected</p>
						</div>
					)}
				</div>
			</div>

			{/* Resize Handle */}
			<div
				className='w-1 bg-gray-300 dark:bg-gray-600 cursor-col-resize transition-colors duration-200 flex-shrink-0 hover:bg-blue-500 active:bg-blue-500'
				onMouseDown={handleResize}
			/>

			{/* Right Pane */}
			<div
				className={`flex flex-col h-full bg-gray-50 dark:bg-gray-900 border-2 border-transparent transition-colors duration-200 hover:border-gray-300 dark:hover:border-gray-600 ${activePaneId === 'right' ? 'border-blue-500' : ''}`}
				style={{ width: `${100 - leftPaneWidth}%` }}
				onClick={() => onPaneClick('right')}
			>
				<div className='flex-shrink-0 p-4 border-b border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800'>
					{rightNote && (
						<input
							className='w-full bg-transparent border-none text-lg font-semibold text-gray-900 dark:text-gray-100 py-2 focus:outline-none focus:border-b-2 focus:border-blue-500'
							type='text'
							value={rightNote.title}
							onChange={e => onNoteTitleChange(rightNote.id, e.target.value)}
							placeholder='Untitled Note'
							onClick={e => e.stopPropagation()}
						/>
					)}
				</div>
				<div className='flex-1 overflow-hidden relative'>
					{rightNote ? (
						<EditorContainer
							content={rightNote.content}
							onChange={content => onNoteContentChange(rightNote.id, content)}
							placeholder='Start writing your note...'
							toolbarVisible={toolbarVisible}
						/>
					) : (
						<div className='flex items-center justify-center h-full text-gray-500 dark:text-gray-400 italic'>
							<p>No note selected</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
