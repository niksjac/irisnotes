#!/bin/bash
# Local install script for IrisNotes on Arch Linux
# Usage: ./install-local.sh [--no-build]

set -e

PREFIX="${PREFIX:-$HOME/.local}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKIP_BUILD=false

# Parse arguments
for arg in "$@"; do
    case $arg in
        --no-build)
            SKIP_BUILD=true
            shift
            ;;
    esac
done

echo "Installing IrisNotes to $PREFIX..."

# Build apps unless --no-build is passed
if [ "$SKIP_BUILD" = false ]; then
    echo ""
    echo "Building main app..."
    cd "$SCRIPT_DIR/apps/main"
    pnpm run build
    
    echo ""
    echo "Building quick app..."
    cd "$SCRIPT_DIR/apps/quick"
    pnpm run build:frontend
    pnpm run build
    
    cd "$SCRIPT_DIR"
    echo ""
    echo "Build complete!"
fi

# Create directories
mkdir -p "$PREFIX/bin"
mkdir -p "$PREFIX/share/applications"
mkdir -p "$PREFIX/share/icons/hicolor/128x128/apps"
mkdir -p "$HOME/.config/irisnotes"

# Initialize database if it doesn't exist
if [ ! -f "$HOME/.config/irisnotes/notes.db" ]; then
    echo "Initializing database..."
    sqlite3 "$HOME/.config/irisnotes/notes.db" < "$SCRIPT_DIR/schema/base.sql"
fi

# Copy binaries
cp "$SCRIPT_DIR/apps/main/src-tauri/target/release/irisnotes" "$PREFIX/bin/"
cp "$SCRIPT_DIR/apps/quick/src-tauri/target/release/irisnotes-quick" "$PREFIX/bin/"
chmod +x "$PREFIX/bin/irisnotes" "$PREFIX/bin/irisnotes-quick"

# Create desktop entry for main app
cat > "$PREFIX/share/applications/irisnotes.desktop" << EOF
[Desktop Entry]
Name=IrisNotes
Comment=A modern note-taking application
Exec=$PREFIX/bin/irisnotes
Icon=irisnotes
Terminal=false
Type=Application
Categories=Office;TextEditor;
EOF

# Create desktop entry for quick app (hidden from menu, for keybind)
cat > "$PREFIX/share/applications/irisnotes-quick.desktop" << EOF
[Desktop Entry]
Name=IrisNotes Quick Search
Comment=Quick search for IrisNotes
Exec=$PREFIX/bin/irisnotes-quick
Icon=irisnotes
Terminal=false
Type=Application
Categories=Office;
NoDisplay=true
EOF

# Copy icon if available
if [ -f "$SCRIPT_DIR/apps/main/src-tauri/icons/128x128.png" ]; then
    cp "$SCRIPT_DIR/apps/main/src-tauri/icons/128x128.png" "$PREFIX/share/icons/hicolor/128x128/apps/irisnotes.png"
fi

echo ""
echo "✓ IrisNotes v1.0.0 installed!"
echo ""
echo "Binaries:"
echo "  $PREFIX/bin/irisnotes"
echo "  $PREFIX/bin/irisnotes-quick"
echo ""
echo "Make sure $PREFIX/bin is in your PATH:"
echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
echo ""
echo "For Hyprland, add keybind in ~/.config/hypr/hyprland.conf:"
echo "  bind = SUPER, N, exec, irisnotes"
echo "  bind = SUPER SHIFT, N, exec, irisnotes-quick"
