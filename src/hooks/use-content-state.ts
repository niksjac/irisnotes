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
import { usePaneState, usePaneActions, useViewState } from './index';
import { useEditorLayout } from './use-editor-layout';
import { useAtomValue } from 'jotai';
import { currentViewAtom } from '@/atoms';

export function useContentState() {
	const { isDualPaneMode, activePaneId } = usePaneState();
	const { setActivePane } = usePaneActions();
	const { configViewActive, hotkeysViewActive } = useViewState();
	const { toolbarVisible } = useEditorLayout();
	const currentView = useAtomValue(currentViewAtom);

	const { notes } = useNotesData();
	const { createNewNote, updateNoteTitle, updateNoteContent } = useNotesActions();
	const { getNotesForPane, openNoteInPane, setSelectedNoteId } = useNotesNavigation();
	const { storageManager, isInitialized } = useNotesStorage();

	useNotesInitialization();

	const notesForPane = getNotesForPane();

	const { categories, noteCategories, handleCreateFolder } = useCategoryManagement({
		storageManager,
		isLoading: !isInitialized,
		notesLength: notes.length,
	});

	const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

	const selectedFolder = selectedFolderId ? categories.find((cat: any) => cat.id === selectedFolderId) || null : null;

	const { handleNoteClick, handleCreateNote } = useAppHandlers({
		storageManager,
		isDualPaneMode,
		activePaneId,
		openNoteInPane,
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

	return {
		// View state
		currentView,
		configViewActive,
		hotkeysViewActive,
		isDualPaneMode,
		selectedFolder,

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
		dualPaneProps: {
			leftNote: notesForPane.left,
			rightNote: notesForPane.right,
			activePaneId,
			onNoteContentChange: updateNoteContent,
			onNoteTitleChange: updateNoteTitle,
			onPaneClick: setActivePane,
			toolbarVisible,
		},
		singlePaneProps: {
			treeProps: {
				tree: [],
				selectedNodeId: null,
				onNodeSelect: () => {},
				onNoteSelect: handleNoteClick,
				onFolderSelect: handleFolderSelect,
				onTitleChange: updateNoteTitle,
				onCreateNote: handleCreateNote,
				onDeleteNote: () => {},
				onRenameNote: () => {},
			},
		},
	};
}
