# ADR-0011: Resident quick launcher that can create notes; main app optionally resident

- **Status:** Accepted
- **Date:** 2026-11-27
- **Recorded:** —
- **Supersedes:** —
- **Related:** [ADR-0006](ADR-0006-quick-search-separate-app.md),
  [ADR-0004](ADR-0004-fractional-indexing-sort-order.md),
  [ADR-0008](ADR-0008-local-first-sync-central-hub.md),
  [quick-launcher.md](../../guides/quick-launcher.md)

## Context

The owner opens notes from a Hyprland key (Alt+Q). Before this change:

- `irisnotes-quick` stayed resident once started (tray icon, single instance),
  but nothing started it at login, so the first use paid for a webview start,
  and it showed its window as soon as it started.
- Its window was a fixed 1100×450 panel that stayed up until Escape; it didn't
  hide on focus loss or toggle on a second key press.
- Opening a note while the main app was closed was a cold start, and the main
  app forwarded `--open-note` to its UI after a fixed 500 ms sleep.
- Notes could only be created inside the main window.

The owner wants less friction: type a query straight after the key press, see
results only once something is typed, open or create a note, or capture a note
without the main window. Whether the main app stays running should be a setting.

## Decision

- **Launcher.** `irisnotes-quick --hidden` starts it without a window (session
  autostart). A second `irisnotes-quick` (the Alt+Q bind) toggles it. The
  window is a launcher bar: just the input, growing to its content (results, a
  "Create" row, key hints) through the `resize_launcher` command (under
  Hyprland, which ignores a floating window resizing itself, through its IPC
  socket: `apps/quick/src-tauri/src/hyprland.rs`); it hides on
  Escape, after acting, and on focus loss. Placement is left to compositor
  rules (Wayland clients can't position themselves).
- **Create and open.** Ctrl+Enter (or the "Create" row) launches
  `irisnotes --new-note=<title>`; the main app creates a root note and opens it.
- **Quick capture.** Ctrl+Shift+Enter makes the quick app **write the note
  itself** (`apps/quick/src-tauri/src/capture.rs`): a root note with the main
  app's id format, a `sort_order` after the last root note (a Rust port of
  `generateKeyBetween(last, null)`, tested against the JS package's output),
  and `toISOString()`-shaped timestamps so sync pushes it. The body is stored
  one `<p>` per line (ADR-0005).
- **Launch hand-off.** The main app queues `--open-note` / `--new-note` (from a
  second instance or its own start) until the UI calls `launch_ready`, then
  emits `launch-action` events. No fixed delay.
- **Main app residency is a setting** ("Keep running when the window is
  closed", Settings → Background, off by default). When on, closing hides the
  window and Ctrl+Q quits. `irisnotes --hidden` starts it without a window.
  The main window now starts hidden in `tauri.conf.json` and is shown in setup
  after the saved size is applied, unless `--hidden`.
- **Seeing captured notes.** When the main window gains focus and the item
  count or newest `created_at` changed, it reloads the items.

Invariant: the quick app's insert must produce rows the main app and sync
would have produced — same columns, id shape, `sort_order` rules and timestamp
format. Changes to `createItem` in the main app or to `items` in
`schema/base.sql` have to be mirrored in `capture.rs`.

## Consequences

**Good**

- Alt+Q to typing is a window show, not an app start, once autostarted.
- Notes can be opened, created and captured without the main window; with the
  main app resident, opening a note is instant too.
- No race on cold starts: the UI pulls queued actions when it is ready.

**Bad**

- The quick app now **writes** to the database, not only reads (ADR-0006 said
  read-side). Note creation exists twice (TypeScript and Rust), with the
  invariant above to keep in sync.
- Two resident processes. `install-local.sh` can't replace running binaries, so
  both have to be quit before a release install (tray → Quit, Ctrl+Q).
- Launcher look depends on compositor rules the owner maintains outside the
  repo; an old fixed-size rule fights the auto-sizing window.
- Captured notes appear in an open main window only on its next focus.

**Neutral**

- `--hidden`, `--new-note` and `--open-note` are part of the main binary's CLI
  surface (clap, `apps/main/src-tauri/src/cli.rs`).

## Alternatives considered

- **Layer-shell overlay (like rofi).** True shell integration with its own
  keyboard grab, but Wayland-only, more code, and untested with WebKitGTK in
  Tauri. Rejected for now; window rules give the same behaviour in practice.
- **Capture through the main app** (`irisnotes --new-note` without opening).
  Simpler, one creation path, but starts the whole main app for a capture,
  which is the friction this removes.
- **Main app always resident.** Fastest, but changes what closing the window
  means for everyone; made a setting instead.
- **Keep the 500 ms delay.** Simple, but too short on a slow start and wasted on
  a fast one.
