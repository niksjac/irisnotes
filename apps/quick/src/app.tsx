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
  match_type: "title" | "content" | "parent";
  word_count: number;
}

export function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  // Focus input on mount and clear on window shown
  useEffect(() => {
    inputRef.current?.focus();
    
    // Listen for window-shown event to clear search
    const unlisten = listen("window-shown", () => {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      inputRef.current?.focus();
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

  const getMatchTypeLabel = (matchType: string) => {
    switch (matchType) {
      case "title": return "Title";
      case "content": return "Content";
      case "parent": return "Parent";
      default: return "";
    }
  };

  const getMatchTypeTooltip = (matchType: string) => {
    switch (matchType) {
      case "title": return "Matched in note title";
      case "content": return "Matched in note content";
      case "parent": return "Note is inside a matching book/section";
      default: return "";
    }
  };

  const formatWordCount = (count: number) => {
    if (count < 1) return "empty";
    if (count < 100) return `~${count}w`;
    if (count < 1000) return `~${Math.round(count / 10) * 10}w`;
    return `~${(count / 1000).toFixed(1)}k`;
  };

  const getLocation = (result: SearchResult) => {
    if (result.book_name && result.section_name) {
      return `${result.book_name} / ${result.section_name}`;
    }
    if (result.book_name) {
      return result.book_name;
    }
    return "—";
  };

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

      <div className="results-table" ref={resultsRef}>
        {results.length > 0 && (
          <div className="table-header">
            <span className="col-title">Title</span>
            <span className="col-location">Location</span>
            <span className="col-preview">Content</span>
            <span className="col-words">Words</span>
            <span className="col-match">Match</span>
          </div>
        )}
        {results.map((result, index) => (
          <div
            key={result.id}
            className={`table-row ${index === selectedIndex ? "selected" : ""}`}
            onClick={() => openNote(result.id)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <span className="col-title" title={result.title}>{result.title}</span>
            <span className="col-location" title={getLocation(result)}>{getLocation(result)}</span>
            <span className="col-preview" title={result.content_preview}>{result.content_preview}</span>
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

      <div className="hints">
        <span>↑↓ navigate</span>
        <span>↵ open</span>
        <span>esc close</span>
      </div>
    </div>
  );
}
