#!/bin/bash
# Generate all required icon sizes from SVG source
# Requires: rsvg-convert (librsvg) or inkscape
#
# Usage: ./scripts/generate-icons.sh [svg-source]
# Default source: assets/icon.svg

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

SVG_SOURCE="${1:-$ROOT_DIR/assets/icon.svg}"

if [ ! -f "$SVG_SOURCE" ]; then
    echo "Error: SVG source not found: $SVG_SOURCE"
    exit 1
fi

echo "Generating icons from: $SVG_SOURCE"

# Check for rsvg-convert or inkscape
if command -v rsvg-convert &> /dev/null; then
    CONVERTER="rsvg"
elif command -v inkscape &> /dev/null; then
    CONVERTER="inkscape"
else
    echo "Error: Neither rsvg-convert nor inkscape found."
    echo "Install with: sudo pacman -S librsvg  # or: sudo pacman -S inkscape"
    exit 1
fi

# Function to convert SVG to PNG
convert_svg() {
    local size=$1
    local output=$2
    
    if [ "$CONVERTER" = "rsvg" ]; then
        rsvg-convert -w "$size" -h "$size" "$SVG_SOURCE" -o "$output"
    else
        inkscape "$SVG_SOURCE" -w "$size" -h "$size" -o "$output"
    fi
    echo "  Generated: $output (${size}x${size})"
}

# Main app icons
MAIN_ICONS="$ROOT_DIR/apps/main/src-tauri/icons"
mkdir -p "$MAIN_ICONS"

echo ""
echo "Generating main app icons..."
convert_svg 32 "$MAIN_ICONS/32x32.png"
convert_svg 128 "$MAIN_ICONS/128x128.png"
convert_svg 256 "$MAIN_ICONS/128x128@2x.png"
convert_svg 512 "$MAIN_ICONS/icon.png"

# Windows icons (Square logos)
convert_svg 30 "$MAIN_ICONS/Square30x30Logo.png"
convert_svg 44 "$MAIN_ICONS/Square44x44Logo.png"
convert_svg 71 "$MAIN_ICONS/Square71x71Logo.png"
convert_svg 89 "$MAIN_ICONS/Square89x89Logo.png"
convert_svg 107 "$MAIN_ICONS/Square107x107Logo.png"
convert_svg 142 "$MAIN_ICONS/Square142x142Logo.png"
convert_svg 150 "$MAIN_ICONS/Square150x150Logo.png"
convert_svg 284 "$MAIN_ICONS/Square284x284Logo.png"
convert_svg 310 "$MAIN_ICONS/Square310x310Logo.png"
convert_svg 50 "$MAIN_ICONS/StoreLogo.png"

# Generate ICO (Windows) - requires ImageMagick
if command -v convert &> /dev/null; then
    echo "  Generating Windows .ico..."
    convert "$MAIN_ICONS/32x32.png" "$MAIN_ICONS/128x128.png" "$MAIN_ICONS/icon.png" "$MAIN_ICONS/icon.ico"
else
    echo "  Skipping .ico (ImageMagick not found)"
fi

# Generate ICNS (macOS) - requires png2icns or iconutil
if command -v png2icns &> /dev/null; then
    echo "  Generating macOS .icns..."
    # png2icns needs specific sizes: 16, 32, 128, 256, 512
    convert_svg 16 "/tmp/icon_16.png"
    convert_svg 32 "/tmp/icon_32.png"
    convert_svg 128 "/tmp/icon_128.png"
    convert_svg 256 "/tmp/icon_256.png"
    convert_svg 512 "/tmp/icon_512.png"
    png2icns "$MAIN_ICONS/icon.icns" /tmp/icon_16.png /tmp/icon_32.png /tmp/icon_128.png /tmp/icon_256.png /tmp/icon_512.png
    rm /tmp/icon_*.png
else
    echo "  Skipping .icns (png2icns not found)"
fi

# Quick app icons
QUICK_ICONS="$ROOT_DIR/apps/quick/src-tauri/icons"
mkdir -p "$QUICK_ICONS"

echo ""
echo "Generating quick app icons..."
convert_svg 32 "$QUICK_ICONS/32x32.png"
convert_svg 128 "$QUICK_ICONS/128x128.png"
convert_svg 256 "$QUICK_ICONS/128x128@2x.png"
convert_svg 512 "$QUICK_ICONS/icon.png"

# Copy Windows icons (same as main)
cp "$MAIN_ICONS"/Square*.png "$QUICK_ICONS/"
cp "$MAIN_ICONS/StoreLogo.png" "$QUICK_ICONS/"
[ -f "$MAIN_ICONS/icon.ico" ] && cp "$MAIN_ICONS/icon.ico" "$QUICK_ICONS/"
[ -f "$MAIN_ICONS/icon.icns" ] && cp "$MAIN_ICONS/icon.icns" "$QUICK_ICONS/"

echo ""
echo "✓ Icon generation complete!"
echo ""
echo "Icons generated in:"
echo "  $MAIN_ICONS"
echo "  $QUICK_ICONS"
