import { useEffect } from "react";
import { EditorContainer, DualPaneEditor } from "./features/editor";
import { ActivityBar } from "./features/activity-bar";
import { ResizableSidebar } from "./features/sidebar";
import { useNotes } from "./features/notes";
import { useTheme } from "./features/theme";
import { useLayout } from "./features/layout";
import { useShortcuts } from "./features/shortcuts";
import { useHotkeySequences, createAppConfigSequences } from "./features/hotkeys";
import { useLineWrapping } from "./features/editor/hooks/use-line-wrapping";
import "./styles/theme.css";
import "./styles/layout.css";
import "./styles/components.css";

function App() {
  // Custom hooks for feature management
  const {
    notes,
    selectedNote,
    selectedNoteId,
    setSelectedNoteId,
    getSelectedNoteForPane,
    openNoteInPane,
    loadExampleNote,
    reloadExampleNote,
    createNewNote,
    updateNoteTitle,
    updateNoteContent
  } = useNotes();

  const { loadUserTheme } = useTheme();

  const {
    sidebarCollapsed,
    activityBarVisible,
    selectedView,
    isDualPaneMode,
    activePaneId,
    toggleSidebar,
    handleSidebarCollapsedChange,
    toggleActivityBar,
    handleViewChange,
    toggleDualPaneMode,
    setActivePane
  } = useLayout();

  const { isWrapping, toggleLineWrapping } = useLineWrapping();

  // Initialize app
  const initializeApp = async () => {
    try {
      console.log("Initializing IrisNotes...");
      await loadExampleNote();
    } catch (error) {
      console.error("Failed to initialize app:", error);
    }
  };

  // Setup keyboard shortcuts
  useShortcuts({
    onToggleSidebar: toggleSidebar,
    onToggleActivityBar: toggleActivityBar,
    onToggleDualPane: toggleDualPaneMode,
    onReloadNote: reloadExampleNote,
    onToggleLineWrapping: toggleLineWrapping
  });

  // Setup hotkey sequences (VSCode-style)
  useHotkeySequences({
    sequences: createAppConfigSequences()
  });

  // Initialize app and load user theme
  useEffect(() => {
    initializeApp();
    loadUserTheme();
  }, []);

  // Get notes for dual-pane mode
  const leftNote = getSelectedNoteForPane('left') || null;
  const rightNote = getSelectedNoteForPane('right') || null;

  return (
    <div className="app">
      {/* Activity Bar */}
      <ActivityBar
        isVisible={activityBarVisible}
        selectedView={selectedView}
        onViewChange={handleViewChange}
        isDualPaneMode={isDualPaneMode}
        onToggleDualPane={toggleDualPaneMode}
        isLineWrapping={isWrapping}
        onToggleLineWrapping={toggleLineWrapping}
      />

      {/* Resizable Sidebar */}
      <ResizableSidebar
        isCollapsed={sidebarCollapsed}
        onCollapsedChange={handleSidebarCollapsedChange}
        minWidth={200}
        maxWidth={600}
        defaultWidth={300}
      >
        <div className="sidebar">
          <div style={{
            padding: 'var(--iris-space-md)',
            borderBottom: '1px solid var(--iris-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <h2 style={{ margin: 0, fontSize: 'var(--iris-font-size-lg)' }}>
              Section {selectedView}
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
                             (leftNote?.id === note.id || rightNote?.id === note.id))
                             ? 'var(--iris-bg-secondary)' : 'transparent',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  if (isDualPaneMode) {
                    openNoteInPane(note.id, activePaneId);
                  } else {
                    setSelectedNoteId(note.id);
                  }
                }}
              >
                <span style={{ flex: 1, fontSize: 'var(--iris-font-size-sm)' }}>
                  {note.title}
                </span>
                {isDualPaneMode && (
                  <div style={{ display: 'flex', gap: 'var(--iris-space-xs)' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openNoteInPane(note.id, 'left');
                      }}
                      style={{
                        padding: '2px 6px',
                        fontSize: '10px',
                        border: '1px solid var(--iris-border)',
                        background: leftNote?.id === note.id ? 'var(--iris-accent)' : 'transparent',
                        color: leftNote?.id === note.id ? 'white' : 'var(--iris-text)',
                        borderRadius: '2px',
                        cursor: 'pointer'
                      }}
                      title="Open in left pane"
                    >
                      L
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openNoteInPane(note.id, 'right');
                      }}
                      style={{
                        padding: '2px 6px',
                        fontSize: '10px',
                        border: '1px solid var(--iris-border)',
                        background: rightNote?.id === note.id ? 'var(--iris-accent)' : 'transparent',
                        color: rightNote?.id === note.id ? 'white' : 'var(--iris-text)',
                        borderRadius: '2px',
                        cursor: 'pointer'
                      }}
                      title="Open in right pane"
                    >
                      R
                    </button>
                  </div>
                )}
              </div>
            ))}

            <button
              onClick={() => createNewNote(isDualPaneMode ? activePaneId : undefined)}
              style={{
                width: '100%',
                padding: 'var(--iris-space-sm)',
                margin: 'var(--iris-space-sm) 0',
                border: '1px dashed var(--iris-border)',
                background: 'transparent',
                color: 'var(--iris-text-muted)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: 'var(--iris-font-size-sm)'
              }}
            >
              + New Note {isDualPaneMode ? `(${activePaneId === 'left' ? 'Left' : 'Right'} pane)` : ''}
            </button>
          </div>
        </div>
      </ResizableSidebar>

      {/* Main Content */}
      <div className="main-content">
        {isDualPaneMode ? (
          <DualPaneEditor
            leftNote={leftNote}
            rightNote={rightNote}
            activePaneId={activePaneId}
            onNoteContentChange={updateNoteContent}
            onNoteTitleChange={updateNoteTitle}
            onPaneClick={setActivePane}
          />
        ) : (
          <>
            <div className="title-bar">
              {selectedNote && (
                <input
                  className="title-input"
                  type="text"
                  value={selectedNote.title}
                  onChange={(e) => updateNoteTitle(selectedNote.id, e.target.value)}
                  placeholder="Untitled Note"
                />
              )}
            </div>

            <div className="editor-container">
              {selectedNote && (
                <EditorContainer
                  content={selectedNote.content}
                  onChange={(content) => updateNoteContent(selectedNote.id, content)}
                  placeholder="Start writing your note..."
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
