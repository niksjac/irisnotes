import { FileText, FolderPlus, BookOpen } from 'lucide-react';
import { useNotesActions, useNotesStorage, useCategoryManagement } from '@/features/notes/hooks';
import { useNotesData } from '@/features/notes/hooks';
import type { PaneId } from '@/atoms';

interface WelcomeViewProps {
	paneId?: PaneId | undefined;
}

export function WelcomeView({ paneId }: WelcomeViewProps) {
	// Note: paneId parameter reserved for future dual-pane functionality
	void paneId;

	const { createNewNote } = useNotesActions();
	const { storageManager, isInitialized } = useNotesStorage();
	const { notes } = useNotesData();
	const { handleCreateFolder } = useCategoryManagement({
		storageManager,
		isLoading: !isInitialized,
		notesLength: notes.length,
	});

	const handleCreateNote = () => {
		createNewNote();
	};

	const handleCreateNewFolder = () => {
		handleCreateFolder();
	};

	return (
		<div className='welcome-view flex flex-col items-center justify-center h-full p-8 bg-gray-50 dark:bg-gray-900'>
			<div className='text-center max-w-md'>
				<div className='mb-8'>
					<BookOpen
						size={64}
						className='mx-auto text-blue-500 mb-4'
					/>
					<h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2'>Welcome to IrisNotes</h1>
					<p className='text-gray-600 dark:text-gray-400 text-lg'>
						Your intelligent note-taking companion. Start by creating your first note or organizing with folders.
					</p>
				</div>

				<div className='space-y-4'>
					<button
						onClick={handleCreateNote}
						className='w-full flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium'
					>
						<FileText size={20} />
						Create Your First Note
					</button>

					<button
						onClick={handleCreateNewFolder}
						className='w-full flex items-center justify-center gap-3 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors font-medium'
					>
						<FolderPlus size={20} />
						Create a Folder
					</button>
				</div>

				<div className='mt-8 text-sm text-gray-500 dark:text-gray-400'>
					<p>
						Need help getting started? Press{' '}
						<kbd className='px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs'>Ctrl+K, H</kbd> to view keyboard
						shortcuts.
					</p>
				</div>
			</div>
		</div>
	);
}
