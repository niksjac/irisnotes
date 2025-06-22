import { useState, useEffect } from "react";
import { appConfigDir } from "@tauri-apps/api/path";
import { readTextFile, exists } from "@tauri-apps/plugin-fs";
import { PanelLeft, FileText, Search, Plus, } from "lucide-react";
import clsx from "clsx";
import { EditorContainer } from "./features/editor";
import { ActivityBar } from "./features/activity-bar";
import { ResizableSidebar } from "./features/sidebar";
import "./App.css";

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

function App() {
  // Create a default "hot note" that's always available
  const defaultNote: Note = {
    id: "default-hot-note",
    title: "Quick Notes",
    content: `
      <p><span style="color: #e74c3c;">This is a red paragraph.</span></p>
      <p><span style="color: #27ae60;">This is a green paragraph.</span></p>
      <p><span style="color: #3498db;">This is a blue paragraph.</span></p>
      <p><a href="https://www.google.com">This is a link</a></p>
    `,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [activityBarVisible, setActivityBarVisible] = useState(true);
  const [selectedView, setSelectedView] = useState("1");
  const [darkMode, setDarkMode] = useState(false);
  const [notes, setNotes] = useState<Note[]>([defaultNote]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>("default-hot-note");
  const [searchQuery, setSearchQuery] = useState("");

  // Initialize app and load user theme
  useEffect(() => {
    initializeApp();
    loadUserTheme();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'b':
            e.preventDefault();
            setSidebarCollapsed(prev => !prev);
            break;
          case 'j':
            e.preventDefault();
            setActivityBarVisible(prev => !prev);
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize database and load notes
      console.log("Initializing IrisNotes...");
      // We'll implement database operations later
    } catch (error) {
      console.error("Failed to initialize app:", error);
    }
  };

  const loadUserTheme = async () => {
    try {
      const configDir = await appConfigDir();
      const themePath = `${configDir}/theme.css`;

      if (await exists(themePath)) {
        const themeCSS = await readTextFile(themePath);

        // Remove existing user theme
        const existingStyle = document.getElementById('user-theme-styles');
        if (existingStyle) {
          existingStyle.remove();
        }

        // Inject user theme
        const styleElement = document.createElement('style');
        styleElement.id = 'user-theme-styles';
        styleElement.textContent = themeCSS;
        document.head.appendChild(styleElement);

        console.log("User theme loaded successfully");
      }
    } catch (error) {
      console.error("Failed to load user theme:", error);
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleSidebarCollapsedChange = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  };

  const toggleActivityBar = () => {
    setActivityBarVisible(!activityBarVisible);
  };

  const handleViewChange = (view: string) => {
    setSelectedView(view);
    if (sidebarCollapsed) {
      setSidebarCollapsed(false);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.setAttribute('data-theme', darkMode ? 'light' : 'dark');
  };

  const createNewNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: "Untitled Note",
      content: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setNotes([newNote, ...notes]);
    setSelectedNoteId(newNote.id);
  };

  const updateNoteTitle = (noteId: string, title: string) => {
    setNotes(notes.map(note =>
      note.id === noteId
        ? { ...note, title, updated_at: new Date().toISOString() }
        : note
    ));
  };

  const updateNoteContent = (noteId: string, content: string) => {
    setNotes(notes.map(note =>
      note.id === noteId
        ? { ...note, content, updated_at: new Date().toISOString() }
        : note
    ));
  };

  const selectedNote = notes.find(note => note.id === selectedNoteId);

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
