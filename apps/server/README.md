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

## Phase 1 scope / known limitations

- Syncs the **`items` table only** (notes/books/sections). `tags`, `item_tags`,
  `note_versions`, `settings` are not synced yet.
- `updated_at` has **second granularity** (SQLite `datetime('now')`); the pull
  cursor uses strict `>`. Fine for a single user who never edits two devices in
  the same second — revisit if that assumption changes.
- Bearer token uses a plain `==` compare — switch to constant-time before
  exposing to the public internet, and always run behind TLS (Caddy).
- No pagination on pull yet (whole changed-set in one response).
