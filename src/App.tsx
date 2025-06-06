import { useState, useEffect } from "react";
// import { invoke } from "@tauri-apps/api/core";
import { appConfigDir } from "@tauri-apps/api/path";
import { readTextFile, exists } from "@tauri-apps/plugin-fs";
import {
  PanelLeft,
  FileText,
  Search,
  Plus,
  Settings,
  Moon,
  Sun,
  Menu
} from "lucide-react";
import clsx from "clsx";
import { RichTextEditor } from "./components/RichTextEditor";
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
    `,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notes, setNotes] = useState<Note[]>([defaultNote]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>("default-hot-note");
  const [searchQuery, setSearchQuery] = useState("");

  // Initialize app and load user theme
  useEffect(() => {
    initializeApp();
    loadUserTheme();
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
      {/* Sidebar */}
      <div className={clsx("sidebar", { collapsed: sidebarCollapsed })}>
        <div className="sidebar-header" style={{
          padding: 'var(--iris-space-md)',
          borderBottom: '1px solid var(--iris-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--iris-space-sm)'
        }}>
          {!sidebarCollapsed && (
            <>
              <FileText size={20} />
              <h2 style={{ margin: 0, fontSize: 'var(--iris-font-size-lg)' }}>
                IrisNotes
              </h2>
            </>
          )}
          <button
            className="btn"
            onClick={toggleSidebar}
            style={{ marginLeft: 'auto' }}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <PanelLeft size={16} />
          </button>
        </div>

        {!sidebarCollapsed && (
          <>
            {/* Search */}
            <div style={{ padding: 'var(--iris-space-md)' }}>
              <div style={{ position: 'relative' }}>
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 'var(--iris-space-sm)',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--iris-text-2)'
                  }}
                />
                <input
                  className="input"
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '2.5rem', width: '100%' }}
                />
              </div>
            </div>

            {/* Notes List */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '0 var(--iris-space-md)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--iris-space-sm)'
              }}>
                <h3 style={{ margin: 0, color: 'var(--iris-text-2)' }}>Notes</h3>
                <button
                  className="btn primary"
                  onClick={createNewNote}
                  title="Create new note"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--iris-space-xs)' }}>
                {notes.map((note) => (
                    <div
                      key={note.id}
                      className={clsx("note-item", { active: selectedNoteId === note.id })}
                      onClick={() => setSelectedNoteId(note.id)}
                      style={{
                        padding: 'var(--iris-space-sm)',
                        border: '1px solid var(--iris-border)',
                        borderRadius: 'var(--iris-radius-sm)',
                        cursor: 'pointer',
                        backgroundColor: selectedNoteId === note.id ? 'var(--iris-primary)' : 'var(--iris-surface)',
                        color: selectedNoteId === note.id ? 'white' : 'var(--iris-text)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <h4 style={{ margin: '0 0 4px 0', fontSize: 'var(--iris-font-size-base)' }}>
                        {note.title}
                      </h4>
                      <p style={{
                        margin: 0,
                        fontSize: 'var(--iris-font-size-base)',
                        opacity: 0.7,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {note.content || "No content"}
                      </p>
                    </div>
                  ))}
                </div>
            </div>
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Toolbar */}
        <div className="toolbar">
          {sidebarCollapsed && (
            <button
              className="btn"
              onClick={toggleSidebar}
              title="Show sidebar"
            >
              <Menu size={16} />
            </button>
          )}

          <div style={{ flex: 1 }}>
            {selectedNote && (
              <input
                className="input"
                type="text"
                value={selectedNote.title}
                onChange={(e) => updateNoteTitle(selectedNote.id, e.target.value)}
                style={{
                  fontSize: 'var(--iris-font-size-lg)',
                  fontWeight: 'bold',
                  border: 'none',
                  background: 'transparent',
                  width: '300px'
                }}
                placeholder="Note title..."
              />
            )}
          </div>

          <div style={{ display: 'flex', gap: 'var(--iris-space-sm)' }}>
            <button
              className="btn"
              onClick={toggleDarkMode}
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button className="btn" title="Settings">
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* Editor Container */}
        <div className="editor-container">
          {selectedNote && (
            <RichTextEditor
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
