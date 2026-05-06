# IrisNotes AI Assistant Guide

## Purpose

This file is always-on Copilot context. Keep it short: include repo facts that change how code should be edited, and verify detailed behavior in source before broad changes.

## Repo Shape

- IrisNotes is a pnpm workspace with three apps:
	- `apps/main`: primary Tauri v2 desktop notes app with a React frontend.
	- `apps/quick`: separate Tauri quick-search overlay; its React UI uses direct Tauri `invoke`/events, not Jotai.
	- `apps/cli`: Bun/Commander CLI (`iris`) for list/search/show/open against the SQLite database.
- Main stack: React 19, TypeScript, Tailwind CSS v4, Jotai, Rust/Tauri v2, SQLite, ProseMirror, and CodeMirror 6.
- Main app source lives in `apps/main/src`. The `@/` alias maps there; `@schema/*` maps to root `schema/*`.

## Commands

- `pnpm dev`: run main and quick apps together.
- `pnpm main`, `pnpm quick`: run one Tauri app.
- `pnpm run type-check`: TypeScript validation for the main app.
- `pnpm test`, `pnpm test:e2e`, `pnpm build`: unit tests, Playwright e2e, and both app builds.
- After schema changes, or when resetting local data, run `./dev/setup-dev-db.sh`.
- Vite dev ports: main `1420`, quick `3333`.

## Database And Storage

- `schema/base.sql` is the schema source of truth. The main frontend imports it via `@schema/base.sql?raw`; the Tauri backend embeds it with `include_str!`. Update that file, not `dev/notes.db` or generated artifacts.
- Content uses one SQLite `items` table with `type` in `note | book | section`, `parent_id`, fractional `sort_order`, JSON `metadata`, and FTS via `items_fts`.
- Intended hierarchy: books are root; notes may be root, under books, or under sections; notes cannot contain notes. Sections are intended to live under books; if touching hierarchy, keep `schema/base.sql`, `apps/main/src/storage/hierarchy.ts`, and UI creation/drop logic aligned.
- Production storage is SQLite only through `SQLiteStorageAdapter`; file backup/restore lives in `apps/main/src/storage/export-import.ts`.

## Main App Architecture

- State lives in Jotai atoms under `apps/main/src/atoms`. Core areas include items, panes/tabs, tree, settings, hotkeys/editor keybindings, search, editor stats, autocorrect, and ascii-art.
- Views are routed by `apps/main/src/view.tsx` using `ViewType` from `apps/main/src/types/index.ts`. Current view files include editor rich/source, book/section, config, hotkeys, branding, ascii-art, autocorrect, and icon editor.
- Components are organized by UI area under `apps/main/src/components`. Prefer existing hooks, atoms, and local helpers over new global abstractions.

## Editor Rules

- ProseMirror is line-oriented: paragraphs are "lines"; there is no `hard_break`; there is no semantic heading node. Legacy `h1`-`h6` parse as paragraphs, and visual headings use `fontSize` marks.
- Current schema includes paragraph, blockquote, horizontal rule, `code_section`, `code_block`, details/summary, image, lists, tables, and marks for link, font, color, bold, italic, code, underline, and strikethrough.
- Editor plugin/keybinding code is in `apps/main/src/components/editor/plugins`, `apps/main/src/components/editor/prosemirror-setup.ts`, and `apps/main/src/config/default-editor-keybindings.ts`. Check the directory before assuming the plugin list is complete.
- Source editor is CodeMirror 6. Content and cursor state sync through Jotai/hooks when toggling rich/source with `Ctrl+E`.

## Hotkeys And Config

- App defaults are in `apps/main/src/config/default-hotkeys.ts`; rich-editor defaults are in `apps/main/src/config/default-editor-keybindings.ts`; display aggregation is in `apps/main/src/config/editor-hotkeys.ts` and `apps/main/src/views/hotkeys-view.tsx`.
- User/dev overrides are TOML in `dev/hotkeys.toml`; `apps/main/src/hooks/use-hotkeys-config.ts` loads TOML through Tauri config commands and merges with defaults.
- App hotkeys use react-hotkeys-hook names like `comma` and `period`, not literal `,` or `.`. ProseMirror editor keys use its own `Mod-b` style notation.

## TypeScript And Style

- Strict TypeScript is enabled (`noUnused*`, `noUncheckedIndexedAccess`, `noImplicitReturns`). Keep imports and type-only imports consistent with nearby files.
- Follow existing React ref patterns in the touched file. DOM refs commonly use `useRef<T>(null)` here; mutable non-DOM refs often use `useRef<T | null>(null)`.
- Tailwind v4 is used via `@tailwindcss/vite`; keep custom base/reset CSS inside Tailwind layers to avoid utility cascade problems.
- Keep changes scoped. Do not refactor broad architecture or update stale docs unless the task asks for it.

## Source Pointers

- Database: `schema/base.sql`, `apps/main/src/storage/`, `apps/main/src-tauri/src/lib.rs`.
- Editor: `apps/main/src/components/editor/`, `apps/main/src/config/default-editor-keybindings.ts`.
- Hotkeys: `apps/main/src/config/`, `apps/main/src/hooks/use-app-hotkeys.ts`, `apps/main/src/hooks/use-hotkeys-config.ts`.
- Quick search: `apps/quick/src/app.tsx`, `apps/quick/src-tauri/src/lib.rs`.
- CLI: `apps/cli/src/index.ts`, `apps/cli/src/db.ts`.
- Docs in `docs/` are useful background, but some files predate the current monorepo layout and TOML config; verify source before treating docs as current.
