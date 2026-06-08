# IrisNotes Docs

Background documentation for IrisNotes. **Some files are partly stale** — several predate the current monorepo layout and TOML config. Verify against source before treating any doc as current. For the always-current high-signal overview, see [`/CLAUDE.md`](../CLAUDE.md) and [`.github/copilot-instructions.md`](../.github/copilot-instructions.md).

## Architecture & Structure

- [WORKSPACE_STRUCTURE.md](WORKSPACE_STRUCTURE.md) — overall workspace layout.
- [MONOREPO_STRUCTURE.md](MONOREPO_STRUCTURE.md) — monorepo / pnpm workspace structure.
- [DATABASE_DESIGN.md](DATABASE_DESIGN.md) — SQLite schema and `items` table design.
- [NOTE_TYPES.md](NOTE_TYPES.md) — note/book/section types and hierarchy.
- [FRACTIONAL_INDEXING.md](FRACTIONAL_INDEXING.md) — `sort_order` fractional indexing.

## Editor

- [EDITOR_FEATURES.md](EDITOR_FEATURES.md) — editor feature overview.
- [EDITOR_SETTINGS.md](EDITOR_SETTINGS.md) — editor settings.
- [PROSEMIRROR_CONFIGURATION.md](PROSEMIRROR_CONFIGURATION.md) — ProseMirror schema/config.
- [PROSEMIRROR_FORMATTING.md](PROSEMIRROR_FORMATTING.md) — formatting marks/nodes.
- [PROSEMIRROR_ONENOTE_SPEC.md](PROSEMIRROR_ONENOTE_SPEC.md) — OneNote-style editor spec.
- [MATH_RENDERING.md](MATH_RENDERING.md) — math rendering.

## Config, Hotkeys & Theming

- [CONFIGURATION.md](CONFIGURATION.md) — app configuration (TOML).
- [HOTKEYS.md](HOTKEYS.md) / [HOTKEYS_ARCHITECTURE.md](HOTKEYS_ARCHITECTURE.md) — hotkeys system.
- [SETTINGS_ARCHITECTURE.md](SETTINGS_ARCHITECTURE.md) / [SETTINGS_PORTABILITY.md](SETTINGS_PORTABILITY.md) — settings system.
- [THEMING.md](THEMING.md) — theming.
- [CURSOR_CUSTOMIZATION.md](CURSOR_CUSTOMIZATION.md) — cursor customization.
- [ICONS.md](ICONS.md) / [ICON_PATHS.md](ICON_PATHS.md) — icon system and paths.

## Tooling, Build & Distribution

- [CLI_TOOL.md](CLI_TOOL.md) — the `iris` CLI.
- [QUICK_SEARCH.md](QUICK_SEARCH.md) — quick-search overlay app.
- [BUILDING.md](BUILDING.md) — building the apps.
- [DISTRIBUTION.md](DISTRIBUTION.md) — packaging and distribution.
- [BIOME_FORMATTING.md](BIOME_FORMATTING.md) — formatting notes (⚠️ no formatter is currently wired up; see `/CLAUDE.md`).

## Design Drafts (forward-looking)

- [SYNC_DESIGN.md](SYNC_DESIGN.md) — sync design.
- [CLOUD_SYNC_ROADMAP.txt](CLOUD_SYNC_ROADMAP.txt) — cloud sync roadmap.
