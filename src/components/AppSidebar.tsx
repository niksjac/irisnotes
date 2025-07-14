import React from 'react';
import { SidebarContent } from '../features/sidebar';
import { useAppContext } from '../contexts/AppContext';

export const AppSidebar: React.FC = () => {
  const {
    notes,
    categories,
    noteCategories,
    selectedNoteId,
    selectedItem,
    handleNoteClick,
    handleItemSelectWithState,
    handleCreateNote,
    handleCreateFolder,
    handleMoveNote,
    handleDeleteNote,
    handleDeleteCategory,
    handleRenameNote,
    handleRenameCategory,
    focusManagement
  } = useAppContext();

  return (
    <SidebarContent
      notes={notes}
      categories={categories}
      selectedNoteId={selectedNoteId}
      selectedItemId={selectedItem.id}
      selectedItemType={selectedItem.type}
      onNoteSelect={handleNoteClick}
      onItemSelect={handleItemSelectWithState}
      onCreateNote={handleCreateNote}
      onCreateFolder={handleCreateFolder}
      onMoveNote={handleMoveNote}
      onDeleteNote={handleDeleteNote}
      onDeleteCategory={handleDeleteCategory}
      onRenameNote={handleRenameNote}
      onRenameCategory={handleRenameCategory}
      noteCategories={noteCategories}
      registerElement={focusManagement.registerElement}
      getFocusClasses={focusManagement.getFocusClasses}
      focusElement={focusManagement.focusElement}
      setFocusFromClick={focusManagement.setFocusFromClick}
    />
  );
};