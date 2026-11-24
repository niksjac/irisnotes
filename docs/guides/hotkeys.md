# Hotkeys

How keyboard shortcuts are defined and how to override them. Verified against
source on 2026-11-24.

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

## Layout toggles (Ctrl+2–9)

Each number shows or hides one part of the window, in the same scheme as the
owner's GTK apps (falcon, K9: 1 title bar, 2 toolbar, 3 sidebar, 4 status bar).
Ctrl+1 is unassigned: the window title bar (logo, tab title, close) has no
toggle of its own and is hidden only by zen mode (F11).

| Key | Part | Action id |
|---|---|---|
| Ctrl+2 | Toolbar | `toggleAppToolbar` |
| Ctrl+3 (also Ctrl+G) | Notes sidebar | `toggleSidebar` |
| Ctrl+4 | Status bar | `toggleStatusBar` |
| Ctrl+5 | Tab bar | `toggleTabBar` |
| Ctrl+6 | Formatting toolbar (per pane) | `toggleToolbar` |
| Ctrl+7 | Note title (per pane) | `toggleTitleBar` |
| Ctrl+8 | Note info bar | `toggleMetadataBar` |
| Ctrl+9 | Note hotkey bar | `toggleNoteConfigBar` |

The toolbar's **More** menu (⋯) lists the same toggles with their current keys,
and the window title bar has one show/hide button per part, in the same order,
left of Close (dimmed while that part is hidden).
Visibility is remembered across restarts, except the note hotkey bar. When the
toolbar is hidden, its key and the command palette (Ctrl+Shift+P) bring it back.

These keys used to focus tabs 1–9; numbered tab focus is gone (use Ctrl+Tab or
the tab palette). Overrides for action ids that no longer exist are ignored, so
an old `[focusTab1]` entry in `hotkeys.toml` does nothing — but an old
`[toggleSidebar] key = "ctrl+g"` still wins over the default (which has both
Ctrl+3 and Ctrl+G); remove it to get both back.

## Where to override

| Build | File |
|---|---|
| Installed app | `~/.config/irisnotes/hotkeys.toml` |
| Development (`pnpm dev`) | `dev/hotkeys.toml` |

Only list what you change; everything else keeps its default. A `hotkeys.json`
is read instead if no `.toml` exists.

Saving the file reloads it while the app runs; no restart needed.

### Changing app hotkeys in the app

In the Keyboard Shortcuts view, click an **App** shortcut and press the new
combination (Esc cancels); it replaces all of the action's keys. The **+** next
to it records one more key instead, so the action keeps its existing keys. A
key needs Ctrl, Alt or Meta, except F-keys. If another app action already uses
the key, the view says which and asks before assigning it; both then share the
key. A changed key is highlighted with a reset button next to it, which
restores all default keys.

Saving rewrites `hotkeys.toml`: comments are lost, the `[editor]` section is
kept, entries for actions that no longer exist are dropped, and a changed key is
written as just `key = …` (an array when the action has several keys). Editor keybindings can only be changed in the file.

## App hotkeys

Each override is a table named after the action id (the keys of
`DEFAULT_HOTKEYS`):

```toml
[toggleDualPane]
key = "ctrl+alt+s"

# several keys for one action: an array, or one string separated by ","
[toggleSidebar]
key = ["ctrl+3", "ctrl+g"]
```

- An action can have several keys; any of them runs it. Labels show them as
  `Ctrl+3 / Ctrl+G`. An override replaces all default keys, so list every key
  you want to keep.
- Fields left out (`description`, `category`, `global`) keep their defaults.
- `global = true` lets the hotkey fire while focus is in the editor or in an
  input field; `false` limits it to when neither has focus.
- Modifiers: `ctrl`, `shift`, `alt`, `meta`. Arrow keys: `left`, `right`, `up`,
  `down`. Punctuation by name: `comma`, `period`.
- Keys are matched by **physical key position** (`KeyboardEvent.code`), so
  `ctrl+comma` works the same on Nordic, US and other layouts.
- `F1` is reserved for About; a `showQuickHotkeys` binding set to
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
