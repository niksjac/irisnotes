//! Database setup for the sync hub.
//!
//! The server owns the canonical `items` database. The schema is single-sourced
//! from `schema/base.sql` — the exact same file the desktop app embeds — so the
//! server and every client can never drift on table structure.

use rusqlite::Connection;
use std::path::Path;

/// The schema, embedded at compile time from the repo's single source of truth.
/// Path is relative to this file: apps/server/src -> repo root -> schema/base.sql.
const SCHEMA: &str = include_str!("../../../schema/base.sql");

/// Open (creating if needed) the server database and apply the schema.
pub fn open(path: &Path) -> rusqlite::Result<Connection> {
    let conn = Connection::open(path)?;
    init(&conn)?;
    Ok(conn)
}

/// Apply the shared schema, then make the server-specific adjustments sync needs.
fn init(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute_batch(SCHEMA)?;

    // The shared schema auto-rewrites `updated_at = now` on every UPDATE. On the
    // server that would clobber the originating device's timestamp the moment we
    // apply a remote write, breaking last-writer-wins. The server never originates
    // edits — it only stores what clients send — so we drop that trigger here and
    // always persist the incoming `updated_at` verbatim.
    conn.execute_batch("DROP TRIGGER IF EXISTS update_items_timestamp;")?;

    Ok(())
}
