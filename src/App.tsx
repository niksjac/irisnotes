import React, { useEffect, useMemo, useCallback } from "react";
import { EditorContainer, DualPaneEditor } from "./features/editor";
import { ActivityBar } from "./features/activity-bar";
import { ResizableSidebar } from "./features/sidebar";
import { ConfigView } from "./features/editor/components/config-view";
import { HotkeysView } from "./features/editor/components/hotkeys-view";
import { DatabaseStatusView } from "./features/editor/components/database-status-view";
import { useSingleStorageNotes as useNotes } from "./features/notes/hooks/use-single-storage-notes";
import { useTheme } from "./features/theme";
import { useLayout } from "./features/layout";
import { useShortcuts } from "./features/shortcuts";
import { useHotkeySequences, createAppConfigSequences } from "./features/hotkeys";
import { useLineWrapping } from "./features/editor/hooks/use-line-wrapping";
import { useConfig } from "./hooks/use-config";
import "./styles/theme.css";
import "./styles/layout.css";
import "./styles/components.css";

// Memoized components to prevent unnecessary re-renders
const MemoizedActivityBar = React.memo(ActivityBar);
const MemoizedResizableSidebar = React.memo(ResizableSidebar);
const MemoizedDualPaneEditor = React.memo(DualPaneEditor);
const MemoizedEditorContainer = React.memo(EditorContainer);
const MemoizedConfigView = React.memo(ConfigView);
const MemoizedHotkeysView = React.memo(HotkeysView);
const MemoizedDatabaseStatusView = React.memo(DatabaseStatusView);

function App() {
  const { config, loading: configLoading } = useConfig();

  // Memoized hooks to prevent unnecessary re-renders
  const notesData = useNotes();
  const themeData = useTheme();
  const layoutData = useLayout();
  const lineWrappingData = useLineWrapping();

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
    loadAllNotes
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
    toggleSidebar,
    handleSidebarCollapsedChange,
    toggleActivityBar,
    toggleConfigView,
    toggleHotkeysView,
    toggleDatabaseStatus,
    toggleDualPaneMode,
    setActivePane
  } = layoutData;

  const { isWrapping, toggleLineWrapping } = lineWrappingData;

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

  const handleTitleChange = useCallback((noteId: string, title: string) => {
    updateNoteTitle(noteId, title);
  }, [updateNoteTitle]);

  const handleContentChange = useCallback((noteId: string, content: string) => {
    updateNoteContent(noteId, content);
  }, [updateNoteContent]);

  // Memoize shortcuts configuration
  const shortcutsConfig = useMemo(() => ({
    onToggleSidebar: toggleSidebar,
    onToggleActivityBar: toggleActivityBar,
    onToggleDualPane: toggleDualPaneMode,
    onReloadNote: () => loadAllNotes(), // Reload notes from storage
    onToggleLineWrapping: toggleLineWrapping
  }), [toggleSidebar, toggleActivityBar, toggleDualPaneMode, loadAllNotes, toggleLineWrapping]);

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

  // Memoize sidebar content to prevent unnecessary re-renders - Notes only
  const sidebarContent = useMemo(() => (
    <div className="sidebar">
      <div style={{
        padding: 'var(--iris-space-md)',
        borderBottom: '1px solid var(--iris-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <h2 style={{ margin: 0, fontSize: 'var(--iris-font-size-lg)' }}>
          Notes
        </h2>
      </div>

      {/* Notes list with pane selection for dual-mode */}
      <div style={{ padding: 'var(--iris-space-md)' }}>
        {notes.map(note => (
          <div
            key={note.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--iris-space-sm)',
              margin: 'var(--iris-space-xs) 0',
              background: (selectedNoteId === note.id ||
                         (notesForPane.left?.id === note.id || notesForPane.right?.id === note.id))
                         ? 'var(--iris-bg-secondary)' : 'transparent',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onClick={() => handleNoteClick(note.id)}
          >
            <span style={{ flex: 1, fontSize: 'var(--iris-font-size-sm)' }}>
              {note.title}
            </span>
            {isDualPaneMode && (
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  style={{
                    padding: '2px 6px',
                    fontSize: '10px',
                    border: '1px solid var(--iris-border)',
                    borderRadius: '2px',
                    background: notesForPane.left?.id === note.id ? 'var(--iris-accent)' : 'transparent',
                    color: notesForPane.left?.id === note.id ? 'white' : 'var(--iris-text)',
                    cursor: 'pointer'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    openNoteInPane(note.id, 'left');
                  }}
                >
                  L
                </button>
                <button
                  style={{
                    padding: '2px 6px',
                    fontSize: '10px',
                    border: '1px solid var(--iris-border)',
                    borderRadius: '2px',
                    background: notesForPane.right?.id === note.id ? 'var(--iris-accent)' : 'transparent',
                    color: notesForPane.right?.id === note.id ? 'white' : 'var(--iris-text)',
                    cursor: 'pointer'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    openNoteInPane(note.id, 'right');
                  }}
                >
                  R
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add new note button */}
      <div style={{ padding: 'var(--iris-space-md)', borderTop: '1px solid var(--iris-border)' }}>
        <button
          onClick={() => createNewNote()}
          style={{
            width: '100%',
            padding: 'var(--iris-space-sm)',
            border: '1px solid var(--iris-border)',
            borderRadius: '4px',
            background: 'var(--iris-bg-secondary)',
            color: 'var(--iris-text)',
            cursor: 'pointer',
            fontSize: 'var(--iris-font-size-sm)'
          }}
        >
          + New Note
        </button>
      </div>
    </div>
  ), [notes, selectedNoteId, notesForPane, isDualPaneMode, handleNoteClick, openNoteInPane, createNewNote]);

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
        />
      );
    }

    return (
      <>
        <div className="title-bar">
          {selectedNote && (
            <input
              className="title-input"
              type="text"
              value={selectedNote.title}
              onChange={(e) => handleTitleChange(selectedNote.id, e.target.value)}
              placeholder="Untitled Note"
            />
          )}
        </div>

        <div className="editor-container">
          {selectedNote && (
            <MemoizedEditorContainer
              content={selectedNote.content}
              onChange={(content) => handleContentChange(selectedNote.id, content)}
              placeholder="Start writing your note..."
            />
          )}
        </div>
      </>
    );
  }, [configViewActive, hotkeysViewActive, isDualPaneMode, notesForPane, activePaneId, selectedNote, handleContentChange, handleTitleChange, setActivePane]);

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
