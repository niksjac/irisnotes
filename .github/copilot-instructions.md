# IrisNotes AI Assistant Guide

## Architecture Overview

IrisNotes is a **Tauri-based desktop notes app** with a React frontend. The app uses a **unified hierarchical structure**: Books → Sections → Notes stored in a single SQLite `items` table.

### Core Technology Stack
- **Frontend**: React 19 + TypeScript + Tailwind CSS + Jotai (state management)
- **Backend**: Tauri v2 (Rust) + SQLite
- **Editor**: ProseMirror (rich text) + CodeMirror 6 (source view)
- **Build**: Vite

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
pnpm tauri dev          # Start Tauri dev server (backend + frontend)
pnpm run type-check     # TypeScript validation
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
State is organized in `/src/atoms/`:
- `atoms/items.ts` - Main data atoms for the unified items system
- `atoms/panes.ts` - Multi-pane layout state
- `atoms/tree.ts` - Tree view state
- `atoms/settings.ts` - App settings

### 3. Storage Abstraction
`/src/storage/` provides adapters:
- `SQLiteStorageAdapter` - Production (Tauri + SQLite)
- `JsonSingleStorageAdapter` - Development fallback
- Factory pattern in `factory.ts` chooses adapter based on environment

### 4. View System
Views in `/src/views/` are switched based on selection:
- `editor-rich-view.tsx` - ProseMirror rich text editor
- `editor-source-view.tsx` - CodeMirror source editor
- `config-view.tsx` - App settings
- `hotkeys-view.tsx` - Keyboard shortcuts (dynamic, pulls from all sources)
- `empty-view.tsx` - No selection state

### 5. Editor Architecture

**Line-Based Model**: The ProseMirror editor treats each paragraph as a "line":
- No soft line breaks (`hard_break` removed from schema)
- Enter and Shift+Enter both create new blocks
- Empty lines create visual separation

**Extended Schema** (`/src/components/editor/schema.ts`):
- Marks: bold, italic, code, underline, strikethrough, textColor, highlight, fontSize, fontFamily
- Nodes: paragraph, heading, lists, blockquote, code_block (no hard_break)

**Line Commands** (`/src/components/editor/plugins/line-commands.ts`):
- `Alt+↑/↓` - Move line up/down
- `Alt+Shift+↑/↓` - Duplicate line up/down
- `Ctrl+D` - Select word / next occurrence
- `Ctrl+Shift+K` - Delete line
- `Ctrl+A` - Smart select all (progressive: line → paragraph → all)

## Project-Specific Conventions

### File Organization
```
src/
├── atoms/          # Jotai state atoms
├── components/     # React components by UI area
│   ├── dialogs/    # Modal dialogs (NoteLocationDialog)
│   ├── editor/     # ProseMirror/CodeMirror components
│   ├── panes/      # Multi-pane layout
│   ├── sidebar/    # Sidebar components
│   ├── tree/       # Tree view
│   └── tabs/       # Tab management
├── config/         # Configuration (default-hotkeys.ts, editor-hotkeys.ts)
├── hooks/          # Custom React hooks
├── storage/        # Storage adapters & types
├── types/          # TypeScript definitions
├── utils/          # Pure utility functions
├── views/          # Top-level view components
└── styles/         # Global CSS
```

### TypeScript Patterns
- Strict type checking enabled
- Use `type` imports: `import type { SomeType } from "..."`
- Components in `.tsx`, utilities in `.ts`

### Hotkeys System
Hotkeys are managed through multiple layers:
- `/src/config/default-hotkeys.ts` - Default app hotkey definitions
- `/dev/hotkeys.json` - Runtime hotkey overrides
- `/src/config/editor-hotkeys.ts` - Editor-specific hotkeys for display
- `/src/hooks/use-app-hotkeys.ts` - Central hotkey registration
- `/src/hooks/use-hotkey-handlers.ts` - Handler implementations

**Key App Shortcuts**:
- `Ctrl+G` - Toggle sidebar
- `Ctrl+J` - Toggle activity bar
- `Ctrl+N` - New note (root)
- `Ctrl+Shift+N` - New note (pick location)
- `Ctrl+Shift+,` - Open settings
- `Ctrl+Shift+.` - Open keyboard shortcuts
- `Ctrl+,`/`Ctrl+.` - Resize sidebar
- `Alt+,`/`Alt+.` - Resize panes

## Integration Points

### Tauri Bridge
- Database operations via `@tauri-apps/plugin-sql`
- File system access via `@tauri-apps/plugin-fs`
- Global shortcuts via `@tauri-apps/plugin-global-shortcut`

### Editor Integration
- **Rich editor**: ProseMirror with extended schema and line-based commands
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
3. **Line-Based Model**: No `<br>` soft breaks - each "line" is a block
4. **Tauri Dev**: Frontend runs on port 1420, backend managed by Tauri
5. **React 19**: Use `useRef<T | null>(null)` pattern for DOM refs
