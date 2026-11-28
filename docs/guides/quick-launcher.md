# Quick launcher

Open, create and capture notes from a key without the main window. Verified
against source on 2026-11-27. Background: [ADR-0011](../decisions/adr/ADR-0011-resident-quick-launcher-and-capture.md).

`irisnotes-quick` is a small resident app. Started once (best at login with
`--hidden`), it waits in the tray; each run of `irisnotes-quick` toggles its
launcher bar.

## Keys in the launcher

| Key | Does |
|---|---|
| type | search titles; `~word` content, `@book`, `#section`, `/` root only (F1 lists the syntax) |
| ↑ ↓, Enter | open the selected note in IrisNotes |
| Enter on "Create note …" | create a root note with that title and open it |
| Ctrl+Enter | same, whatever is selected |
| Tab | add a text field for a new note (Shift+Tab or Esc back) |
| Ctrl+Shift+Enter | save the note (title + text) **without opening IrisNotes** |
| Esc, or clicking elsewhere | hide |

The window is just the input until something is typed, then grows to fit the
results. Hyprland ignores a floating window resizing itself, so under Hyprland
the launcher asks the compositor over its IPC socket (`src-tauri/src/hyprland.rs`,
Lua dispatchers first, classic ones as fallback), keeps its top edge in place
and turns off animations for its window, so it doesn't glide between sizes.
A saved note appears in an open IrisNotes window the next time that
window gets focus.

## Keep IrisNotes itself running

Settings → Background → **Keep running when the window is closed**: closing the
window hides it instead of quitting, so notes opened from the launcher appear
instantly. Ctrl+Q (or "Quit IrisNotes" in the command palette) quits for real.
Off by default.

## Hyprland setup (Lua config)

Start both hidden at login, bind the launcher, and give it a launcher-like
window rule. In `~/.config/hypr/lua/`:

```lua
-- startup.lua, inside hl.on("hyprland.start", function() … end)
hl.exec_cmd("irisnotes-quick --hidden")
hl.exec_cmd("irisnotes --hidden") -- only with "Keep running" on

-- binds.lua
bind(combo(alt, "Q"), exec("irisnotes-quick"))

-- rules.lua: replaces any rule that sets a fixed size for irisnotes-quick,
-- which would fight the window sizing itself to its content
hl.window_rule({
  name  = "irisnotes-quick",
  match = { class = "^(irisnotes-quick(-dev)?)$" },
  float      = true,
  no_anim    = true,
  dim_around = true,
  move       = "(monitor_w*0.5-window_w*0.5) (monitor_h*0.2)",
})
```

The rule passed `Hyprland --verify-config` on Hyprland 0.57 (2026-11-27). In
hyprlang the same is `exec-once = irisnotes-quick --hidden`,
`bind = ALT, Q, exec, irisnotes-quick` and
`windowrule = float on, match:class ^(irisnotes-quick)$` plus `no_anim on`,
`dim_around on` and the `move` above.

Dev builds use the class `irisnotes-quick-dev`; the debug binary is
`apps/quick/src-tauri/target/debug/irisnotes-quick`.

## Releasing

Both apps stay running, and a running binary can't be replaced, so quit them
before `./install-local.sh`: the quick app from its tray menu (Quit), IrisNotes
with Ctrl+Q.

## Known issues

- Placement depends on the compositor rule; without one the launcher opens
  wherever the compositor puts new floating windows.
- On other Wayland compositors that, like Hyprland, ignore client resizes of
  floating windows, the launcher stays at its first size.
- A capture made while IrisNotes is open shows up in its tree only when its
  window next gains focus.
