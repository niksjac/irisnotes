import React from 'react';
import { FileText, Folder as FolderIcon, Plus, FolderOpen } from 'lucide-react';
import type { Note, Category } from '@/types/database';

interface FolderViewProps {
	selectedFolder: Category;
	notes: Note[];
	categories: Category[];
	noteCategories?: { noteId: string; categoryId: string }[];
	onNoteSelect: (noteId: string) => void;
	onFolderSelect: (folderId: string) => void;
	onCreateNote: (parentCategoryId?: string) => void;
	onCreateFolder: (parentCategoryId?: string) => void;
}

export const FolderView = React.memo(
	({
		selectedFolder,
		notes,
		categories,
		noteCategories = [],
		onNoteSelect,
		onFolderSelect,
		onCreateNote,
		onCreateFolder,
	}: FolderViewProps) => {
		// Get notes that belong to this folder
		const folderNotes = React.useMemo(() => {
			const noteCategoryMap = new Map<string, string[]>();
			noteCategories.forEach(nc => {
				const existing = noteCategoryMap.get(nc.noteId) || [];
				existing.push(nc.categoryId);
				noteCategoryMap.set(nc.noteId, existing);
			});

			return notes.filter(note => {
				const noteCategs = noteCategoryMap.get(note.id) || [];
				return noteCategs.includes(selectedFolder.id);
			});
		}, [notes, noteCategories, selectedFolder.id]);

		// Get direct subfolders of this folder
		const subfolders = React.useMemo(() => {
			return categories.filter(category => category.parent_id === selectedFolder.id);
		}, [categories, selectedFolder.id]);

		const isEmpty = folderNotes.length === 0 && subfolders.length === 0;

		const handleCreateNote = () => {
			onCreateNote(selectedFolder.id);
		};

		const handleCreateFolder = () => {
			onCreateFolder(selectedFolder.id);
		};

		if (isEmpty) {
			return (
				<div className='folder-content-view'>
					<div className='folder-header'>
						<div className='folder-title'>
							<FolderOpen size={20} />
							<h2>{selectedFolder.name}</h2>
						</div>
					</div>

					<div className='folder-empty-state'>
						<div className='empty-icon'>
							<FolderIcon size={48} />
						</div>
						<h3>This folder is empty</h3>
						<p>Create your first note or subfolder to get started</p>

						<div className='empty-actions'>
							<button
								className='inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
								onClick={handleCreateNote}
							>
								<Plus size={16} />
								Create Note
							</button>
							<button
								className='inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors'
								onClick={handleCreateFolder}
							>
								<Plus size={16} />
								Create Subfolder
							</button>
						</div>
					</div>
				</div>
			);
		}

		return (
			<div className='folder-content-view'>
				<div className='folder-header'>
					<div className='folder-title'>
						<FolderOpen size={20} />
						<h2>{selectedFolder.name}</h2>
					</div>
					<div className='folder-actions'>
						<button
							className='inline-flex items-center gap-1 p-2 bg-transparent text-gray-600 dark:text-gray-400 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
							onClick={handleCreateNote}
							title='Create note in this folder'
						>
							<Plus size={16} />
							<FileText size={16} />
						</button>
						<button
							className='inline-flex items-center gap-1 p-2 bg-transparent text-gray-600 dark:text-gray-400 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
							onClick={handleCreateFolder}
							title='Create subfolder'
						>
							<Plus size={16} />
							<FolderIcon size={16} />
						</button>
					</div>
				</div>

				<div className='folder-content'>
					{/* Subfolders Section */}
					{subfolders.length > 0 && (
						<div className='folder-section'>
							<h3 className='section-title'>Folders</h3>
							<div className='items-grid'>
								{subfolders.map(folder => (
									<div
										key={folder.id}
										className='content-item folder-item'
										onClick={() => onFolderSelect(folder.id)}
									>
										<div className='item-icon'>
											<FolderIcon size={24} />
										</div>
										<div className='item-info'>
											<h4 className='item-title'>{folder.name}</h4>
											<p className='item-meta'>Folder</p>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Notes Section */}
					{folderNotes.length > 0 && (
						<div className='folder-section'>
							<h3 className='section-title'>Notes</h3>
							<div className='items-grid'>
								{folderNotes.map(note => (
									<div
										key={note.id}
										className='content-item note-item'
										onClick={() => onNoteSelect(note.id)}
									>
										<div className='item-icon'>
											<FileText size={24} />
										</div>
										<div className='item-info'>
											<h4 className='item-title'>{note.title}</h4>
											<p className='item-meta'>
												{note.updated_at ? new Date(note.updated_at).toLocaleDateString() : 'No date'}
											</p>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</div>
		);
	}
);

FolderView.displayName = 'FolderView';
