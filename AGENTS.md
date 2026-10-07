# IrisNotes — agent guide

How to work in this repository. This file is the single source of instructions
for every coding agent (Claude Code, Copilot, Codex, Cursor, …). Tool-specific
files such as `CLAUDE.md` import it and add only tool-specific notes; don't
duplicate rules elsewhere.

When this file, a doc and the code disagree: **the code is right**, then this
file, then `docs/`. Fix the stale one as part of your change, or say so.

## Project

IrisNotes is a local-first desktop notes app (OneNote/Trilium-inspired), built
and used by one person on Arch Linux. pnpm workspace (`packages: apps/*`):

| App | What | Stack |
|---|---|---|
| `apps/main` | the notes app — most work happens here | Tauri v2, React 19, TypeScript (strict), Tailwind v4, Jotai, ProseMirror, CodeMirror 6 |
| `apps/quick` | global quick-search overlay ([ADR-0006](docs/decisions/adr/ADR-0006-quick-search-separate-app.md)) | Tauri v2, React; plain Tauri `invoke`/events, **no Jotai** |
| `apps/cli` | `iris` CLI: list/search/show/open | Bun, Commander |
| `apps/server` | `iris-server` sync hub ([ADR-0008](docs/decisions/adr/ADR-0008-local-first-sync-central-hub.md)) | Rust, axum, rusqlite |

- Main app source: `apps/main/src`; alias `@/` → there, `@schema/*` → root
  `schema/*`. Rust backend: `apps/main/src-tauri/src` (`lib.rs`, `cli.rs`).
- There are two CLIs with overlapping commands: the Bun `iris` in `apps/cli`
  and a Rust one in `apps/main/src-tauri/src/cli.rs`. Check which one a task
  means.

## Commands

From the repo root:

| Command | Purpose |
|---|---|
| `pnpm dev` | main + quick together (Vite: main 1420, quick 3333) |
| `pnpm main` / `pnpm quick` | one app |
| `pnpm run type-check` | `tsc --noEmit`, main app — **required check for TS changes** |
| `pnpm test` / `pnpm test:e2e` | Vitest / Playwright (main app) |
| `pnpm cli -- <args>` | the Rust CLI |
| `pnpm -C apps/cli dev -- <args>` | the Bun `iris` CLI |
| `./dev/setup-dev-db.sh` | recreate `dev/notes.db` from `schema/base.sql` + `schema/seed-dev.sql` |
| `cd apps/server && IRIS_TOKEN=… cargo run` | sync server, local |
| `./install-local.sh --bump --commit` | local release — see Releases |

Dev builds read config and data from `dev/`; installed builds from
`~/.config/irisnotes/`. Full setup: [docs/guides/building.md](docs/guides/building.md).

## Before you change things

- **Keep changes scoped** to the request. No drive-by refactors, renames or
  reformatting. Report unrelated problems instead of fixing them silently.
- **Match the file you're editing.** No formatter or linter exists
  ([ADR-0009](docs/decisions/adr/ADR-0009-local-builds-no-ci-no-formatter.md)):
  tabs for indentation, the surrounding naming, comment density and import
  style. Don't add formatter/linter config or directives (`biome-ignore`, …).
- **TypeScript is strict** (`noUnused*`, `noUncheckedIndexedAccess`,
  `noImplicitReturns`). Follow the file's ref patterns: DOM refs
  `useRef<T>(null)`, mutable non-DOM refs usually `useRef<T | null>(null)`.
- **Tailwind v4** via `@tailwindcss/vite`; custom base/reset CSS stays inside
  Tailwind layers.
- **Prefer existing** atoms, hooks and helpers over new global abstractions.

## Verifying your work

- TypeScript changed → `pnpm run type-check` must pass. Logic with tests →
  `pnpm test`. Rust crate changed → `cargo check` in that crate.
- UI behaviour can only be confirmed in the running app; say when you couldn't.
- Report exactly what you ran and what you didn't. Never describe something as
  tested or working that you didn't verify.

## Data and safety

- **Never touch production data**: `~/.config/irisnotes/` holds the owner's real
  notes (`notes.db`) and config. Develop against `dev/`. To test an installed
  build, isolate it: `XDG_CONFIG_HOME=<scratch dir>` gives it a separate config
  and database.
- **Never commit secrets or local state**: `dev/config.toml` (may hold a sync
  token), `dev/notes.db`, `apps/server/.env`. All are gitignored — keep it so.
- **Schema** changes go in `schema/base.sql` only. It is embedded by the main
  app, `iris-server` and read by `apps/quick`; check all three, and the sync
  contract version (`EXPECTED_*_VERSION` in
  `apps/main/src/storage/sync/sync-engine.ts`, `/version` in the server) when
  `items` changes. Existing databases are migrated in place on startup — never
  require users to recreate them.
- **Sync stays content-opaque**: never parse `content`/`metadata` in sync code.
  `iris-server` listens only on loopback or a private overlay address — never a
  public one — and never terminates TLS itself
  ([ADR-0001](docs/decisions/adr/ADR-0001-sync-overlay-network.md),
  [ADR-0010](docs/decisions/adr/ADR-0010-tailscale-serve-for-first-deployment.md)).
- **Ask first** before anything destructive or outward-facing: deleting
  untracked files, killing processes, pushing, touching a remote host.

## Git

- **Conventional Commits** (`feat(editor): …`, `fix(sync): …`, `docs: …`,
  `chore(repo): …`). One logical change per commit; split mixed worktrees into
  several commits.
- **No AI attribution** — no `Co-Authored-By` or similar trailers naming an AI.
- Work on `master` unless asked to branch. **Never push unless asked.** Never
  force-push or rewrite pushed history.

## Releases

`./install-local.sh --bump --commit` bumps the patch version, builds both apps,
installs them to `~/.local`, and commits `chore(release): bump apps to X.Y.Z`.

- Needs a clean tracked worktree: commit the feature first.
- **The installed apps must not be running** — a running binary can't be
  overwritten ("Text file busy"). Check with `pgrep -a irisnotes`; ask before
  closing them.
- No CI and no tags; the release commit is the record.

## Architecture rules

- **Data**: one `items` table for books, sections and notes
  ([ADR-0003](docs/decisions/adr/ADR-0003-single-items-table.md)). Books are
  root; sections live under books; notes go at root or under books/sections,
  never under notes. Hierarchy rules exist in `schema/base.sql`,
  `apps/main/src/storage/hierarchy.ts` and the tree's create/drop logic — change
  them together. Order is a fractional-index string
  ([ADR-0004](docs/decisions/adr/ADR-0004-fractional-indexing-sort-order.md)).
  Storage is SQLite only (`SQLiteStorageAdapter`); backup/restore in
  `apps/main/src/storage/export-import.ts`.
- **State** lives in Jotai atoms under `apps/main/src/atoms`. Views are routed in
  `apps/main/src/view.tsx` by `ViewType` (`apps/main/src/types/index.ts`).
- **Editor** is line-oriented
  ([ADR-0005](docs/decisions/adr/ADR-0005-line-oriented-editor-schema.md)): a
  paragraph is a line, no `hard_break`, no heading node — headings are
  `fontSize` marks. Code: `apps/main/src/components/editor/` (`schema.ts`,
  `prosemirror-setup.ts`, `plugins/`). `Ctrl+E` toggles to the CodeMirror
  source view.
- **Hotkeys**: app hotkeys in `apps/main/src/config/default-hotkeys.ts`
  (react-hotkeys-hook names: `comma`, `period`, not `,` `.`); editor keybindings
  in `apps/main/src/config/default-editor-keybindings.ts` (ProseMirror notation:
  `Mod-b`). Details: [docs/guides/hotkeys.md](docs/guides/hotkeys.md).
- **Config**: TOML files for configuration, the SQLite `settings` table for UI
  preferences
  ([ADR-0007](docs/decisions/adr/ADR-0007-configuration-toml-and-settings-table.md),
  [docs/guides/configuration.md](docs/guides/configuration.md)).

## Documentation

- `docs/decisions/` — **ADRs** (decisions made) and **RFCs** (open questions).
  Write an ADR when a choice constrains later work or a reader would ask "why
  not the obvious thing?"; an RFC when the right answer isn't clear yet. Follow
  `docs/decisions/README.md`. Never rewrite an accepted ADR — supersede it; a
  dated note recording a verification result is fine.
- `docs/guides/` — how-to guides, each checked against source and dated. When
  you change behaviour a guide describes, update the guide in the same commit.
- Don't add new top-level docs; put decisions in `docs/decisions/`, how-tos in
  `docs/guides/`. Known bugs are listed under "Known issues" in the guides and
  the "Bad" consequences of ADRs.
