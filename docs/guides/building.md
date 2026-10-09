# Building and installing

Development setup, builds and local releases. Verified against source on
2026-10-04. Why releases are local and unautomated:
[ADR-0009](../decisions/adr/ADR-0009-local-builds-no-ci-no-formatter.md).

## Prerequisites

- **Node.js** 20+ and **pnpm** 9+
- **Rust**, latest stable (`rustup`)
- **System libraries** for Tauri v2 on Arch Linux:
  ```sh
  sudo pacman -S webkit2gtk-4.1 libayatana-appindicator
  ```
  (other distributions: see the Tauri v2 prerequisites for your platform)
- **sqlite3** — for `dev/setup-dev-db.sh`
- **Docker** — only to run `iris-server` in a container

Then, from the repo root:

```sh
pnpm install
./dev/setup-dev-db.sh      # creates dev/notes.db from schema/base.sql + schema/seed-dev.sql
```

## Development

| Command | Runs |
|---|---|
| `pnpm dev` | main app and quick app together |
| `pnpm main` / `pnpm quick` | one app |
| `pnpm run type-check` | `tsc --noEmit` for the main app — the required check |
| `pnpm test` / `pnpm test:e2e` | Vitest unit tests / Playwright e2e |
| `pnpm cli <args>` | the CLI built into the main app (installed: `irisnotes <command>`) |
| `cd apps/server && IRIS_TOKEN=… cargo run` | the sync server (see its README) |

Development builds use `tauri.dev.conf.json`: they run as **IrisNotes Dev** /
**IrisNotes Quick Dev**, read config and data from `dev/` instead of
`~/.config/irisnotes/`, and use Vite ports 1420 (main) and 3333 (quick). Dev and
installed builds can run side by side without touching each other's data.

Run `./dev/setup-dev-db.sh` again after changing `schema/base.sql`, or to reset
the dev data.

## Local release

```sh
./install-local.sh --bump --commit
```

- Bumps the patch version in all release files (both apps' `package.json`,
  `tauri.conf.json`, `Cargo.toml`, `Cargo.lock`, and the release notes JSON).
- Builds both apps in release mode and installs them to `~/.local/bin`
  (`irisnotes`, `irisnotes-quick`), with desktop entries and icons (see
  [icons.md](icons.md)).
- Commits `chore(release): bump apps to X.Y.Z`. `--commit` requires `--bump` and a
  clean tracked worktree.

Other options: `--force` (reinstall the same version), `--no-build` (install
existing release binaries), `-h`.

**Close the installed apps first.** A running binary can't be overwritten
("Text file busy"), so the install step fails while `irisnotes` or
`irisnotes-quick` is running.

## Troubleshooting

- **Stale build:** `cargo clean --manifest-path apps/main/src-tauri/Cargo.toml`
  (and the same for `apps/quick`), then rebuild.
- **Empty or broken dev data:** `./dev/setup-dev-db.sh`.
- **App starts but the schema seems old:** existing databases are migrated in
  place on startup; a fresh dev DB from `setup-dev-db.sh` rules that out.
