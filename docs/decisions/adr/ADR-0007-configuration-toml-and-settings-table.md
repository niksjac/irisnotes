# ADR-0007: Configuration in TOML files, UI preferences in the settings table

- **Status:** Accepted
- **Date:** 2025-12-31 (`config.toml`, documented in commit `2b7ef39`);
  2026-01-05 (SQLite `settings` table)
- **Recorded:** 2026-10-04, retroactively, from `docs/CONFIGURATION.md`,
  `docs/SETTINGS_ARCHITECTURE.md` and `docs/SETTINGS_PORTABILITY.md` (since
  removed), checked against source
- **Supersedes:** —
- **Related:** [`docs/guides/configuration.md`](../../guides/configuration.md)

## Context

Two kinds of settings exist, with different needs:

- **Configuration a person edits and keeps** — theme, editor toggles, storage
  location, sync target, hotkeys, autocorrect rules, ASCII-art snippets. These
  benefit from being plain files: commentable, diffable, editable in any editor
  while the app runs, and easy to keep in dotfiles.
- **Preferences the UI adjusts continuously** — editor appearance sliders,
  layout and pane sizes, branding. These change often from inside the app and
  should travel with the notes database.

## Decision

1. **TOML files in the config directory** are the source of truth for
   configuration. The app reads them through the Tauri `read_config` command
   (`config`, `hotkeys`, `autocorrect`, `ascii-art`), watches the directory, and
   reloads on external edits. UI changes to these values write back to the file.
   A `.json` file of the same name is still read if no `.toml` exists.
   - Production: `~/.config/irisnotes/`. Development: `dev/` in the repo.
2. **The SQLite `settings` table** holds UI-managed preferences as JSON values,
   through `atomWithPersistence` in `apps/main/src/atoms/settings.ts`: keys
   `editor` (appearance), `layout` and `branding`. The Config view can export and
   import these (`apps/main/src/storage/settings.ts`).

TOML was chosen over JSON for the file layer: comments, `[section]` nesting,
multi-line strings, and first-class Rust support.

## Consequences

**Good**

- Configuration survives reinstalls, can live in dotfiles, and can be edited
  without the app.
- Frequently changing UI state does not churn files on disk.

**Bad**

- Two stores means every new setting needs a deliberate choice of home.
- The two stores have already overlapped once: the `settings` table has a
  `theme` key (`themeAtom`) that **nothing reads** — the theme actually comes
  from `config.toml` (`apps/main/src/hooks/use-theme.ts`). Dead state like this
  is the predictable failure mode of the split.

**Must be remembered**

- Rule of thumb for new settings: a person would want to edit, comment or keep it
  in dotfiles → TOML; adjusted continuously from the UI → `settings` table.
- `settings` is not synced (ADR-0008 syncs `items` only), so UI preferences are
  per device today.

## Alternatives considered

- **Everything in `config.toml`** — rejected for UI-driven values that change
  many times per session.
- **Everything in SQLite** (the original proposal in `SETTINGS_ARCHITECTURE.md`,
  with `config.toml` migrated away) — only partly carried through: the table was
  built for UI preferences, but `config.toml` and the other TOML files remained
  the source of truth for configuration. No record says why; the split above is
  what the code does.
- **localStorage** — rejected as a source of truth; it is only a startup cache.
