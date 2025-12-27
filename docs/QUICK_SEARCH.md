# IrisNotes Quick Search

A lightweight, always-available search overlay for instant note access via system-wide hotkey.

## Overview

Quick Search is a minimal UI that provides instant search across all your notes without opening the full IrisNotes application. Think of it like Spotlight (macOS) or Albert (Linux), but specifically for your notes.

**Key Features:**
- **Instant Launch**: Bound to system hotkey (e.g., `Super+Space`)
- **System Tray**: Runs in background for zero-latency activation
- **Fast Search**: FTS5-powered search-as-you-type
- **Note Preview**: See content snippets before opening
- **Open in Main App**: Seamlessly transition to full editor

---

## Architecture Decision

### ✅ **Recommended: Separate Lightweight Tauri App**

Create `irisnotes-quick` as a standalone Tauri application alongside the main app.

**Project Structure:**
```
irisnotes/                    # Main app
irisnotes-quick/              # Quick search overlay
├── src-tauri/
│   ├── src/
│   │   ├── main.rs          # Minimal backend
│   │   └── lib.rs
│   └── Cargo.toml
├── src/
│   ├── main.tsx             # Entry point
│   ├── search-bar.tsx       # Main UI component
│   ├── result-item.tsx      # Search result component
│   └── hooks/
│       ├── use-search.ts    # FTS search logic
│       └── use-hotkey.ts    # Global hotkey handling
├── package.json
└── tauri.conf.json          # Minimal config
```

---

## Why Separate App?

| Aspect | Separate App | Main App Mode |
|--------|--------------|---------------|
| **Startup Time** | ~50ms (minimal) | ~500ms+ (full app) |
| **Memory** | ~20MB | ~80MB+ |
| **Independence** | Works when main closed | Requires main running |
| **Maintenance** | Separate codebase | Same codebase |
| **Complexity** | Higher initial setup | Lower initial setup |

**Verdict**: Separate app provides the "instant" UX that makes this feature valuable.

---

## UI Design

### Window Specifications

```typescript
// tauri.conf.json
{
  "windows": [{
    "title": "IrisNotes Quick Search",
    "width": 600,
    "height": 400,
    "center": true,
    "resizable": false,
    "decorations": false,  // frameless
    "alwaysOnTop": true,
    "skipTaskbar": true,
    "transparent": true,
    "visible": false,       // hidden by default
    "focus": true
  }]
}
```

### Visual Layout

```
┌─────────────────────────────────────────────────┐
│  🔍  Search your notes...                    ⌘K │ ← Search input
├─────────────────────────────────────────────────┤
│  📄 React Best Practices                        │
│     📂 Reading List → Articles                  │
│     ...Modern React patterns and performance... │ ← Result preview
├─────────────────────────────────────────────────┤
│  📄 Project A Notes                             │
│     📂 Work → Projects                          │
│     ...TODO: Optimize React component...        │
├─────────────────────────────────────────────────┤
│  📄 Learning Goals                              │
│     📂 Personal → Ideas                         │
│     ...Master React performance optimization... │
└─────────────────────────────────────────────────┘
       ↑ Keyboard navigation (↑↓ + Enter)
```

---

## Features

### 1. Search-as-You-Type
```typescript
// Debounced FTS5 query
const searchQuery = `
  SELECT 
    i.id,
    i.title,
    snippet(items_fts, 1, '<mark>', '</mark>', '...', 32) as snippet,
    CASE 
      WHEN p.type = 'section' THEN pp.title
      ELSE p.title
    END as book_name,
    CASE 
      WHEN p.type = 'section' THEN p.title
      ELSE NULL
    END as section_name,
    rank
  FROM items_fts fts
  JOIN items i ON fts.id = i.id
  LEFT JOIN items p ON i.parent_id = p.id
  LEFT JOIN items pp ON p.parent_id = pp.id
  WHERE items_fts MATCH ?
    AND i.type = 'note'
    AND i.deleted_at IS NULL
    AND i.archived_at IS NULL
  ORDER BY rank
  LIMIT 10
`;
```

**Performance:**
- Debounce: 150ms
- Max results: 10
- Cancel previous queries on new input

### 2. Keyboard Navigation
```
ESC       - Close overlay
↑ / ↓     - Navigate results
Enter     - Open selected note in main app
⌘+Enter   - Open in new window
Tab       - Cycle through result details
```

### 3. System Tray Integration

**Tray Icon States:**
- **Default**: IrisNotes logo (gray)
- **Active Search**: Logo (colored)
- **Update Available**: Badge indicator

**Tray Menu:**
```
IrisNotes Quick Search
├─ Show Search (⌘+Space)
├─ Open Main App
├─ Recent Notes ▶
│  ├─ Note 1
│  ├─ Note 2
│  └─ Note 3
├─ ─────────────
├─ Preferences
└─ Quit
```

### 4. Global Hotkey

**Registration (Tauri):**
```rust
// src-tauri/src/main.rs
use tauri_plugin_global_shortcut::GlobalShortcutExt;

let app_handle = app.handle();
app.global_shortcut()
    .on_shortcut("Super+Space", move |_app, _shortcut, _event| {
        let window = app_handle.get_webview_window("main").unwrap();
        if window.is_visible().unwrap() {
            window.hide().unwrap();
        } else {
            window.show().unwrap();
            window.set_focus().unwrap();
        }
    })
    .unwrap();
```

**Configuration:**
```json
// User can customize in settings
{
  "hotkey": "Super+Space",
  "alternatives": ["CommandOrControl+K", "Alt+Space"]
}
```

---

## Platform Integration

### Linux (Hyprland)

**Option 1: Tauri Global Shortcut**
```rust
// Handled by Tauri plugin - works across compositors
```

**Option 2: Hyprland Config** (Backup)
```bash
# ~/.config/hypr/hyprland.conf
bind = SUPER, SPACE, exec, irisnotes-quick --toggle

# Or via D-Bus
bind = SUPER, SPACE, exec, dbus-send --session \
  --dest=com.irisnotes.quick \
  --type=method_call \
  /com/irisnotes/quick \
  com.irisnotes.quick.Toggle
```

### macOS

```bash
# Tauri handles global shortcuts natively
# Falls back to Accessibility permissions if needed
```

### Windows

```bash
# Tauri handles via Windows API
# RegisterHotKey system call
```

---

## Database Access

### Shared Database Strategy

```typescript
// Both apps read from same SQLite database
const DB_PATH = {
  linux: '~/.local/share/com.irisnotes.app/notes.db',
  macos: '~/Library/Application Support/com.irisnotes.app/notes.db',
  windows: '%APPDATA%/com.irisnotes.app/notes.db'
};
```

**Concurrency Handling:**
- Quick Search: **READ-ONLY** access
- SQLite handles multiple readers efficiently
- No write conflicts (main app owns writes)

### Rust Backend (Tauri Commands)

```rust
// src-tauri/src/main.rs
use rusqlite::{Connection, params};

#[tauri::command]
fn search_notes(query: String) -> Result<Vec<SearchResult>, String> {
    let db = Connection::open(get_db_path())?;
    
    let mut stmt = db.prepare("
        SELECT i.id, i.title, 
               snippet(items_fts, 1, '<mark>', '</mark>', '...', 32) as snippet
        FROM items_fts fts
        JOIN items i ON fts.id = i.id
        WHERE items_fts MATCH ?1 AND i.type = 'note'
        ORDER BY rank LIMIT 10
    ")?;
    
    let results = stmt.query_map([&query], |row| {
        Ok(SearchResult {
            id: row.get(0)?,
            title: row.get(1)?,
            snippet: row.get(2)?,
        })
    })?;
    
    Ok(results.collect())
}
```

---

## Opening Notes in Main App

### URL Protocol Handler

Register custom protocol: `irisnotes://`

```bash
# Main app registers protocol on install
irisnotes://open/note/<note-id>
irisnotes://open/note/<note-id>?window=new
irisnotes://search/<query>
```

### Implementation

**Quick Search → Main App:**
```typescript
// In Quick Search app
const openNote = async (noteId: string) => {
  await invoke('open_note_in_main_app', { noteId });
  // Hide quick search window
  await appWindow.hide();
};
```

**Rust Command:**
```rust
#[tauri::command]
fn open_note_in_main_app(note_id: String) -> Result<(), String> {
    // Launch main app with deep link
    #[cfg(target_os = "linux")]
    std::process::Command::new("xdg-open")
        .arg(format!("irisnotes://open/note/{}", note_id))
        .spawn()
        .map_err(|e| e.to_string())?;
    
    #[cfg(target_os = "macos")]
    std::process::Command::new("open")
        .arg(format!("irisnotes://open/note/{}", note_id))
        .spawn()
        .map_err(|e| e.to_string())?;
    
    Ok(())
}
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Create new Tauri project (`irisnotes-quick`)
- [ ] Setup minimal window (frameless, always-on-top)
- [ ] Implement search input component
- [ ] Connect to shared SQLite database

### Phase 2: Search (Week 2)
- [ ] Implement FTS5 search query
- [ ] Build result list component
- [ ] Add keyboard navigation
- [ ] Implement snippet highlighting

### Phase 3: Integration (Week 3)
- [ ] Global shortcut registration
- [ ] System tray icon + menu
- [ ] Deep linking to main app
- [ ] Auto-start on system boot

### Phase 4: Polish (Week 4)
- [ ] Smooth animations (fade in/out)
- [ ] Recent searches cache
- [ ] Fuzzy matching fallback
- [ ] Theme support (light/dark)
- [ ] Settings panel

---

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| **Cold Start** | < 100ms | From hotkey press to visible |
| **Search Latency** | < 50ms | Query execution time |
| **Memory (Idle)** | < 20MB | Background process |
| **Memory (Active)** | < 40MB | With results loaded |

---

## Code Sharing Strategy

### Shared Workspace Package

```
packages/
├── shared/
│   ├── types/          # TypeScript types
│   │   ├── items.ts
│   │   └── search.ts
│   ├── queries/        # SQL queries
│   │   └── search.ts
│   └── utils/
│       └── db-path.ts
```

**Usage in Both Apps:**
```json
// irisnotes/package.json & irisnotes-quick/package.json
{
  "dependencies": {
    "@irisnotes/shared": "workspace:*"
  }
}
```

---

## Security Considerations

1. **Read-Only Access**: Quick Search never writes to database
2. **Process Isolation**: Separate from main app process
3. **No Network**: Purely local operations
4. **Sandboxing**: Tauri security features enabled

---

## Alternative: Single App with Popup Mode

If you prefer not to maintain two apps:

```bash
# Launch main app in minimal mode
irisnotes --quick-search
```

**Pros:**
- Single codebase
- Shared state management

**Cons:**
- Slower startup (~300-500ms)
- Higher memory usage
- Can't use while main app is open

**Implementation:**
```rust
// Check for --quick-search flag
let args: Vec<String> = std::env::args().collect();
if args.contains(&"--quick-search".to_string()) {
    // Launch minimal window
    create_quick_search_window(app);
} else {
    // Launch full app
    create_main_window(app);
}
```

---

## Testing Strategy

### Unit Tests
- Search query parsing
- Result ranking algorithm
- Keyboard navigation state

### Integration Tests
- Database connection
- Main app launching
- Hotkey registration

### E2E Tests
- Full workflow: Hotkey → Search → Open note
- Multi-monitor support
- Focus management

---

## Distribution

### Standalone Executable
```bash
# Build both apps
cd irisnotes && pnpm tauri build
cd ../irisnotes-quick && pnpm tauri build

# Package together
# Linux: .deb / .AppImage
# macOS: .dmg (both .app bundles)
# Windows: .msi (both .exe)
```

### Auto-Update
```json
// tauri.conf.json
{
  "updater": {
    "active": true,
    "endpoints": ["https://releases.irisnotes.app/quick/{{target}}/{{current_version}}"]
  }
}
```

---

## Future Enhancements

- **Inline Note Creation**: Create notes directly from quick search
- **Recent Notes**: Show recently opened notes without search
- **Clipboard Integration**: Search clipboard history
- **AI Suggestions**: Context-aware note suggestions
- **Multi-Select**: Open multiple notes at once
- **Quick Actions**: Archive, delete, tag from overlay
- **Preview Panel**: Show full note content in split view
- **Cross-Platform Sync Indicator**: Show sync status in tray

---

## User Preferences

```json
// ~/.config/irisnotes/quick-search.json
{
  "hotkey": "Super+Space",
  "maxResults": 10,
  "showBreadcrumbs": true,
  "showSnippets": true,
  "theme": "auto",
  "position": "center",  // or "cursor"
  "autoHideDelay": 5000,
  "soundEnabled": false
}
```

---

## Accessibility

- **Keyboard-Only Navigation**: Full functionality without mouse
- **Screen Reader Support**: ARIA labels on all elements
- **High Contrast Mode**: Support system theme
- **Font Scaling**: Respect system font size settings
