# RFC-0001: Sync hub topology and redundancy

- **Status:** Accepted (resolved differently from the recommendation — see
  Resolution)
- **Date:** 2026-10-02 (opened)
- **Resolved:** 2026-10-02, by
  [ADR-0002](../adr/ADR-0002-vps-hub-first-defer-home-infrastructure.md)
- **Related:** [ADR-0001](../adr/ADR-0001-sync-overlay-network.md) (transport —
  decided), [`apps/server/DEPLOY.md`](../../../apps/server/DEPLOY.md)

## Problem

ADR-0001 settled *how* clients reach a sync hub privately. It deliberately did
not settle two things:

1. **Where the primary hub lives** — the Contabo VPS or the TrueNAS box.
2. **What "redundancy" means concretely** — the word covers three different
   mechanisms with wildly different costs, and only some work with what is
   built today.

These block the first real deployment: `DEPLOY.md` cannot be rewritten into a
single recommended path until the primary hub is chosen, and it is not worth
documenting a multi-hub story that the client cannot execute.

## What exists today

Verified against source on 2026-10-02.

**Implemented and verified locally (released in 1.0.17):**

- Client ↔ hub sync: pull-then-push, version handshake, last-writer-wins on
  `updated_at` (`apps/main/src/storage/sync/sync-engine.ts`).
- Sync cursors are **already keyed per server URL** —
  `iris.sync.{pull,push}Cursor::<serverUrl>` (`sync-engine.ts:73`). The
  persistence layer is therefore already multi-hub-safe; pointing at a second
  hub does not corrupt the first hub's cursor state.
- Server is env-configured with state confined to a `/data` volume holding one
  SQLite file; Docker image builds and persists across restarts.

**Implemented but never run on real remote hardware:**

- Everything above. The 2026-06-27 round-trip test was against a local
  container. No hub has ever existed outside this machine.

**Not built at all:**

- **One hub at a time.** `SyncSettings` carries a single `serverUrl` and `token`
  (`apps/main/src/types/index.ts:275`). There is no notion of a target list.
- **No hub ↔ hub replication.** Hubs never talk to each other and have no
  concept of peers. Any convergence between two hubs happens only because some
  client talked to both.

**Property that makes all of this cheaper than it looks:** every client is
local-first and holds the complete corpus. A client pointed at an empty hub
simply pushes everything to it. Hubs are therefore *derived* state, not
authoritative — which is why failover is nearly free and why losing a hub is an
inconvenience rather than data loss.

## Options

### Where the primary hub lives

#### Option A — TrueNAS NAS as primary

Own hardware, ZFS encryption at rest with keys held locally, ZFS snapshots as
the backup mechanism for free, no recurring cost. Reached over the NetBird mesh
from anywhere, with OPNsense WireGuard as a second path into the same LAN.

Cost: unreachable during a home power or ISP outage. Given local-first writes,
the consequence is *delayed convergence*, not lost availability — writing keeps
working on every device; they simply reconcile later.

#### Option B — Contabo VPS as primary

Always reachable, independent of home power and ISP. Convergence is prompt even
when two devices are used in the same day from different places.

Cost: the corpus lives on third-party disks (mitigable with volume encryption,
not eliminable), it costs money monthly, and it needs the `0.0.0.0` Docker
binding footgun handled correctly since the box has a public IP. If OPNsense
WireGuard is ever the active path, reaching the VPS hairpins through home.

### What "redundancy" means

#### Option 1 — Hub database backup

Works today, no code. If the NAS is the hub, ZFS snapshots of the dataset cover
it entirely. Otherwise a scheduled copy of `/data/iris-server.db` off the hub.
Protects against hub data loss and corruption; does nothing for hub
unavailability.

#### Option 2 — Standby hub with manual failover

Works today, no code. Run a second `iris-server` on the other box. When the
primary is unreachable, change the URL in the Sync view. Because cursors are
per-URL and clients hold the full corpus, the first cycle against the standby
pushes everything and converges; switching back later also converges by LWW.
Cheap precisely because of the local-first property above.

#### Option 3 — Simultaneous push to multiple hubs

**Requires a feature.** `SyncSettings.serverUrl: string` would become a list of
`{ url, token }` targets, and the engine would iterate targets per cycle. The
cursor layer needs no change at all (`sync-engine.ts:73` already keys per URL),
which makes this a much smaller change than it first appears — the work is in
settings, the Sync view UI, and per-target error/status reporting rather than in
sync semantics.

Risk it introduces: a device can push to hub X and then go offline before
pushing to hub Y, leaving the two hubs divergent until some client talks to
both. LWW still converges eventually, but "eventually" now depends on client
scheduling rather than on a single hub being the meeting point. Per-target
status also makes the single sync indicator ambiguous — partial success becomes
a state the UI must express.

## Recommendation

**NAS as primary, VPS as warm standby, adopt Options 1 + 2 now, defer Option 3.**

Reasoning:

- The sync contract's own premise is single-user with "never edit two devices
  simultaneously". Under that premise, prompt convergence is a convenience and
  write availability is already guaranteed by local-first storage. The VPS's one
  genuine advantage therefore buys *latency*, not *function* — which is not
  enough to justify putting the whole corpus on someone else's disks and paying
  monthly for it.
- The NAS already has the better durability story by a wide margin: ZFS
  encryption with local keys plus snapshots is a stronger backup posture than
  anything planned for the VPS, and Option 1 costs literally nothing there.
- Options 1 and 2 together already deliver what "redundancy" is usually meant to
  deliver — no data loss, and a recovery path measured in seconds (change a URL)
  rather than hours. They need zero code, so they can be in place before the
  first real deployment rather than after.
- Option 3 is the only part that needs code, and it buys the least: it addresses
  convergence latency during a hub outage, which is the mildest failure mode in
  the whole system. It also degrades the sync status UI into something with
  partial states. Worth building only if a concrete need shows up after 1 + 2
  have been running — e.g. if phone-and-desktop-same-day use turns out to be
  common enough that waiting on home uptime genuinely annoys.
- Keeping the VPS enrolled in the overlay as a standby preserves Option B. If
  home uptime turns out to be the real constraint, promoting the VPS to primary
  is a Sync-view URL change, not a migration.

## Open questions

Each must be answered before this can move to `Accepted`:

- ~~**Does the home connection have a stable public IP, or is it CGNAT?**~~
  **Answered 2026-10-02: not CGNAT.** The OPNsense WAN interface holds a public
  IPv4 address directly (a /18 from the ISP, gateway on `.1`), and it matches
  the address seen by an external IP-check site. OPNsense WireGuard is therefore
  viable as the second path in ADR-0001. Still unverified: whether the address
  is a static assignment or a DHCP lease that can change (if the latter, the
  WireGuard endpoint needs a dynamic DNS name), and whether inbound UDP is
  actually reachable — confirmed only by a handshake from outside.
- **Does the home connection have a usable upstream bandwidth and an acceptable
  uptime record?** Determines whether Option A's delayed-convergence cost is
  measured in minutes or days.
- **Is the NAS on a UPS?** A NAS that goes down hard on every power blip is a
  worse hub than one that does not, and SQLite on ZFS tolerates this well but
  not infinitely.
- **Does the Contabo plan meet NetBird's self-hosted minimum (1 CPU / 2 GB RAM)**
  if the control plane is ever moved there per ADR-0001's deferred option?
- **Is `iris-server` built for the NAS's architecture?** The image is static musl;
  confirm the NAS is x86-64 and not something needing a second build target.

## Resolution

Settled 2026-10-02, recorded in
[ADR-0002](../adr/ADR-0002-vps-hub-first-defer-home-infrastructure.md).

The recommendation above (NAS primary, VPS standby) was **not adopted for now**.
The first deployment is a single hub on the Contabo VPS over NetBird. The NAS
hub and the OPNsense WireGuard path are deferred until that deployment is
running; simultaneous multi-hub push (Option 3) stays unbuilt.

The open questions about the home uplink, UPS, and NAS architecture were not
answered and no longer block anything. They should be carried into a new RFC
when the NAS is brought in.
