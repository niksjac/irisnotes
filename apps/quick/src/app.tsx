import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  content_preview: string;
  book_name: string | null;
  section_name: string | null;
  match_type: string;
  word_count: number;
}

interface Config {
  theme?: string;
}

// Apply theme to document
function applyTheme(themeName: string) {
  const root = document.documentElement;
  root.setAttribute("data-theme", themeName);
  
  // Determine if theme is dark (simple check based on known theme names)
  const darkThemes = [
    "default-dark", "nord", "catppuccin-mocha", 
    "tokyo-night", "gruvbox", "rose-pine"
  ];
  const isDark = darkThemes.includes(themeName);
  root.classList.toggle("dark", isDark);
  root.style.colorScheme = isDark ? "dark" : "light";
}

export function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  // Load theme from config on startup
  useEffect(() => {
    async function loadTheme() {
      try {
        const configJson = await invoke<string>("read_config");
        const config: Config = JSON.parse(configJson);
        if (config.theme) {
          applyTheme(config.theme);
        }
      } catch (err) {
        console.error("Failed to load theme config:", err);
        // Default to dark theme
        applyTheme("default-dark");
      }
    }
    loadTheme();
  }, []);

  // Focus input on mount and clear on window shown
  useEffect(() => {
    inputRef.current?.focus();
    
    // Listen for window-shown event to clear search and refresh theme
    const unlisten = listen("window-shown", async () => {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      inputRef.current?.focus();
      
      // Reload theme in case it changed in main app
      try {
        const configJson = await invoke<string>("read_config");
        const config: Config = JSON.parse(configJson);
        if (config.theme) {
          applyTheme(config.theme);
        }
      } catch (err) {
        console.error("Failed to reload theme:", err);
      }
    });
    
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current && results.length > 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedIndex, results.length]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const searchResults = await invoke<SearchResult[]>("search_notes", {
          query: query.trim(),
        });
        setResults(searchResults);
        setSelectedIndex(0);
      } catch (err) {
        console.error("Search error:", err);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  const openNote = useCallback(async (noteId: string) => {
    try {
      await invoke("open_note_in_main_app", { noteId });
      // Clear search state after opening
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      await invoke("hide_window");
    } catch (err) {
      console.error("Failed to open note:", err);
    }
  }, []);

  const handleKeyDown = useCallback(
    async (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "F1":
          e.preventDefault();
          setShowCheatSheet((v) => !v);
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (showCheatSheet) {
            setShowCheatSheet(false);
          } else if (results[selectedIndex]) {
            openNote(results[selectedIndex].id);
          }
          break;
        case "Escape":
          e.preventDefault();
          if (showCheatSheet) {
            setShowCheatSheet(false);
          } else {
            try {
              await invoke("hide_window");
            } catch (err) {
              console.error("Failed to hide window:", err);
            }
          }
          break;
      }
    },
    [results, selectedIndex, openNote, showCheatSheet]
  );

  const getMatchTypeLabel = (matchType: string) => {
    switch (matchType) {
      case "title": return "Title";
      case "content": return "Content";
      case "parent": return "Parent";
      case "root": return "Root";
      default: return "";
    }
  };

  const getMatchTypeTooltip = (matchType: string) => {
    switch (matchType) {
      case "title": return "Matched in note title";
      case "content": return "Matched in note content";
      case "parent": return "Note is inside a matching book/section";
      case "root": return "Note is at root level";
      default: return "";
    }
  };

  const formatWordCount = (count: number) => {
    if (count < 1) return "empty";
    if (count < 100) return `~${count}w`;
    if (count < 1000) return `~${Math.round(count / 10) * 10}w`;
    return `~${(count / 1000).toFixed(1)}k`;
  };

  return (
    <div className="app-container">
      {showCheatSheet && (
        <div className="cheat-sheet-overlay" onClick={() => setShowCheatSheet(false)}>
          <div className="cheat-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="cheat-sheet-header">
              <span>Search Syntax</span>
              <kbd>F1</kbd>
            </div>
            <div className="cheat-sheet-body">
              <div className="cheat-sheet-section">
                <div className="cheat-sheet-title">Filters</div>
                <div className="cheat-sheet-row"><kbd>hello</kbd><span>Search note titles</span></div>
                <div className="cheat-sheet-row"><kbd>~word</kbd><span>Search note content</span></div>
                <div className="cheat-sheet-row"><kbd>@book</kbd><span>Filter by book name</span></div>
                <div className="cheat-sheet-row"><kbd>#section</kbd><span>Filter by section name</span></div>
                <div className="cheat-sheet-row"><kbd>/</kbd><span>Root-level notes only</span></div>
              </div>
              <div className="cheat-sheet-section">
                <div className="cheat-sheet-title">Quoting</div>
                <div className="cheat-sheet-row"><kbd>@"My Book"</kbd><span>Use quotes for spaces</span></div>
              </div>
              <div className="cheat-sheet-section">
                <div className="cheat-sheet-title">Examples</div>
                <div className="cheat-sheet-row"><kbd>todo @work</kbd><span>"todo" in title, in "work" book</span></div>
                <div className="cheat-sheet-row"><kbd>~python #snippets</kbd><span>Content has "python", in "snippets" section</span></div>
                <div className="cheat-sheet-row"><kbd>/ meeting</kbd><span>"meeting" in title, root only</span></div>
              </div>
              <div className="cheat-sheet-section">
                <div className="cheat-sheet-title">Navigation</div>
                <div className="cheat-sheet-row"><kbd>↑ ↓</kbd><span>Navigate results</span></div>
                <div className="cheat-sheet-row"><kbd>Enter</kbd><span>Open selected note</span></div>
                <div className="cheat-sheet-row"><kbd>Esc</kbd><span>Close</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="search-box">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search notes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        {isLoading && <div className="loading-indicator">...</div>}
      </div>

      <div className="results-table" ref={resultsRef}>
        {results.map((result, index) => (
          <div
            key={result.id}
            className={`table-row ${index === selectedIndex ? "selected" : ""}`}
            onClick={() => openNote(result.id)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <span className="col-title" title={result.title}>{result.title}</span>
            <span className="col-book">
              {result.book_name ? (
                <span className="tag tag-book" title={result.book_name}>{result.book_name}</span>
              ) : (
                <span className="tag tag-root">Root</span>
              )}
            </span>
            <span className="col-section">
              {result.section_name && (
                <span className="tag tag-section" title={result.section_name}>{result.section_name}</span>
              )}
            </span>
            <span className="col-words" title={`Approximately ${result.word_count} words`}>
              {formatWordCount(result.word_count)}
            </span>
            <span 
              className={`col-match match-type-${result.match_type}`}
              title={getMatchTypeTooltip(result.match_type)}
            >
              {getMatchTypeLabel(result.match_type)}
            </span>
          </div>
        ))}

        {query && !isLoading && results.length === 0 && (
          <div className="no-results">No notes found</div>
        )}
      </div>
    </div>
  );
}
