# Icons

How IrisNotes' icons are produced, installed and resolved on Linux, and how to
change them. Verified against source on 2026-11-17.

## Where each icon comes from

| Context | Source |
|---|---|
| App window, bundles | `apps/main/src-tauri/icons/`, `apps/quick/src-tauri/icons/` (embedded at build time) |
| Launcher, taskbar | `irisnotes.desktop` / `irisnotes-quick.desktop` with `Icon=irisnotes`, resolved through the **hicolor** icon theme |
| Quick app's tray icon | the logo chosen in the About view, embedded in the quick app at build time |
| In-app logo | About view (**F1**) |

## Changing the app icon

1. Edit the source SVG (the current logo is `assets/logo-transparent.svg`).
2. Regenerate the embedded PNG sizes for both apps:
   ```sh
   ./scripts/generate-icons.sh            # or pass another SVG as the argument
   ```
   Needs `rsvg-convert` (`librsvg`) or Inkscape. Without an argument it uses
   `assets/logo-transparent.svg`.
3. Rebuild and reinstall: `./install-local.sh` (it also refreshes the hicolor
   icons and desktop entries, below).

## What `install-local.sh` installs

Under `~/.local` (`$PREFIX`):

- `share/icons/hicolor/{32x32,128x128,256x256,512x512}/apps/irisnotes.png`
  from `apps/main/src-tauri/icons/`, and
  `share/icons/hicolor/scalable/apps/irisnotes.svg` from
  `assets/logo-transparent.svg`; then `gtk-update-icon-cache`.
- `share/applications/irisnotes.desktop` (`StartupWMClass=irisnotes`) and
  `irisnotes-quick.desktop` (`StartupWMClass=irisnotes-quick`), both with
  `Icon=irisnotes`.

Each app sets its program name before GTK starts, so its Wayland `app_id` /
X11 `WM_CLASS` matches the desktop file: `irisnotes` and `irisnotes-quick`, or
`irisnotes-dev` and `irisnotes-quick-dev` in development builds.

`./scripts/install-dev-desktop.sh` installs separate desktop entries and
dev-badged icons for those `-dev` classes, so a running `pnpm dev` instance is
distinguishable in the taskbar.

## Tray icon (quick app)

The About view (**F1**) sets one logo for the window title bar and the quick
app's tray. The choice is saved as the `branding` row of the `settings` table
(`{"logo": "<variant>"}`), which the quick app reads at startup and re-checks
every 3 seconds, so a change reaches the tray without a restart.

The quick app embeds the same logo files the main app offers
(`apps/main/public`) from `LOGOS` in `apps/quick/src-tauri/src/lib.rs`; adding
a variant to `LOGO_OPTIONS` in `apps/main/src/atoms/settings.ts` means adding
it there too. An unknown or missing choice falls back to the purple logo.
Files named `quick-tray-icon.{svg,png}` in the config directory are no longer
read.

## Troubleshooting

```sh
gtk-update-icon-cache ~/.local/share/icons/hicolor      # stale icon
ls ~/.local/share/icons/hicolor/*/apps/irisnotes.*       # what is installed
grep -E 'Icon|StartupWMClass' ~/.local/share/applications/irisnotes*.desktop
```

A taskbar showing a generic icon usually means the window class does not match
a desktop file's `StartupWMClass` — check that the dev and installed builds
aren't being confused.
