import React from 'react';
import { ConfigView } from '../../editor/components/config-view';
import { HotkeysView } from '../../editor/components/hotkeys-view';
import { FolderContent, DualPaneContent, SinglePaneContent } from '../../editor';
import {
  useNotesData,
  useNotesActions,
  useNotesNavigation,
  useNotesInitialization,
  useCategoryManagement,
  useAppHandlers,
  useNotesStorage
} from '../../notes/hooks';
import {
  useViewState,
  usePaneState,
  usePaneActions
} from '../hooks';
import { useEditorLayout } from '../hooks';

// Simple wrapper components for views that don't need props
const ConfigContent = () => <ConfigView />;
const HotkeysContent = () => <HotkeysView />;

export const AppMainContent: React.FC = () => {
  // View state - focused hooks
  const { configViewActive, hotkeysViewActive } = useViewState();
  const { isDualPaneMode, activePaneId } = usePaneState();
  const { setActivePane } = usePaneActions();
  const { toolbarVisible } = useEditorLayout();

  // Notes data and navigation - focused hooks
  const { notes } = useNotesData();
  const {
    createNewNote,
    updateNoteTitle,
    updateNoteContent
  } = useNotesActions();
  const {
    getSelectedNote,
    getNotesForPane,
    openNoteInPane,
    setSelectedNoteId
  } = useNotesNavigation();
  const { storageManager, isInitialized } = useNotesStorage();

  // Initialize notes when storage is ready
  useNotesInitialization();

  // Get selected note and pane notes
  const selectedNote = getSelectedNote();
  const notesForPane = getNotesForPane();

  // Category management
  const { categories, noteCategories, handleCreateFolder } = useCategoryManagement({
    storageManager,
    isLoading: !isInitialized,
    notesLength: notes.length
  });

  // Current selection state for folders
  const [selectedItem, setSelectedItem] = React.useState<{
    id: string | null;
    type: 'note' | 'category' | null;
  }>({
    id: null,
    type: null
  });

  // Get selected folder if any
  const selectedFolder = React.useMemo(() => {
    if (selectedItem.type === 'category' && selectedItem.id) {
      return categories.find(cat => cat.id === selectedItem.id) || null;
    }
    return null;
  }, [selectedItem.type, selectedItem.id, categories]);

  // App handlers for integrated actions
  const {
    handleNoteClick,
    handleCreateNote,
  } = useAppHandlers({
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
    focusElement: () => {} // No-op since focus management is handled at main layout level
  });

  // Helper functions
  const handleFolderSelectWithState = (folderId: string) => {
    setSelectedItem({ id: folderId, type: 'category' });
    setSelectedNoteId(null); // Clear note selection when folder is selected
  };

  const handleTitleChange = (noteId: string, title: string) => {
    updateNoteTitle(noteId, title);
  };

  const handleContentChange = (noteId: string, content: string) => {
    updateNoteContent(noteId, content);
  };

  // Main content rendering - no memoization needed as components are already optimized
  if (configViewActive) {
    return <ConfigContent />;
  }

  if (hotkeysViewActive) {
    return <HotkeysContent />;
  }

  if (selectedFolder && selectedItem.type === 'category') {
    return (
      <FolderContent
        selectedFolder={selectedFolder}
        notes={notes}
        categories={categories}
        noteCategories={noteCategories}
        onNoteSelect={handleNoteClick}
        onFolderSelect={handleFolderSelectWithState}
        onCreateNote={handleCreateNote}
        onCreateFolder={handleCreateFolder}
      />
    );
  }

  if (isDualPaneMode) {
    return (
      <DualPaneContent
        leftNote={notesForPane.left}
        rightNote={notesForPane.right}
        activePaneId={activePaneId}
        onNoteContentChange={handleContentChange}
        onNoteTitleChange={handleTitleChange}
        onPaneClick={setActivePane}
        toolbarVisible={toolbarVisible}
      />
    );
  }

  return (
    <SinglePaneContent
      selectedNote={selectedNote || null}
      onTitleChange={handleTitleChange}
      onContentChange={handleContentChange}
      onCreateNote={handleCreateNote}
      onCreateFolder={handleCreateFolder}
      onFocusSearch={() => {}} // No-op since focus management is handled at main layout level
      toolbarVisible={toolbarVisible}
      focusClasses={{}} // Empty since focus management is handled at main layout level
      onRegisterElement={() => {}} // No-op since focus management is handled at main layout level
      onSetFocusFromClick={() => {}} // No-op since focus management is handled at main layout level
    />
  );
};