import { useEffect } from "react";
import { EditorContainer } from "./features/editor";
import { ActivityBar } from "./features/activity-bar";
import { ResizableSidebar } from "./features/sidebar";
import { useNotes } from "./features/notes";
import { useTheme } from "./features/theme";
import { useLayout } from "./features/layout";
import { useShortcuts } from "./features/shortcuts";
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
    loadDefaultNote,
    reloadDefaultNote,
    createNewNote,
    updateNoteTitle,
    updateNoteContent
  } = useNotes();

  const { darkMode, loadUserTheme, toggleDarkMode } = useTheme();

  const {
    sidebarCollapsed,
    activityBarVisible,
    selectedView,
    toggleSidebar,
    handleSidebarCollapsedChange,
    toggleActivityBar,
    handleViewChange
  } = useLayout();

  const { toggleLineWrapping } = useLineWrapping();

  // Initialize app
  const initializeApp = async () => {
    try {
      console.log("Initializing IrisNotes...");
      await loadDefaultNote();
    } catch (error) {
      console.error("Failed to initialize app:", error);
    }
  };

  // Setup keyboard shortcuts
  useShortcuts({
    onToggleSidebar: toggleSidebar,
    onToggleActivityBar: toggleActivityBar,
    onReloadNote: reloadDefaultNote,
    onToggleLineWrapping: toggleLineWrapping
  });

  // Initialize app and load user theme
  useEffect(() => {
    initializeApp();
    loadUserTheme();
  }, []);

  return (
    <div className="app">
      {/* Activity Bar */}
      <ActivityBar
        isVisible={activityBarVisible}
        selectedView={selectedView}
        onViewChange={handleViewChange}
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
        </div>
      </ResizableSidebar>

      {/* Main Content */}
      <div className="main-content">
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
      </div>
    </div>
  );
}

export default App;
