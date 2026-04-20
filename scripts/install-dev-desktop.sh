#!/bin/bash
# Install desktop entries and icons for IrisNotes dev instances.
# This enables the AGS taskbar to show the correct (dev-badged) icon
# when running IrisNotes in development mode (pnpm dev / pnpm main).
#
# Dev instances use different window classes:
#   - irisnotes-dev        (main app, from productName "IrisNotes Dev")
#   - irisnotes-quick-dev  (quick app, from productName "IrisNotes Quick Dev")
#
# Usage: ./scripts/install-dev-desktop.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PREFIX="${PREFIX:-$HOME/.local}"
ICON_DIR="$PREFIX/share/icons/hicolor"
ICON_SRC="$PROJECT_ROOT/apps/main/src-tauri/icons"

echo "Installing IrisNotes dev desktop entries and icons..."

# --- Generate dev icon variants with a "DEV" badge ---

generate_dev_icon() {
    local src="$1"
    local dst="$2"
    local size="$3"

    if ! command -v magick &>/dev/null; then
        # No ImageMagick — just copy the original icon as-is
        cp "$src" "$dst"
        return
    fi

    # Badge size and position (bottom-right corner)
    local badge_h=$((size / 4))
    local font_size=$((badge_h * 2 / 3))

    # Create a "DEV" badge overlay and composite onto the icon
    # -colorspace sRGB: source may be grayscale (black outline SVG), force RGB so red badge stays red
    magick "$src" -colorspace sRGB -type TrueColorAlpha \
        \( -size "${size}x${badge_h}" xc:none \
           -fill "#E53E3E" -draw "roundrectangle 0,0 $((size-1)),$((badge_h-1)) $((badge_h/4)),$((badge_h/4))" \
           -fill white -font "Liberation-Sans-Bold" -pointsize "$font_size" \
           -gravity center -annotate +0+0 "DEV" \
        \) \
        -gravity south -composite "$dst"
}

# Create directories
for size in 32 128 256 512; do
    mkdir -p "$ICON_DIR/${size}x${size}/apps"
done

# Generate dev icons at each size
echo "Generating dev icon variants..."
HAS_MAGICK=false
if command -v magick &>/dev/null; then
    HAS_MAGICK=true
    echo "  Using ImageMagick for DEV badge overlay"
else
    echo "  ImageMagick not found — installing original icons as dev icons"
    echo "  (Install imagemagick for badged dev icons: pacman -S imagemagick)"
fi

[ -f "$ICON_SRC/32x32.png" ] && generate_dev_icon "$ICON_SRC/32x32.png" "$ICON_DIR/32x32/apps/irisnotes-dev.png" 32
[ -f "$ICON_SRC/128x128.png" ] && generate_dev_icon "$ICON_SRC/128x128.png" "$ICON_DIR/128x128/apps/irisnotes-dev.png" 128
[ -f "$ICON_SRC/128x128@2x.png" ] && generate_dev_icon "$ICON_SRC/128x128@2x.png" "$ICON_DIR/256x256/apps/irisnotes-dev.png" 256
[ -f "$ICON_SRC/icon.png" ] && generate_dev_icon "$ICON_SRC/icon.png" "$ICON_DIR/512x512/apps/irisnotes-dev.png" 512

# --- Install dev desktop entries ---

echo "Installing dev desktop entries..."

# Main app (dev)
mkdir -p "$PREFIX/share/applications"
cat > "$PREFIX/share/applications/irisnotes-dev.desktop" << EOF
[Desktop Entry]
Name=IrisNotes [DEV]
Comment=IrisNotes development instance
Exec=$PROJECT_ROOT/apps/main/src-tauri/target/debug/irisnotes
Icon=irisnotes-dev
Terminal=false
Type=Application
Categories=Office;TextEditor;Development;
StartupWMClass=irisnotes-dev
EOF

# Quick app (dev)
cat > "$PREFIX/share/applications/irisnotes-quick-dev.desktop" << EOF
[Desktop Entry]
Name=IrisNotes Quick Search [DEV]
Comment=IrisNotes Quick Search development instance
Exec=$PROJECT_ROOT/apps/quick/src-tauri/target/debug/irisnotes-quick
Icon=irisnotes-dev
Terminal=false
Type=Application
Categories=Office;Development;
NoDisplay=true
StartupWMClass=irisnotes-quick-dev
EOF

# Update icon cache
gtk-update-icon-cache "$ICON_DIR" 2>/dev/null || true

# --- Generate dev tray icon for quick app ---

DEV_TRAY_ICON="$PROJECT_ROOT/dev/quick-tray-icon.png"
if [ -f "$ICON_SRC/icon.png" ]; then
    echo "Generating dev tray icon..."
    generate_dev_icon "$ICON_SRC/icon.png" "$DEV_TRAY_ICON" 512
    echo "  → $DEV_TRAY_ICON"
fi

echo ""
echo "✓ Dev desktop entries and icons installed!"
echo ""
echo "Desktop entries:"
echo "  $PREFIX/share/applications/irisnotes-dev.desktop"
echo "  $PREFIX/share/applications/irisnotes-quick-dev.desktop"
echo ""
echo "Dev icons installed as 'irisnotes-dev' in hicolor theme"
if [ "$HAS_MAGICK" = true ]; then
    echo "  (with red DEV badge)"
fi
echo ""
echo "Dev tray icon: $DEV_TRAY_ICON"
