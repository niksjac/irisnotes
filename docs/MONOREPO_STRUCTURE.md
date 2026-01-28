# IrisNotes Monorepo Structure

This document describes the monorepo organization for IrisNotes and its companion applications.

## Overview

IrisNotes uses a **pnpm workspace monorepo** to manage multiple applications that share code, configuration, and development infrastructure.

```
irisnotes/                          # Monorepo root
├── pnpm-workspace.yaml             # Workspace configuration
├── package.json                    # Root scripts and shared dev dependencies
├── apps/                           # Applications
│   ├── main/                       # Main IrisNotes editor
│   └── quick/                      # Quick search companion app
├── dev/                            # Shared development data
├── schema/                         # Shared database schema
├── docs/                           # Documentation
└── packages/                       # Shared packages (future)
```

---

## Applications

### apps/main - IrisNotes Editor

The full-featured note-taking application.

```
apps/main/
├── package.json                    # App dependencies
├── vite.config.ts                  # Vite bundler config
├── tsconfig.json                   # TypeScript config
├── index.html                      # Entry HTML
├── src/                            # React frontend
│   ├── app.tsx
│   ├── atoms/                      # Jotai state
│   ├── components/                 # UI components
│   ├── hooks/                      # React hooks
│   ├── storage/                    # Storage adapters
│   ├── types/                      # TypeScript types
│   ├── utils/                      # Utilities
│   └── views/                      # View components
└── src-tauri/                      # Rust backend
    ├── Cargo.toml
    ├── tauri.conf.json
    └── src/
        ├── lib.rs
        └── main.rs
```

**Tech Stack:**
- Frontend: React 19, TypeScript, Tailwind CSS, Jotai
- Editor: ProseMirror (rich text), CodeMirror 6 (source view)
- Backend: Tauri v2, Rust
- Database: SQLite via tauri-plugin-sql

### apps/quick - Quick Search

Lightweight companion app for quick note search and capture.

```
apps/quick/
├── package.json
├── vite.config.ts
├── src/                            # Minimal React frontend
└── src-tauri/                      # Rust backend
    ├── Cargo.toml
    ├── tauri.conf.json
    └── src/
```

**Features:**
- Global hotkey activation (e.g., Ctrl+Space)
- System tray icon
- Fuzzy search across all notes
- Quick note capture
- Minimal resource footprint

---

## Shared Resources

### dev/ - Development Data

Shared between all apps during development:

```
dev/
├── notes.db                        # SQLite database
├── config.toml                     # App configuration
├── hotkeys.toml                    # Hotkey overrides
└── storage.json                    # Fallback JSON storage
```

The Rust backend finds this directory by looking for `pnpm-workspace.yaml` at the monorepo root.

### schema/ - Database Schema

Single source of truth for database structure:

```
schema/
├── base.sql                        # Core schema (tables, indexes, triggers)
└── seed-dev.sql                    # Development seed data
```

Both apps import the schema via Vite alias `@schema/base.sql?raw`.

### docs/ - Documentation

Project documentation shared across all apps.

---

## Workspace Configuration

### pnpm-workspace.yaml

```yaml
packages:
  - "apps/*"
  - "packages/*"    # Future shared packages
```

### Root package.json

```json
{
  "name": "irisnotes-monorepo",
  "private": true,
  "scripts": {
    "main": "pnpm -C apps/main tauri dev",
    "quick": "pnpm -C apps/quick tauri dev",
    "build:main": "pnpm -C apps/main tauri build",
    "build:quick": "pnpm -C apps/quick tauri build",
    "build:all": "pnpm build:main && pnpm build:quick",
    "type-check": "pnpm -r run type-check",
    "lint": "pnpm -r run lint",
    "test": "pnpm -r run test"
  }
}
```

---

## Development Workflow

### Running Apps

```bash
# Start main app in dev mode
pnpm main

# Start quick app in dev mode (separate terminal)
pnpm quick

# Both apps share the same dev/notes.db
```

### Path Aliases

Each app's `vite.config.ts` and `tsconfig.json` defines aliases:

| Alias | Resolves To |
|-------|-------------|
| `@/*` | `./src/*` (app-specific) |
| `@schema/*` | `../../schema/*` (shared) |

### Database Development

```bash
# Reset dev database with schema + seed data
./dev/setup-dev-db.sh
```

---

## Production Build

### Build Process

```bash
# Build main app
pnpm build:main
# Output: apps/main/src-tauri/target/release/

# Build quick app
pnpm build:quick
# Output: apps/quick/src-tauri/target/release/
```

### Data Directory Resolution

In production, both apps use the same user data directory:

| Platform | Directory |
|----------|-----------|
| Linux | `~/.config/irisnotes/` |
| macOS | `~/Library/Application Support/irisnotes/` |
| Windows | `%APPDATA%\irisnotes\` |

This is handled by the `get_config_dir()` and `get_data_dir()` functions in each app's `lib.rs`.

---

## Future: Shared Packages

For code shared between apps, create packages:

```
packages/
├── shared-types/                   # TypeScript types
│   ├── package.json
│   └── src/
│       └── index.ts
├── shared-utils/                   # Utility functions
│   ├── package.json
│   └── src/
│       └── index.ts
└── ui-components/                  # Shared React components
    ├── package.json
    └── src/
        └── index.tsx
```

Usage in apps:

```typescript
// In apps/main/src/...
import type { Note } from '@irisnotes/shared-types';
import { formatDate } from '@irisnotes/shared-utils';
import { SearchInput } from '@irisnotes/ui-components';
```

---

## Adding a New App

1. Create app directory:
   ```bash
   mkdir -p apps/new-app
   cd apps/new-app
   pnpm create tauri-app . --template react-ts
   ```

2. Update `pnpm-workspace.yaml` (apps/* already covers it)

3. Configure Vite aliases for shared resources

4. Update `src-tauri/src/lib.rs` to use monorepo root detection:
   ```rust
   // Find monorepo root by looking for pnpm-workspace.yaml
   if project_root.join("pnpm-workspace.yaml").exists() {
       break;
   }
   ```

5. Add run script to root `package.json`:
   ```json
   "new-app": "pnpm -C apps/new-app tauri dev"
   ```

---

## Dependency Management

### Installing Dependencies

```bash
# Install dependency for specific app
pnpm -C apps/main add some-package

# Install dev dependency at root (shared tooling)
pnpm add -D -w eslint prettier

# Install dependency for all apps
pnpm -r add some-package
```

### Updating Dependencies

```bash
# Update all dependencies across workspace
pnpm update -r

# Update specific package everywhere
pnpm update -r some-package
```
