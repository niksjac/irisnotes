#!/bin/bash
# Local install script for IrisNotes on Arch Linux
# Usage: ./install-local.sh [--no-build] [--bump] [--commit] [--force]

set -e

PREFIX="${PREFIX:-$HOME/.local}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKIP_BUILD=false
BUMP_VERSION=false
FORCE_INSTALL=false
CREATE_RELEASE_COMMIT=false

RELEASE_FILES=(
    "apps/main/package.json"
    "apps/main/src-tauri/tauri.conf.json"
    "apps/main/src-tauri/Cargo.toml"
    "apps/main/src-tauri/Cargo.lock"
    "apps/main/src/data/current-release-notes.json"
    "apps/quick/package.json"
    "apps/quick/src-tauri/tauri.conf.json"
    "apps/quick/src-tauri/Cargo.toml"
    "apps/quick/src-tauri/Cargo.lock"
)

show_usage() {
    cat << EOF
Usage: ./install-local.sh [options]

Options:
    --bump      Bump the patch version before building and installing
    --commit    With --bump, commit release files locally after a successful install
    --force     Rebuild/reinstall even when the current version is already installed
    --no-build  Skip build and install existing release binaries
    -h, --help  Show this help
EOF
}

ensure_git_work_tree() {
    git -C "$SCRIPT_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1 || {
        echo "--commit requires install-local.sh to run inside a git work tree." >&2
        exit 1
    }
}

ensure_clean_tracked_worktree() {
    ensure_git_work_tree

    if ! git -C "$SCRIPT_DIR" diff --quiet -- . || ! git -C "$SCRIPT_DIR" diff --cached --quiet -- .; then
        echo "--commit requires a clean tracked worktree before bumping." >&2
        echo "Commit or stash existing tracked changes first, then rerun ./install-local.sh --bump --commit." >&2
        echo "" >&2
        git -C "$SCRIPT_DIR" --no-pager status --short --untracked-files=no >&2
        exit 1
    fi
}

get_current_version() {
    sed -n 's/^[[:space:]]*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$SCRIPT_DIR/apps/main/src-tauri/tauri.conf.json" | head -n 1
}

get_installed_version() {
    local binary="$PREFIX/bin/irisnotes"
    local version

    [ -x "$binary" ] || return 1

    version="$("$binary" --version 2>/dev/null | sed -n 's/^irisnotes[[:space:]]\+\([^[:space:]]\+\).*/\1/p' | head -n 1)"
    [ -n "$version" ] || return 1

    echo "$version"
}

get_built_version() {
    local binary="$SCRIPT_DIR/apps/main/src-tauri/target/release/irisnotes"
    local version

    [ -x "$binary" ] || return 1

    version="$("$binary" --version 2>/dev/null | sed -n 's/^irisnotes[[:space:]]\+\([^[:space:]]\+\).*/\1/p' | head -n 1)"
    [ -n "$version" ] || return 1

    echo "$version"
}

get_release_baseline_commit() {
    local version="$1"
    local tag="v$version"
    local commit

    git -C "$SCRIPT_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1 || return 1

    commit="$(git -C "$SCRIPT_DIR" rev-parse --verify --quiet "refs/tags/$tag^{commit}" || true)"
    if [ -n "$commit" ]; then
        echo "$commit"
        return 0
    fi

    git -C "$SCRIPT_DIR" log -1 --format=%H --fixed-strings --grep="chore(release): bump apps to $version"
}

get_unreleased_commit_count() {
    local baseline="$1"

    [ -n "$baseline" ] || return 1
    git -C "$SCRIPT_DIR" rev-list --count "$baseline..HEAD"
}

print_unreleased_commits() {
    local baseline="$1"

    git -C "$SCRIPT_DIR" --no-pager log --oneline --no-merges --max-count=5 "$baseline..HEAD" | sed 's/^/  /'
}

create_release_commit() {
    local message="chore(release): bump apps to $APP_VERSION"

    ensure_git_work_tree

    if git -C "$SCRIPT_DIR" diff --quiet -- "${RELEASE_FILES[@]}" && git -C "$SCRIPT_DIR" diff --cached --quiet -- "${RELEASE_FILES[@]}"; then
        echo "No release file changes to commit."
        return 0
    fi

    echo ""
    echo "Creating local release commit..."
    git -C "$SCRIPT_DIR" add -- "${RELEASE_FILES[@]}"
    git -C "$SCRIPT_DIR" commit --only --message "$message" -- "${RELEASE_FILES[@]}"
    echo "Release commit created locally. No remote push was attempted."
}

bump_patch_version() {
    local version="$1"
    local major minor patch

    if [[ ! "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        echo "Cannot auto-bump non-semver version: $version" >&2
        exit 1
    fi

    IFS=. read -r major minor patch <<< "$version"
    echo "$major.$minor.$((patch + 1))"
}

set_json_version() {
    local file="$1"
    local version="$2"

    node --input-type=module - "$file" "$version" <<'NODE'
import fs from "node:fs";

const [file, version] = process.argv.slice(2);
const text = fs.readFileSync(file, "utf8");
const data = JSON.parse(text);
const indent = text.includes('\n\t"') ? "\t" : 2;

data.version = version;
fs.writeFileSync(file, `${JSON.stringify(data, null, indent)}\n`);
NODE
}

set_cargo_manifest_version() {
    local file="$1"
    local version="$2"

    NEW_VERSION="$version" perl -0pi -e 's/(\[package\]\s*name\s*=\s*"[^"]+"\s*version\s*=\s*")[^"]+(")/$1$ENV{NEW_VERSION}$2/s' "$file"
}

set_cargo_lock_package_version() {
    local file="$1"
    local package_name="$2"
    local version="$3"

    PACKAGE_NAME="$package_name" NEW_VERSION="$version" perl -0pi -e 'my $pkg = quotemeta $ENV{PACKAGE_NAME}; s/(\[\[package\]\]\s*name = "$pkg"\s*version = ")[^"]+(")/$1$ENV{NEW_VERSION}$2/s' "$file"
}

bump_release_version() {
    local current_version new_version

    current_version="$(get_current_version)"
    new_version="$(bump_patch_version "$current_version")"

    echo "Bumping release version: $current_version -> $new_version"

    set_json_version "$SCRIPT_DIR/apps/main/package.json" "$new_version"
    set_json_version "$SCRIPT_DIR/apps/main/src-tauri/tauri.conf.json" "$new_version"
    set_cargo_manifest_version "$SCRIPT_DIR/apps/main/src-tauri/Cargo.toml" "$new_version"
    set_cargo_lock_package_version "$SCRIPT_DIR/apps/main/src-tauri/Cargo.lock" "irisnotes" "$new_version"

    set_json_version "$SCRIPT_DIR/apps/quick/package.json" "$new_version"
    set_json_version "$SCRIPT_DIR/apps/quick/src-tauri/tauri.conf.json" "$new_version"
    set_cargo_manifest_version "$SCRIPT_DIR/apps/quick/src-tauri/Cargo.toml" "$new_version"
    set_cargo_lock_package_version "$SCRIPT_DIR/apps/quick/src-tauri/Cargo.lock" "irisnotes-quick" "$new_version"

    APP_VERSION="$new_version"
}

generate_release_notes() {
    echo "Generating release notes for v$APP_VERSION..."
    node "$SCRIPT_DIR/scripts/generate-release-notes.mjs"
}

# Parse arguments
for arg in "$@"; do
    case $arg in
        --bump)
            BUMP_VERSION=true
            ;;
        --commit)
            CREATE_RELEASE_COMMIT=true
            ;;
        --force)
            FORCE_INSTALL=true
            ;;
        --no-build)
            SKIP_BUILD=true
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            echo "Unknown argument: $arg" >&2
            show_usage >&2
            exit 1
            ;;
    esac
done

if [ "$SKIP_BUILD" = true ] && [ "$BUMP_VERSION" = true ]; then
    echo "--bump cannot be used with --no-build because the rebuilt binaries would be missing." >&2
    exit 1
fi

if [ "$CREATE_RELEASE_COMMIT" = true ] && [ "$BUMP_VERSION" = false ]; then
    echo "--commit must be used with --bump so the commit matches a freshly built release." >&2
    exit 1
fi

if [ "$CREATE_RELEASE_COMMIT" = true ]; then
    ensure_clean_tracked_worktree
fi

echo "Installing IrisNotes to $PREFIX..."

APP_VERSION="$(get_current_version)"
INSTALLED_VERSION="$(get_installed_version || true)"

if [ -n "$INSTALLED_VERSION" ]; then
    echo "Installed version: v$INSTALLED_VERSION"
else
    echo "Installed version: none"
fi
echo "Source version: v$APP_VERSION"

if [ "$BUMP_VERSION" = false ] && [ "$FORCE_INSTALL" = false ] && [ "$INSTALLED_VERSION" = "$APP_VERSION" ]; then
    RELEASE_BASELINE="$(get_release_baseline_commit "$APP_VERSION" || true)"
    UNRELEASED_COUNT="$(get_unreleased_commit_count "$RELEASE_BASELINE" 2>/dev/null || echo 0)"

    echo ""
    if [ "$UNRELEASED_COUNT" -gt 0 ]; then
        NEXT_VERSION="$(bump_patch_version "$APP_VERSION")"
        echo "IrisNotes v$APP_VERSION is installed, but this checkout has $UNRELEASED_COUNT committed change(s) after the v$APP_VERSION release marker."
        echo ""
        echo "Recent unreleased commits:"
        print_unreleased_commits "$RELEASE_BASELINE"
        echo ""
        echo "Use --bump --commit to create, install, and commit v$NEXT_VERSION, or --force to rebuild/reinstall v$APP_VERSION."
    else
        echo "IrisNotes v$APP_VERSION is already installed. Nothing new to install."
        echo "Use --bump --commit to create the next patch release with a local release commit, or --force to rebuild/reinstall v$APP_VERSION."
    fi
    exit 0
fi

# Build apps unless --no-build is passed
if [ "$SKIP_BUILD" = false ]; then
    if [ "$BUMP_VERSION" = true ]; then
        echo ""
        bump_release_version
    else
        echo ""
        echo "Building IrisNotes v$APP_VERSION..."
    fi

    echo ""
    generate_release_notes

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
else
    BUILT_VERSION="$(get_built_version || true)"

    if [ ! -x "$SCRIPT_DIR/apps/main/src-tauri/target/release/irisnotes" ] || [ ! -x "$SCRIPT_DIR/apps/quick/src-tauri/target/release/irisnotes-quick" ]; then
        echo "Release binaries are missing. Run ./install-local.sh to build them first." >&2
        exit 1
    fi

    if [ -n "$BUILT_VERSION" ] && [ "$BUILT_VERSION" != "$APP_VERSION" ] && [ "$FORCE_INSTALL" = false ]; then
        echo "Built main binary is v$BUILT_VERSION, but the source version is v$APP_VERSION." >&2
        echo "Run ./install-local.sh to rebuild, or use --force --no-build to copy the existing binaries anyway." >&2
        exit 1
    fi

    echo "Skipping build and version bump (--no-build). Installing existing binaries for v$APP_VERSION."
fi

# Create directories
mkdir -p "$PREFIX/bin"
mkdir -p "$PREFIX/share/applications"
mkdir -p "$HOME/.config/irisnotes"

ICON_DIR="$PREFIX/share/icons/hicolor"
ICON_SRC="$SCRIPT_DIR/apps/main/src-tauri/icons"

for size in 32 128 256 512; do
    mkdir -p "$ICON_DIR/${size}x${size}/apps"
done
mkdir -p "$ICON_DIR/scalable/apps"

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
StartupWMClass=irisnotes
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
StartupWMClass=irisnotes-quick
EOF

# Install icons at multiple sizes for crisp display in all contexts
[ -f "$ICON_SRC/32x32.png" ] && cp "$ICON_SRC/32x32.png" "$ICON_DIR/32x32/apps/irisnotes.png"
[ -f "$ICON_SRC/128x128.png" ] && cp "$ICON_SRC/128x128.png" "$ICON_DIR/128x128/apps/irisnotes.png"
[ -f "$ICON_SRC/128x128@2x.png" ] && cp "$ICON_SRC/128x128@2x.png" "$ICON_DIR/256x256/apps/irisnotes.png"
[ -f "$ICON_SRC/icon.png" ] && cp "$ICON_SRC/icon.png" "$ICON_DIR/512x512/apps/irisnotes.png"

# Install SVG for scalable icon (best quality)
if [ -f "$SCRIPT_DIR/assets/logo-transparent.svg" ]; then
    cp "$SCRIPT_DIR/assets/logo-transparent.svg" "$ICON_DIR/scalable/apps/irisnotes.svg"
fi

# Update icon cache for fast lookups
gtk-update-icon-cache "$ICON_DIR" 2>/dev/null || true

if [ "$CREATE_RELEASE_COMMIT" = true ]; then
    create_release_commit
fi

echo ""
echo "✓ IrisNotes v$APP_VERSION installed!"
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
