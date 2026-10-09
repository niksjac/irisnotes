# Configuration and themes

Where IrisNotes keeps its settings and which ones you can edit by hand.
Verified against source on 2026-10-04, updated 2026-10-09. The reasoning behind the split is in
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
serverUrl = "http://127.0.0.1:8787"   # default; production: https://<machine>.<tailnet>.ts.net:8787
token = ""
intervalSeconds = 30
```

Sync is normally configured in the app's **Sync view** (activity bar), which
writes these values back to the file. Deployment of the server is described in
[`docs/guides/sync-hub.md`](sync-hub.md).

`config.toml`, `hotkeys.toml`, `autocorrect.toml` and `ascii-art.toml` are
reloaded while the app runs when you save them from another editor.

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

## Preferences kept by the app

Editor appearance (font, size, line height, cursor — see
[editor.md](editor.md)) and branding are set from the UI. They live in the app's
local storage (`setting:editor`, `setting:branding`), and every change is also
written to the `settings` table of `notes.db`. Window layout (sidebar, toolbar,
title and metadata bars, panes and tabs) lives in local storage only. None of
these are in TOML, and none are synced between devices.

The Config view can export the database copy to a JSON file; importing it
currently has no effect (see Known issues).

## Known issues

- **Importing settings has no effect.** The import writes the `settings` table
  and reloads the window, but preferences are read from local storage, which the
  import never touches. `atomWithPersistence` (`apps/main/src/atoms/settings.ts`)
  reads the database only through its `initAtom`, and nothing calls it. Fix:
  load the init atoms at startup (making the database the source), or have the
  import write local storage as well.
- **Older `config.toml` files may hold keys from earlier versions** — `[debug]`,
  `[development]`, `[production]`, `[layout]`, `[storage]`, `hotkeys`, and
  `[editor]` visibility and line-wrapping keys. They are ignored and kept when
  the app saves the file; delete them by hand if you like.
