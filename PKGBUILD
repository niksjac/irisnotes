# Maintainer: Niklas <your-email@example.com>
pkgname=irisnotes
pkgver=1.0.0
pkgrel=1
pkgdesc="A modern note-taking application inspired by Trilium Notes"
arch=('x86_64')
url="https://github.com/your-username/irisnotes"
license=('MIT')
depends=('webkit2gtk-4.1' 'gtk3' 'libappindicator-gtk3')
makedepends=('rust' 'cargo' 'pnpm' 'nodejs')
source=("$pkgname-$pkgver.tar.gz::$url/archive/v$pkgver.tar.gz")
sha256sums=('SKIP')

build() {
    cd "$srcdir/$pkgname-$pkgver"
    
    # Build main app
    cd apps/main
    pnpm install
    pnpm run build:frontend
    cd src-tauri
    cargo build --release
    cd ../../..
    
    # Build quick app
    cd apps/quick
    pnpm install
    pnpm run build:frontend
    cd src-tauri
    cargo build --release
}

package() {
    cd "$srcdir/$pkgname-$pkgver"
    
    # Install main app binary
    install -Dm755 "apps/main/src-tauri/target/release/irisnotes" "$pkgdir/usr/bin/irisnotes"
    
    # Install quick app binary
    install -Dm755 "apps/quick/src-tauri/target/release/irisnotes-quick" "$pkgdir/usr/bin/irisnotes-quick"
    
    # Install desktop files
    install -Dm644 /dev/stdin "$pkgdir/usr/share/applications/irisnotes.desktop" << EOF
[Desktop Entry]
Name=IrisNotes
Comment=A modern note-taking application
Exec=irisnotes
Icon=irisnotes
Terminal=false
Type=Application
Categories=Office;TextEditor;
EOF

    install -Dm644 /dev/stdin "$pkgdir/usr/share/applications/irisnotes-quick.desktop" << EOF
[Desktop Entry]
Name=IrisNotes Quick Search
Comment=Quick search for IrisNotes
Exec=irisnotes-quick
Icon=irisnotes
Terminal=false
Type=Application
Categories=Office;
NoDisplay=true
EOF

    # Install icons (if available)
    if [ -f "apps/main/src-tauri/icons/128x128.png" ]; then
        install -Dm644 "apps/main/src-tauri/icons/128x128.png" "$pkgdir/usr/share/icons/hicolor/128x128/apps/irisnotes.png"
    fi
}
