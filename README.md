# IrisNotes

A local-first desktop notes app for Linux, inspired by OneNote and Trilium.
Notes live in a local SQLite database and stay fully usable offline; optional
sync reconciles devices through a small self-hosted hub.

This is a personal project, built and used by one person on Arch Linux.

## What's in the repo

| Path | What |
|---|---|
| `apps/main` | the notes app — Tauri v2, React, ProseMirror (rich editor), CodeMirror (source view); its binary is also the CLI (`irisnotes list`, `irisnotes search …`) |
| `apps/quick` | a global quick-search overlay |
| `apps/server` | `iris-server`, the sync hub (Rust) |
| `schema/base.sql` | the database schema |
| `docs/` | decision records and guides |

## Getting started

```sh
pnpm install
./dev/setup-dev-db.sh   # sample data for development
pnpm dev                # run the app and the quick-search overlay
```

Prerequisites and releases: [docs/guides/building.md](docs/guides/building.md).

## Documentation

- [AGENTS.md](AGENTS.md) — how to work in this repo (for people and coding agents)
- [docs/](docs/README.md) — current state, decision records (ADRs/RFCs), guides
- [docs/guides/sync-hub.md](docs/guides/sync-hub.md) — running the sync hub
