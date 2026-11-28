//! Quick capture: insert a root note without the main app.
//!
//! Mirrors `SQLiteStorageAdapter.createItem` in apps/main: the same id format,
//! a sort_order after the last root note (fractional indexing, ADR-0004) and
//! ISO timestamps in the same format as JS `toISOString()`, so sync pushes the
//! note like any other. The FTS index is kept current by the items triggers.

use rusqlite::{params, Connection, OptionalExtension};
use std::hash::{BuildHasher, Hasher};

const DIGITS: &[u8] = b"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/// Length of a key's integer part, from its head character
fn integer_length(head: u8) -> Option<usize> {
    match head {
        b'a'..=b'z' => Some((head - b'a') as usize + 2),
        b'A'..=b'Z' => Some((b'Z' - head) as usize + 2),
        _ => None,
    }
}

fn digit_index(c: u8) -> Option<usize> {
    DIGITS.iter().position(|&d| d == c)
}

/// `incrementInteger` from the fractional-indexing package; None past the largest integer
fn increment_integer(int: &[u8]) -> Option<Vec<u8>> {
    let head = int[0];
    let mut digs: Vec<u8> = int[1..].to_vec();
    let mut carry = true;
    for d in digs.iter_mut().rev() {
        if !carry {
            break;
        }
        let next = digit_index(*d)? + 1;
        if next == DIGITS.len() {
            *d = DIGITS[0];
        } else {
            *d = DIGITS[next];
            carry = false;
        }
    }
    if !carry {
        let mut out = vec![head];
        out.extend(digs);
        return Some(out);
    }
    match head {
        b'Z' => Some(vec![b'a', DIGITS[0]]),
        b'z' => None,
        _ => {
            let h = head + 1;
            if h > b'a' {
                digs.push(DIGITS[0]);
            } else {
                digs.pop();
            }
            let mut out = vec![h];
            out.extend(digs);
            Some(out)
        }
    }
}

/// `midpoint(a, null)` from the fractional-indexing package
fn midpoint_after(a: &[u8]) -> Vec<u8> {
    let digit_a = a.first().and_then(|&c| digit_index(c)).unwrap_or(0);
    let digit_b = DIGITS.len();
    if digit_b - digit_a > 1 {
        // JS Math.round(0.5 * (a + b)) rounds .5 up
        vec![DIGITS[(digit_a + digit_b + 1) / 2]]
    } else {
        let mut out = vec![DIGITS[digit_a]];
        out.extend(midpoint_after(&a[1.min(a.len())..]));
        out
    }
}

/// `generateKeyBetween(last, null)`: a key after `last` (or the first key).
/// An invalid `last` falls back to the first key, as the main app does.
pub fn key_after(last: Option<&str>) -> String {
    let Some(last) = last else { return "a0".into() };
    let bytes = last.as_bytes();
    let valid = !bytes.is_empty()
        && integer_length(bytes[0]).is_some_and(|n| n <= bytes.len())
        && bytes.iter().all(|&c| digit_index(c).is_some())
        && last != format!("A{}", "0".repeat(26))
        && !(bytes.len() > integer_length(bytes[0]).unwrap_or(0) && bytes[bytes.len() - 1] == DIGITS[0]);
    if !valid {
        return "a0".into();
    }
    let n = integer_length(bytes[0]).unwrap_or(2);
    let (int, frac) = bytes.split_at(n);
    let key = match increment_integer(int) {
        Some(next) => next,
        None => {
            let mut out = int.to_vec();
            out.extend(midpoint_after(frac));
            out
        }
    };
    String::from_utf8(key).unwrap_or_else(|_| "a0".into())
}

/// `note_<ms>_<9 base-36 chars>`, like the main app's ids
fn new_note_id() -> String {
    let ms = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0);
    let mut random = std::collections::hash_map::RandomState::new().build_hasher();
    random.write_u128(ms);
    let mut n = random.finish();
    let mut suffix = String::new();
    for _ in 0..9 {
        suffix.push(char::from(b"0123456789abcdefghijklmnopqrstuvwxyz"[(n % 36) as usize]));
        n /= 36;
    }
    format!("note_{}_{}", ms, suffix)
}

fn escape_html(text: &str) -> String {
    text.replace('&', "&amp;").replace('<', "&lt;").replace('>', "&gt;").replace('"', "&quot;")
}

/// One paragraph per line: the editor is line-oriented (ADR-0005)
fn body_to_html(body: &str) -> String {
    let body = body.trim_end();
    if body.is_empty() {
        return String::new();
    }
    body.lines()
        .map(|line| format!("<p>{}</p>", escape_html(line)))
        .collect()
}

pub fn insert_root_note(conn: &Connection, title: &str, body: &str) -> rusqlite::Result<String> {
    let title = match title.trim() {
        "" => "Untitled Note",
        t => t,
    };
    let content = body_to_html(body);
    let plaintext = body.trim_end().to_string();
    let word_count = plaintext.split_whitespace().count() as i64;

    let last: Option<String> = conn
        .query_row(
            "SELECT sort_order FROM items WHERE parent_id IS NULL AND deleted_at IS NULL
             ORDER BY sort_order DESC LIMIT 1",
            [],
            |row| row.get(0),
        )
        .optional()?;
    let sort_order = key_after(last.as_deref());
    let id = new_note_id();

    conn.execute(
        "INSERT INTO items (
            id, type, title, content, content_type, content_plaintext, parent_id,
            sort_order, metadata, created_at, updated_at, word_count, character_count
        ) VALUES (
            ?1, 'note', ?2, ?3, 'html', ?4, NULL, ?5, '{}',
            strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), ?6, ?7
        )",
        params![id, title, content, plaintext, sort_order, word_count, content.chars().count() as i64],
    )?;
    Ok(id)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Vectors from the JS package: generateKeyBetween(a, null) in fractional-indexing 3.2.0
    #[test]
    fn matches_fractional_indexing_package() {
        let cases = [
            (None, "a0"),
            (Some("a0"), "a1"),
            (Some("a9"), "aA"),
            (Some("az"), "b00"),
            (Some("a1V"), "a2"),
            (Some("b0z"), "b10"),
            (Some("bzz"), "c000"),
            (Some("Zz"), "a0"),
            (Some("Y0z"), "Y10"),
            (Some("zzzzzzzzzzzzzzzzzzzzzzzzzzz"), "zzzzzzzzzzzzzzzzzzzzzzzzzzzV"),
        ];
        for (last, expected) in cases {
            assert_eq!(key_after(last), expected, "after {:?}", last);
        }
    }

    #[test]
    fn invalid_keys_fall_back_to_first_key() {
        assert_eq!(key_after(Some("")), "a0");
        assert_eq!(key_after(Some("!")), "a0");
        assert_eq!(key_after(Some("a10")), "a0"); // trailing zero
    }

    fn db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(include_str!("../../../../schema/base.sql")).unwrap();
        conn
    }

    #[test]
    fn inserts_a_root_note_after_the_last_one() {
        let conn = db();
        conn.execute(
            "INSERT INTO items (id, type, title, sort_order) VALUES ('n1', 'note', 'First', 'a5')",
            [],
        )
        .unwrap();
        let id = insert_root_note(&conn, "  Idea ", "line one\nline <two>\n").unwrap();
        assert!(id.starts_with("note_"));
        let (title, content, plain, sort, words, updated): (String, String, String, String, i64, String) = conn
            .query_row(
                "SELECT title, content, content_plaintext, sort_order, word_count, updated_at FROM items WHERE id = ?1",
                [&id],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?, r.get(4)?, r.get(5)?)),
            )
            .unwrap();
        assert_eq!(title, "Idea");
        assert_eq!(content, "<p>line one</p><p>line &lt;two&gt;</p>");
        assert_eq!(plain, "line one\nline <two>");
        assert_eq!(sort, "a6");
        assert_eq!(words, 4);
        // Same shape as JS toISOString(): 2026-11-27T10:00:00.123Z
        assert_eq!(updated.len(), 24);
        assert!(updated.ends_with('Z') && updated.contains('T'));
    }

    #[test]
    fn empty_title_and_body() {
        let conn = db();
        let id = insert_root_note(&conn, " ", "").unwrap();
        let (title, content): (String, String) = conn
            .query_row("SELECT title, content FROM items WHERE id = ?1", [&id], |r| Ok((r.get(0)?, r.get(1)?)))
            .unwrap();
        assert_eq!(title, "Untitled Note");
        assert_eq!(content, "");
    }
}
