# ADR-0001: Private overlay network for sync transport

- **Status:** Accepted — choice of NetBird as primary transport superseded by
  [ADR-0010](ADR-0010-tailscale-serve-for-first-deployment.md); the private-overlay
  invariant below still holds
- **Date:** 2026-10-02
- **Supersedes:** —
- **Related:** [RFC-0001](../rfc/RFC-0001-sync-hub-topology.md) (hub topology),
  [ADR-0002](ADR-0002-vps-hub-first-defer-home-infrastructure.md) (rollout order —
  the secondary transport below is deferred),
  [`apps/server/DEPLOY.md`](../../../apps/server/DEPLOY.md)

## Context

`iris-server` holds the complete note corpus and authenticates with a single
bearer token. The token is compared with a plain `==` (`apps/server/src/main.rs`,
`auth`), it terminates no TLS of its own, and it defaults to binding
`127.0.0.1:8787` (`IRIS_BIND`, `apps/server/src/main.rs:61`). It is not built to
face the public internet, and making it safe to do so is not a goal — keeping it
off the public internet is cheaper and stronger.

Phase 1 sync is implemented and verified against a local container (round-trip
confirmed 2026-06-27, released in 1.0.17), but has never run on real remote
hardware. The transport question is therefore still fully open, and whatever is
chosen now should not be expensive to change later — the stated requirement is a
setup that survives changes of mind.

Hardware and services actually available:

- **Contabo VPS** — always-on, public IP, but third-party disks.
- **TrueNAS SCALE NAS** — own hardware, ZFS encryption and snapshots, sits behind
  the home uplink.
- **OPNsense firewall** — own hardware, terminates the home WAN, has WireGuard
  built in.

Access requirement: desktop and phone reach the hub from anywhere, including
from cellular networks and behind CGNAT, with nothing listening publicly.

## Decision

Sync traffic rides a **private WireGuard overlay**, never the public internet.
Two transports are provisioned, with distinct roles:

1. **NetBird — primary.** WireGuard mesh, fully open source including the control
   plane. Start on the managed free tier; the control plane can be self-hosted
   later (unified server container since v0.65, Feb 2026) with no change to
   application code — re-enrolling peers against a different management URL is a
   client-side operation.
2. **OPNsense WireGuard — secondary.** Hub-and-spoke into the home LAN. Provides
   LAN-speed sync at home and a fallback path that depends on no external
   control plane whatsoever.

The invariant that makes this swappable, and which must hold for every
deployment:

> **`iris-server` binds only to a private overlay address via `IRIS_BIND`, and
> never terminates TLS. Clients address a hub by URL + bearer token only.**

Because the client's entire notion of a hub is a URL and a token
(`SyncSettings`, `apps/main/src/types/index.ts:275`), transport has **no
application-code surface**. Changing or replacing the overlay is a deployment
and documentation change, not a code change.

This ADR covers transport only. Where the hub itself lives is a separate and
still-open question — see RFC-0001.

## Consequences

**Good**

- No public listener for `iris-server` on any host, on any transport. The
  non-constant-time token compare stays a low-severity issue rather than an
  exposed one.
- All sync traffic is WireGuard-encrypted peer-to-peer regardless of which
  transport carries it, so plain HTTP over the overlay is acceptable and no
  certificate management is needed.
- Transport is replaceable config-only: NetBird cloud → self-hosted NetBird →
  plain WireGuard are all moves that touch neither Rust nor TypeScript.
- Two independent paths mean an external control-plane outage does not strand
  sync while at home.
- NetBird is a mesh, so the phone reaches a hub directly instead of hairpinning
  through a fixed concentrator.

**Bad**

- NetBird has no equivalent of `tailscale serve` or Funnel, so there is no free
  in-overlay HTTPS and no zero-config public URL. Acceptable now because
  WireGuard already encrypts; a future browser client would need Caddy added
  explicitly.
- The managed free tier puts coordination in NetBird's cloud. It brokers keys and
  peer discovery only — note content is end-to-end between peers and never
  traverses it — but it is still a third party in the path until self-hosted.
- OPNsense WireGuard requires a stable public UDP endpoint and a port-forward at
  home, and is unusable under CGNAT. This is precisely why it is secondary.
- Self-hosting NetBird's control plane later means publicly exposing 80/443 TCP
  and 3478 UDP and operating Traefik, a dashboard, and an identity provider —
  *more* public surface than it removes, on a box whose job was to have none.
  Deliberately deferred, not rejected.

**Neutral / must be remembered**

- **Docker publishes ports on `0.0.0.0` and bypasses `ufw`.** A plain
  `-p 8787:8787` defeats this entire ADR. Every deployment must bind the
  published port to the overlay address explicitly:
  ```yaml
  ports:
    - "100.x.y.z:8787:8787"   # overlay IP, never the public one
  ```
  NetBird and Tailscale both allocate from `100.64.0.0/10`, so this guidance is
  identical across transports. This is the single easiest way to get the
  deployment wrong and belongs in `DEPLOY.md` permanently.
- Disk encryption remains a separate concern from transport. Any host holding
  `iris-server.db` needs it — ZFS on the NAS, volume encryption on the VPS.

## Alternatives considered

- **Tailscale** — rejected. Functionally excellent and the existing `DEPLOY.md`
  was written around it, but the coordination server is proprietary and
  self-hosting is unsupported (Headscale is third-party, lacks a web UI, and has
  partial feature parity). That conflicts with the long-term goal of being able
  to own the whole path. NetBird is a drop-in replacement at the same topology,
  so the switch costs documentation only. Retained in `DEPLOY.md` as a
  documented alternative rather than deleted.
- **Public HTTPS via Caddy + Let's Encrypt** — rejected as the primary path. It
  places a hand-rolled bearer-token endpoint on the public internet, which is
  the exact exposure this ADR exists to avoid, and would make the constant-time
  compare fix a prerequisite. Kept documented as an escape hatch for clients
  that cannot join an overlay.
- **Plain WireGuard on OPNsense as the only transport** — rejected as primary.
  It hairpins traffic (phone → home → VPS) when the hub is not at home, makes
  the home uplink a hard dependency for reaching an always-on VPS, requires
  manual keypair and peer management for every device, and fails outright under
  CGNAT. Valuable as a second path, wrong as the only one.
- **ZeroTier** — not pursued. Comparable to NetBird in shape, but NetBird's
  WireGuard-native data plane and self-hostable control plane cover the same
  ground with one fewer protocol to reason about.
