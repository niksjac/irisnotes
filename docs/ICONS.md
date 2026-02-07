# IrisNotes Icon Configuration

This document explains how to customize icons for both the main IrisNotes app and the Quick Search app.

## Quick Reference

| Icon Type | Main App | Quick App |
|-----------|----------|-----------|
| Window/Taskbar | `apps/main/src-tauri/icons/` | `apps/quick/src-tauri/icons/` |
| System Tray | N/A | `~/.config/irisnotes/quick-tray-icon.png` |

## 1. Changing System Tray Icon (Quick App Only)

The Quick app supports custom tray icons at runtime without rebuilding.

### Production
Place your custom icon at:
```
~/.config/irisnotes/quick-tray-icon.png
```

### Development
Place your icon at:
```
dev/quick-tray-icon.png
```

**Requirements:**
- Format: PNG
- Recommended size: 32x32 or 64x64 pixels (will be scaled)
- Restart the app after changing

## 2. Changing App Icons (Window, Taskbar, Desktop Entry)

App icons are embedded at build time. To customize:

### Step 1: Create Your Icon

Create a **1024x1024 PNG** icon with transparency.

### Step 2: Generate All Sizes

Use Tauri CLI to generate all required sizes:

```bash
cd apps/main
pnpm exec tauri icon path/to/your-icon.png
```

This generates:
- `icons/32x32.png` - Small icon
- `icons/128x128.png` - Medium icon
- `icons/128x128@2x.png` - Retina medium
- `icons/icon.png` - 512x512 base icon
- `icons/icon.ico` - Windows icon
- `icons/icon.icns` - macOS icon bundle
- `icons/Square*.png` - Windows Store icons
- `icons/StoreLogo.png` - Windows Store logo

### Step 3: Rebuild

```bash
pnpm run build
```

### Quick App Icons

Same process for the quick app:
```bash
cd apps/quick
pnpm exec tauri icon path/to/your-quick-icon.png
pnpm run build
```

## 3. Dark/Light Theme Support

### System Tray (Quick App)

The Quick app **automatically detects your system theme** and loads the appropriate icon.

**macOS:** The `iconAsTemplate: true` setting automatically adapts the icon to light/dark mode. Use a single-color icon (black or white with transparency) for best results.

**Linux:** The app detects GTK/GNOME color scheme and loads theme-specific icons if available.

#### Setting Up Theme-Specific Tray Icons

1. Create two icons:
   - `quick-tray-icon-light.png` - Light-colored icon (for dark theme panels)
   - `quick-tray-icon-dark.png` - Dark-colored icon (for light theme panels)

2. Place them in:
   ```
   # Production
   ~/.config/irisnotes/quick-tray-icon-light.png
   ~/.config/irisnotes/quick-tray-icon-dark.png
   
   # Development
   dev/quick-tray-icon-light.png
   dev/quick-tray-icon-dark.png
   ```

3. The app will automatically pick the correct icon based on your system theme.

4. If no theme-specific icons exist, it falls back to `quick-tray-icon.png`.

#### Icon Naming Convention
- `-light` suffix = Light-colored icon for **dark** theme backgrounds
- `-dark` suffix = Dark-colored icon for **light** theme backgrounds

This matches how most design systems name their icon variants (by the icon's color, not the background).

#### Manual Override

If theme detection doesn't work for your setup, just use `quick-tray-icon.png` without variants. Design it to be visible on both light and dark backgrounds (e.g., with an outline or contrasting colors).

### Bundle Icons (Main App)

Bundle icons cannot change at runtime. Options:

1. **Use a neutral icon** that works on both light and dark backgrounds
2. **Provide separate builds** for light/dark themes (not recommended)

The recommended approach is to design an icon with:
- Good contrast on both light and dark backgrounds
- A colored or outlined design (not pure black or white)
- Sufficient padding/border for visibility

## 4. Icon Design Tips

### For Tray Icons
- Keep it simple - details get lost at 16-32px
- Use a single color with transparency for template icons (macOS)
- For Linux/Windows, ensure visibility on both light/dark panels

### For App Icons
- Start with 1024x1024 for best quality at all sizes
- Test at small sizes (32x32) to ensure recognizability
- Include some padding from the edges

## Current Icon Paths

```
apps/
├── main/
│   └── src-tauri/
│       └── icons/
│           ├── 32x32.png          # Small icon
│           ├── 128x128.png        # Medium icon
│           ├── 128x128@2x.png     # Retina medium
│           ├── icon.png           # 512x512 base
│           ├── icon.ico           # Windows
│           ├── icon.icns          # macOS
│           ├── Square*.png        # Windows Store
│           └── StoreLogo.png      # Windows Store
└── quick/
    └── src-tauri/
        └── icons/
            └── (same structure)

~/.config/irisnotes/
└── quick-tray-icon.png            # Custom tray icon (runtime)
```

## Generating Icons from SVG

If you have an SVG source:

```bash
# Install ImageMagick or use another converter
convert -background none input.svg -resize 1024x1024 output.png

# Then generate all sizes
cd apps/main
pnpm exec tauri icon output.png
```
