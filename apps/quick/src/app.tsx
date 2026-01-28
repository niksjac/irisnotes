import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";

interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  book_name: string | null;
  section_name: string | null;
}

export function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
      // Hide window after opening
      await invoke("hide_window");
    } catch (err) {
      console.error("Failed to open note:", err);
    }
  }, []);

  const handleKeyDown = useCallback(
    async (e: React.KeyboardEvent) => {
      switch (e.key) {
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
          if (results[selectedIndex]) {
            openNote(results[selectedIndex].id);
          }
          break;
        case "Escape":
          e.preventDefault();
          try {
            await invoke("hide_window");
          } catch (err) {
            console.error("Failed to hide window:", err);
          }
          break;
      }
    },
    [results, selectedIndex, openNote]
  );

  return (
    <div className="app-container">
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

      <div className="results">
        {results.map((result, index) => (
          <div
            key={result.id}
            className={`result-item ${index === selectedIndex ? "selected" : ""}`}
            onClick={() => openNote(result.id)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <div className="result-title">{result.title}</div>
            <div className="result-path">
              {result.book_name && <span className="book-name">{result.book_name}</span>}
              {result.section_name && (
                <>
                  <span className="separator">/</span>
                  <span className="section-name">{result.section_name}</span>
                </>
              )}
            </div>
            <div
              className="result-snippet"
              dangerouslySetInnerHTML={{ __html: result.snippet }}
            />
          </div>
        ))}

        {query && !isLoading && results.length === 0 && (
          <div className="no-results">No notes found</div>
        )}
      </div>

      <div className="hints">
        <span>↑↓ navigate</span>
        <span>↵ open</span>
        <span>esc close</span>
      </div>
    </div>
  );
}
