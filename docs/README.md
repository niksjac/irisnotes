# IrisNotes docs

Two kinds of documentation live here. For how to work in this repo — commands,
conventions, rules for changes — start with [`/AGENTS.md`](../AGENTS.md).

## Current state

*As of 2026-10-07, release 1.0.19.* Update this section when a milestone lands
or a priority changes.

**Working**

- Desktop app (`apps/main`), quick-search overlay (`apps/quick`), both CLIs.
- Sync phase 1: local-first clients reconciling `items` with one hub
  ([ADR-0008](decisions/adr/ADR-0008-local-first-sync-central-hub.md)).
- The hub is live: Contabo VPS (Ubuntu 22.04, shared with another service), on
  the owner's Tailscale tailnet, at `https://hub.tailcb3cd9.ts.net:8787`. Code in
  `/opt/irisnotes`, database in `/srv/iris`
  ([ADR-0010](decisions/adr/ADR-0010-tailscale-serve-for-first-deployment.md),
  [sync-hub.md](guides/sync-hub.md)). The installed app syncs with it.

**Not protected yet — known and accepted for now**

- **No hub backups.** Every device holds all notes, so a lost hub can be refilled,
  but nothing copies the hub's database.
- **No encryption at rest.** The VPS database is a plain file (owner's choice,
  2026-10-05), and the desktop's disk is not encrypted either (checked
  2026-10-07). Data in transit is encrypted (WireGuard + HTTPS).
- **Sync keeps no copy of overwritten content** — a genuine concurrent edit on
  two devices loses the older text (ADR-0008).

**Next, roughly in order**

1. Hub backups: nightly SQLite backup copied off the VPS ([sync-hub.md — Backups](guides/sync-hub.md#backups)).
2. Encryption at rest: full-disk encryption on the desktop; for the hub, a
   passphrase LUKS volume or moving it to the NAS later
   ([ADR-0002](decisions/adr/ADR-0002-vps-hub-first-defer-home-infrastructure.md)).
3. Keep overwritten content recoverable during sync before relying on
   multi-device editing (ADR-0008).
4. Phase 2: Android client (Tauri v2). The hub already serves trusted HTTPS,
   which Android requires.
5. Editor features, in the order proposed in
   [RFC-0004](decisions/rfc/RFC-0004-onenote-style-editor.md); open proposals in
   RFC-0002 (math) and RFC-0003 (note types).

**To check later** (owner runs anything on the VPS; the TLS check is read-only
and any agent can run it from the desktop)

- The hub restarting by itself after a VPS reboot (expected, never tested).
- TLS renewal: the hub's certificate expires 2027-01-03 and `tailscale serve`
  should renew it automatically. In December, confirm `notBefore` has moved past
  2026-10-05:
  `echo | openssl s_client -connect hub.tailcb3cd9.ts.net:8787 2>/dev/null | openssl x509 -noout -dates`

**Smaller known issues** are listed under "Known issues" in the guides — for
example several `config.toml` keys that are accepted but ignored — and as "Bad"
consequences in the ADRs. Two CLIs overlap in function (see `AGENTS.md`).

## [Decision records](decisions/README.md)

Why IrisNotes is built the way it is: **ADRs** for decisions made, **RFCs** for
questions still open. Dated and append-only — an old record is history, not an
error. See the [index](decisions/README.md) for the full list.

## Guides

How to use and extend parts of the app. Each guide is checked against the source
and dated; if code and guide disagree, the code wins and the guide needs fixing.

- [building.md](guides/building.md) — prerequisites, dev workflow, local releases
- [configuration.md](guides/configuration.md) — config files, themes, autocorrect,
  ASCII art, what lives in the database
- [hotkeys.md](guides/hotkeys.md) — app hotkeys and editor keybindings, and how
  to override them
- [editor.md](guides/editor.md) — editor appearance settings and the custom
  cursor
- [icons.md](guides/icons.md) — app, launcher and tray icons on Linux
- [sync-hub.md](guides/sync-hub.md) — deploying, updating and operating the sync
  hub (`iris-server`)

## Elsewhere

- [`apps/server/README.md`](../apps/server/README.md) — sync server, contract
- [`schema/base.sql`](../schema/base.sql) — the database schema (source of truth)
