//! IrisNotes sync hub.
//!
//! A small axum server that owns the canonical `items` database and exposes the
//! sync contract used by every local-first client (desktop, future Android app,
//! and a future browser surface).
//!
//! Config via environment:
//!   IRIS_DB_PATH  path to the server database file   (default ./iris-server.db)
//!   IRIS_TOKEN    bearer token clients must present   (default "dev-token" + warn)
//!   IRIS_BIND     address to listen on                (default 127.0.0.1:8787)
//!
//! Routes:
//!   GET  /health        liveness, no auth
//!   GET  /version       schema/sync contract versions, no auth (handshake)
//!   POST /sync/pull     download changes since a cursor   (auth)
//!   POST /sync/push     upload a batch, last-writer-wins   (auth)

mod db;
mod sync;

use std::path::PathBuf;
use std::sync::{Arc, Mutex};

use axum::{
    extract::{Request, State},
    http::{header::AUTHORIZATION, StatusCode},
    middleware::{from_fn, from_fn_with_state, Next},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use rusqlite::Connection;
use serde_json::json;
use tower_http::cors::CorsLayer;

/// Bumped when the schema or sync protocol changes in a way clients must match.
const SCHEMA_VERSION: u32 = 1;
const SYNC_VERSION: u32 = 1;

#[derive(Clone)]
pub struct AppState {
    pub db: Arc<Mutex<Connection>>,
    pub token: Arc<String>,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "iris_server=info".into()),
        )
        .init();

    let db_path =
        PathBuf::from(std::env::var("IRIS_DB_PATH").unwrap_or_else(|_| "iris-server.db".into()));
    let token = std::env::var("IRIS_TOKEN").unwrap_or_else(|_| {
        tracing::warn!("IRIS_TOKEN not set — using insecure default 'dev-token' (dev only!)");
        "dev-token".into()
    });
    let bind = std::env::var("IRIS_BIND").unwrap_or_else(|_| "127.0.0.1:8787".into());

    let conn = db::open(&db_path).expect("failed to open/init server database");
    tracing::info!("database ready at {}", db_path.display());

    let state = AppState {
        db: Arc::new(Mutex::new(conn)),
        token: Arc::new(token),
    };

    // Auth applies only to /sync/*; health and version stay open for handshakes.
    let synced = Router::new()
        .route("/sync/pull", post(sync::pull))
        .route("/sync/push", post(sync::push))
        .route_layer(from_fn_with_state(state.clone(), auth));

    let app = Router::new()
        .route("/health", get(health))
        .route("/version", get(version))
        .merge(synced)
        // Permissive CORS for local dev so the Tauri webview (origin
        // http://localhost:1420 or tauri://localhost) can call the API.
        // Tighten this behind Caddy before exposing to the internet.
        .layer(CorsLayer::permissive())
        .layer(from_fn(log_requests))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(&bind)
        .await
        .expect("failed to bind");
    tracing::info!("iris-server listening on http://{bind}");
    axum::serve(listener, app).await.expect("server error");
}

/// Dev-only request log so we can see exactly what clients call.
async fn log_requests(req: Request, next: Next) -> Response {
    let method = req.method().clone();
    let uri = req.uri().clone();
    let has_auth = req.headers().contains_key(AUTHORIZATION);
    let res = next.run(req).await;
    tracing::info!("{method} {uri} (auth={has_auth}) -> {}", res.status());
    res
}

async fn health() -> Json<serde_json::Value> {
    Json(json!({ "status": "ok" }))
}

async fn version() -> Json<serde_json::Value> {
    Json(json!({
        "schemaVersion": SCHEMA_VERSION,
        "syncVersion": SYNC_VERSION,
    }))
}

/// Bearer-token gate. NOTE: plain `==` compare for Phase 1; switch to a
/// constant-time compare before this faces the public internet.
async fn auth(State(state): State<AppState>, req: Request, next: Next) -> Response {
    let provided = req
        .headers()
        .get(AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "));

    match provided {
        Some(t) if t == state.token.as_str() => next.run(req).await,
        _ => (StatusCode::UNAUTHORIZED, "unauthorized").into_response(),
    }
}
