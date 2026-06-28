# Deploying iris-server

iris-server is **hub-agnostic**: one small Docker image (~13 MB), configured
entirely by environment variables, with the only state in a `/data` volume (the
SQLite DB). The same artifact runs on **TrueNAS SCALE**, a **Contabo VPS**, or
any Docker host — and you can move between them later without touching code.

The desktop/app side is already flexible: set the **Server URL** and **Token**
in the app's Sync view. Sync cursors are stored per-URL, so pointing the app at
a different hub re-syncs cleanly against it.

## Quick start (any Docker host)

```sh
cd apps/server
cp .env.example .env          # then set IRIS_TOKEN to a strong random value
docker compose up -d --build
```

Generate a token with `openssl rand -hex 32`. The server listens on `8787`.
Verify: `curl http://HOST:8787/health` → `{"status":"ok"}`.

## TrueNAS SCALE

SCALE is Linux + Docker, so this is straightforward.

1. **Create a dataset** for the DB, e.g. `tank/apps/iris`. Enable **ZFS
   encryption** on it for encryption-at-rest (your keys), and it gets **ZFS
   snapshots** for free — an excellent backup story for a SQLite file.
2. **Deploy the container.** Use the compose file (recent SCALE supports
   *Apps → Discover → Install via YAML* / custom app), or define a Custom App:
   - Image: build & push `iris-server` to a registry, or build on the NAS.
   - Env: `IRIS_TOKEN=<your token>` (`IRIS_BIND` and `IRIS_DB_PATH` are baked in).
   - Storage: mount the dataset at `/data` (host path `/mnt/tank/apps/iris`
     → container `/data`). In `docker-compose.yml`, swap the named volume for:
     ```yaml
     volumes:
       - /mnt/tank/apps/iris:/data
     ```
   - Port: publish `8787` (or map another host port).
3. Confirm `http://<nas-lan-ip>:8787/health` works from a device on the LAN.

## Reaching it from anywhere — Tailscale (works for NAS *and* VPS)

Tailscale gives **zero public exposure** access from anywhere, and it applies to
any host — a LAN NAS or a public VPS alike. The host just becomes a node on your
tailnet; you reach iris-server at its tailnet address, not its public IP.

1. Install Tailscale on the **host** (SCALE has a Tailscale app; on a VPS just
   `tailscale up`), the **phone**, and the **desktop** — all one tailnet.
2. In the app's **Sync view**, set **Server URL** to the host over the tailnet:
   - MagicDNS: `http://<host-name>.<your-tailnet>.ts.net:8787`
   - or the tailnet IP: `http://100.x.y.z:8787`
3. Set the **Token** to match `IRIS_TOKEN`. The phone syncs from anywhere,
   through CGNAT, with nothing facing the public internet and traffic encrypted
   by Tailscale. No port-forwarding, dynamic DNS, or certificates.

### On a public VPS (e.g. Contabo): don't leak the port

A VPS has a public IP, but iris-server need not be on it — keep it tailnet-only.
Caveat: **Docker publishes ports on `0.0.0.0` and bypasses `ufw`**, so a plain
`-p 8787:8787` would expose it publicly even with a firewall rule. Bind the
published port to the tailnet instead:

- Bind to the tailnet IP — in `docker-compose.yml`:
  ```yaml
  ports:
    - "100.x.y.z:8787:8787"   # the VPS's Tailscale IP; not the public one
  ```
- Or bind to localhost and front it with Tailscale (adds in-tailnet HTTPS):
  ```yaml
  ports:
    - "127.0.0.1:8787:8787"
  ```
  then on the host: `tailscale serve --bg http://127.0.0.1:8787`
  → reachable at `https://<node>.<tailnet>.ts.net` inside your tailnet.

This way the VPS gives you always-on uptime while access stays private. (Still
encrypt the VPS disk/volume — the data sits on Contabo's hardware at rest.)

If you instead want it reachable by **non-Tailscale** clients (a browser on a
borrowed device), use **Tailscale Funnel** (public `https://…ts.net` URL, TLS by
Tailscale, no open ports) or the public reverse-proxy route below.

## Switching / migrating hubs

You can change hubs anytime from the Sync view (e.g. NAS → Contabo, or back):

- **Just point the app at the new hub** (URL + token). Because cursors are
  per-URL, the first cycle pushes all your local notes to the new (empty) hub —
  your device is the source of truth, so nothing is lost.
- If the new hub already holds data, last-writer-wins reconciles the two.
- To clone a hub exactly, copy its `iris-server.db` (the `/data` volume) to the
  new host instead.

## Exposing publicly instead of Tailscale

Only needed if clients can't use Tailscale (e.g. a browser on a borrowed
device). If you expose the server to the public internet:

- Put **Caddy** (or another reverse proxy) in front for **TLS** — never serve
  the token over plain HTTP. Caddy gets Let's Encrypt certs automatically.
- Keep the bearer token strong and secret. (Note: the token check is currently a
  plain compare — switch it to a constant-time compare before public exposure;
  see `auth` in `src/main.rs`.)
- Consider firewalling so only the proxy port is open.

## Operating notes

- **Backups:** ZFS snapshots of the dataset (NAS), or periodically copy
  `iris-server.db`. It's a single SQLite file.
- **Logs:** the server logs each request (`method uri (auth=…) -> status`) —
  handy for confirming a client is reaching it. `docker logs iris-server`.
- **Health:** the image has a `HEALTHCHECK` hitting `/health`; `docker ps` shows
  `healthy` once it's up.
