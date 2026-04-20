# Icon & Desktop File Paths — Arch Linux Reference

How IrisNotes icons are resolved on this system (Arch Linux, Wayland, AGS3 panel).

## Path Overview

### Desktop Entry Files (`.desktop`)

These tell the system how to launch the app and which icon name to use.

| Path | Scope | Overrides | File |
|------|-------|-----------|------|
| `/usr/share/applications/` | System-wide (pacman) | — | Installed by PKGBUILD |
| `~/.local/share/applications/` | **User** | System | Installed by `install-local.sh` / `install-dev-desktop.sh` |
| `$XDG_DATA_DIRS` lookup | Fallback chain | Varies | Rarely used directly |

**Resolution order**: User (`~/.local/share/applications/`) overrides system (`/usr/share/applications/`).

#### Current desktop entries on this system

| File | Icon= | StartupWMClass | Purpose |
|------|-------|----------------|---------|
| `~/.local/share/applications/irisnotes.desktop` | `irisnotes` | `irisnotes` | Production main app |
| `~/.local/share/applications/irisnotes-quick.desktop` | `irisnotes` | `irisnotes-quick` | Production quick search (NoDisplay=true) |
| `~/.local/share/applications/irisnotes-dev.desktop` | `irisnotes-dev` | `irisnotes-dev` | Dev main app |
| `~/.local/share/applications/irisnotes-quick-dev.desktop` | `irisnotes-dev` | `irisnotes-quick-dev` | Dev quick search (NoDisplay=true) |

### Icon Theme Files (hicolor)

Icons are resolved by icon name (from `.desktop` `Icon=` field) through the [Icon Theme Specification](https://specifications.freedesktop.org/icon-theme-spec/latest/).

| Path | Scope | Overrides |
|------|-------|-----------|
| `/usr/share/icons/hicolor/` | System-wide | — |
| `~/.local/share/icons/hicolor/` | **User** | System |
| `~/.icons/hicolor/` | User (legacy) | System (but not recommended) |

**Resolution order**: `~/.local/share/icons/hicolor/` > `/usr/share/icons/hicolor/`

Within the hicolor theme, icons are organized by size:

```
~/.local/share/icons/hicolor/
├── 32x32/apps/irisnotes.png         # 32×32 raster
├── 128x128/apps/irisnotes.png       # 128×128 raster
├── 256x256/apps/irisnotes.png       # 256×256 raster
├── 512x512/apps/irisnotes.png       # 512×512 raster
├── scalable/apps/irisnotes.svg      # Vector (any size)
├── 32x32/apps/irisnotes-dev.png     # Dev variant (with DEV badge)
├── 128x128/apps/irisnotes-dev.png
├── 256x256/apps/irisnotes-dev.png
├── 512x512/apps/irisnotes-dev.png
└── index.theme                       # Required for gtk-update-icon-cache
```

**Size selection**: The system picks the closest matching size to the requested display size, preferring exact matches. SVG in `scalable/` is used when no exact raster match exists.

### Tauri Embedded Icons

These are compiled into the binary and used as the window icon (title bar, Alt+Tab, etc.).

| Path | Purpose |
|------|---------|
| `apps/main/src-tauri/icons/32x32.png` | 32px window icon |
| `apps/main/src-tauri/icons/128x128.png` | 128px |
| `apps/main/src-tauri/icons/128x128@2x.png` | 256px (HiDPI) |
| `apps/main/src-tauri/icons/icon.png` | 512px fallback |
| `apps/main/src-tauri/icons/icon.svg` | Source SVG |
| `apps/main/src-tauri/icons/icon.ico` | Windows icon |
| `apps/main/src-tauri/icons/icon.icns` | macOS icon |
| `apps/main/src-tauri/icons/Square*.png` | Windows Store icons |
| `apps/quick/src-tauri/icons/` | Same set for quick app |

**Important**: These are embedded at compile time. Changes require `cargo build` to take effect.

### System Tray Icons

| Path | Scope | Purpose |
|------|-------|---------|
| `dev/quick-tray-icon.png` | Dev | Tray icon for Quick Search in dev mode |
| `dev/quick-tray-icon.svg` | Dev | SVG version (if custom) |
| `~/.config/irisnotes/quick-tray-icon.{svg,png}` | Production | Custom tray icon |

The quick app's Rust code checks for these files at startup.

### In-App Logo Assets

Located in `apps/main/public/` (served at `/` by Vite):

| File | Description |
|------|-------------|
| `logo-transparent.svg` | Black outline iris on transparent (source for icon editor) |
| `logo-purple.png` | Purple filled iris |
| `logo-white.png` | White filled iris |
| `iris-detailed-*.svg` | Five detailed iris variants |

Custom logos saved via Icon Editor go to the app data directory:
- Dev: `dev/assets/custom-logo.svg`
- Production: `~/.config/irisnotes/assets/custom-logo.svg`

## Icon Resolution Chain

When the taskbar/panel needs to show an icon for a running window:

```
Window app_id (Wayland) / WM_CLASS (X11)
    ↓
Match against .desktop files' StartupWMClass
    ↓
Read Icon= field from matched .desktop entry
    ↓
Look up icon name in icon themes:
    1. Current GTK theme (e.g. Adwaita, breeze)
    2. hicolor (fallback theme — always checked)
        a. ~/.local/share/icons/hicolor/  (user)
        b. /usr/share/icons/hicolor/      (system)
    ↓
Pick best size match from available PNGs / use SVG from scalable/
```

### AGS3 / AstalApps Specifics

The AGS3 taskbar uses AstalApps to resolve window → icon mappings:

1. AstalApps loads all `.desktop` files (skips `NoDisplay=true` entries)
2. When a window appears, matches `app_id` against `StartupWMClass`
3. Resolves `Icon=` name through the icon theme
4. If no `.desktop` match → falls back to `app_id` as icon name → hicolor lookup

**Key gotchas**:
- `NoDisplay=true` causes AstalApps to skip the entry entirely (used for quick search since it shouldn't appear in app launchers)
- Wayland `app_id` is set by `g_set_prgname()` in our Rust code, not by Tauri's `productName`
- After installing new icons, run `gtk-update-icon-cache ~/.local/share/icons/hicolor/` and restart the panel

## Scripts

| Script | What it does |
|--------|-------------|
| `install-local.sh` | Installs production desktop entries + hicolor icons |
| `scripts/install-dev-desktop.sh` | Installs dev desktop entries + DEV-badged icons |
| `scripts/generate-icons.sh` | Regenerates Tauri embedded icons from source SVG |

## Quick Reference Commands

```bash
# Reinstall production icons to hicolor
./install-local.sh

# Reinstall dev icons (with DEV badge)
./scripts/install-dev-desktop.sh

# Rebuild icon cache after manual icon changes
gtk-update-icon-cache ~/.local/share/icons/hicolor/

# Check what icon theme your system is using
gsettings get org.gnome.desktop.interface icon-theme

# Verify a window's app_id (Wayland)
hyprctl clients | grep -A2 "class:"

# Check what icon name a .desktop file uses
grep "Icon=" ~/.local/share/applications/irisnotes.desktop
```
