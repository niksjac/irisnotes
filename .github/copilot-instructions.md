# IrisNotes AI Assistant Guide

## Architecture Overview

IrisNotes is a **Tauri-based desktop notes app** with a React frontend. The app uses a **unified hierarchical structure**: Books → Sections → Notes stored in a single SQLite `items` table.

### Core Technology Stack
- **Frontend**: React 19 + TypeScript + Tailwind CSS + Jotai (state management)
- **Backend**: Tauri v2 (Rust) + SQLite
- **Editor**: CodeMirror 6 + ProseMirror for rich text
- **Build**: Vite + Biome (linting/formatting)

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
pnpm run biome:fix      # Auto-fix linting/formatting
```

## Key Architecture Patterns

### 1. Unified Items Model
The app migrated from separate `notes`/`categories` tables to a **single `items` table**:
```sql
-- items table supports: type IN ('note', 'book', 'section')
-- Hierarchy: parent_id references items(id)
-- Books: always at root (parent_id IS NULL)
-- Sections: always under a book
-- Notes: can be at root, under books, OR under sections (flexible placement)
-- Notes CANNOT be inside other notes (enforced by trigger)
```

### 2. Jotai State Management
State is organized in `/src/atoms/`:
- `atoms/items.ts` - Main data atoms for the unified items system
- `atoms/panes.ts` - Multi-pane layout state
- `atoms/tree.ts` - Tree view state
- Legacy atoms in `atoms/index.ts` for backward compatibility during migration

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
- `hotkeys-view.tsx` - Keyboard shortcuts
- `empty-view.tsx` - No selection state

### 5. Component Architecture
- `/src/components/` organized by UI areas: `sidebar/`, `editor/`, `panes/`, `tree/`
- Components use custom hooks from `/src/hooks/` for business logic
- Tailwind + CSS custom properties in `/src/styles/theme.css`

## Project-Specific Conventions

### File Organization
```
src/
├── atoms/          # Jotai state atoms
├── components/     # React components by UI area
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
- Biome enforces consistent formatting (80 char line width, double quotes)

### Hotkeys System
The app has extensive keyboard shortcuts managed through:
- `/src/hooks/use-app-hotkeys.ts` - Central hotkey registration
- `/dev/hotkeys.json` - Hotkey configuration
- Global shortcuts work across all editor states

### Migration Notes
The codebase is **migrating from legacy structure** to unified items:
- Legacy `selectedNoteIdAtom` → `selectedItemIdAtom`
- Legacy `categoriesAtom` → items with `type: 'book'|'section'`
- Some components may still reference legacy atoms during transition

## Integration Points

### Tauri Bridge
- Database operations via `@tauri-apps/plugin-sql`
- File system access via `@tauri-apps/plugin-fs`
- Global shortcuts via `@tauri-apps/plugin-global-shortcut`

### Editor Integration
- **Rich editor**: ProseMirror with custom schema
- **Source editor**: CodeMirror 6 with markdown/HTML support
- Content synced between editors via Jotai atoms

### Development Database
- SQLite database at `/dev/notes.db`
- Schema managed declaratively in `/schema/base.sql`
- Run `./dev/setup-dev-db.sh` to reset with sample data

## Common Gotchas

1. **Database Schema**: Only modify `/schema/base.sql` - not generated files
2. **State Migration**: Check both new (`itemsAtom`) and legacy atoms during transition
3. **Biome Config**: Line width is 80 chars, not 120 - format accordingly
4. **Tauri Dev**: Frontend runs on port 1420, backend managed by Tauri
5. **React 19**: Use `useRef<T | null>(null)` pattern for DOM refs
