# IrisNotes Distribution Guide

This document outlines the build and distribution strategies for IrisNotes across different platforms.

## Architecture Overview

IrisNotes consists of two companion desktop applications:

| Application | Purpose | Runtime Behavior |
|-------------|---------|------------------|
| **IrisNotes** | Full-featured note editor | Standard window application |
| **IrisNotes Quick** | Quick search/capture | Background process with system tray |

Both applications share:
- **Database**: `notes.db` (SQLite)
- **Configuration**: `config.toml`, `hotkeys.toml`
- **User data directory**: Platform-specific (see below)

### Shared Data Locations

| Platform | Location |
|----------|----------|
| Linux | `~/.config/irisnotes/` |
| macOS | `~/Library/Application Support/irisnotes/` |
| Windows | `C:\Users\<user>\AppData\Roaming\irisnotes\` |

---

## Distribution Strategies

### Strategy 1: Single Installer (Recommended)

Bundle both apps in one installer for a seamless user experience.

**Pros:**
- Simpler for end users
- Guaranteed version compatibility between apps
- Single download and install process

**Cons:**
- Larger download size
- Users who only want one app still get both

#### Platform Outputs

| Platform | Installer | User Gets |
|----------|-----------|-----------|
| Windows | `IrisNotes-1.0.0-Setup.exe` | Start Menu: "IrisNotes" + "IrisNotes Quick" |
| macOS | `IrisNotes-1.0.0.dmg` | Applications: `IrisNotes.app` + `IrisNotes Quick.app` |
| Linux | `irisnotes_1.0.0_amd64.deb` | Desktop entries for both apps |

### Strategy 2: Separate Installers

Distribute each app independently.

**Pros:**
- Users can choose which apps to install
- Smaller individual downloads
- Independent update cycles

**Cons:**
- Risk of version mismatch
- More complex release management

---

## Platform-Specific Guidelines

### Windows

**Recommended Installer**: NSIS or WiX

```
IrisNotes-Setup.exe
├── Installs: C:\Program Files\IrisNotes\
│   ├── irisnotes.exe
│   ├── irisnotes-quick.exe
│   └── resources/
├── Creates Start Menu shortcuts
├── Registers uninstaller
└── Optional: Add Quick to startup
```

**User Flow:**
1. Download `IrisNotes-1.0.0-Setup.exe`
2. Run installer → Accept license → Choose install location → Install
3. Start Menu shows both applications
4. Optionally enable "Start IrisNotes Quick with Windows"

### macOS

**Recommended Format**: DMG with both .app bundles

```
IrisNotes-1.0.0.dmg
├── IrisNotes.app
├── IrisNotes Quick.app
└── Applications symlink (for drag-to-install)
```

**User Flow:**
1. Download `IrisNotes-1.0.0.dmg`
2. Open DMG → Drag both apps to Applications
3. First launch may require Gatekeeper approval
4. Add IrisNotes Quick to Login Items for auto-start

**Code Signing:**
- Requires Apple Developer account ($99/year)
- Apps must be notarized for Gatekeeper
- Without signing: Users must right-click → Open to bypass warnings

### Linux

Multiple distribution formats recommended:

| Format | Target Users | Pros |
|--------|--------------|------|
| `.deb` | Debian/Ubuntu | Native package manager integration |
| `.rpm` | Fedora/RHEL | Native package manager integration |
| AppImage | Any distro | No installation needed, portable |
| Flatpak | Any distro | Sandboxed, auto-updates via Flathub |
| **AUR** | Arch Linux | Native integration (see below) |

---

## Arch Linux (AUR)

For Arch Linux users, the AUR is the preferred distribution method.

### Package Types

| Package | Description | Install Command |
|---------|-------------|-----------------|
| `irisnotes-bin` | Prebuilt binaries | `paru -S irisnotes-bin` |
| `irisnotes-git` | Build from git master | `paru -S irisnotes-git` |
| `irisnotes` | Build from release tag | `paru -S irisnotes` |

### Dependencies

```bash
# Runtime dependencies
depends=('webkit2gtk' 'gtk3' 'libayatana-appindicator')

# Build dependencies (for -git package)
makedepends=('rust' 'cargo' 'nodejs' 'pnpm' 'webkit2gtk')
```

### Example PKGBUILD (irisnotes-bin)

```bash
# Maintainer: IrisNotes Team <team@irisnotes.app>
pkgname=irisnotes-bin
pkgver=1.0.0
pkgrel=1
pkgdesc="A modern note-taking app with quick search companion"
arch=('x86_64')
url="https://github.com/irisnotes/irisnotes"
license=('MIT')
depends=('webkit2gtk' 'gtk3' 'libayatana-appindicator')
optdepends=('libnotify: desktop notifications')
provides=('irisnotes' 'irisnotes-quick')
conflicts=('irisnotes' 'irisnotes-git')
source=("${url}/releases/download/v${pkgver}/irisnotes-${pkgver}-linux-x64.tar.gz")
sha256sums=('SKIP')  # Replace with actual checksum

package() {
    cd "$srcdir"
    
    # Install binaries
    install -Dm755 "irisnotes" "$pkgdir/usr/bin/irisnotes"
    install -Dm755 "irisnotes-quick" "$pkgdir/usr/bin/irisnotes-quick"
    
    # Install desktop entries
    install -Dm644 "irisnotes.desktop" \
        "$pkgdir/usr/share/applications/irisnotes.desktop"
    install -Dm644 "irisnotes-quick.desktop" \
        "$pkgdir/usr/share/applications/irisnotes-quick.desktop"
    
    # Install icons
    install -Dm644 "icons/128x128.png" \
        "$pkgdir/usr/share/icons/hicolor/128x128/apps/irisnotes.png"
    install -Dm644 "icons/256x256.png" \
        "$pkgdir/usr/share/icons/hicolor/256x256/apps/irisnotes.png"
    
    # Install license
    install -Dm644 "LICENSE" "$pkgdir/usr/share/licenses/$pkgname/LICENSE"
}
```

### Example PKGBUILD (irisnotes-git)

```bash
# Maintainer: IrisNotes Team <team@irisnotes.app>
pkgname=irisnotes-git
pkgver=r123.abc1234
pkgrel=1
pkgdesc="A modern note-taking app (git version)"
arch=('x86_64')
url="https://github.com/irisnotes/irisnotes"
license=('MIT')
depends=('webkit2gtk' 'gtk3' 'libayatana-appindicator')
makedepends=('git' 'rust' 'cargo' 'nodejs' 'pnpm')
provides=('irisnotes' 'irisnotes-quick')
conflicts=('irisnotes' 'irisnotes-bin')
source=("git+${url}.git")
sha256sums=('SKIP')

pkgver() {
    cd "$srcdir/irisnotes"
    printf "r%s.%s" "$(git rev-list --count HEAD)" "$(git rev-parse --short HEAD)"
}

build() {
    cd "$srcdir/irisnotes"
    
    # Install frontend dependencies
    pnpm install
    
    # Build main app
    pnpm -C apps/main tauri build --bundles none
    
    # Build quick app
    pnpm -C apps/quick tauri build --bundles none
}

package() {
    cd "$srcdir/irisnotes"
    
    # Install binaries
    install -Dm755 "apps/main/src-tauri/target/release/irisnotes" \
        "$pkgdir/usr/bin/irisnotes"
    install -Dm755 "apps/quick/src-tauri/target/release/irisnotes-quick" \
        "$pkgdir/usr/bin/irisnotes-quick"
    
    # Desktop entries and icons...
}
```

---

## Build Commands

### Development

```bash
# Run main app in dev mode
pnpm main

# Run quick app in dev mode  
pnpm quick
```

### Production Build

```bash
# Build main app (creates platform-specific bundles)
pnpm -C apps/main tauri build

# Build quick app
pnpm -C apps/quick tauri build

# Build both
pnpm build:all  # (if configured in root package.json)
```

### Build Outputs

After running `tauri build`, outputs are in:

```
apps/main/src-tauri/target/release/
├── irisnotes                    # Linux binary
├── bundle/
│   ├── deb/                     # Debian package
│   ├── appimage/                # AppImage
│   └── ...

apps/quick/src-tauri/target/release/
├── irisnotes-quick              # Linux binary
├── bundle/
│   └── ...
```

---

## CI/CD Recommendations

### GitHub Actions Workflow

```yaml
name: Release

on:
  push:
    tags: ['v*']

jobs:
  build:
    strategy:
      matrix:
        platform: [ubuntu-latest, macos-latest, windows-latest]
    
    runs-on: ${{ matrix.platform }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9
      
      - name: Setup Rust
        uses: dtolnay/rust-action@stable
      
      - name: Install dependencies (Linux)
        if: matrix.platform == 'ubuntu-latest'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev libayatana-appindicator3-dev
      
      - name: Install frontend dependencies
        run: pnpm install
      
      - name: Build apps
        run: |
          pnpm -C apps/main tauri build
          pnpm -C apps/quick tauri build
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: release-${{ matrix.platform }}
          path: |
            apps/*/src-tauri/target/release/bundle/
```

---

## Release Checklist

1. [ ] Update version in all `Cargo.toml` and `package.json` files
2. [ ] Update CHANGELOG.md
3. [ ] Create git tag: `git tag -a v1.0.0 -m "Release v1.0.0"`
4. [ ] Push tag: `git push origin v1.0.0`
5. [ ] CI builds all platform binaries
6. [ ] Create GitHub Release with binaries
7. [ ] Update AUR PKGBUILD with new version and checksums
8. [ ] Push PKGBUILD to AUR
9. [ ] Announce release

---

## Future Considerations

### Auto-Updates

Tauri supports built-in auto-updates. Consider implementing:
- Update checking on app start
- Notification when updates available
- Background download and apply on restart

### Flatpak / Snap

For broader Linux distribution:
- Submit to Flathub for Flatpak
- Submit to Snapcraft for Snap Store

### Microsoft Store / Mac App Store

For maximum reach:
- Windows: Submit to Microsoft Store (requires signing)
- macOS: Submit to Mac App Store (requires Apple Developer account, stricter sandboxing)
