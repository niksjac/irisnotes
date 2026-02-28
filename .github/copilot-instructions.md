# IrisNotes AI Assistant Guide

## Architecture Overview

IrisNotes is a **pnpm monorepo** containing multiple applications built around a shared SQLite database. The main app is a **Tauri v2 desktop notes app** with a React frontend. The app uses a **unified hierarchical structure**: Books → Sections → Notes stored in a single SQLite `items` table.

### Monorepo Apps
- **`apps/main`** - The primary Tauri desktop app (rich text editor, sidebar, tabs, panes)
- **`apps/quick`** - Quick Search overlay — a separate lightweight Tauri window for fast note lookup
- **`apps/cli`** - Bun-based CLI tool (`iris`) for searching, listing, and reading notes from the terminal

### Core Technology Stack
- **Frontend**: React 19 + TypeScript + Tailwind CSS v4 + Jotai (state management)
- **Backend**: Tauri v2 (Rust) + SQLite
- **Editor**: ProseMirror (rich text) + CodeMirror 6 (source view)
- **Build**: Vite + pnpm workspaces
- **CLI**: Bun + Commander.js

## Critical Development Workflows

### Database Setup
```bash
# ALWAYS run this after schema changes or fresh checkout
./dev/setup-dev-db.sh
```
- Creates `/dev/notes.db` from `/schema/base.sql` + `/schema/seed-dev.sql`
- Schema is the SINGLE SOURCE OF TRUTH at `/schema/base.sql`

### Development Commands
```bash
pnpm dev                # Start both main + quick apps concurrently
pnpm main               # Start main Tauri app only
pnpm quick              # Start quick search app only
pnpm run type-check     # TypeScript validation (main app)
pnpm test               # Run unit tests (vitest)
pnpm test:e2e           # Run end-to-end tests (Playwright)
pnpm build              # Build both main + quick apps
```

## Key Architecture Patterns

### 1. Unified Items Model
Single `items` table for all content types:
```sql
-- items table supports: type IN ('note', 'book', 'section')
-- Hierarchy: parent_id references items(id)
-- Books: always at root (parent_id IS NULL)
-- Sections: always under a book
-- Notes: can be at root, under books, OR under sections
-- Notes CANNOT be inside other notes (enforced by trigger)
```

### 2. Jotai State Management
State is organized in `apps/main/src/atoms/`:
- `atoms/items.ts` - Main data atoms for the unified items system
- `atoms/panes.ts` - Multi-pane layout state
- `atoms/tree.ts` - Tree view state
- `atoms/settings.ts` - App settings
- `atoms/actions.ts` - Action atoms (create, delete, move items)
- `atoms/editor-stats.ts` - Editor statistics (word count, etc.)
- `atoms/search.ts` - Search state

### 3. Storage
`apps/main/src/storage/` provides a SQLite-only storage layer:
- `SQLiteStorageAdapter` in `adapters/sqlite-adapter.ts` - the sole production adapter
- Factory pattern in `factory.ts` (SQLite only — JSON adapters were removed)
- `export-import.ts` - File-based export/import for backup
- `hierarchy.ts` - Item hierarchy utilities

### 4. View System
Views in `apps/main/src/views/` are switched based on selection:
- `editor-rich-view.tsx` - ProseMirror rich text editor
- `editor-source-view.tsx` - CodeMirror source editor
- `config-view.tsx` - App settings
- `hotkeys-view.tsx` - Keyboard shortcuts (dynamic, pulls from all sources)
- `book-view.tsx` - Book detail/content view
- `section-view.tsx` - Section detail/content view

When no tab is active, `view.tsx` returns `null` (no dedicated empty view component).

### 5. Editor Architecture

**Line-Based Model**: The ProseMirror editor treats each paragraph as a "line":
- No soft line breaks (`hard_break` removed from schema)
- No semantic heading nodes (h1-h6 parsed as paragraphs for legacy content migration)
- Enter and Shift+Enter both create new blocks
- Empty lines create visual separation

**Schema** (`apps/main/src/components/editor/schema.ts`):
- Marks: bold (strong), italic (em), code, underline, strikethrough, textColor, highlight, fontSize, fontFamily, link
- Nodes: paragraph, blockquote, horizontal_rule, code_block, image, text, list nodes (via `addListNodes`)
- No heading node — use fontSize mark instead

**Line Commands** (`apps/main/src/components/editor/plugins/line-commands.ts`):
- `Alt+↑/↓` - Move line up/down
- `Alt+Shift+↑/↓` - Duplicate line up/down
- `Ctrl+D` - Select word / next occurrence
- `Ctrl+Shift+D` - Select previous occurrence
- `Shift+Delete` - Delete line
- `Ctrl+A` - Smart select all (progressive: line → paragraph → all)

**Additional Editor Plugins** (`apps/main/src/components/editor/plugins/`):
- `active-line.ts` - Active line highlighting
- `autolink.ts` - Automatic URL detection and linking
- `custom-cursor.ts` - Custom cursor styling
- `search.ts` - In-editor search
- `tight-selection.ts` - Selection behavior customization

## Project-Specific Conventions

### File Organization
```
apps/
├── main/                    # Primary Tauri desktop app
│   └── src/
│       ├── atoms/           # Jotai state atoms
│       ├── components/      # React components by UI area
│       │   ├── activity-bar/  # Left activity bar
│       │   ├── dialogs/       # Modal dialogs
│       │   ├── editor/        # ProseMirror/CodeMirror components
│       │   ├── logos/         # Logo components
│       │   ├── panes/         # Multi-pane layout
│       │   ├── right-click-menu/ # Context menu
│       │   ├── sidebar/       # Sidebar & tree header
│       │   ├── status-bar/    # Bottom status bar
│       │   ├── tabs/          # Tab management
│       │   └── tree/          # Tree view
│       ├── config/          # Configuration (default-hotkeys.ts, editor-hotkeys.ts)
│       ├── hooks/           # Custom React hooks
│       ├── storage/         # Storage adapter (SQLite) & types
│       ├── types/           # TypeScript definitions
│       ├── utils/           # Pure utility functions
│       ├── views/           # Top-level view components
│       └── styles/          # CSS (tailwind.css, theme.css, prosemirror.css)
├── quick/                   # Quick Search overlay app
│   └── src/
│       ├── app.tsx          # Quick search UI
│       └── main.tsx         # Entry point
├── cli/                     # CLI tool
│   └── src/
│       ├── index.ts         # CLI commands (list, search, show, open, etc.)
│       └── db.ts            # Database access for CLI
schema/                      # Database schema (single source of truth)
dev/                         # Development config & database
docs/                        # Documentation
scripts/                     # Build & utility scripts
```

### TypeScript Patterns
- Strict type checking enabled
- Use `type` imports: `import type { SomeType } from "..."`
- Components in `.tsx`, utilities in `.ts`
- Path alias `@/` maps to `apps/main/src/`

### Hotkeys System
Hotkeys are managed through multiple layers:
- `apps/main/src/config/default-hotkeys.ts` - Default app hotkey definitions
- `/dev/hotkeys.toml` - Runtime hotkey overrides (TOML format, loaded via Tauri backend)
- `apps/main/src/config/editor-hotkeys.ts` - Editor-specific hotkeys for display
- `apps/main/src/hooks/use-app-hotkeys.ts` - Central hotkey registration
- `apps/main/src/hooks/use-hotkey-handlers.ts` - Handler implementations
- `apps/main/src/hooks/use-hotkeys-config.ts` - TOML config loading & merging with defaults

**Key App Shortcuts**:
- `Ctrl+G` - Toggle sidebar
- `Ctrl+J` - Toggle activity bar
- `Ctrl+N` - New note (root)
- `Ctrl+Alt+N` - New note (pick location)
- `Ctrl+Shift+,` - Open settings
- `Ctrl+Shift+.` - Open keyboard shortcuts
- `Ctrl+,`/`Ctrl+.` - Resize sidebar
- `Alt+,`/`Alt+.` - Resize panes
- `Ctrl+E` - Toggle rich/source editor
- `Ctrl+P` - Quick search
- `Ctrl+Shift+F` - Full text search
- `F1` - Quick hotkeys reference

## Integration Points

### Tauri Bridge
- Database operations via `@tauri-apps/plugin-sql`
- File system access via `@tauri-apps/plugin-fs`
- Global shortcuts via `@tauri-apps/plugin-global-shortcut`
- Clipboard via `@tauri-apps/plugin-clipboard-manager`
- File dialogs via `@tauri-apps/plugin-dialog`
- Notifications via `@tauri-apps/plugin-notification`
- URL/file opening via `@tauri-apps/plugin-opener`
- Window state persistence via `@tauri-apps/plugin-window-state`

### Editor Integration
- **Rich editor**: ProseMirror with line-based schema and custom plugins
- **Source editor**: CodeMirror 6 with markdown/HTML support
- Content synced between editors via Jotai atoms
- Toggle with `Ctrl+E`

### Development Database
- SQLite database at `/dev/notes.db`
- Schema managed declaratively in `/schema/base.sql`
- Run `./dev/setup-dev-db.sh` to reset with sample data

## Common Gotchas

1. **Database Schema**: Only modify `/schema/base.sql` - not generated files
2. **Hotkey Key Names**: react-hotkeys-hook uses `comma`, `period` not `,`, `.`
3. **Line-Based Model**: No `<br>` soft breaks, no heading nodes - each "line" is a paragraph block
4. **Tauri Dev**: Main frontend runs on port 1420, quick frontend on port 3333
5. **React 19**: Use `useRef<T | null>(null)` pattern for DOM refs
6. **Hotkey Config Format**: User overrides are in TOML (`dev/hotkeys.toml`), not JSON
7. **Monorepo Paths**: Source lives under `apps/main/src/`, not a flat `src/`
