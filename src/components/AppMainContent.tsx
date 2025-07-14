import React from 'react';
import { ConfigView } from '../features/editor/components/config-view';
import { HotkeysView } from '../features/editor/components/hotkeys-view';
import { FolderContent, DualPaneContent, SinglePaneContent } from '../components';
import { useAppContext } from '../contexts/AppContext';

// Simple wrapper components for views that don't need props
const ConfigContent = () => <ConfigView />;
const HotkeysContent = () => <HotkeysView />;

export const AppMainContent: React.FC = () => {
  const {
    configViewActive,
    hotkeysViewActive,
    selectedFolder,
    selectedItem,
    isDualPaneMode,
    notes,
    categories,
    noteCategories,
    notesForPane,
    activePaneId,
    selectedNote,
    toolbarVisible,
    handleNoteClick,
    handleFolderSelectWithState,
    handleCreateNote,
    handleCreateFolder,
    handleContentChange,
    handleTitleChange,
    setActivePane,
    focusManagement
  } = useAppContext();

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
      onFocusSearch={() => focusManagement.focusElement('sidebar-search')}
      toolbarVisible={toolbarVisible}
      focusClasses={focusManagement.getFocusClasses('editor')}
      onRegisterElement={(ref) => focusManagement.registerElement('editor', ref)}
      onSetFocusFromClick={() => focusManagement.setFocusFromClick('editor')}
    />
  );
};