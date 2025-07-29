import { EditorContainer } from '@/features/editor/components/editor-container';
import type { Note } from '@/types/database';

interface EditorRichViewProps {
	note: Note | null;
	onNoteContentChange: (noteId: string, content: string) => void;
	onNoteTitleChange: (noteId: string, title: string) => void;
	toolbarVisible?: boolean;
}

export function EditorRichView({
	note,
	onNoteContentChange,
	onNoteTitleChange,
	toolbarVisible = true,
}: EditorRichViewProps) {
	if (!note) {
		return (
			<div className='flex items-center justify-center h-full text-gray-500 dark:text-gray-400 italic'>
				<p>No note selected</p>
			</div>
		);
	}

	return (
		<div className='flex flex-col h-full bg-white dark:bg-gray-900'>
			{/* Note Title */}
			<div className='flex-shrink-0 p-4 border-b border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800'>
				<input
					className='w-full bg-transparent border-none text-lg font-semibold text-gray-900 dark:text-gray-100 py-2 focus:outline-none focus:border-b-2 focus:border-blue-500'
					type='text'
					value={note.title}
					onChange={e => onNoteTitleChange(note.id, e.target.value)}
					placeholder='Untitled Note'
				/>
			</div>

			{/* Rich Editor */}
			<div className='flex-1 overflow-hidden relative'>
				<EditorContainer
					content={note.content}
					onChange={content => onNoteContentChange(note.id, content)}
					placeholder='Start writing your note...'
					defaultView='rich'
					toolbarVisible={toolbarVisible}
				/>
			</div>
		</div>
	);
}
