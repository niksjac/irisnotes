//! The sync contract: pull (download changes since a cursor) and push (upload a
//! batch with last-writer-wins). Phase 1 syncs the `items` table only — notes,
//! books and sections, including soft-deleted rows so deletions propagate.
//!
//! The cursor is simply the high-water `updated_at`. Because this is a
//! single-user, never-edit-two-devices-at-once setup, conflict resolution is
//! last-writer-wins per row keyed on `updated_at`. Rows are content-opaque: the
//! server never parses `content` or `metadata`, so new editor/UI features in the
//! app need no server changes.

use axum::{extract::State, Json};
use rusqlite::{params, Connection, Row};
use serde::{Deserialize, Serialize};

use crate::AppState;

/// One `items` row on the wire. camelCase to match the TypeScript client.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Item {
    pub id: String,
    #[serde(rename = "type")]
    pub item_type: String,
    pub title: String,
    pub content: String,
    pub content_type: String,
    pub content_raw: Option<String>,
    pub content_plaintext: String,
    pub parent_id: Option<String>,
    pub sort_order: String,
    /// Opaque JSON string — never parsed server-side.
    pub metadata: String,
    pub created_at: String,
    pub updated_at: String,
    /// Tombstone: non-null means the row is soft-deleted.
    pub deleted_at: Option<String>,
    pub word_count: i64,
    pub character_count: i64,
    pub view_count: i64,
    pub last_viewed_at: Option<String>,
}

fn row_to_item(row: &Row) -> rusqlite::Result<Item> {
    Ok(Item {
        id: row.get("id")?,
        item_type: row.get("type")?,
        title: row.get("title")?,
        content: row.get("content")?,
        content_type: row.get("content_type")?,
        content_raw: row.get("content_raw")?,
        content_plaintext: row.get("content_plaintext")?,
        parent_id: row.get("parent_id")?,
        sort_order: row.get("sort_order")?,
        metadata: row.get("metadata")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
        deleted_at: row.get("deleted_at")?,
        word_count: row.get("word_count")?,
        character_count: row.get("character_count")?,
        view_count: row.get("view_count")?,
        last_viewed_at: row.get("last_viewed_at")?,
    })
}

/// Current high-water mark across all rows (the cursor a client can advance to).
fn high_water(conn: &Connection) -> rusqlite::Result<String> {
    conn.query_row("SELECT COALESCE(MAX(updated_at), '') FROM items", [], |r| {
        r.get(0)
    })
}

const SELECT_COLS: &str = "id, type, title, content, content_type, content_raw, \
    content_plaintext, parent_id, sort_order, metadata, created_at, updated_at, \
    deleted_at, word_count, character_count, view_count, last_viewed_at";

// ---- pull -------------------------------------------------------------------

#[derive(Debug, Deserialize)]
pub struct PullReq {
    /// Cursor from the client's last successful sync. Empty/absent = full pull.
    #[serde(default)]
    pub since: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PullResp {
    pub items: Vec<Item>,
    pub cursor: String,
}

pub async fn pull(
    State(state): State<AppState>,
    Json(req): Json<PullReq>,
) -> Result<Json<PullResp>, ApiError> {
    let conn = state.db.lock().expect("db mutex poisoned");
    let since = req.since.unwrap_or_default();

    let sql = format!(
        "SELECT {SELECT_COLS} FROM items WHERE updated_at > ?1 ORDER BY updated_at ASC"
    );
    let mut stmt = conn.prepare(&sql)?;
    let items = stmt
        .query_map(params![since], row_to_item)?
        .collect::<rusqlite::Result<Vec<_>>>()?;

    let cursor = high_water(&conn)?;
    Ok(Json(PullResp { items, cursor }))
}

// ---- push -------------------------------------------------------------------

#[derive(Debug, Deserialize)]
pub struct PushReq {
    pub items: Vec<Item>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PushResp {
    /// How many rows the server actually wrote (won by last-writer-wins).
    pub applied: usize,
    pub cursor: String,
}

/// Upsert with last-writer-wins: overwrite only when the incoming row is strictly
/// newer than what we hold. Ties keep the existing row (deterministic).
const UPSERT: &str = "INSERT INTO items (\
    id, type, title, content, content_type, content_raw, content_plaintext, \
    parent_id, sort_order, metadata, created_at, updated_at, deleted_at, \
    word_count, character_count, view_count, last_viewed_at) \
    VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17) \
    ON CONFLICT(id) DO UPDATE SET \
    type=excluded.type, title=excluded.title, content=excluded.content, \
    content_type=excluded.content_type, content_raw=excluded.content_raw, \
    content_plaintext=excluded.content_plaintext, parent_id=excluded.parent_id, \
    sort_order=excluded.sort_order, metadata=excluded.metadata, \
    created_at=excluded.created_at, updated_at=excluded.updated_at, \
    deleted_at=excluded.deleted_at, word_count=excluded.word_count, \
    character_count=excluded.character_count, view_count=excluded.view_count, \
    last_viewed_at=excluded.last_viewed_at \
    WHERE excluded.updated_at > items.updated_at";

pub async fn push(
    State(state): State<AppState>,
    Json(req): Json<PushReq>,
) -> Result<Json<PushResp>, ApiError> {
    let mut conn = state.db.lock().expect("db mutex poisoned");
    let tx = conn.transaction()?;
    let mut applied = 0usize;
    {
        let mut stmt = tx.prepare(UPSERT)?;
        for it in &req.items {
            applied += stmt.execute(params![
                it.id,
                it.item_type,
                it.title,
                it.content,
                it.content_type,
                it.content_raw,
                it.content_plaintext,
                it.parent_id,
                it.sort_order,
                it.metadata,
                it.created_at,
                it.updated_at,
                it.deleted_at,
                it.word_count,
                it.character_count,
                it.view_count,
                it.last_viewed_at,
            ])?;
        }
    }
    let cursor = high_water(&tx)?;
    tx.commit()?;
    Ok(Json(PushResp { applied, cursor }))
}

// ---- error plumbing ---------------------------------------------------------

/// Maps any rusqlite failure to a 500 with a readable message.
pub struct ApiError(rusqlite::Error);

impl From<rusqlite::Error> for ApiError {
    fn from(e: rusqlite::Error) -> Self {
        ApiError(e)
    }
}

impl axum::response::IntoResponse for ApiError {
    fn into_response(self) -> axum::response::Response {
        tracing::error!("db error: {}", self.0);
        (
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            format!("database error: {}", self.0),
        )
            .into_response()
    }
}
