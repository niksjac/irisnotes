# IrisNotes Sync Design

Status: Draft  
Last updated: 2026-05-27

This document turns the older cloud sync roadmap into a concrete design for syncing IrisNotes across multiple machines. The target is a Trilium-inspired setup: every IrisNotes desktop install keeps a local SQLite database, and all devices sync through one central server that can be self-hosted on an Ubuntu VPS with Docker.

## Recommendation

Use a centralized sync server running in Docker on a VPS as the first serious sync architecture.

This is a good fit for IrisNotes because it is easier to make reliable than peer-to-peer sync, works when devices are never online at the same time, is cheap to host, is easy to back up, and matches the existing local-first SQLite app model. The server should not expose or synchronize the raw SQLite database file. It should expose a small HTTPS API, store a canonical server database, and keep an append-only change feed that clients can push to and pull from.

For production use over the public internet, HTTPS with a valid TLS certificate should be mandatory. The easiest path is Docker Compose with Caddy as a reverse proxy, because Caddy can automatically request and renew Let's Encrypt certificates. Nginx with Certbot or Traefik are also valid, but they add more setup surface.

## Goals

- Install IrisNotes on multiple machines and sync notes reliably between them.
- Keep every client usable offline with a complete local SQLite database.
- Make self-hosting understandable: one Docker Compose file, one persistent data directory, clear backups, clear upgrades.
- Avoid silent data loss. Conflicts should preserve recoverable versions.
- Support Linux-first desktop sync, then keep the design open for macOS, Windows, and mobile.
- Keep the security model simple enough to operate correctly.

## Non-Goals For The First Version

- Real-time collaborative editing inside the same note.
- Peer-to-peer sync as the primary architecture.
- Multi-user shared notebooks and permissions.
- Using Dropbox, Google Drive, Syncthing, or Git to sync the live SQLite file.
- Exposing the sync server directly over plain HTTP on the public internet.

## Architecture

```text
IrisNotes desktop A         VPS / central server         IrisNotes desktop B
-------------------        --------------------         -------------------
Local SQLite DB      <--->  HTTPS sync API         <---> Local SQLite DB
Sync outbox                 Server SQLite DB             Sync outbox
Last server sequence        Append-only changes          Last server sequence
```

Each client stores notes locally and records local mutations in a sync outbox. The server receives idempotent change batches, assigns each accepted change a monotonically increasing server sequence, and returns new remote changes to each client. Clients track the last server sequence they have applied.

The server is a coordinator and durable source of reconciliation, not the only usable copy of the notes. If the VPS is down, clients continue working locally and upload their outbox when the server returns.

## Why Not Sync The SQLite File Directly

The live database file should not be synchronized with file tools while multiple machines can write to it. SQLite is reliable as a local embedded database, but syncing the file itself through cloud drives, rsync, Git, or network shares risks divergent histories, overwritten writes, WAL file issues, and hard-to-debug corruption.

IrisNotes should sync logical changes instead: item created, note content updated, tag added, item soft-deleted, setting changed. This gives us retry safety, conflict detection, progress reporting, and future encryption.

## VPS And Docker Assessment

A central VPS running a Docker image is a good idea for this project if we treat it as a small production service.

Reliability requirements:

- The server container has a persistent mounted data volume.
- Docker uses a restart policy such as `unless-stopped`.
- The server database uses safe SQLite settings and a clean backup path.
- The server exposes health checks and simple sync status endpoints.
- Backups are automated and periodically restored in a test environment.
- Image tags are pinned for upgrades instead of blindly tracking `latest`.
- Migrations are explicit and run before accepting sync traffic.
- Clients use an outbox with idempotency keys so retries do not duplicate changes.

Security requirements:

- Only ports 80 and 443 are exposed publicly for normal operation.
- The IrisNotes server process is only reachable through the reverse proxy.
- HTTPS uses a valid certificate, not a self-signed certificate for public sync.
- Authentication uses device-scoped tokens; tokens can be revoked per device.
- Passwords are stored with Argon2id or an equivalent password hashing scheme.
- Secrets are passed through environment variables or Docker secrets, not committed files.
- Logs never include note content, passwords, bearer tokens, or raw sync payloads.
- Backups are encrypted before leaving the VPS.
- SSH access to the VPS is locked down separately from the app.

This setup is reliable enough for personal multi-machine sync if those operational basics are in place. It is not automatically private from the VPS provider or a server compromise unless note contents are encrypted at the application layer.

## HTTPS And TLS

TLS is necessary for public internet sync. Even if IrisNotes later encrypts note bodies end-to-end, TLS still protects login, device registration, bearer tokens, metadata, traffic shape, and downgrade or man-in-the-middle attacks.

Recommended setup:

1. Buy or use a domain, for example `sync.example.com`.
2. Point an `A` or `AAAA` DNS record at the VPS.
3. Open ports 80 and 443 on the VPS firewall.
4. Run Caddy in Docker Compose next to the IrisNotes sync server.
5. Let Caddy request and renew certificates from Let's Encrypt automatically.
6. Keep the app server on the internal Docker network, not exposed directly.

Example deployment shape:

```yaml
services:
  irisnotes-server:
    image: ghcr.io/irisnotes/irisnotes-server:0.1.0
    restart: unless-stopped
    environment:
      IRISNOTES_DATA_DIR: /data
      IRISNOTES_PUBLIC_URL: https://sync.example.com
    volumes:
      - irisnotes_data:/data
    expose:
      - "8080"

  caddy:
    image: caddy:2
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - irisnotes-server

volumes:
  irisnotes_data:
  caddy_data:
  caddy_config:
```

Example `Caddyfile`:

```caddyfile
sync.example.com {
  reverse_proxy irisnotes-server:8080
}
```

Alternatives:

- Nginx plus Certbot: mature and common, but more manual renewal and proxy configuration.
- Traefik: good if the host already runs multiple Docker services.
- Tailscale or WireGuard: good for private-only sync. Public HTTPS is less urgent on a private encrypted network, but certificate validation is still useful and avoids training the app to accept insecure endpoints.
- Cloudflare Tunnel: avoids opening inbound ports, but adds another provider to the trust and operations model.

Avoid disabling certificate verification in the client. That makes setup feel easier at first, but it removes one of the main protections against credential theft.

## Trust Model And Encryption

There are two viable security modes.

Trusted-server mode is the simplest first implementation. The server stores plaintext note data, protected by HTTPS, authentication, VPS hardening, encrypted backups, and possibly disk encryption. This is easier to build and debug, but a compromised VPS can read notes.

End-to-end encrypted mode is safer for a rented VPS. Clients encrypt note content before upload, and the server stores opaque encrypted payloads. The server can still coordinate revisions and changes, but it cannot index content or inspect note bodies. This is better privacy, but it complicates conflict resolution, password recovery, sharing, and migrations.

Recommended product stance: design the protocol so end-to-end encryption can be added without replacing the sync system. For real personal production use on an untrusted VPS, end-to-end encryption should be implemented before calling sync fully secure.

Practical compromise:

- Phase 1: trusted-server sync for local development and early testing.
- Phase 2: encrypt content fields and sensitive metadata before wider personal use.
- Always use TLS in both phases.

## Server Shape

The central server should be a headless server binary, not a Tauri desktop app running in a special mode. Tauri is excellent for the desktop clients, but the server should be a normal HTTP service that is easy to containerize, log, monitor, and run without a GUI stack.

Likely structure:

```text
apps/sync-server/
  Dockerfile
  docker-compose.example.yml
  src/
    api.rs
    auth.rs
    db.rs
    sync.rs
    main.rs
```

The exact language can be decided later. A small Rust HTTP server is a good match because the Tauri backend is already Rust, but a TypeScript server would be faster to prototype. The important boundary is the API and data model, not the framework.

## Data To Sync

The current schema source of truth is `schema/base.sql`. The first syncable set should be:

- `items`: notes, books, sections, hierarchy, content, metadata, sort order, timestamps, soft deletes.
- `tags`: tag definitions.
- `item_tags`: item-to-tag relations.
- `settings`: only settings that should roam between machines.
- `note_versions`: either synced as recovery history or generated independently per device. This needs a deliberate decision.

Derived data should not be synced:

- `items_fts`: rebuild locally from `items`.
- Tree views: rebuild from `items`.
- Search indexes and caches.
- Ephemeral UI state such as active pane, transient cursor focus, or local window size.

## Proposed Sync Metadata

These additions are conceptual and should be converted into migrations when implementation starts.

Server tables:

```sql
CREATE TABLE sync_clients (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_seen_at TEXT,
  revoked_at TEXT
);

CREATE TABLE sync_changes (
  server_seq INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT NOT NULL,
  client_change_id TEXT NOT NULL,
  entity_table TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('insert', 'update', 'delete')),
  base_revision INTEGER,
  entity_revision INTEGER NOT NULL,
  payload_json TEXT NOT NULL,
  content_hash TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(client_id, client_change_id)
);
```

Client tables:

```sql
CREATE TABLE sync_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE sync_outbox (
  id TEXT PRIMARY KEY,
  entity_table TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  base_revision INTEGER,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT
);
```

Synced entities should also carry revision metadata. This can be columns such as `sync_revision`, `updated_by_client_id`, and `content_hash`, or it can live in side tables. Columns are simpler and faster to query; side tables reduce churn in the existing schema.

## Sync Protocol

Initial setup:

1. Server starts in setup mode with no users.
2. Setup creates the first user and disables setup mode.
3. A desktop client registers as a named device.
4. The server returns a device token.
5. The client stores the token in the OS keychain, not in plain config.

Normal loop:

1. Client records local changes into `sync_outbox` in the same logical operation as the local SQLite update.
2. Client calls `POST /api/sync/push` with a batch of outbox entries.
3. Server validates auth, checks idempotency, detects revision conflicts, applies accepted changes, assigns `server_seq` values, and returns acknowledgements.
4. Client removes acknowledged outbox rows.
5. Client calls `GET /api/sync/pull?since=<last_server_seq>`.
6. Server returns ordered changes after that sequence.
7. Client applies remote changes in a transaction and updates `last_server_seq`.
8. Client periodically computes or requests a sync hash to detect divergence.

Useful endpoints:

```text
GET  /health
POST /api/setup
POST /api/auth/login
POST /api/devices
GET  /api/devices
POST /api/devices/{id}/revoke
POST /api/sync/push
GET  /api/sync/pull?since=123
GET  /api/sync/snapshot
GET  /api/sync/status
```

All mutating requests should be idempotent. A retry after a network drop must be safe.

## Conflict Handling

Conflicts happen when the client pushes a change based on an older entity revision than the server currently has.

Safe default behavior:

- Never permanently discard note content during sync.
- For concurrent content edits, keep one version as current and save the other as a note version or conflict copy.
- For title and metadata changes, allow field-level merge when fields do not overlap.
- For hierarchy moves, accept the newest move but keep fractional `sort_order` and use entity id or server sequence as a stable tie-breaker.
- For delete versus edit, preserve the edit as recoverable history or create a conflict copy instead of losing it.

The first version can use last-write-wins for the visible current note as long as the overwritten content remains recoverable. Trilium uses a similar practical model where the newer change wins and the older version remains available in note revisions. IrisNotes already has `note_versions`, so this is a good fit if version history is made sync-aware.

## Integrity Checks

After a sync cycle, the client and server should be able to compare a deterministic hash of the synced dataset. The hash should exclude derived data such as FTS tables and include only canonical syncable rows.

If hashes differ:

1. Pause normal sync for that client.
2. Fetch a compact manifest of entity ids, revisions, and hashes.
3. Identify divergent entities.
4. Re-pull or re-push only the divergent rows.
5. Fall back to a full snapshot restore only when targeted repair fails.

This gives a recovery path for bugs, interrupted migrations, and missed changes.

## Backups

Backups are part of the sync design, not a separate concern.

Minimum server backup plan:

- Nightly encrypted backups of the server data volume.
- Keep several daily snapshots and a few weekly/monthly snapshots.
- Store at least one backup outside the VPS provider.
- Test restore regularly into a clean environment.
- Include app version, schema version, and migration state with the backup.

SQLite backups should use a safe backup method. Avoid blindly copying a live database file if WAL state may be active. Prefer an application backup endpoint, SQLite online backup, or briefly stopping the service during a small personal backup window.

## Client UX

The UI should make sync status visible without becoming noisy.

Expected states:

- Not configured.
- Connected and up to date.
- Syncing.
- Offline, pending local changes.
- Auth problem.
- Server unreachable.
- Conflict needs attention.
- Integrity repair running.

The app should show the last successful sync time, pending upload count, current server URL, and registered device name. It should also provide a manual `Test connection` and `Sync now` action.

## First Implementation Milestones

1. Add sync metadata schema and local outbox.
2. Build a minimal headless server with SQLite and health checks.
3. Add device registration and token auth.
4. Implement push/pull for `items` only.
5. Add Caddy-based Docker Compose example.
6. Add sync status UI and manual sync trigger.
7. Add conflict preservation through `note_versions`.
8. Add tags, item tags, selected settings, and integrity hashes.
9. Add encrypted backups and documented restore.
10. Add end-to-end encryption for content fields before treating the setup as private against the VPS.

## Open Decisions

- Should the first usable version be trusted-server sync, or should content encryption be part of the MVP?
- Should `note_versions` sync between devices, or should each device keep local history while conflicts create synced recovery versions?
- Which settings should roam, and which should remain device-local?
- Should the server support only one user initially?
- Should attachments and images be part of the first sync release?
- Should deployment prefer public HTTPS with Caddy or private networking with Tailscale/WireGuard?
- Should the sync server be Rust-first or TypeScript-first?

## References

- Existing roadmap: `docs/CLOUD_SYNC_ROADMAP.txt`
- Current schema source of truth: `schema/base.sql`
- Trilium synchronization docs: https://docs.triliumnotes.org/user-guide/setup/synchronization
- Trilium Docker server docs: https://docs.triliumnotes.org/user-guide/setup/server/installation/docker