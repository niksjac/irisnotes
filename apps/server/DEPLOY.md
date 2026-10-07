# Deploying iris-server

iris-server is **hub-agnostic**: one small Docker image (~13 MB), configured
entirely by environment variables, with the only state in a `/data` volume (the
SQLite DB). The same image runs on a VPS, TrueNAS SCALE, or any Docker host, and
you can move between them later without touching code.

The app side is equally flexible: a hub is just the **Server URL** and **Token**
in the app's Sync view. Sync cursors are stored per URL, so pointing the app at a
different hub re-syncs cleanly against it.

Why it is set up this way: [ADR-0001](../../docs/decisions/adr/ADR-0001-sync-overlay-network.md)
(private overlay only), [ADR-0002](../../docs/decisions/adr/ADR-0002-vps-hub-first-defer-home-infrastructure.md)
(VPS hub first), [ADR-0010](../../docs/decisions/adr/ADR-0010-tailscale-serve-for-first-deployment.md)
(Tailscale and `tailscale serve`).

**The one rule:** iris-server never listens on a public address. It publishes
only on `127.0.0.1`, and the overlay makes it reachable to your own devices.

## Recommended: a VPS on Tailscale, published with `tailscale serve`

This is the setup running in production, verified 2026-10-05 – 2026-10-07 on an
Ubuntu 22.04 VPS that also hosts another service. Run everything on the VPS as
root unless noted. Secrets (the sync token) are created on the VPS and never
printed.

### 0. Check the box first (read-only)

```sh
lsb_release -ds; free -h | head -2; df -h /
sudo ss -tlnup                    # port 8787 must be free
docker --version; docker compose version   # Compose 2.24+ needed for !override
docker ps --format 'table {{.Names}}\t{{.Ports}}'
tailscale status | head -3        # the VPS must be on your tailnet
tailscale serve status            # anything already published
```

### 1. Code, data directory, token

```sh
git clone https://github.com/niksjac/irisnotes.git /opt/irisnotes
cd /opt/irisnotes/apps/server
mkdir -p /srv/iris
(umask 077; printf 'IRIS_TOKEN=%s\n' "$(openssl rand -hex 32)" > .env)
```

`.env` is gitignored and readable by root only.

### 2. Override: loopback only, data in `/srv/iris`

The repo's `docker-compose.yml` publishes on `127.0.0.1` and uses a named
volume. A local override file (untracked; `git pull` still works) pins the
loopback binding explicitly and puts the data in `/srv/iris`.
Written with `printf` rather than a heredoc, which pastes unreliably:

```sh
printf '%s\n' \
  'services:' \
  '  iris-server:' \
  '    ports: !override' \
  '      - "127.0.0.1:8787:8787"' \
  '    volumes: !override' \
  '      - /srv/iris:/data' \
  > docker-compose.override.yml
```

**Check before building.** `--no-interpolate` keeps the token out of the output:

```sh
docker compose config --no-interpolate | grep -E -A6 '^    (ports|volumes):'
```

Expect `host_ip: 127.0.0.1` under ports and `source: /srv/iris` under volumes. If
you see `${IRIS_PORT:-8787}` or `iris-data`, the override was not loaded — stop.

### 3. Build and start

```sh
docker compose up -d --build      # the Rust build takes a few minutes
docker ps --filter name=iris-server --format '{{.Names}}  {{.Status}}  {{.Ports}}'
curl -s http://127.0.0.1:8787/health; echo      # {"status":"ok"}
```

### 4. Publish to the tailnet with HTTPS

```sh
tailscale serve --bg --https=8787 http://127.0.0.1:8787
tailscale serve status
```

The hub is now `https://<machine>.<tailnet>.ts.net:8787`, reachable only from
your tailnet, with a Let's Encrypt certificate managed by Tailscale. Other
`serve` entries (e.g. on `:443`) are unaffected.

- The **first** HTTPS request to a new name waits while Tailscale fetches the
  certificate — allow up to a minute.
- `tailscale serve reset`, or renaming the machine, drops entries: re-run each
  `tailscale serve --bg …` command afterwards and check `serve status`.
- Machine names appear in public Certificate Transparency logs. They are not
  reachable from outside, but they are not secret either.

### 5. Verify — from your desktop

```sh
H=https://<machine>.<tailnet>.ts.net
curl -s $H:8787/health                                   # {"status":"ok"}
curl -s -o /dev/null -w '%{http_code}\n' -X POST -d '{}' \
  -H 'content-type: application/json' $H:8787/sync/pull  # 401 (no token)
curl -m 8 http://<public-ip>:8787/health                 # must FAIL to connect
```

### 6. Connect the app — on your desktop

1. Back up your notes once:
   `sqlite3 ~/.config/irisnotes/notes.db ".backup '$HOME/irisnotes-pre-sync-$(date +%F).db'"`
2. Copy the token to the clipboard without displaying it:
   `ssh root@<machine> 'cut -d= -f2- /opt/irisnotes/apps/server/.env' | wl-copy`
3. In the **Sync view**: Server URL `https://<machine>.<tailnet>.ts.net:8787`,
   paste the token, enable, **Save**, **Sync now**. Then `wl-copy --clear`.

The first cycle against an empty hub pushes all your notes. If it fails, the
Sync view says which step failed and why (unreachable server, rejected token, or
an HTTP status).

### 7. Updating the server

```sh
cd /opt/irisnotes && git pull
cd apps/server && docker compose up -d --build
```

The override file and `.env` survive the pull.

## Backups

**Not set up yet.** Every client holds the full set of notes, so a lost hub can
be refilled from any device — but that is recovery, not backup. The database is
one SQLite file; take consistent copies with SQLite's own backup command (needs
`apt install sqlite3` on the VPS), for example nightly from cron:

```sh
sqlite3 /srv/iris/iris-server.db ".backup '/srv/iris-backup/iris-$(date +%F).db'"
```

…and copy the results off the VPS.

## Encryption at rest

**Not set up on the production hub** (owner's choice, 2026-10-05): the database
in `/srv/iris` is a plain file on the VPS disk. Data in transit is encrypted
(WireGuard + HTTPS). What disk encryption on a VPS can and cannot do:

- It protects against leaked disk images, snapshots and decommissioned drives.
- It does **not** protect against the provider while the VM runs — the
  hypervisor can read memory, including the unlock key. Only end-to-end
  encryption of note content in the app would (deferred, ADR-0008).

Options when this is taken up: a LUKS volume at `/srv/iris` unlocked by
passphrase after each reboot (guard against the container starting on the
empty, unencrypted mount point before it is unlocked), or moving the hub to the
NAS with ZFS encryption (below).

## Later: other hubs and transports

### TrueNAS SCALE as a standby or replacement hub

1. **Create a dataset**, e.g. `tank/apps/iris`, with **ZFS encryption** (your
   keys); it gets **ZFS snapshots** for free — a better backup story than the
   VPS.
2. **Deploy the container** (*Apps → Discover → Install via YAML* / custom app):
   env `IRIS_TOKEN=<token>`, the dataset mounted at `/data`
   (`/mnt/tank/apps/iris:/data`), port `8787` published on loopback or the
   overlay address only.
3. Put it on the overlay and confirm `/health` from a client.
4. Switch the Server URL in the Sync view (see below).

The app talks to **one hub at a time**: a second hub is a standby you can switch
to, not one kept in step automatically.

### NetBird instead of Tailscale

Deferred (ADR-0010). Don't run it alongside Tailscale on one host: both use
`100.64.0.0/10`, and Tailscale drops that range on other interfaces. NetBird
gives no HTTPS certificates for peer names; use plain HTTP over the tunnel
(desktop only — Android refuses plain HTTP) or your own domain with a DNS-01
certificate (e.g. Caddy with your DNS provider's plugin). An owned domain also
gives a URL that survives changing overlay or host.

### OPNsense WireGuard as a second path

A plain WireGuard tunnel on the home router, into the home LAN and a NAS hub.
Needs a public WAN address and a forwarded UDP port (dynamic DNS if the address
changes). Only useful once there is a hub at home.

## Switching / migrating hubs

- **Point the app at the new hub** (URL + token). Cursors are per URL, so the
  first cycle pushes all local notes to an empty hub — your device is the source
  of truth.
- If the new hub already holds data, last-writer-wins reconciles the two.
- To clone a hub exactly, copy its `iris-server.db` to the new host instead.

## Exposing publicly

Only if a client cannot join the overlay (e.g. a browser on a borrowed device):

- Put **Caddy** (or another reverse proxy) in front for **TLS** — never send the
  token over plain HTTP on the public internet.
- Switch the token check to a constant-time compare first (it is a plain `==`;
  see `auth` in `src/main.rs`).
- Firewall so only the proxy port is open. Remember that Docker publishes ports
  past `ufw`: a plain `-p 8787:8787` is public even with a firewall rule.

## Operating notes

- **Logs:** each request is logged as `method uri (auth=…) -> status`:
  `docker logs iris-server --tail 20`.
- **Health:** the image's `HEALTHCHECK` hits `/health`; `docker ps` shows
  `healthy`.
- **Restarts:** the container has `restart: unless-stopped`, and `tailscale serve`
  entries persist, so both should come back after a reboot (expected, not yet
  tested by rebooting). Binding to `127.0.0.1` avoids any dependency on the
  overlay interface being up first.
- **Quick local run:** `docker compose up -d --build` without the override
  serves on `127.0.0.1:8787` with data in a named volume — reachable only from
  the same machine.
