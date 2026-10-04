# ADR-0006: Quick search is a separate Tauri app

- **Status:** Accepted
- **Date:** 2025-12-27 (proposed in `docs/QUICK_SEARCH.md`, commit `d2b19c9`);
  built as `apps/quick` 2026-01-28 (commit `d46ce55`)
- **Recorded:** 2026-10-04, retroactively, from `docs/QUICK_SEARCH.md` (since
  removed)
- **Supersedes:** —
- **Related:** [ADR-0003](ADR-0003-single-items-table.md)

## Context

The point of quick search is an overlay that appears instantly from a global
hotkey, finds a note by full-text search, and opens it — including when the main
app is not running. A full IrisNotes window takes noticeably longer to start and
uses several times the memory of a single search field.

## Decision

Quick search is its own small Tauri application, **`apps/quick`**
(`irisnotes-quick`), with:

- its own minimal Rust backend that opens the **same SQLite database** read-side
  with `rusqlite` and queries `items_fts` directly
  (`apps/quick/src-tauri/src/lib.rs`);
- a React UI that talks to that backend with plain Tauri `invoke` and events —
  **not Jotai**, and no shared state with the main app;
- hand-off to the main app by launching `irisnotes --open-note=<id>`; the main
  app's single-instance plugin forwards that to an already running window.

## Consequences

**Good**

- The overlay starts and responds fast and works whether or not the main app is
  open.
- A crash or heavy load in the main app does not affect search.

**Bad**

- Two Tauri apps to build, install and release (`install-local.sh` handles both).
- Database path resolution exists twice, in `apps/main/src-tauri` and
  `apps/quick/src-tauri`, and must stay in agreement — including the dev-mode
  `dev/notes.db` fallback.
- The quick app reads the schema implicitly; a schema change that affects
  `items` or `items_fts` must be checked against its queries.

## Alternatives considered

- **A `--quick-search` mode of the main app** — rejected: slower start, higher
  memory, and awkward when the main app is already running.
