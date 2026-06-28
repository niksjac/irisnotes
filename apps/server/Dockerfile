# syntax=docker/dockerfile:1
#
# iris-server — portable sync hub image.
#
# Build context MUST be the repo root, because the server embeds the shared
# schema via include_str!("../../../schema/base.sql"):
#
#   docker build -f apps/server/Dockerfile -t iris-server .
#
# or just use apps/server/docker-compose.yml, which sets the context for you.

FROM rust:1-alpine AS build
# build-base gives gcc + musl-dev, needed to compile rusqlite's bundled SQLite.
RUN apk add --no-cache build-base
WORKDIR /build
COPY apps/server/Cargo.toml apps/server/Cargo.lock ./apps/server/
COPY apps/server/src ./apps/server/src
COPY schema ./schema
WORKDIR /build/apps/server
# rust:alpine targets x86_64-unknown-linux-musl → a fully static binary.
RUN cargo build --release && strip target/release/iris-server

FROM alpine:3
LABEL org.opencontainers.image.title="iris-server" \
      org.opencontainers.image.description="IrisNotes local-first sync hub"
COPY --from=build /build/apps/server/target/release/iris-server /usr/local/bin/iris-server

# Hub-agnostic: everything is configured via env. The DB lives in /data so it
# can be a named volume (any Docker host) or a bind-mounted ZFS dataset (NAS).
ENV IRIS_DB_PATH=/data/iris-server.db \
    IRIS_BIND=0.0.0.0:8787
VOLUME /data
EXPOSE 8787

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD wget -qO- http://127.0.0.1:8787/health || exit 1

ENTRYPOINT ["/usr/local/bin/iris-server"]
