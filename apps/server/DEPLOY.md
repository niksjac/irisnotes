# Deploying iris-server

iris-server is **hub-agnostic**: one small Docker image (~13 MB), configured
entirely by environment variables, with the only state in a `/data` volume (the
SQLite DB). The same artifact runs on a **Contabo VPS**, **TrueNAS SCALE**, or
any Docker host — and you can move between them later without touching code.

The app side is equally flexible: a hub is just the **Server URL** and **Token**
in the app's Sync view. Sync cursors are stored per-URL, so pointing the app at
a different hub re-syncs cleanly against it.

The reasoning behind the setup below is recorded in
[`docs/decisions/`](../../docs/decisions/README.md):
[ADR-0001](../../docs/decisions/adr/ADR-0001-sync-overlay-network.md) (private
overlay, NetBird) and
[ADR-0002](../../docs/decisions/adr/ADR-0002-vps-hub-first-defer-home-infrastructure.md)
(VPS hub first; NAS and OPNsense WireGuard later).

**The one rule:** iris-server is never reachable from the public internet. It
listens only on a private overlay address, and clients reach it through the
overlay.

## Recommended: Contabo VPS over NetBird

NetBird is a WireGuard mesh. Every device (VPS, desktop, later the phone) joins
one private network and gets a stable address in `100.64.0.0/10`. The VPS needs
no inbound ports opened for this.

### 1. Join the VPS to NetBird

Create an account at netbird.io (managed free tier), then in the dashboard
create a **setup key** for the server. On the VPS:

```sh
curl -fsSL https://pkgs.netbird.io/install.sh | sh
netbird up --setup-key <SETUP_KEY>
netbird status
ip addr show wt0          # the VPS's NetBird address, e.g. 100.77.12.34
```

Note that address — it is the hub's address from now on.

### 2. Start iris-server bound to the NetBird address

**Docker publishes ports on `0.0.0.0` and bypasses `ufw`.** The default
`ports:` line in `docker-compose.yml` would put the server on the VPS's public
IP even with a firewall rule in place. Bind the published port to the NetBird
address instead:

```yaml
    ports:
      - "100.77.12.34:8787:8787"   # the VPS's NetBird address, never the public one
```

Keep the DB somewhere you can back up and encrypt (see below) by swapping the
named volume for a host path:

```yaml
    volumes:
      - /srv/iris:/data
```

Then:

```sh
cd apps/server
cp .env.example .env          # set IRIS_TOKEN to: openssl rand -hex 32
docker compose up -d --build
```

Reboot caveat: Docker can only bind the NetBird address once the `wt0`
interface is up. If the container is not running after a reboot, make Docker
start after NetBird:

```sh
sudo mkdir -p /etc/systemd/system/docker.service.d
printf '[Unit]\nAfter=netbird.service\nWants=netbird.service\n' |
  sudo tee /etc/systemd/system/docker.service.d/after-netbird.conf
sudo systemctl daemon-reload
```

Check this once after the first reboot (`docker ps` should show `healthy`).

### 3. Join your devices

Install the NetBird client on the desktop (and later the phone) and sign in to
the same account.

In the NetBird dashboard, check **Access Control**: peers can only talk if a
policy allows it. A policy that lets your devices reach the VPS on TCP `8787`
is all iris-server needs, and is tighter than an allow-everything default.

### 4. Verify

From the desktop:

```sh
curl http://100.77.12.34:8787/health        # {"status":"ok"}
```

From any machine **outside** NetBird, against the VPS's **public** IP:

```sh
curl -m 5 http://<public-ip>:8787/health    # must time out or be refused
```

If the second command answers, the port is published publicly — fix the
`ports:` line before going further.

### 5. Point the app at it

In the app's **Sync view**: Server URL `http://100.77.12.34:8787`, Token equal
to `IRIS_TOKEN`, enable, **Sync now**.

Use the address rather than a NetBird DNS name: peer names
(`<host>.netbird.cloud`) resolve out of the box on Linux, but other platforms
need nameservers configured in NetBird first.

Plain `http://` is fine here — WireGuard encrypts everything between peers.

> **Verified on the Linux desktop build (2026-10-03):** the installed 1.0.18
> release build completed a full sync cycle — version check, pull, push — over
> plain HTTP to a server bound only to an overlay address (`100.x.y.z`). No
> app-side change is needed for the desktop.
>
> **Phone (future Android client):** Android apps refuse plain-HTTP requests to
> non-local addresses by default, whatever the network path. This is expected to
> need an app-side fix in Phase 2 (sync requests sent from Rust rather than the
> webview), not a server or overlay change. See ADR-0002.

### Disk encryption and backups on the VPS

The notes sit on Contabo's disks, so:

- **Encrypt `/srv/iris`** — e.g. a LUKS volume mounted there. This protects
  against disk reuse and provider-side snapshots, not against someone with
  access to the running machine.
- **Back up the DB.** It is one SQLite file. A consistent copy from the host:
  ```sh
  sqlite3 /srv/iris/iris-server.db ".backup '/srv/iris-backup/iris-$(date +%F).db'"
  ```
  Run it from cron and copy the result off the VPS. Every client also holds the
  full set of notes, so a lost hub can be refilled from any device — but that is
  a recovery path, not a backup.

## Later: adding home infrastructure

Deferred by ADR-0002. Nothing here is needed for the setup above, and none of it
needs a code change when the time comes.

### TrueNAS SCALE as a standby or replacement hub

1. **Create a dataset** for the DB, e.g. `tank/apps/iris`. Enable **ZFS
   encryption** on it (your keys), and it gets **ZFS snapshots** for free — a
   better backup story than the VPS has.
2. **Deploy the container** with the compose file (*Apps → Discover → Install
   via YAML* / custom app):
   - Env: `IRIS_TOKEN=<token>` (`IRIS_BIND` and `IRIS_DB_PATH` are baked in).
   - Storage: mount the dataset at `/data`:
     ```yaml
     volumes:
       - /mnt/tank/apps/iris:/data
     ```
   - Port: publish `8787`.
3. Join the NAS to NetBird and confirm `/health` over its NetBird address.
4. In the app's Sync view, switch the Server URL to the NAS (see "Switching
   hubs" below).

The app talks to **one hub at a time**. Running both hubs gives you a standby
you can switch to, not two hubs kept in step automatically.

### OPNsense WireGuard as a second path

A plain WireGuard tunnel terminated on the home router: a way into the home LAN
(and a NAS hub) that depends on no outside service. It needs a public address on
the router's WAN and a forwarded UDP port; use a dynamic DNS name for the
endpoint if the address is not static. Only useful once there is a hub at home —
reaching the VPS through it would route everything via the home line.

## Switching / migrating hubs

You can change hubs anytime from the Sync view (e.g. VPS → NAS, or back):

- **Just point the app at the new hub** (URL + token). Because cursors are
  per-URL, the first cycle pushes all your local notes to the new (empty) hub —
  your device is the source of truth, so nothing is lost.
- If the new hub already holds data, last-writer-wins reconciles the two.
- To clone a hub exactly, copy its `iris-server.db` (the `/data` volume) to the
  new host instead.

## Alternatives

### Tailscale instead of NetBird

Works the same way: join the host and your devices to one tailnet, bind the
published port to the host's tailnet address (`100.x.y.z:8787:8787`), and use
`http://100.x.y.z:8787` as the Server URL. Tailscale adds two conveniences
NetBird lacks — `tailscale serve --bg http://127.0.0.1:8787` for HTTPS inside
the tailnet, and Funnel for a public HTTPS URL. Not the default here because its
coordination service cannot be self-hosted (ADR-0001).

### Exposing publicly

Only if a client cannot join the overlay (e.g. a browser on a borrowed device):

- Put **Caddy** (or another reverse proxy) in front for **TLS** — never serve
  the token over plain HTTP on the public internet. Caddy gets Let's Encrypt
  certs automatically.
- Switch the token check to a constant-time compare first (it is currently a
  plain `==`; see `auth` in `src/main.rs`).
- Firewall so only the proxy port is open.

## Operating notes

- **Logs:** the server logs each request (`method uri (auth=…) -> status`) —
  handy for confirming a client is reaching it. `docker logs iris-server`.
- **Health:** the image has a `HEALTHCHECK` hitting `/health`; `docker ps` shows
  `healthy` once it's up.
- **Quick local run (no overlay):** `docker compose up -d --build` with the
  default `ports:` line serves on `8787` on every interface — fine on a trusted
  LAN or for testing, not on a host with a public IP.
