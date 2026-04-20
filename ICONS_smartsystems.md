# Icons: How They Work on This System

Everything about how desktop icons are resolved, displayed, and installed — covering the taskbar, system tray, app launchers, and the custom Icon Browser widget.

---

## 1. The Icon Theme System (freedesktop.org / XDG)

Linux desktop icons follow the [freedesktop Icon Theme Specification](https://specifications.freedesktop.org/icon-theme-spec/latest/). Icons are organized into **themes**, which are directory trees containing icons at various sizes.

### Lookup Order

When GTK (or anything using `Gtk.IconTheme`) looks up an icon by name:

1. **Active theme** — currently `Adwaita` (set via `gsettings get org.gnome.desktop.interface icon-theme`)
2. **Inherited themes** — Adwaita inherits `AdwaitaLegacy`, then `hicolor`
3. **hicolor** — the universal fallback theme, always searched last

The `hicolor` theme is where app-specific icons go. Theme icons (like `folder`, `edit-copy`) live in Adwaita.

### Directory Structure

```
/usr/share/icons/
├── Adwaita/              # Active desktop theme (Adwaita)
│   ├── index.theme       # Inherits=AdwaitaLegacy,hicolor
│   ├── scalable/         # SVGs
│   └── symbolic/         # Monochrome variants
├── hicolor/              # Universal fallback theme
│   ├── index.theme
│   ├── 16x16/apps/      # PNG icons per size
│   ├── 22x22/apps/
│   ├── 32x32/apps/
│   ├── 48x48/apps/
│   ├── 64x64/apps/
│   ├── 128x128/apps/    # ← most common for app icons
│   ├── 256x256/apps/
│   ├── 512x512/apps/
│   ├── scalable/apps/   # SVG icons (resolution-independent)
│   └── symbolic/         # Monochrome symbolic icons
└── default -> Adwaita    # Symlink

~/.local/share/icons/
└── hicolor/
    └── 128x128/apps/
        └── irisnotes.png # ← user-installed app icons
```

### How an Icon Gets Its Name

An icon's **name** is simply the filename without extension. For example:
- `/usr/share/icons/hicolor/128x128/apps/firefox.png` → icon name: `firefox`
- `/usr/share/icons/hicolor/scalable/apps/keepassxc.svg` → icon name: `keepassxc`
- `~/.local/share/icons/hicolor/128x128/apps/irisnotes.png` → icon name: `irisnotes`

The name is what `.desktop` files reference in their `Icon=` field, and what GTK widgets use in `iconName=`.

### How Icons Get Installed

| Method | Where Icons Land | Example |
|--------|-----------------|---------|
| **pacman/AUR packages** | `/usr/share/icons/hicolor/<size>/apps/<name>.png` | `firefox.png`, `keepassxc.svg` |
| **Manual install scripts** | `~/.local/share/icons/hicolor/<size>/apps/<name>.png` | `irisnotes.png` |
| **Pixmaps (legacy)** | `/usr/share/pixmaps/<name>.png` | Rarely used now |
| **Bundled absolute path** | Anywhere on disk | Trilium: `~/apps/trilium/icon.png` |

After installing icons to hicolor, you should run:
```bash
gtk-update-icon-cache ~/.local/share/icons/hicolor/
# or for system-wide:
sudo gtk-update-icon-cache /usr/share/icons/hicolor/
```
This rebuilds `icon-theme.cache` for faster lookups. GTK4 will still find icons without the cache, but it's slower.

### Supported Formats

- **SVG** — preferred, scales to any size
- **PNG** — common, provide multiple sizes for crispness
- **XPM** — legacy, rarely used

---

## 2. The Taskbar (AGS3 Panel)

The taskbar in `ags3-panel/widget/Taskbar.tsx` shows icons for open windows. The icon resolution flow:

### Resolution Chain

```
Window opens → Hyprland reports class (app_id) → Taskbar resolves icon
```

The `getIconNameFromClass(windowClass)` function in [Taskbar.tsx](../repos/ags+astal/ags3-panel/widget/Taskbar.tsx) follows this priority:

1. **Custom override** — checks `~/.config/irisnotes/<class>-taskbar-icon.{svg,png,icon}`
   - `.svg` / `.png` → absolute file path used directly
   - `.icon` → text file containing an icon theme name
2. **AstalApps lookup** — iterates all `.desktop` files:
   - Matches by `StartupWMClass` (case-insensitive)
   - Matches by `.desktop` filename
   - Returns the `Icon=` value from the matching entry
3. **Manual .desktop search** — reads `.desktop` files from:
   - `~/.local/share/applications/`
   - `/usr/share/applications/`
   - Matches `StartupWMClass`, then exact filename, then partial filename
4. **Fallback** — `application-x-executable` (generic binary icon)

### Icon Rendering

```tsx
// Taskbar decides based on whether icon is a path or a name:
{group.icon.startsWith("/") ? (
  <image file={group.icon} pixelSize={18} />       // Absolute path → file
) : (
  <image iconName={group.icon} pixelSize={18} />   // Theme name → GTK lookup
)}
```

### Current App Status

| App | Window Class | Desktop `Icon=` | `StartupWMClass` | Taskbar Icon Resolves? |
|-----|-------------|-----------------|-------------------|----------------------|
| Firefox | `firefox` | `firefox` | `firefox` | ✅ via hicolor |
| KeePassXC | `org.keepassxc.KeePassXC` | `keepassxc` | `keepassxc` | ✅ via hicolor |
| VS Code | `code` | `vscode` | `code` | ✅ via .desktop match |
| IrisNotes | `irisnotes` | `irisnotes` | *(missing)* | ✅ via .desktop filename match → `irisnotes` → hicolor |
| IrisNotes Quick | `irisnotes-quick` | `irisnotes` | *(missing)* | ⚠️  relies on partial .desktop match |
| Trilium | `Trilium Notes` | `/home/niklas/apps/trilium/icon.png` | *(missing)* | ⚠️  absolute path, only works via .desktop search |

### Problems and Fixes

**Trilium**: The desktop files use an absolute path (`Icon=/home/niklas/apps/trilium/icon.png`) and have no `StartupWMClass`. The taskbar can find it via the `.desktop` `Name=` partial match, but it gets the absolute path as the icon — which works but bypasses the theme system.

**Better approach for Trilium**:
```bash
# 1. Install icon into hicolor
cp ~/apps/trilium/icon.png ~/.local/share/icons/hicolor/128x128/apps/trilium.png
gtk-update-icon-cache ~/.local/share/icons/hicolor/

# 2. Fix desktop files to use theme name + add WMClass
cat > ~/.local/share/applications/trilium-notes.desktop << 'EOF'
[Desktop Entry]
Type=Application
Name=Trilium Notes
Icon=trilium
Exec=/home/niklas/apps/trilium/trilium
StartupWMClass=Trilium Notes
Categories=Office
Terminal=false
EOF
```

**IrisNotes**: Desktop files should add `StartupWMClass` for more reliable matching:
```ini
# In irisnotes.desktop:
StartupWMClass=irisnotes

# In irisnotes-quick.desktop:  
StartupWMClass=irisnotes-quick
```

---

## 3. The System Tray (StatusNotifierItem / SNI)

The system tray uses the [StatusNotifierItem](https://freedesktop.org/wiki/Specifications/StatusNotifierItem/) D-Bus protocol. Apps register tray items with the `org.kde.StatusNotifierWatcher` service (provided by AGS via AstalTray).

### How Tray Icons Work

Each tray item exposes these icon-related D-Bus properties:

| Property | Type | Description |
|----------|------|-------------|
| `IconName` | string | Icon theme name (e.g. `keepassxc-locked`) |
| `IconThemePath` | string | Custom theme search path |
| `IconPixmap` | array of (w, h, data) | Raw ARGB32 pixel data |

Apps can provide icons via **any combination** of these. The `AstalTray.TrayItem` library unifies them into a single `gicon` property (a `Gio.Icon`):

- If `IconName` is set → uses `Gtk.IconTheme` lookup (respecting `IconThemePath`)
- If only `IconPixmap` is set → converts to `GdkPixbuf.Pixbuf` (which implements `GIcon`)
- The `gicon` property automatically picks the best source

### SysTray Widget

```tsx
// In SysTray.tsx:
const img = new Gtk.Image({ gicon: item.gicon })
// Automatically handles both theme names and pixbuf data
```

### Current Tray Items

| App | SNI Id | IconName | IconPixmap | How Icon Shows |
|-----|--------|----------|------------|----------------|
| CopyQ | `CopyQ_copyq` | `""` (empty) | 5 entries | Pixmap (embedded) |
| KeePassXC | `KeePassXC` | `keepassxc-locked` | 3 entries | Theme name ✅ |
| Chrome | `chrome_status_icon_1` | `""` | 1 entry | Pixmap (embedded) |
| **Trilium** | `chrome_status_icon_1` | `""` (empty) | 1 entry | Pixmap only (Electron default) |
| **IrisNotes Quick** | `tray-icon tray app` | temp file path | *(none)* | File at `/run/user/1000/tray-icon/` |

### Why Trilium's Tray Icon May Look Wrong

Trilium is an Electron app. Electron registers tray icons as `chrome_status_icon_1` with:
- **No IconName** (empty string)
- **No IconThemePath**
- **Only IconPixmap** — raw pixel data embedded in D-Bus

This means:
- The icon **cannot** be themed or overridden via the icon theme system
- AstalTray converts the pixmap to a `GdkPixbuf.Pixbuf` and exposes it as `gicon`
- Quality depends on the resolution of the embedded pixmap
- The SNI `Id` is generic (`chrome_status_icon_1`), making it indistinguishable from other Electron apps

**There's not much you can do** to change Trilium's tray icon externally — it's hardcoded inside the Electron app. The only option would be to modify Trilium's source or use a tray icon override mechanism (which AstalTray does not currently support).

### IrisNotes Quick Tray Icon

IrisNotes Quick (Tauri v2) uses the `trayIcon` config in `tauri.conf.json`:
```json
"trayIcon": {
  "iconPath": "icons/icon.png",
  "iconAsTemplate": true
}
```

Tauri writes the icon as a temp PNG to `/run/user/1000/tray-icon/` and registers it via the ayatana SNI interface with:
- `IconName` = absolute path to the temp file
- `IconThemePath` = the temp directory

This works but is fragile — the temp path changes on each launch. AstalTray's `gicon` handles this correctly by searching `IconThemePath` for the file.

**IrisNotes main has NO tray icon** — neither `tauri.conf.json` nor Rust source contains any tray configuration. It only appears in the taskbar.

---

## 4. The Icon Browser Widget

The Icon Browser (`ags3-panel/widget/IconBrowser.tsx`) shows all icons discoverable by the GTK4 icon theme system.

### How It Discovers Icons

```typescript
const theme = Gtk.IconTheme.get_for_display(display)
// Add extra search paths
theme.add_search_path("/usr/share/pixmaps")
// List all icon names
const allNames = theme.get_icon_names()
```

`Gtk.IconTheme.get_icon_names()` returns every icon name found in:
1. The active theme (`Adwaita`) and its inherited themes
2. `hicolor` (always included)
3. Any paths added via `add_search_path()`
4. `$HOME/.local/share/icons/` (XDG user data dir)

### Why an Icon Appears (or Doesn't) in the Browser

An icon appears in the browser if it exists as a file in **any** of the searched icon theme directories with a recognized extension (.svg, .png, .xpm).

| Icon | In Browser? | Why |
|------|------------|-----|
| `firefox` | ✅ | Installed in hicolor by pacman |
| `irisnotes` | ✅ | Installed in `~/.local/share/icons/hicolor/128x128/apps/` |
| `trilium` | ❌ | Only exists as `~/apps/trilium/icon.png` — not in any theme directory |
| `keepassxc-locked` | ✅ | Installed in hicolor by pacman |

### Icon Detail Panel (Tracing)

Clicking an icon in the browser shows a detail panel with provenance info via `lookupIconInfo()`:

```
Name:    firefox
Path:    /usr/share/icons/hicolor/128x128/apps/firefox.png
Format:  PNG
Theme:   hicolor
Size:    128x128
Origin:  System package (pacman/AUR)
```

The tracing uses `Gtk.IconTheme.lookup_icon()` → `Gtk.IconPaintable.get_file()` to find the actual file on disk, then parses the path to determine theme, size directory, and origin.

---

## 5. Making IrisNotes Icons Available Everywhere

### Current State

| Context | Works? | How |
|---------|--------|-----|
| **App launcher** (rofi, etc.) | ✅ | `.desktop` file has `Icon=irisnotes`, icon in hicolor |
| **Taskbar** | ✅ | Taskbar finds `.desktop` → `irisnotes` → hicolor lookup |
| **Icon Browser** | ✅ | GTK theme lists `irisnotes` from hicolor |
| **System tray (main)** | ❌ | No tray icon configured |
| **System tray (quick)** | ⚠️ | Works via temp file, but uses generic temp path |

### What's Missing

1. **No `StartupWMClass`** in `.desktop` files — makes matching less reliable
2. **Only one icon size** (128x128) — works but not optimal for all contexts
3. **Main app has no tray icon** — only Quick has one
4. **No scalable (SVG) icon** — PNGs don't scale as well

### Recommended Install (Full Coverage)

Provide multiple sizes and an SVG for the install script:

```bash
# In install-local.sh, after building:

ICON_DIR="$PREFIX/share/icons/hicolor"
ICON_SRC="$SCRIPT_DIR/apps/main/src-tauri/icons"

# Install PNG at multiple sizes
for size in 32 128 256 512; do
    mkdir -p "$ICON_DIR/${size}x${size}/apps"
    # Resize if needed, or provide pre-made sizes
    if [ -f "$ICON_SRC/${size}x${size}.png" ]; then
        cp "$ICON_SRC/${size}x${size}.png" "$ICON_DIR/${size}x${size}/apps/irisnotes.png"
    fi
done

# Install SVG if available (best for scalability)
if [ -f "$ICON_SRC/icon.svg" ]; then
    mkdir -p "$ICON_DIR/scalable/apps"
    cp "$ICON_SRC/icon.svg" "$ICON_DIR/scalable/apps/irisnotes.svg"
fi

# Update icon cache
gtk-update-icon-cache "$ICON_DIR" 2>/dev/null || true
```

And add `StartupWMClass` to both desktop entries:

```ini
# irisnotes.desktop
StartupWMClass=irisnotes

# irisnotes-quick.desktop
StartupWMClass=irisnotes-quick
```

### Adding a Tray Icon to IrisNotes Main

The main app currently has no tray icon. To add one via Tauri v2, add to `apps/main/src-tauri/tauri.conf.json`:

```json
{
  "app": {
    "trayIcon": {
      "iconPath": "icons/icon.png",
      "iconAsTemplate": false
    }
  }
}
```

This will make Tauri register the app with `org.kde.StatusNotifierWatcher` and AstalTray's SysTray widget will pick it up automatically.

---

## 6. Making Trilium's Icon Available Everywhere

### Current State

| Context | Works? | How |
|---------|--------|-----|
| **App launcher** | ⚠️ | `.desktop` uses absolute path to `~/apps/trilium/icon.png` |
| **Taskbar** | ⚠️ | Found via .desktop Name= partial match, gets absolute path |
| **Icon Browser** | ❌ | Not in any icon theme |
| **System tray** | ⚠️ | Electron pixmap — generic `chrome_status_icon_1` id |

### Fix: Install into Icon Theme

```bash
# One-time setup:
mkdir -p ~/.local/share/icons/hicolor/128x128/apps
cp ~/apps/trilium/icon.png ~/.local/share/icons/hicolor/128x128/apps/trilium.png
gtk-update-icon-cache ~/.local/share/icons/hicolor/ 2>/dev/null
```

### Fix: Proper Desktop Entry

```bash
cat > ~/.local/share/applications/trilium-notes.desktop << 'EOF'
[Desktop Entry]
Type=Application
Name=Trilium Notes
Icon=trilium
Exec=/home/niklas/apps/trilium/trilium
StartupWMClass=Trilium Notes
Categories=Office
Terminal=false
EOF

# Remove the duplicate/broken entry
rm -f ~/.local/share/applications/trilium.desktop
```

After these fixes:
- App launcher will use the themed icon
- Taskbar will find `trilium` via `StartupWMClass` match
- Icon Browser will show `trilium`
- System tray will **still** use Electron's embedded pixmap (can't change externally)

---

## 7. Summary: Where Each Context Gets Its Icon

```
┌─────────────────────┬─────────────────────────────────────────────────┐
│ Context             │ Icon Source                                     │
├─────────────────────┼─────────────────────────────────────────────────┤
│ App Launcher        │ .desktop Icon= → GTK theme lookup              │
│ (rofi, etc.)        │                                                 │
├─────────────────────┼─────────────────────────────────────────────────┤
│ AGS Taskbar         │ window class → .desktop match → Icon= value    │
│                     │ OR custom override in ~/.config/irisnotes/      │
│                     │ Then: theme name → GTK lookup, or abs path     │
├─────────────────────┼─────────────────────────────────────────────────┤
│ System Tray (SNI)   │ App registers via D-Bus:                       │
│                     │ - IconName (theme name) → GTK lookup            │
│                     │ - IconPixmap (raw pixels) → GdkPixbuf          │
│                     │ - IconThemePath (custom dir) for custom lookup  │
│                     │ AstalTray unifies into gicon property           │
├─────────────────────┼─────────────────────────────────────────────────┤
│ Icon Browser        │ Gtk.IconTheme.get_icon_names() → all icons in  │
│                     │ active theme + hicolor + search paths           │
├─────────────────────┼─────────────────────────────────────────────────┤
│ Hyprland window     │ app_id (Wayland) / WM_CLASS (X11) → used for   │
│ decorations         │ window rules, not icon display                  │
└─────────────────────┴─────────────────────────────────────────────────┘
```

### The Golden Path: How to Make Any App's Icon Show Everywhere

1. **Create icon file** — ideally SVG, or PNG at 128x128+ 
2. **Install into hicolor** — `~/.local/share/icons/hicolor/{size}/apps/{name}.png`
3. **Update icon cache** — `gtk-update-icon-cache ~/.local/share/icons/hicolor/`
4. **Desktop entry** — `Icon={name}` (theme name, not path) + `StartupWMClass={class}`
5. **Tray** — app must register with StatusNotifierWatcher (app-side, e.g. Tauri `trayIcon`)

Step 1-4 cover launchers, taskbar, and icon browser. Step 5 is app-internal for the system tray.
