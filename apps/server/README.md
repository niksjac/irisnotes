# iris-server

Sync hub for IrisNotes. Owns the canonical `items` database and exposes the
sync contract that local-first clients (desktop, future Android app, future
browser) push to and pull from. Single-user, last-writer-wins.

Schema is single-sourced from `schema/base.sql` (embedded via `include_str!`),
so the server can never drift from the app on table structure.

## Run (local dev)

```sh
cd apps/server
IRIS_TOKEN=secret123 cargo run
```

| Env var        | Default              | Meaning                              |
| -------------- | -------------------- | ------------------------------------ |
| `IRIS_DB_PATH` | `./iris-server.db`   | Server database file                 |
| `IRIS_TOKEN`   | `dev-token` (+ warn) | Bearer token clients must present    |
| `IRIS_BIND`    | `127.0.0.1:8787`     | Listen address                       |

## Contract (v1)

All `/sync/*` requests need `Authorization: Bearer <IRIS_TOKEN>`.

- `GET /health` → `{ "status": "ok" }`
- `GET /version` → `{ "schemaVersion": 1, "syncVersion": 1 }` — clients check this on connect.
- `POST /sync/pull` `{ "since": "<cursor>" }` → `{ "items": [...], "cursor": "<hi-water>" }`
  Returns `items` rows (incl. soft-deleted tombstones) with `updated_at > since`.
- `POST /sync/push` `{ "items": [...] }` → `{ "applied": <n>, "cursor": "<hi-water>" }`
  Upserts last-writer-wins; only rows strictly newer than the server's copy are written.

`cursor` is the high-water `updated_at`. An item is one `items` row in camelCase
(`type`, `contentType`, `parentId`, `sortOrder`, `deletedAt`, …); `content` and
`metadata` are opaque and never parsed server-side.

## Connect the desktop app

The desktop client (`apps/main`) is local-first and syncs in the background when
enabled. It is **off by default**. To turn it on, add a `[sync]` section to your
app config (`dev/config.toml` in dev):

```toml
[sync]
enabled = true
serverUrl = "http://127.0.0.1:8787"
token = "secret123"        # must equal the server's IRIS_TOKEN
intervalSeconds = 10
```

How it works (`apps/main/src/storage/sync/sync-engine.ts`, mounted via
`useSync` in the layout): each cycle checks `/version`, pulls rows since the last
cursor and applies them last-writer-wins under the `sync_ctl` guard (so pulled
timestamps are preserved, not rewritten by the local trigger), then pushes local
rows changed since the last push cursor. Cursors live in `localStorage` per
server URL.

### Manual round-trip test

1. `cd apps/server && IRIS_TOKEN=secret123 cargo run`
2. Add the `[sync]` block above to `dev/config.toml`, then `pnpm main`.
3. Create/edit a note in the app — within `intervalSeconds` it pushes; confirm
   with `curl -s -X POST localhost:8787/sync/pull -H 'authorization: Bearer secret123' -H 'content-type: application/json' -d '{}' | jq`.
4. `POST /sync/push` a row by hand (see contract above) and watch it appear in
   the app on the next cycle.

> Recreating the schema: existing databases keep the *old* `update_items_timestamp`
> trigger (CREATE TRIGGER IF NOT EXISTS won't replace it). For a clean dev DB with
> the guard, run `./dev/setup-dev-db.sh`. Production DBs need a one-time migration
> to drop & recreate that trigger.

## Phase 1 scope / known limitations

- Syncs the **`items` table only** (notes/books/sections). `tags`, `item_tags`,
  `note_versions`, `settings` are not synced yet.
- `updated_at` has **second granularity** (SQLite `datetime('now')`); the pull
  cursor uses strict `>`. Fine for a single user who never edits two devices in
  the same second — revisit if that assumption changes.
- Bearer token uses a plain `==` compare — switch to constant-time before
  exposing to the public internet, and always run behind TLS (Caddy).
- No pagination on pull yet (whole changed-set in one response).
