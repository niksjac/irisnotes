import React, { useEffect, useMemo, useCallback, useState } from "react";
import { EditorContainer, DualPaneEditor, EditorWrapper, WelcomeScreen, FolderContentView, useFontSize } from "./features/editor";
import { ActivityBar } from "./features/activity-bar";
import { ResizableSidebar, SidebarContent } from "./features/sidebar";
import { ConfigView } from "./features/editor/components/config-view";
import { HotkeysView } from "./features/editor/components/hotkeys-view";
import { DatabaseStatusView } from "./features/editor/components/database-status-view";
import { useSingleStorageNotes as useNotes } from "./features/notes/hooks/use-single-storage-notes";
import { useTheme } from "./features/theme";
import { useLayout, useFocusManagement } from "./features/layout";
import { useShortcuts } from "./features/shortcuts";
import { useHotkeySequences, createAppConfigSequences } from "./features/hotkeys";
import { useLineWrapping } from "./features/editor/hooks/use-line-wrapping";
import { useConfig } from "./hooks/use-config";
import type { Category } from "./types/database";
import "./styles/theme.css";
import "./styles/layout.css";
import "./styles/components.css";
import "./styles/focus-management.css";

// Memoized components to prevent unnecessary re-renders
const MemoizedActivityBar = React.memo(ActivityBar);
const MemoizedResizableSidebar = React.memo(ResizableSidebar);
const MemoizedDualPaneEditor = React.memo(DualPaneEditor);
const MemoizedEditorContainer = React.memo(EditorContainer);
const MemoizedConfigView = React.memo(ConfigView);
const MemoizedHotkeysView = React.memo(HotkeysView);
const MemoizedDatabaseStatusView = React.memo(DatabaseStatusView);
const MemoizedWelcomeScreen = React.memo(WelcomeScreen);
const MemoizedFolderContentView = React.memo(FolderContentView);

function App() {
  const { config, loading: configLoading } = useConfig();

  // Memoized hooks to prevent unnecessary re-renders
  const notesData = useNotes();
  const themeData = useTheme();
  const layoutData = useLayout();
  const lineWrappingData = useLineWrapping();
  const fontSizeData = useFontSize(); // Add font size management

  // Destructure only what we need
  const {
    notes,
    selectedNote,
    selectedNoteId,
    setSelectedNoteId,
    getSelectedNoteForPane,
    openNoteInPane,
    createNewNote,
    updateNoteTitle,
    updateNoteContent,
    loadAllNotes,
    storageManager,
    isLoading
  } = notesData;

  const { loadUserTheme } = themeData;

  const {
    sidebarCollapsed,
    activityBarVisible,
    configViewActive,
    hotkeysViewActive,
    databaseStatusVisible,
    isDualPaneMode,
    activePaneId,
    toolbarVisible,
    toggleSidebar,
    handleSidebarCollapsedChange,
    toggleActivityBar,
    toggleConfigView,
    toggleHotkeysView,
    toggleDatabaseStatus,
    toggleDualPaneMode,
    setActivePane,
    toggleToolbar
  } = layoutData;

  // Focus management (after layout data is available)
  const focusManagement = useFocusManagement({
    onFocusChange: (element) => {
      console.log('Focus changed to:', element);
    },
    onToggleSidebar: () => {
      // Only show sidebar if it's collapsed
      if (sidebarCollapsed) {
        toggleSidebar();
      }
    },
    onToggleActivityBar: () => {
      // Only show activity bar if it's hidden
      if (!activityBarVisible) {
        toggleActivityBar();
      }
    },
    sidebarCollapsed,
    activityBarVisible
  });

  const { isWrapping, toggleLineWrapping } = lineWrappingData;

  const { fontSize, increaseFontSize, decreaseFontSize } = fontSizeData;

  // Category management state
  const [categories, setCategories] = useState<Category[]>([]);
  const [noteCategories, setNoteCategories] = useState<{ noteId: string; categoryId: string }[]>([]);

  // State management
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<'note' | 'category' | null>(null);

  // Load categories when notes are loaded (indicating storage is ready)
  useEffect(() => {
    const loadCategories = async () => {
      if (!storageManager || isLoading) return;

      try {
        const result = await storageManager.getCategories();
        if (result.success) {
          setCategories(result.data);
        } else {
          console.error('Failed to load categories:', result.error);
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };

    // Only load categories after notes are loaded and storage is ready
    if (!isLoading && notes.length >= 0) {
      loadCategories();
    }
  }, [storageManager, isLoading, notes.length]); // Trigger when notes are loaded

  // Load note-category relationships
  const loadNoteCategories = useCallback(async () => {
    if (!storageManager) return [];

    try {
      const storage = storageManager.getActiveStorage();
      if (!storage) return [];

      const relationships: { noteId: string; categoryId: string }[] = [];

      // Load note categories for each category
      for (const category of categories) {
        const result = await storage.getCategoryNotes(category.id);
        if (result.success) {
          result.data.forEach(note => {
            relationships.push({
              noteId: note.id,
              categoryId: category.id
            });
          });
        }
      }

      setNoteCategories(relationships);
      return relationships;
    } catch (error) {
      console.error('Failed to load note categories:', error);
      return [];
    }
  }, [storageManager, categories]);

  // Load note categories when categories change
  useEffect(() => {
    if (categories.length > 0) {
      loadNoteCategories();
    }
  }, [categories, loadNoteCategories]);

  // Category handlers
    const handleCreateFolder = useCallback(async (parentCategoryId?: string) => {
    if (!storageManager) return;

    try {
      const createParams = {
        name: 'New Folder',
        description: '',
        ...(parentCategoryId && { parent_id: parentCategoryId })
      };
      const result = await storageManager.createCategory(createParams);

      if (result.success) {
        setCategories(prev => [...prev, result.data]);
        // Reload categories to ensure consistency
        const categoriesResult = await storageManager.getCategories();
        if (categoriesResult.success) {
          setCategories(categoriesResult.data);
        }
      } else {
        console.error('Failed to create category:', result.error);
      }
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  }, [storageManager]);

  const handleCreateNote = useCallback(async (parentCategoryId?: string) => {
    if (!storageManager) return;

    try {
      const result = await createNewNote();
      if (result.success && result.data && parentCategoryId) {
        // Add the note to the category
        const storage = storageManager.getActiveStorage();
        if (storage) {
          await storage.addNoteToCategory(result.data.id, parentCategoryId);
          // Reload note categories to update the tree
          await loadNoteCategories();
        }
      }
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  }, [storageManager, createNewNote, loadNoteCategories]);

    const handleMoveNote = useCallback(async (noteId: string, newCategoryId: string | null) => {
    if (!storageManager) return;

    try {
      const storage = storageManager.getActiveStorage();
      if (storage) {
        // Remove from all categories first
        for (const category of categories) {
          await storage.removeNoteFromCategory(noteId, category.id);
        }

        // Add to new category if specified
        if (newCategoryId) {
          await storage.addNoteToCategory(noteId, newCategoryId);
        }

        // Reload note categories to update the tree
        await loadNoteCategories();
      }
    } catch (error) {
      console.error('Failed to move note:', error);
    }
  }, [storageManager, categories, loadNoteCategories]);

  const handleDeleteNote = useCallback(async (noteId: string) => {
    if (!storageManager) return;

    try {
      const storage = storageManager.getActiveStorage();
      if (storage) {
        await storage.deleteNote(noteId);
        // Reload notes to update the UI
        await loadAllNotes();
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  }, [storageManager, loadAllNotes]);

  const handleDeleteCategory = useCallback(async (categoryId: string) => {
    if (!storageManager) return;

    try {
      const storage = storageManager.getActiveStorage();
      if (storage) {
        await storage.deleteCategory(categoryId);
        setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  }, [storageManager]);

  const handleRenameNote = useCallback(async (noteId: string, newTitle: string) => {
    await updateNoteTitle(noteId, newTitle);
  }, [updateNoteTitle]);

  const handleRenameCategory = useCallback(async (categoryId: string, newName: string) => {
    if (!storageManager) return;

    try {
      const storage = storageManager.getActiveStorage();
      if (storage) {
        const result = await storage.updateCategory(categoryId, { name: newName });
        if (result.success) {
          setCategories(prev => prev.map(cat =>
            cat.id === categoryId ? { ...cat, name: newName } : cat
          ));
        }
      }
    } catch (error) {
      console.error('Failed to rename category:', error);
    }
  }, [storageManager]);

  // Memoize expensive computations
  const notesForPane = useMemo(() => ({
    left: getSelectedNoteForPane('left') || null,
    right: getSelectedNoteForPane('right') || null
  }), [getSelectedNoteForPane]);

  // Memoize hotkey sequences to prevent recreation
  const hotkeySequences = useMemo(() => createAppConfigSequences(), []);

  // Memoize callbacks to prevent child re-renders
  const handleNoteClick = useCallback((noteId: string) => {
    if (isDualPaneMode) {
      openNoteInPane(noteId, activePaneId);
    } else {
      setSelectedNoteId(noteId);
    }
  }, [isDualPaneMode, openNoteInPane, activePaneId, setSelectedNoteId]);

  const handleItemSelect = useCallback((itemId: string, itemType: 'note' | 'category') => {
    setSelectedItemId(itemId);
    setSelectedItemType(itemType);

    // Don't automatically open notes when just selecting them
    // Notes will be opened via Enter/Space or double-click in the tree view
    if (itemType === 'category') {
      // For folders, we don't load them in the editor, just select them
      setSelectedNoteId(null);
    }
  }, []);

  const handleTitleChange = useCallback((noteId: string, title: string) => {
    updateNoteTitle(noteId, title);
  }, [updateNoteTitle]);

  const handleContentChange = useCallback((noteId: string, content: string) => {
    updateNoteContent(noteId, content);
  }, [updateNoteContent]);

  const handleFolderSelect = useCallback((folderId: string) => {
    setSelectedItemId(folderId);
    setSelectedItemType('category');
    setSelectedNoteId(null);
  }, [setSelectedNoteId]);

  // Memoize shortcuts configuration
  const shortcutsConfig = useMemo(() => ({
    onToggleSidebar: toggleSidebar,
    onToggleActivityBar: toggleActivityBar,
    onToggleDualPane: toggleDualPaneMode,
    onReloadNote: () => loadAllNotes(), // Reload notes from storage
    onToggleLineWrapping: toggleLineWrapping,
    onIncreaseFontSize: increaseFontSize,
    onDecreaseFontSize: decreaseFontSize
  }), [toggleSidebar, toggleActivityBar, toggleDualPaneMode, loadAllNotes, toggleLineWrapping, increaseFontSize, decreaseFontSize]);

  // Initialize app after config loads
  useEffect(() => {
    if (configLoading) return;

    const initializeApp = async () => {
      try {
        console.log("Initializing IrisNotes...");
        console.log("Config loaded:", config);

        // Load user theme (notes will be loaded by the storage hook)
        await loadUserTheme();
      } catch (error) {
        console.error("Failed to initialize app:", error);
      }
    };

    initializeApp();
  }, [configLoading, config, loadUserTheme]);

  // Setup keyboard shortcuts
  useShortcuts(shortcutsConfig);

  // Setup hotkey sequences (VSCode-style)
  useHotkeySequences({
    sequences: hotkeySequences
  });

  // Memoize sidebar content to prevent unnecessary re-renders
  const sidebarContent = useMemo(() => (
    <SidebarContent
      notes={notes}
      categories={categories}
      selectedNoteId={selectedNoteId}
      selectedItemId={selectedItemId}
      selectedItemType={selectedItemType}
      onNoteSelect={handleNoteClick}
      onItemSelect={handleItemSelect}
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
  ), [
    notes,
    categories,
    selectedNoteId,
    selectedItemId,
    selectedItemType,
    handleNoteClick,
    handleItemSelect,
    handleCreateNote,
    handleCreateFolder,
    handleMoveNote,
    handleDeleteNote,
    handleDeleteCategory,
    handleRenameNote,
    handleRenameCategory,
    noteCategories,
    focusManagement.registerElement,
    focusManagement.getFocusClasses,
    focusManagement.focusElement,
    focusManagement.setFocusFromClick
  ]);

  // Find selected folder for folder content view
  const selectedFolder = useMemo(() => {
    if (selectedItemType === 'category' && selectedItemId) {
      return categories.find(cat => cat.id === selectedItemId) || null;
    }
    return null;
  }, [selectedItemType, selectedItemId, categories]);

  // Memoize main content to prevent unnecessary re-renders
  const mainContent = useMemo(() => {
    // Show config view if active
    if (configViewActive) {
      return <MemoizedConfigView />;
    }

    // Show hotkeys view if active
    if (hotkeysViewActive) {
      return <MemoizedHotkeysView />;
    }

    // Show folder content view if a folder is selected
    if (selectedFolder && selectedItemType === 'category') {
      return (
        <MemoizedFolderContentView
          selectedFolder={selectedFolder}
          notes={notes}
          categories={categories}
          noteCategories={noteCategories}
          onNoteSelect={handleNoteClick}
          onFolderSelect={handleFolderSelect}
          onCreateNote={handleCreateNote}
          onCreateFolder={handleCreateFolder}
        />
      );
    }

    // Otherwise show normal editor content
    if (isDualPaneMode) {
      return (
        <MemoizedDualPaneEditor
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
      <EditorWrapper
        focusClasses={focusManagement.getFocusClasses('editor')}
        onRegisterElement={(ref) => focusManagement.registerElement('editor', ref)}
        onSetFocusFromClick={() => focusManagement.setFocusFromClick('editor')}
      >
        {selectedNote ? (
          <>
            <div className="title-bar">
              <input
                className="title-input"
                type="text"
                value={selectedNote.title}
                onChange={(e) => handleTitleChange(selectedNote.id, e.target.value)}
                placeholder="Untitled Note"
              />
            </div>

            <div className="editor-container">
              <MemoizedEditorContainer
                content={selectedNote.content}
                onChange={(content) => handleContentChange(selectedNote.id, content)}
                placeholder="Start writing your note..."
                toolbarVisible={toolbarVisible}
              />
            </div>
          </>
        ) : (
          <MemoizedWelcomeScreen
            onCreateNote={() => handleCreateNote()}
            onCreateFolder={() => handleCreateFolder()}
            onFocusSearch={() => focusManagement.focusElement('sidebar-search')}
          />
        )}
      </EditorWrapper>
    );
  }, [configViewActive, hotkeysViewActive, selectedFolder, selectedItemType, isDualPaneMode, notesForPane, activePaneId, selectedNote, handleContentChange, handleTitleChange, setActivePane, focusManagement.getFocusClasses, focusManagement.registerElement, notes, categories, noteCategories, handleNoteClick, handleFolderSelect, handleCreateNote, handleCreateFolder]);

  // Sync selectedItemId with selectedNoteId when note is selected through other means
  useEffect(() => {
    if (selectedNoteId) {
      setSelectedItemId(selectedNoteId);
      setSelectedItemType('note');
    }
  }, [selectedNoteId]);

  return (
    <div className="app-container">
      <div className="app-content">
        <div className="app">
          {/* Activity Bar */}
          <MemoizedActivityBar
            isVisible={activityBarVisible}
            sidebarCollapsed={sidebarCollapsed}
            configViewActive={configViewActive}
            hotkeysViewActive={hotkeysViewActive}
            databaseStatusVisible={databaseStatusVisible}
            onToggleSidebar={toggleSidebar}
            onToggleConfigView={toggleConfigView}
            onToggleHotkeysView={toggleHotkeysView}
            onToggleDatabaseStatus={toggleDatabaseStatus}
            isDualPaneMode={isDualPaneMode}
            onToggleDualPane={toggleDualPaneMode}
            isLineWrapping={isWrapping}
            onToggleLineWrapping={toggleLineWrapping}
            isToolbarVisible={toolbarVisible}
            onToggleToolbar={toggleToolbar}
            fontSize={fontSize}
            focusClasses={focusManagement.getFocusClasses('activity-bar')}
            onRegisterElement={(ref) => focusManagement.registerElement('activity-bar', ref)}
            onSetFocusFromClick={() => focusManagement.setFocusFromClick('activity-bar')}
          />

          {/* Resizable Sidebar */}
          <MemoizedResizableSidebar
            isCollapsed={sidebarCollapsed}
            onCollapsedChange={handleSidebarCollapsedChange}
            minWidth={200}
            maxWidth={600}
            defaultWidth={300}
          >
            {sidebarContent}
          </MemoizedResizableSidebar>

          <div className="main-content">
            {mainContent}
          </div>
        </div>
      </div>

      {/* Database Status View - Positioned overlay */}
      {databaseStatusVisible && <MemoizedDatabaseStatusView />}
    </div>
  );
}

export default App;
