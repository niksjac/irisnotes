# ADR-0008: Local-first sync through a central hub

- **Status:** Accepted
- **Date:** 2026-06-25 (decided; drafted in `docs/SYNC_DESIGN.md`, commit
  `973077d` 2026-05-31; built in commits `15dcec3`, `fa58818`, `273a67c`,
  `cc0f555`; released in 1.0.17)
- **Recorded:** 2026-10-04, retroactively, from `docs/SYNC_DESIGN.md` and
  `docs/CLOUD_SYNC_ROADMAP.txt` (since removed), checked against source
- **Supersedes:** —
- **Related:** [ADR-0001](ADR-0001-sync-overlay-network.md) (transport),
  [ADR-0002](ADR-0002-vps-hub-first-defer-home-infrastructure.md) (deployment),
  [`apps/server/README.md`](../../../apps/server/README.md) (contract)

## Context

IrisNotes is used on more than one machine, with a phone client planned. Writing
must keep working offline — a note app that stalls without a connection is not
acceptable. There is one user, who does not edit the same notes on two devices
at the same time.

Syncing the SQLite file itself (cloud drive, rsync, Git, a network share) was
ruled out early: with more than one writer it risks divergent histories, lost
writes, WAL-file problems and corruption that is hard to diagnose.

## Decision

- **Every client is local-first.** It keeps its own complete SQLite database,
  writes to it immediately, and works fully offline.
- **One central hub** (`apps/server`, Rust/axum) holds a canonical database.
  Clients reconcile with it; they never talk to each other (Trilium-style star
  topology).
- **Sync is row-level and content-opaque.** The unit is an `items` row.
  `content` and `metadata` are shipped as opaque strings and never parsed, so
  editor and UI features need no sync changes.
- **Conflict rule: last writer wins per row**, by `updated_at`; deletes are soft
  (`deleted_at`) so they sync as ordinary rows.
- **Protocol:** `GET /version` handshake (schema and sync version must match),
  then `POST /sync/pull` since a cursor and `POST /sync/push` of changed rows.
  Cursors are kept per server URL on the client. Bearer-token auth.
- **Timestamp guard:** a `sync_ctl` flag suppresses the local
  `update_items_timestamp` trigger while pulled rows are applied, so remote
  `updated_at` values are preserved instead of being rewritten (which would send
  them straight back).
- **Schema is shared:** the server embeds `schema/base.sql`, so it cannot drift
  from the app's table structure.

## Consequences

**Good**

- Offline writing is unaffected by sync; sync failures only delay convergence.
- A hub can be empty, replaced or moved: the first cycle refills it from any
  client (ADR-0002).
- Most features ship without touching sync.

**Bad**

- **Overwritten content is not kept.** The design draft required that last
  writer wins *only* if the losing version stays recoverable (as a
  `note_versions` entry or a conflict copy). The built version overwrites rows
  on both server and client without snapshotting. Under the single-user,
  one-device-at-a-time premise this is rare, but a genuine concurrent edit loses
  the older text. This is the main gap to close before relying on multi-device
  editing.
- Only `items` syncs. Tags (`tags`, `item_tags`), `note_versions` and the
  `settings` table stay per device.
- `updated_at` has one-second resolution and the pull cursor uses strict `>`;
  two edits in the same second on different devices can be missed.
- Pull has no pagination yet.

## Alternatives considered

- **Sync the SQLite file** — rejected; see Context.
- **Peer-to-peer sync between devices** — rejected: devices are rarely online at
  the same time, and it is harder to make reliable than a hub.
- **Online-only (server as the database)** — rejected: breaks the offline
  requirement.
- **End-to-end encrypted content** — declined for now: it would prevent
  server-side search. Disk encryption on the hub covers stolen disks; per-note
  encryption remains a possible later addition.
