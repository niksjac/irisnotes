# Configuration and themes

Where IrisNotes keeps its settings and which ones you can edit by hand.
Verified against source on 2026-10-04. The reasoning behind the split is in
[ADR-0007](../decisions/adr/ADR-0007-configuration-toml-and-settings-table.md).

## Where things live

| Build | Directory |
|---|---|
| Installed app | `~/.config/irisnotes/` |
| Development (`pnpm dev`) | `dev/` in the repo |

That directory holds:

| File | Contents |
|---|---|
| `config.toml` | theme and sync — see below |
| `hotkeys.toml` | shortcut overrides — see [hotkeys.md](hotkeys.md) |
| `autocorrect.toml` | text replacements while typing |
| `ascii-art.toml` | snippets inserted by hotkey |
| `notes.db` | the database (notes, plus UI preferences in its `settings` table) |
| `assets/` | images pasted into notes |

For each TOML file, a `.json` file of the same name is read instead if no
`.toml` exists.

The database location is fixed to `notes.db` in this directory; it cannot be
moved through configuration.

## `config.toml`

Only list what you change. The keys the app actually reads:

```toml
theme = "nord"            # see Themes below

[sync]                    # remote sync, off by default
enabled = false
serverUrl = "http://127.0.0.1:8787"
token = ""
intervalSeconds = 30
```

Sync is normally configured in the app's **Sync view** (activity bar), which
writes these values back to the file. Deployment of the server is described in
[`apps/server/DEPLOY.md`](../../apps/server/DEPLOY.md).

Edits to `config.toml` made outside the app are picked up while it runs.

## Themes

Switch with **Ctrl+K** (theme switcher) or from the command palette. The choice
is saved as `theme` in `config.toml`.

| Id | | Id | |
|---|---|---|---|
| `default-dark` (default) | dark | `default-light` | light |
| `nord` | dark | `catppuccin-latte` | light |
| `catppuccin-mocha` | dark | `solarized-light` | light |
| `tokyo-night` | dark | | |
| `gruvbox` | dark | | |
| `rose-pine` | dark | | |

Themes are defined in `apps/main/src/config/themes.ts`. To avoid a flash of the
wrong theme on start, `apps/main/index.html` applies the last theme from
`localStorage` before React loads; `config.toml` remains the source of truth.

## Autocorrect and ASCII art

`autocorrect.toml` — one table per rule:

```toml
[arrow_right]
trigger = "-->"
replacement = "→"
description = "Right arrow"
```

`ascii-art.toml` — one table per snippet, inserted by its hotkey:

```toml
[insert_arrow]
art = """
  ──────►
"""
description = "Insert arrow"
key = "ctrl+shift+alt+3"
```

## Preferences stored in the database

Editor appearance (font, size, line height, cursor — see
[editor.md](editor.md)), layout and branding are set from the UI and stored in
the `settings` table of `notes.db`, not in TOML. The Config view can export them
to a JSON file and import them again. They are **not** synced between devices.

## Known issues

- **Only `config.toml` reloads live.** The config watcher
  (`setup_config_watcher` in `apps/main/src-tauri/src/lib.rs`) emits only for
  `config.toml` / `config.json`. Changes to `hotkeys.toml`, `autocorrect.toml`
  and `ascii-art.toml` take effect after a restart — or, by accident, after any
  `config.toml` change, because their listeners also reload on a filename-less
  event.
- **Keys that are accepted but ignored.** `AppConfig` and the default config
  still define keys that no code reads: `[debug] enableExampleNote`,
  `[development]`, `[production]`, `[layout]`, `[editor] toolbarVisible`,
  `titleBarVisible`, `metadataBarVisible` (these three come from persisted
  layout state instead), `[editor] lineWrapping` (written when you toggle
  wrapping, but the editor setting in the database always takes precedence),
  and `[storage.sqlite] database_path` (replaced at startup by the fixed path).
  Writing them has no effect.
- **A dead `theme` setting.** The `settings` table also defines a `theme` key
  that nothing reads; see ADR-0007.
