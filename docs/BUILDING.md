# Building IrisNotes

This guide covers how to build IrisNotes for development and production.

## Prerequisites

### All Platforms

- **Node.js** 20+ 
- **pnpm** 9+
- **Rust** (latest stable)

```bash
# Install pnpm
npm install -g pnpm

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Linux (Debian/Ubuntu)

```bash
sudo apt update
sudo apt install -y \
  libwebkit2gtk-4.1-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  patchelf
```

### Linux (Arch)

```bash
sudo pacman -S webkit2gtk-4.1 libayatana-appindicator
```

### Linux (Fedora)

```bash
sudo dnf install webkit2gtk4.1-devel libappindicator-gtk3-devel
```

### macOS

- Xcode Command Line Tools: `xcode-select --install`

### Windows

- [Microsoft Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
- [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (usually pre-installed on Windows 10/11)

---

## Development Build

### Setup

```bash
# Clone repository
git clone https://github.com/irisnotes/irisnotes.git
cd irisnotes

# Install dependencies
pnpm install

# Setup development database
./dev/setup-dev-db.sh
```

### Running Apps

```bash
# Run main app (hot-reload enabled)
pnpm main

# Run quick app (in separate terminal)
pnpm quick
```

The first run compiles ~640 Rust crates and takes 2-5 minutes. Subsequent runs are much faster.

### Development URLs

| App | Frontend URL | Notes |
|-----|--------------|-------|
| Main | http://localhost:1420 | Full editor |
| Quick | http://localhost:3333 | Quick search |

---

## Production Build

### Build Commands

```bash
# Build main app
pnpm -C apps/main tauri build

# Build quick app
pnpm -C apps/quick tauri build

# Build both (if configured)
pnpm build:all
```

### Build Outputs

Builds are placed in each app's target directory:

```
apps/main/src-tauri/target/release/
├── irisnotes                       # Binary (Linux/macOS)
├── irisnotes.exe                   # Binary (Windows)
└── bundle/
    ├── appimage/                   # Linux AppImage
    │   └── irisnotes_1.0.0_amd64.AppImage
    ├── deb/                        # Debian package
    │   └── irisnotes_1.0.0_amd64.deb
    ├── dmg/                        # macOS disk image
    │   └── IrisNotes_1.0.0_x64.dmg
    ├── macos/                      # macOS app bundle
    │   └── IrisNotes.app
    ├── msi/                        # Windows installer
    │   └── IrisNotes_1.0.0_x64.msi
    └── nsis/                       # Windows NSIS installer
        └── IrisNotes_1.0.0_x64-setup.exe
```

### Build Options

Control which bundle types are generated in `tauri.conf.json`:

```json
{
  "bundle": {
    "active": true,
    "targets": ["deb", "appimage", "dmg", "nsis"]
  }
}
```

Available targets:
- Linux: `deb`, `rpm`, `appimage`
- macOS: `dmg`, `app`
- Windows: `msi`, `nsis`

### Release Build Optimizations

For smaller, faster binaries:

```bash
# Build with release profile + LTO
cd apps/main/src-tauri
cargo build --release
```

Configure in `Cargo.toml`:

```toml
[profile.release]
lto = true
opt-level = "s"      # Optimize for size
strip = true         # Strip debug symbols
codegen-units = 1    # Better optimization
```

---

## Cross-Compilation

### Building for Linux on macOS/Windows

Not directly supported. Use:
- GitHub Actions with `ubuntu-latest` runner
- Docker container with Linux build tools

### Building for macOS

Requires actual macOS machine or macOS VM (for code signing).

### Building for Windows on Linux

Use cross-compilation tools or Windows VM:

```bash
# Install Windows target
rustup target add x86_64-pc-windows-msvc

# Cross-compile (requires additional setup)
cargo build --target x86_64-pc-windows-msvc --release
```

---

## CI/CD Build

### GitHub Actions Example

```yaml
name: Build

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: ubuntu-latest
            target: x86_64-unknown-linux-gnu
          - platform: macos-latest
            target: x86_64-apple-darwin
          - platform: macos-latest
            target: aarch64-apple-darwin
          - platform: windows-latest
            target: x86_64-pc-windows-msvc

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
        with:
          targets: ${{ matrix.target }}

      - name: Install Linux dependencies
        if: matrix.platform == 'ubuntu-latest'
        run: |
          sudo apt-get update
          sudo apt-get install -y \
            libwebkit2gtk-4.1-dev \
            libayatana-appindicator3-dev \
            librsvg2-dev

      - name: Install frontend dependencies
        run: pnpm install

      - name: Build main app
        run: pnpm -C apps/main tauri build --target ${{ matrix.target }}

      - name: Build quick app
        run: pnpm -C apps/quick tauri build --target ${{ matrix.target }}

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: bundles-${{ matrix.target }}
          path: |
            apps/*/src-tauri/target/${{ matrix.target }}/release/bundle/
```

---

## Troubleshooting

### Common Issues

#### "WebKit2GTK not found" (Linux)

```bash
# Debian/Ubuntu
sudo apt install libwebkit2gtk-4.1-dev

# Arch
sudo pacman -S webkit2gtk-4.1
```

#### "database is locked"

Another instance of the app is running, or the previous instance didn't close cleanly:

```bash
# Remove lock files
rm dev/notes.db-shm dev/notes.db-wal
```

#### Cargo build fails with memory error

Rust compilation is memory-intensive. Try:

```bash
# Limit parallel jobs
cargo build -j 2

# Or increase swap space
```

#### First build is very slow

Normal! Compiling 640+ crates takes time. Subsequent builds only recompile changed code.

### Clean Build

If you encounter strange build issues:

```bash
# Clean Rust build artifacts
cd apps/main/src-tauri && cargo clean
cd apps/quick/src-tauri && cargo clean

# Clean node_modules
pnpm -r exec rm -rf node_modules
rm -rf node_modules

# Reinstall and rebuild
pnpm install
pnpm main
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TAURI_ENV` | Set to `dev` for development mode | auto-detected |
| `TAURI_DEBUG` | Enable debug builds | false |
| `RUST_BACKTRACE` | Show Rust backtraces on panic | 0 |

Example:

```bash
RUST_BACKTRACE=1 pnpm main
```
