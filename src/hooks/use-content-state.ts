import { useState } from 'react';
import {
	useNotesData,
	useNotesActions,
	useNotesNavigation,
	useNotesInitialization,
	useCategoryManagement,
	useAppHandlers,
	useNotesStorage,
} from '../features/notes/hooks';
import { useEditorLayout } from './use-editor-layout';
import { useAtomValue } from 'jotai';
import { selectedNoteAtom, notesForPaneAtom } from '@/atoms';
import type { PaneId } from '@/atoms';

export function useContentState(paneId?: PaneId) {
	const { toolbarVisible } = useEditorLayout();
	const selectedNote = useAtomValue(selectedNoteAtom);
	const notesForPane = useAtomValue(notesForPaneAtom);

	const { notes } = useNotesData();
	const { createNewNote, updateNoteTitle, updateNoteContent } = useNotesActions();
	const { setSelectedNoteId } = useNotesNavigation();
	const { storageManager, isInitialized } = useNotesStorage();

	useNotesInitialization();

	const { categories, noteCategories, handleCreateFolder } = useCategoryManagement({
		storageManager,
		isLoading: !isInitialized,
		notesLength: notes.length,
	});

	const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

	const selectedFolder = selectedFolderId ? categories.find((cat: any) => cat.id === selectedFolderId) || null : null;

	const { handleNoteClick, handleCreateNote } = useAppHandlers({
		storageManager,
		isDualPaneMode: !!paneId, // If paneId is provided, we're in dual pane mode
		activePaneId: paneId || 'left',
		openNoteInPane: () => {}, // Simplified
		setSelectedNoteId,
		updateNoteTitle,
		updateNoteContent,
		createNewNote,
		loadAllNotes: () => Promise.resolve(),
		loadNoteCategories: () => Promise.resolve([]),
	});

	const handleFolderSelect = (folderId: string) => {
		setSelectedFolderId(folderId);
		setSelectedNoteId(null);
	};

	// Get the appropriate note based on pane
	const currentNote = paneId ? (paneId === 'left' ? notesForPane.left : notesForPane.right) : selectedNote;

	return {
		// Props for components
		folderProps: {
			selectedFolder: selectedFolder!,
			notes,
			categories,
			noteCategories,
			onNoteSelect: handleNoteClick,
			onFolderSelect: handleFolderSelect,
			onCreateNote: handleCreateNote,
			onCreateFolder: () => handleCreateFolder(),
		},
		editorProps: {
			note: currentNote,
			onNoteContentChange: updateNoteContent,
			onNoteTitleChange: updateNoteTitle,
			toolbarVisible,
		},
		welcomeProps: {
			onCreateNote: () => handleCreateNote(),
			onCreateFolder: () => handleCreateFolder(),
		},
	};
}
