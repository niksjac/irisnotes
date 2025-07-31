import type React from 'react';
import { useState } from 'react';
import {
	// useNotesData,
	// useNotesSelection,
	// useNotesActions,
	// useNotesNavigation,
	useNotesInitialization,
	// useCategoryManagement,
	useNotesStorage,
	// useNotesTreeView,
} from '../../notes/hooks';
// import { ArboristNotesTree } from '../../notes-tree-view/components/arborist-notes-tree';
import { SidebarSearch } from './sidebar-search';

export const Sidebar: React.FC = () => {
	const [searchQuery, setSearchQuery] = useState('');

	// Basic notes data and actions
	// const { notes } = useNotesData();
	// const { selectedNoteId } = useNotesSelection();
	// const { storageManager, isInitialized } = useNotesStorage();
	const { isInitialized } = useNotesStorage();
	// const { openNoteInPane, setSelectedNoteId } = useNotesNavigation();
	// const { createNewNote, updateNoteTitle } = useNotesActions();

	// Initialize notes
	useNotesInitialization();

	// Category management
	// const { categories, handleCreateFolder, handleDeleteCategory, handleRenameCategory } = useCategoryManagement({
	//   storageManager,
	//   isLoading: !isInitialized,
	//   notesLength: notes.length,
	// });

	// // Basic handlers
	// const handleNoteSelect = (noteId: string) => {
	//   setSelectedNoteId(noteId);
	//   openNoteInPane(noteId, 'left');
	// };

	// const handleCreateNote = () => {
	//   createNewNote();
	// };

	// const handleDeleteNote = (noteId: string) => {
	//   if (window.confirm('Are you sure you want to delete this note?')) {
	//     // Simple implementation - we'd need to add this to notes actions
	//     console.log('Delete note:', noteId);
	//   }
	// };

	// const handleRenameNote = (noteId: string, newTitle: string) => {
	//   updateNoteTitle(noteId, newTitle);
	// };

	// const handleMoveNote = (noteId: string, newCategoryId: string | null) => {
	//   // Handle moving notes between categories
	//   console.log('Move note:', noteId, 'to category:', newCategoryId);
	// };

	// Filter notes based on search
	// const filteredNotes = searchQuery
	//   ? notes.filter(note => note.title.toLowerCase().includes(searchQuery.toLowerCase()))
	//   : notes;

	if (!isInitialized) {
		return (
			<div className='flex items-center justify-center h-full'>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2'></div>
					<p className='text-sm text-gray-500'>Loading notes...</p>
				</div>
			</div>
		);
	}

	return (
		<div className='flex flex-col h-full bg-white dark:bg-gray-900 __1'>
			{/* Search */}
			<div className='p-4 border-b border-gray-200 dark:border-gray-700 __2'>
				<SidebarSearch
					searchQuery={searchQuery}
					onSearchChange={setSearchQuery}
					placeholder='Search notes...'
				/>
			</div>

			{/* Responsive Tree Container - flex-grow for responsive height */}
			<div className='flex-1 min-h-0 select-none __3'>
				{/* <ArboristNotesTree
          notes={filteredNotes}
          categories={categories}
          selectedNoteId={selectedNoteId}
          onNoteSelect={handleNoteSelect}
          onCreateNote={handleCreateNote}
          onCreateFolder={handleCreateFolder}
          onDeleteNote={handleDeleteNote}
          onDeleteCategory={handleDeleteCategory}
          onRenameNote={handleRenameNote}
          onRenameCategory={handleRenameCategory}
          onMoveNote={handleMoveNote}
          searchQuery={searchQuery}
        /> */}
			</div>
		</div>
	);
};
