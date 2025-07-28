import React from 'react';
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

const noop = () => {};
const emptyObj = {};

export function useContentState() {
	const { isDualPaneMode, activePaneId } = usePaneState();
	const { setActivePane } = usePaneActions();
	const { configViewActive, hotkeysViewActive } = useViewState();
	const { toolbarVisible } = useEditorLayout();

	const { notes } = useNotesData();
	const { createNewNote, updateNoteTitle, updateNoteContent } =
		useNotesActions();
	const {
		getSelectedNote,
		getNotesForPane,
		openNoteInPane,
		setSelectedNoteId,
	} = useNotesNavigation();
	const { storageManager, isInitialized } = useNotesStorage();

	useNotesInitialization();

	const selectedNote = getSelectedNote();
	const notesForPane = getNotesForPane();

	const { categories, noteCategories, handleCreateFolder } =
		useCategoryManagement({
			storageManager,
			isLoading: !isInitialized,
			notesLength: notes.length,
		});

	const [selectedFolderId, setSelectedFolderId] = React.useState<string | null>(
		null
	);

	const selectedFolder = React.useMemo(() => {
		return selectedFolderId
			? categories.find((cat: any) => cat.id === selectedFolderId) || null
			: null;
	}, [selectedFolderId, categories]);

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
		focusElement: noop,
	});

	const handleFolderSelect = (folderId: string) => {
		setSelectedFolderId(folderId);
		setSelectedNoteId(null);
	};

	return {
		// View state
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
			selectedNote,
			onTitleChange: updateNoteTitle,
			onContentChange: updateNoteContent,
			onCreateNote: handleCreateNote,
			onCreateFolder: () => handleCreateFolder(),
			onFocusSearch: noop,
			toolbarVisible,
			focusClasses: emptyObj,
			onRegisterElement: noop,
			onSetFocusFromClick: noop,
		},
	};
}
