# ADR-0010: Tailscale and `tailscale serve` for the first hub deployment

- **Status:** Accepted
- **Date:** 2026-10-05
- **Supersedes:** ADR-0001 in part — the choice of NetBird as primary transport.
  ADR-0001's invariant (private overlay only, no public listener) still holds.
- **Related:** [ADR-0001](ADR-0001-sync-overlay-network.md),
  [ADR-0002](ADR-0002-vps-hub-first-defer-home-infrastructure.md),
  [`apps/server/DEPLOY.md`](../../../apps/server/DEPLOY.md)

## Context

ADR-0001 chose NetBird as the primary overlay, and ADR-0002 put the first hub on
the Contabo VPS. Inspecting the VPS on 2026-10-05 showed facts those records
didn't have:

- **The VPS is already on Tailscale**, as is the desktop. Another service on the
  box (`vh-dashboard`, bound to `127.0.0.1:3900`) is published to the tailnet with
  `tailscale serve` on `:443`.
- **NetBird and Tailscale collide on one Linux host.** Both allocate from
  `100.64.0.0/10`. Tailscale routes that range into `tailscale0` and installs a
  firewall rule dropping traffic from it on any other interface — including
  NetBird's `wt0`. Running both needs a custom NetBird range and two overlays to
  debug.
- **Tailscale issues trusted HTTPS certificates for tailnet names**
  (`*.<tailnet>.ts.net`, Let's Encrypt via DNS-01 on Tailscale's domain).
  NetBird has no equivalent for peer names; the feature request
  ([netbirdio/netbird#5479](https://github.com/netbirdio/netbird/issues/5479))
  was open as of 2026-10-05. HTTPS matters for the planned Android client, which
  refuses plain HTTP to non-local addresses by default.

## Decision

The first hub uses the **existing Tailscale tailnet**, published with
**`tailscale serve`** — the same pattern the box already uses:

- `iris-server` publishes only on **`127.0.0.1:8787`** (a local
  `docker-compose.override.yml`; the repo's compose file is unchanged).
- `tailscale serve --bg --https=8787 http://127.0.0.1:8787` exposes it **to the
  tailnet only** as `https://hub.tailcb3cd9.ts.net:8787`. `tailscaled` terminates
  TLS with a Let's Encrypt certificate; `iris-server` still never does.
- The bearer token is generated on the VPS into `.env` (root-only, gitignored)
  and copied to the desktop app over SSH without being displayed.

NetBird is **deferred, not rejected**: revisit it when the whole box (including
`vh-dashboard`) moves to one overlay, or when a self-hosted control plane becomes
a priority.

## Consequences

**Good**

- Nothing new to install on the VPS or the desktop.
- Valid HTTPS with no certificate management; removes the Android plain-HTTP
  obstacle in advance.
- Binding to loopback means no public listener regardless of Docker's firewall
  behaviour, and no boot-ordering dependency on the overlay interface (binding
  to the tailnet IP would require `tailscale0` to be up before Docker starts).

**Bad**

- The coordination server is proprietary — the concern that led ADR-0001 to
  NetBird remains.
- Clients address the hub by a `ts.net` name; switching overlay or host means
  changing the URL in every client. A name on an owned domain (with a
  DNS-01 certificate, e.g. Caddy) would decouple that, at the cost of a DNS API
  token on the server.
- Machine names appear in public Certificate Transparency logs (unreachable
  outside the tailnet, but not secret).
- `tailscale serve reset` removes every published entry; after a reset or a
  machine rename, each `serve` command must be re-run. This happened once during
  setup and broke sync until `:8787` was re-added.

## Verification

On 2026-10-05 – 2026-10-07, from the desktop: `/health` and `/version` answered
over the tailnet with a valid certificate for the name; requests without or with
a wrong token got HTTP 401; the public IP refused connections on `:8787`;
`vh-dashboard` on `:443` was unaffected. The owner reported the installed app
(1.0.19) syncing successfully on 2026-10-07.

## Alternatives considered

- **NetBird alongside Tailscale** with a non-overlapping range — rejected for
  now: two overlays and a custom range to debug on a box running another service.
- **Move the box to NetBird** — deferred: touches a working service; worth doing
  together with a decision on stable, owned-domain URLs.
- **Bind `iris-server` to the Tailscale IP, plain HTTP** (the previous
  `DEPLOY.md` path) — rejected: needs boot ordering and a reboot test that would
  also take down `vh-dashboard`, and gives no HTTPS.
