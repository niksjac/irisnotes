# Hotkeys

How keyboard shortcuts are defined and how to override them. Verified against
source on 2026-10-04.

To see every active shortcut in the app: **Ctrl+Shift+.** opens the Keyboard
Shortcuts view; **F12** shows a quick reference overlay.

## Two layers

| Layer | Defaults | Notation | Scope |
|---|---|---|---|
| **App hotkeys** | `apps/main/src/config/default-hotkeys.ts` | react-hotkeys-hook: `ctrl+shift+left` | layout, tabs, panes, focus, views, search, tree |
| **Editor keybindings** | `apps/main/src/config/default-editor-keybindings.ts` | ProseMirror: `Mod-Shift-k` | formatting and line commands inside the rich editor |

App hotkeys are registered with `useHotkeys` in
`apps/main/src/hooks/use-app-hotkeys.ts`. Editor keybindings are matched in the
rich editor's keydown handling. Both are overridden from the same file.

## Where to override

| Build | File |
|---|---|
| Installed app | `~/.config/irisnotes/hotkeys.toml` |
| Development (`pnpm dev`) | `dev/hotkeys.toml` |

Only list what you change; everything else keeps its default. A `hotkeys.json`
is read instead if no `.toml` exists.

Saving the file reloads it while the app runs; no restart needed.

## App hotkeys

Each override is a table named after the action id (the keys of
`DEFAULT_HOTKEYS`):

```toml
[toggleSidebar]
key = "ctrl+g"
description = "Toggle Notes Sidebar"
category = "Layout"
global = true
```

- An override **replaces the whole default entry**, so give all four fields —
  leaving out `description` or `category` leaves them empty in the Shortcuts
  view.
- `global = true` lets the hotkey fire while focus is in the editor or in an
  input field; `false` limits it to when neither has focus.
- Modifiers: `ctrl`, `shift`, `alt`, `meta`. Arrow keys: `left`, `right`, `up`,
  `down`. Punctuation by name: `comma`, `period`.
- Keys are matched by **physical key position** (`KeyboardEvent.code`), so
  `ctrl+comma` works the same on Nordic, US and other layouts.
- `F1` is reserved for Branding & About; a `showQuickHotkeys` binding set to
  `f1` is ignored and the default kept.

## Editor keybindings

Override them in an `[editor]` section, one line per keybinding id (the
`EditorKeybindingId` values in `default-editor-keybindings.ts`; the list is also
in `dev/hotkeys-template.toml`):

```toml
[editor]
insertLink = "Mod-Shift-k"
moveLineUp = "Alt-ArrowUp"
```

- Only the key changes; description and category stay as defined.
- `Mod` is Ctrl on Linux and Windows, Cmd on macOS.
- Arrow keys use their full names here: `ArrowUp`, `ArrowDown`, …
- Letters match case-insensitively; digits match by physical key, so
  `Mod-Shift-1` works on any layout.

## Adding a hotkey (for contributors)

- **App hotkey:** add the id to `HotkeyMapping` in
  `apps/main/src/types/index.ts`, a default in `default-hotkeys.ts`, and a
  `useHotkeys` call in `use-app-hotkeys.ts`.
- **Editor keybinding:** add the id to `EditorKeybindingId` and a default in
  `default-editor-keybindings.ts`, then handle it in the editor. `pnpm run
  type-check` fails until every exhaustive map covers the new id.
- Check both layers for conflicts — an app hotkey with `global = true` fires
  inside the editor too.
