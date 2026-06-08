# IrisNotes — Claude Code Guide

Always-on context for Claude Code. Keep it short and high-signal: repo facts that change how code should be edited. Verify detailed behavior in source before broad changes.

## Repo Shape

pnpm workspace (`packages: apps/*`) with three apps:

- `apps/main` — primary Tauri v2 desktop notes app, React 19 frontend. Most work happens here.
- `apps/quick` — separate Tauri quick-search overlay. Its React UI uses direct Tauri `invoke`/events, **not** Jotai.
- `apps/cli` — Bun/Commander CLI (`iris`) for list/search/show/open against the SQLite database.

Main stack: React 19, TypeScript (strict), Tailwind CSS v4, Jotai, Rust/Tauri v2, SQLite, ProseMirror, CodeMirror 6.

Main app source is `apps/main/src`. The `@/` alias maps there; `@schema/*` maps to root `schema/*`. Rust backend is `apps/main/src-tauri/src` (`lib.rs`, `cli.rs`, `main.rs`).

## Commands

Run from repo root unless noted:

- `pnpm dev` — run main + quick together (Vite ports: main `1420`, quick `3333`).
- `pnpm main` / `pnpm quick` — run one Tauri app in dev.
- `pnpm run type-check` — TypeScript validation for the main app (`tsc --noEmit`). **Use this to check your work** — there is no wired-up linter.
- `pnpm test` — Vitest unit tests (main app).
- `pnpm test:e2e` — Playwright e2e (main app).
- `pnpm build` — builds both apps (`build:main`, `build:quick`).
- `pnpm cli -- <args>` — runs the **Rust** CLI built into the main app (`apps/main/src-tauri/src/cli.rs`). Note: the separate Bun `iris` CLI in `apps/cli` is run with `pnpm -C apps/cli dev -- <args>`.
- `./dev/setup-dev-db.sh` — (re)create `dev/notes.db` from `schema/base.sql` + `schema/seed-dev.sql`. Run after schema changes or to reset local data. Requires `sqlite3`.

## Code Style & Tooling

- **No formatter or linter is actually wired up** (stale `.biomeignore`/`.prettierignore` exist, but there is no `biome.json`/`prettier` config, no format script, no installed binary). Match the style of the file you are editing — the repo indents with **tabs**.
- Strict TypeScript: `noUnused*`, `noUncheckedIndexedAccess`, `noImplicitReturns`. Keep imports and type-only imports consistent with nearby files.
- Follow existing React ref patterns in the touched file: DOM refs use `useRef<T>(null)`; mutable non-DOM refs often use `useRef<T | null>(null)`.
- Tailwind v4 via `@tailwindcss/vite` — keep custom base/reset CSS inside Tailwind layers to avoid utility-cascade problems.
- Keep changes scoped. Don't refactor broad architecture or update stale docs unless the task asks for it.

## Database & Storage

- `schema/base.sql` is the **schema source of truth**. The main frontend imports it via `@schema/base.sql?raw`; the Tauri backend embeds it with `include_str!`. Edit that file — never `dev/notes.db` or generated artifacts.
- Content lives in one SQLite `items` table: `type` in `note | book | section`, `parent_id`, fractional `sort_order`, JSON `metadata`, plus FTS via `items_fts`.
- Hierarchy intent: books are root; notes may be root, under books, or under sections; notes cannot contain notes; sections live under books. If touching hierarchy, keep `schema/base.sql`, `apps/main/src/storage/hierarchy.ts`, and UI creation/drop logic aligned.
- Production storage is SQLite only via `SQLiteStorageAdapter`. File backup/restore lives in `apps/main/src/storage/export-import.ts`.

## Main App Architecture

- State lives in Jotai atoms under `apps/main/src/atoms` (items, panes/tabs, tree, settings, hotkeys/editor keybindings, search, editor stats, autocorrect, ascii-art).
- Views are routed by `apps/main/src/view.tsx` using `ViewType` from `apps/main/src/types/index.ts`.
- Components are organized by UI area under `apps/main/src/components`. Prefer existing hooks, atoms, and local helpers over new global abstractions.

## Editor Rules

- ProseMirror is **line-oriented**: paragraphs are "lines"; there is no `hard_break` and no semantic heading node. Legacy `h1`–`h6` parse as paragraphs; visual headings use `fontSize` marks.
- Schema includes paragraph, blockquote, horizontal rule, `code_section`, `code_block`, details/summary, image, lists, tables, and marks for link, font, color, bold, italic, code, underline, strikethrough.
- Editor plugin/keybinding code: `apps/main/src/components/editor/plugins`, `apps/main/src/components/editor/prosemirror-setup.ts`, `apps/main/src/config/default-editor-keybindings.ts`. Check the directory before assuming the plugin list is complete.
- Source editor is CodeMirror 6. Content/cursor state sync through Jotai/hooks when toggling rich/source with `Ctrl+E`.

## Hotkeys & Config

- App defaults: `apps/main/src/config/default-hotkeys.ts`. Rich-editor defaults: `apps/main/src/config/default-editor-keybindings.ts`. Display aggregation: `apps/main/src/config/editor-hotkeys.ts` and `apps/main/src/views/hotkeys-view.tsx`.
- User/dev overrides are TOML in `dev/` (`hotkeys.toml`, `config.toml`, `autocorrect.toml`, `ascii-art.toml`); loaded via Tauri config commands and merged with defaults (`apps/main/src/hooks/use-hotkeys-config.ts`).
- App hotkeys use react-hotkeys-hook names like `comma` and `period`, not literal `,`/`.`. ProseMirror editor keys use its own `Mod-b` notation.

## Source Pointers

- Database: `schema/base.sql`, `apps/main/src/storage/`, `apps/main/src-tauri/src/lib.rs`.
- Editor: `apps/main/src/components/editor/`, `apps/main/src/config/default-editor-keybindings.ts`.
- Hotkeys: `apps/main/src/config/`, `apps/main/src/hooks/use-app-hotkeys.ts`, `apps/main/src/hooks/use-hotkeys-config.ts`.
- Quick search: `apps/quick/src/app.tsx`, `apps/quick/src-tauri/src/lib.rs`.
- CLI: `apps/cli/src/index.ts`, `apps/cli/src/db.ts`.

## Docs

`docs/` is useful background but **partly stale** — several files predate the current monorepo layout and TOML config. Verify against source before treating any doc as current. (Some scratch files like `docs/__ACCIDENTALLY_*.md` are junk; ignore them.)
