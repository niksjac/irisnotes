import { useState, useEffect, useCallback, useLayoutEffect, useRef } from "react";
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

async function loadTheme() {
  try {
    const configJson = await invoke<string>("read_config");
    const config: Config = JSON.parse(configJson);
    if (config.theme) {
      applyTheme(config.theme);
    }
  } catch (err) {
    console.error("Failed to load theme config:", err);
    applyTheme("default-dark");
  }
}

/**
 * Launcher (Alt+Q via a Hyprland bind): only the input until something is
 * typed, then matching notes and a "Create" row. The window is sized to this
 * content, and hides on Escape, after acting, or when it loses focus.
 *
 * Enter opens the selected note (or creates one from the "Create" row);
 * Ctrl+Enter creates a note titled with the query and opens it in IrisNotes;
 * Tab adds a text field; Ctrl+Shift+Enter saves the note without opening
 * IrisNotes (quick capture).
 */
export function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  // Results for the current query have arrived at least once. Until then the
  // panel stays closed, so the window grows once instead of in two steps.
  const [searched, setSearched] = useState(false);
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [showBody, setShowBody] = useState(false);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  const trimmed = query.trim();
  // The "Create" row sits after the results
  const createIndex = results.length;
  const rowCount = trimmed ? results.length + 1 : 0;

  const reset = useCallback(() => {
    setQuery("");
    setResults([]);
    setSearched(false);
    setSelectedIndex(0);
    setShowBody(false);
    setBody("");
    setShowCheatSheet(false);
    setStatus(null);
  }, []);

  const hide = useCallback(async () => {
    try {
      await invoke("hide_window");
    } catch (err) {
      console.error("Failed to hide window:", err);
    }
  }, []);

  useEffect(() => {
    loadTheme();
  }, []);

  // Fresh state every time the launcher is shown
  useEffect(() => {
    inputRef.current?.focus();
    const unlisten = listen("window-shown", async () => {
      reset();
      inputRef.current?.focus();
      // Reload theme in case it changed in main app
      await loadTheme();
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, [reset]);

  // Size the window to the content
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      const height = Math.ceil(el.getBoundingClientRect().height);
      invoke("resize_launcher", { height }).catch((err) => console.error("Failed to resize:", err));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    const row = resultsRef.current?.children[selectedIndex] as HTMLElement | undefined;
    row?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex, rowCount]);

  // Debounced search
  useEffect(() => {
    if (!trimmed) {
      setResults([]);
      setSearched(false);
      setSelectedIndex(0);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const searchResults = await invoke<SearchResult[]>("search_notes", { query: trimmed });
        setResults(searchResults);
        setSelectedIndex(0);
      } catch (err) {
        console.error("Search error:", err);
        setResults([]);
      } finally {
        setSearched(true);
        setIsLoading(false);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [trimmed]);

  const openNote = useCallback(async (noteId: string) => {
    try {
      await invoke("open_note_in_main_app", { noteId });
      reset();
      await hide();
    } catch (err) {
      setStatus({ kind: "error", text: `Could not open the note: ${err}` });
    }
  }, [reset, hide]);

  const createAndOpen = useCallback(async () => {
    if (!trimmed) return;
    try {
      await invoke("create_note_in_main_app", { title: trimmed });
      reset();
      await hide();
    } catch (err) {
      setStatus({ kind: "error", text: `Could not create the note: ${err}` });
    }
  }, [trimmed, reset, hide]);

  const capture = useCallback(async () => {
    if (!trimmed && !body.trim()) return;
    try {
      await invoke<string>("capture_note", { title: trimmed, body });
      setStatus({ kind: "ok", text: `Saved “${trimmed || "Untitled Note"}”` });
      // Long enough to see it was saved
      setTimeout(() => {
        reset();
        hide();
      }, 600);
    } catch (err) {
      setStatus({ kind: "error", text: String(err) });
    }
  }, [trimmed, body, reset, hide]);

  const openBody = useCallback(() => {
    setShowBody(true);
    setShowCheatSheet(false);
    requestAnimationFrame(() => bodyRef.current?.focus());
  }, []);

  const closeBody = useCallback(() => {
    setShowBody(false);
    inputRef.current?.focus();
  }, []);

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        capture();
        return;
      }
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        createAndOpen();
        return;
      }
      switch (e.key) {
        case "F1":
          e.preventDefault();
          setShowCheatSheet((v) => !v);
          break;
        case "Tab":
          e.preventDefault();
          openBody();
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, rowCount - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter": {
          e.preventDefault();
          const result = results[selectedIndex];
          if (result) openNote(result.id);
          else if (selectedIndex === createIndex) createAndOpen();
          break;
        }
        case "Escape":
          e.preventDefault();
          if (showCheatSheet) setShowCheatSheet(false);
          else hide();
          break;
      }
    },
    [results, selectedIndex, rowCount, createIndex, showCheatSheet, openNote, createAndOpen, capture, openBody, hide]
  );

  const handleBodyKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        capture();
      } else if (e.key === "Escape" || (e.key === "Tab" && e.shiftKey)) {
        e.preventDefault();
        closeBody();
      }
    },
    [capture, closeBody]
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
    <div className="app-container" ref={containerRef}>
      <div className="search-box">
        <input
          ref={inputRef}
          type="text"
          placeholder="Open a note… (Tab: add text, F1: help)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setStatus(null);
          }}
          onKeyDown={handleInputKeyDown}
          autoFocus
        />
        {isLoading && <div className="loading-indicator">…</div>}
      </div>

      {showBody && (
        <div className="capture-box">
          <textarea
            ref={bodyRef}
            rows={4}
            placeholder="Note text (one line per paragraph)"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleBodyKeyDown}
          />
        </div>
      )}

      {showCheatSheet && (
        <div className="cheat-sheet">
          <div className="cheat-sheet-body">
            <div className="cheat-sheet-section">
              <div className="cheat-sheet-title">Filters</div>
              <div className="cheat-sheet-row"><kbd>hello</kbd><span>Search note titles</span></div>
              <div className="cheat-sheet-row"><kbd>foo bar</kbd><span>Multiple words match independently (AND)</span></div>
              <div className="cheat-sheet-row"><kbd>~word</kbd><span>Search note content</span></div>
              <div className="cheat-sheet-row"><kbd>@book</kbd><span>Filter by book name</span></div>
              <div className="cheat-sheet-row"><kbd>#section</kbd><span>Filter by section name</span></div>
              <div className="cheat-sheet-row"><kbd>/</kbd><span>Root-level notes only</span></div>
              <div className="cheat-sheet-row"><kbd>@"My Book"</kbd><span>Use quotes for spaces</span></div>
            </div>
            <div className="cheat-sheet-section">
              <div className="cheat-sheet-title">Keys</div>
              <div className="cheat-sheet-row"><kbd>↑ ↓ Enter</kbd><span>Open the selected note</span></div>
              <div className="cheat-sheet-row"><kbd>Ctrl+Enter</kbd><span>Create a note with this title and open it</span></div>
              <div className="cheat-sheet-row"><kbd>Tab</kbd><span>Add text to a new note</span></div>
              <div className="cheat-sheet-row"><kbd>Ctrl+Shift+Enter</kbd><span>Save the new note without opening IrisNotes</span></div>
              <div className="cheat-sheet-row"><kbd>Esc</kbd><span>Close</span></div>
            </div>
          </div>
        </div>
      )}

      {trimmed && searched && !showCheatSheet && (
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
          <div
            className={`create-row ${selectedIndex === createIndex ? "selected" : ""}`}
            onClick={createAndOpen}
            onMouseEnter={() => setSelectedIndex(createIndex)}
          >
            <span className="create-plus">+</span>
            <span className="create-label">Create note “{trimmed}”</span>
            <kbd>Ctrl+Enter</kbd>
          </div>
        </div>
      )}

      {((trimmed && searched) || showBody || status) && (
        <div className={`hint-bar ${status ? `hint-${status.kind}` : ""}`}>
          {status ? (
            status.text
          ) : (
            <>
              <span><kbd>Enter</kbd> open</span>
              <span><kbd>Ctrl+Enter</kbd> create &amp; open</span>
              <span><kbd>Ctrl+Shift+Enter</kbd> save without opening</span>
              {!showBody && <span><kbd>Tab</kbd> add text</span>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
