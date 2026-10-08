# ADR-0002: Single VPS hub first; NAS hub and OPNsense WireGuard deferred

- **Status:** Accepted — "reached over NetBird" superseded by
  [ADR-0010](ADR-0010-tailscale-serve-for-first-deployment.md) (the hub runs on
  Tailscale); the rest stands. Note 2026-10-07: the VPS volume encryption this
  record assumes is not in place — see the Current state in `docs/README.md`.
- **Date:** 2026-10-02
- **Supersedes:** —
- **Related:** [ADR-0001](ADR-0001-sync-overlay-network.md) (transport),
  [ADR-0010](ADR-0010-tailscale-serve-for-first-deployment.md) (the hub runs on
  Tailscale, not NetBird),
  [RFC-0001](../rfc/RFC-0001-sync-hub-topology.md) (resolved by this ADR),
  [`docs/guides/sync-hub.md`](../../guides/sync-hub.md)

## Context

ADR-0001 chose NetBird as the primary sync transport and OPNsense WireGuard as
a secondary path. RFC-0001 then weighed where the hub should live and
recommended the TrueNAS box as primary with the Contabo VPS as standby.

Sync has still never run on real remote hardware. Bringing up the NAS hub and
the OPNsense tunnel at the same time as the first deployment would mean
debugging three new things at once. The owner's decision is to get one hub
working first and keep the home infrastructure as a later, optional addition —
on the condition that nothing done now makes that addition harder.

## Decision

The first deployment is **one hub on the Contabo VPS, reached over NetBird**.

The NAS hub and the OPNsense WireGuard path are **deferred, not dropped**. They
stay in the design as documented future options, and no work is done on them
now.

To keep them cheap to add later, these properties must continue to hold. All of
them hold today (verified against source on 2026-10-02):

1. **A hub is only a URL and a token to the client** (`SyncSettings`,
   `apps/main/src/types/index.ts:275`). No host, address range, or transport is
   hardcoded anywhere in the client.
2. **Sync cursors are keyed per server URL** (`cursorKey`,
   `apps/main/src/storage/sync/sync-engine.ts:73`), so pointing the app at a
   different hub never corrupts state for the previous one.
3. **The server is configured only by environment** (`IRIS_BIND`, `IRIS_TOKEN`,
   `IRIS_DB_PATH`, `apps/server/src/main.rs:56-61`) with all state in one
   SQLite file, so the same image runs on the VPS, the NAS, or anything else.
4. **Clients are local-first and hold the full corpus**, so a new or empty hub
   is filled by the first sync cycle rather than by a migration.

What adding each deferred piece will take, given the above:

| Later addition | What it requires |
|---|---|
| NAS as standby or replacement hub | Run the same container on the NAS, enrol it in NetBird, change the URL in the Sync view. No code. |
| OPNsense WireGuard as a second path | Tunnel and peer config on OPNsense; the hub must also listen on an address reachable through that tunnel. No code. |
| Pushing to two hubs at once | A feature: `serverUrl` becomes a list of targets, plus per-target status in the Sync view. Not built, not planned yet. |

## Consequences

**Good**

- The first real deployment has one hub and one transport to debug.
- Nothing is foreclosed: moving to or adding the NAS is a deployment task and a
  URL change.

**Bad**

- The note corpus sits on third-party disks until a NAS hub exists. Volume
  encryption on the VPS limits this but does not remove it.
- No ZFS snapshots. Hub backup on the VPS has to be a scheduled copy of
  `iris-server.db`; until that exists, the only copies are the clients
  themselves.
- NetBird is the only path. If its control plane is unavailable, new
  connections may fail and sync waits; local writing is unaffected.

**Must be verified in the first deployment**

- **Plain HTTP to a non-loopback address from the release build.** The sync
  engine uses the webview's own `fetch` (`sync-engine.ts:78,147,166`), and the
  only round-trip test so far was against a loopback server. A packaged Tauri
  app is served from a custom-scheme origin, and webviews can block plain-HTTP
  requests to non-loopback hosts as mixed content. If the installed app cannot
  reach `http://100.x.y.z:8787`, the fix is to send sync requests from the Rust
  side instead of the webview — which would also be needed for the Android
  client. This is the one place where "transport has no code surface"
  (ADR-0001) is still an untested claim.

  **Verified 2026-10-03 — not a problem on the Linux desktop.** The installed
  1.0.18 release build, run against isolated scratch config and data with the
  32 dev seed notes, completed a full cycle against a throwaway server bound
  only to an overlay address (this machine's `100.x` Tailscale address — the
  same address class NetBird uses). The server logged `GET /version`, `POST
  /sync/pull` and `POST /sync/push`, each with its CORS preflight, all `200 OK`,
  within one 5-second interval; all 32 rows arrived with matching ids and
  `updated_at`. "Transport has no code surface" holds for the desktop.

  Not covered: macOS and Windows builds (not used), and Android. Android apps
  block plain-HTTP requests to non-local addresses by default regardless of the
  network path, so the Phase 2 client is expected to need either sync requests
  sent from Rust or a scoped plain-HTTP exception. Neither overlay avoids this;
  Tailscale only offers an easier route to an `https://` URL via `tailscale
  serve`.

## Alternatives considered

- **NAS as primary hub from the start** (RFC-0001's recommendation) — not
  adopted now. Its durability and data-ownership advantages are real, but it
  adds home-uplink, UPS, and architecture questions that are still unanswered,
  and it would be brought up alongside an untested sync deployment. Remains the
  likely long-term primary.
- **Bring up OPNsense WireGuard now as the fallback path** — not adopted now.
  The home line has a public address, so it is viable, but a fallback for a
  system that is not yet running is premature.
- **Build multi-hub push now so the NAS can be added as a simultaneous
  target** — rejected. It is the only deferred item that needs code, it buys
  the least, and it cannot be tested meaningfully with one hub.
