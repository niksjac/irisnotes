//! CLI module for IrisNotes
//!
//! Provides command-line access to notes:
//! - irisnotes list - List all notes
//! - irisnotes search <query> - Full-text search
//! - irisnotes open <title> - Open note by title
//! - irisnotes id <id> - Open note by ID
//! - irisnotes tree - Show hierarchical tree view
//! - irisnotes show <title> - Show note content

use clap::{Parser, Subcommand};
use colored::Colorize;
use rusqlite::{Connection, Result as SqliteResult};
use std::path::PathBuf;
use std::process::Command;

/// IrisNotes - A modern note-taking application
#[derive(Parser, Debug)]
#[command(name = "irisnotes")]
#[command(version)]
#[command(about = "A modern note-taking application", long_about = None)]
pub struct Cli {
    /// Open a specific note by ID (used by quick app)
    #[arg(long = "open-note", global = true)]
    pub open_note: Option<String>,
    
    #[command(subcommand)]
    pub command: Option<Commands>,
}

#[derive(Subcommand, Debug)]
pub enum Commands {
    /// List all notes
    List {
        /// Show full content instead of truncated
        #[arg(short, long)]
        full: bool,
    },
    /// Search notes by content or title
    Search {
        /// Search query
        query: String,
    },
    /// Open a note by title in the GUI
    Open {
        /// Note title (case-insensitive)
        title: String,
        /// If multiple notes match, select by number (1-based)
        #[arg(short, long)]
        number: Option<usize>,
    },
    /// Open a note by ID in the GUI
    Id {
        /// Note ID (UUID)
        id: String,
    },
    /// Show hierarchical tree of all items
    Tree,
    /// Show note content
    Show {
        /// Note title (case-insensitive)
        title: String,
        /// If multiple notes match, select by number (1-based)
        #[arg(short, long)]
        number: Option<usize>,
        /// Output raw HTML instead of plain text
        #[arg(short, long)]
        raw: bool,
    },
}

#[derive(Debug)]
struct Note {
    id: String,
    title: String,
    content: String,
    item_type: String,
    parent_id: Option<String>,
}

/// Strip HTML tags and decode common entities for plain text output
fn strip_html(html: &str) -> String {
    // Remove HTML tags
    let mut result = String::with_capacity(html.len());
    let mut in_tag = false;
    let mut chars = html.chars().peekable();
    
    while let Some(c) = chars.next() {
        match c {
            '<' => in_tag = true,
            '>' => in_tag = false,
            _ if !in_tag => result.push(c),
            _ => {}
        }
    }
    
    // Decode common HTML entities
    let result = result
        .replace("&nbsp;", " ")
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&#39;", "'")
        .replace("&apos;", "'");
    
    // Collapse multiple spaces and trim
    let mut prev_space = false;
    let collapsed: String = result
        .chars()
        .filter(|c| {
            if c.is_whitespace() && *c != '\n' {
                if prev_space {
                    return false;
                }
                prev_space = true;
            } else {
                prev_space = false;
            }
            true
        })
        .collect();
    
    collapsed.trim().to_string()
}

fn get_db_path() -> PathBuf {
    // Check if we're in development mode
    let is_dev = cfg!(debug_assertions) || std::env::var("TAURI_ENV").as_deref() == Ok("dev");

    if is_dev {
        // Find project root by looking for pnpm-workspace.yaml
        let mut path = std::env::current_dir().unwrap_or_default();
        loop {
            if path.join("pnpm-workspace.yaml").exists() {
                return path.join("dev").join("notes.db");
            }
            if !path.pop() {
                break;
            }
        }
        // Fallback: try current dir
        PathBuf::from("dev/notes.db")
    } else {
        // Production: ~/.config/irisnotes/notes.db
        dirs::config_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("irisnotes")
            .join("notes.db")
    }
}

fn open_connection() -> SqliteResult<Connection> {
    let db_path = get_db_path();
    Connection::open(&db_path)
}

fn get_all_notes(conn: &Connection) -> SqliteResult<Vec<Note>> {
    let mut stmt = conn.prepare(
        "SELECT id, title, content, type, parent_id FROM items ORDER BY sort_order",
    )?;

    let notes = stmt
        .query_map([], |row| {
            Ok(Note {
                id: row.get(0)?,
                title: row.get(1)?,
                content: row.get::<_, Option<String>>(2)?.unwrap_or_default(),
                item_type: row.get(3)?,
                parent_id: row.get(4)?,
            })
        })?
        .collect::<SqliteResult<Vec<_>>>()?;

    Ok(notes)
}

fn find_notes_by_title(conn: &Connection, title: &str) -> SqliteResult<Vec<Note>> {
    let mut stmt = conn.prepare(
        "SELECT id, title, content, type, parent_id FROM items 
         WHERE LOWER(title) = LOWER(?1) AND type = 'note'",
    )?;

    let notes = stmt
        .query_map([title], |row| {
            Ok(Note {
                id: row.get(0)?,
                title: row.get(1)?,
                content: row.get::<_, Option<String>>(2)?.unwrap_or_default(),
                item_type: row.get(3)?,
                parent_id: row.get(4)?,
            })
        })?
        .collect::<SqliteResult<Vec<_>>>()?;

    Ok(notes)
}

fn search_notes(conn: &Connection, query: &str) -> SqliteResult<Vec<Note>> {
    // Try FTS5 search first
    let fts_result: SqliteResult<Vec<Note>> = (|| {
        let mut stmt = conn.prepare(
            "SELECT items.id, items.title, items.content, items.type, items.parent_id
             FROM items_fts
             JOIN items ON items.id = items_fts.id
             WHERE items_fts MATCH ?1
             ORDER BY rank",
        )?;

        let rows = stmt.query_map([query], |row| {
            Ok(Note {
                id: row.get(0)?,
                title: row.get(1)?,
                content: row.get::<_, Option<String>>(2)?.unwrap_or_default(),
                item_type: row.get(3)?,
                parent_id: row.get(4)?,
            })
        })?;
        let result: SqliteResult<Vec<_>> = rows.collect();
        result
    })();

    // If FTS fails, fall back to LIKE search
    match fts_result {
        Ok(notes) if !notes.is_empty() => Ok(notes),
        _ => {
            let pattern = format!("%{}%", query);
            let mut stmt = conn.prepare(
                "SELECT id, title, content, type, parent_id FROM items 
                 WHERE title LIKE ?1 OR content LIKE ?1
                 ORDER BY sort_order",
            )?;

            let rows = stmt.query_map([&pattern], |row| {
                Ok(Note {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    content: row.get::<_, Option<String>>(2)?.unwrap_or_default(),
                    item_type: row.get(3)?,
                    parent_id: row.get(4)?,
                })
            })?;
            rows.collect()
        }
    }
}

fn get_note_by_id(conn: &Connection, id: &str) -> SqliteResult<Option<Note>> {
    let mut stmt = conn.prepare(
        "SELECT id, title, content, type, parent_id FROM items WHERE id = ?1",
    )?;

    let mut rows = stmt.query([id])?;
    if let Some(row) = rows.next()? {
        Ok(Some(Note {
            id: row.get(0)?,
            title: row.get(1)?,
            content: row.get::<_, Option<String>>(2)?.unwrap_or_default(),
            item_type: row.get(3)?,
            parent_id: row.get(4)?,
        }))
    } else {
        Ok(None)
    }
}

fn get_item_path(conn: &Connection, id: &str) -> SqliteResult<String> {
    let mut path_parts = Vec::new();
    let mut current_id = Some(id.to_string());

    while let Some(ref id) = current_id {
        let mut stmt = conn.prepare("SELECT title, parent_id FROM items WHERE id = ?1")?;
        let result: SqliteResult<(String, Option<String>)> = stmt.query_row([id], |row| {
            Ok((row.get(0)?, row.get(1)?))
        });

        match result {
            Ok((title, parent)) => {
                path_parts.push(title);
                current_id = parent;
            }
            Err(_) => break,
        }
    }

    path_parts.reverse();
    Ok(path_parts.join(" / "))
}

fn truncate(s: &str, max_len: usize) -> String {
    if s.len() <= max_len {
        s.to_string()
    } else {
        format!("{}...", &s[..max_len.saturating_sub(3)])
    }
}

fn open_note_in_gui(note_id: &str) {
    // Get the path to the current executable
    let exe = std::env::current_exe().unwrap_or_else(|_| PathBuf::from("irisnotes"));

    // Spawn the GUI with --open-note argument
    let _ = Command::new(exe)
        .arg(format!("--open-note={}", note_id))
        .spawn();
}

fn print_note_list(notes: &[Note], full: bool) {
    for note in notes {
        if note.item_type != "note" {
            continue;
        }
        let title = note.title.cyan();
        let plain_content = strip_html(&note.content);
        let preview = if full {
            plain_content
        } else {
            truncate(&plain_content.replace('\n', " "), 60)
        };
        println!("{} - {}", title, preview.dimmed());
    }
}

fn select_note<'a>(notes: &'a [Note], number: Option<usize>) -> Option<&'a Note> {
    if notes.is_empty() {
        return None;
    }
    if notes.len() == 1 {
        return Some(&notes[0]);
    }

    // If number specified, use it
    if let Some(n) = number {
        if n > 0 && n <= notes.len() {
            return Some(&notes[n - 1]);
        }
        eprintln!(
            "{}: Invalid number {}. Use 1-{}",
            "Error".red(),
            n,
            notes.len()
        );
        return None;
    }

    // Show selection prompt
    eprintln!(
        "{}: Multiple notes found with the same title:",
        "Note".yellow()
    );
    for (i, note) in notes.iter().enumerate() {
        eprintln!("  {}. {} (ID: {})", i + 1, note.title, note.id);
    }
    eprintln!("\nUse {} to select a specific note.", "--number <N>".cyan());
    None
}

pub fn run_cli(cli: Cli) -> Result<(), String> {
    let Some(command) = cli.command else {
        // No subcommand - return to start GUI
        return Err("no-command".to_string());
    };

    let conn = open_connection().map_err(|e| format!("Failed to open database: {}", e))?;

    match command {
        Commands::List { full } => {
            let notes = get_all_notes(&conn).map_err(|e| format!("Failed to list notes: {}", e))?;
            print_note_list(&notes, full);
        }
        Commands::Search { query } => {
            let notes =
                search_notes(&conn, &query).map_err(|e| format!("Search failed: {}", e))?;
            if notes.is_empty() {
                println!("No notes found matching '{}'", query);
            } else {
                println!(
                    "Found {} result{}:",
                    notes.len(),
                    if notes.len() == 1 { "" } else { "s" }
                );
                for note in &notes {
                    let path =
                        get_item_path(&conn, &note.id).unwrap_or_else(|_| note.title.clone());
                    let plain_content = strip_html(&note.content);
                    let preview = truncate(&plain_content.replace('\n', " "), 60);
                    println!("  {} - {}", path.cyan(), preview.dimmed());
                }
            }
        }
        Commands::Open { title, number } => {
            let notes = find_notes_by_title(&conn, &title)
                .map_err(|e| format!("Failed to find note: {}", e))?;

            if notes.is_empty() {
                eprintln!("{}: No note found with title '{}'", "Error".red(), title);
                std::process::exit(1);
            }

            if let Some(note) = select_note(&notes, number) {
                println!("Opening note: {}", note.title.cyan());
                open_note_in_gui(&note.id);
            } else {
                std::process::exit(1);
            }
        }
        Commands::Id { id } => {
            let note =
                get_note_by_id(&conn, &id).map_err(|e| format!("Failed to find note: {}", e))?;

            if let Some(note) = note {
                println!("Opening note: {}", note.title.cyan());
                open_note_in_gui(&note.id);
            } else {
                eprintln!("{}: No note found with ID '{}'", "Error".red(), id);
                std::process::exit(1);
            }
        }
        Commands::Tree => {
            let notes = get_all_notes(&conn).map_err(|e| format!("Failed to get items: {}", e))?;

            fn print_tree(notes: &[Note], parent_id: Option<&str>, indent: usize) {
                for note in notes {
                    let note_parent = note.parent_id.as_deref();
                    if note_parent == parent_id {
                        let icon = match note.item_type.as_str() {
                            "book" => "📚",
                            "section" => "📁",
                            "note" => "📝",
                            _ => "•",
                        };
                        let prefix = "  ".repeat(indent);
                        println!("{}{} {}", prefix, icon, note.title);
                        print_tree(notes, Some(&note.id), indent + 1);
                    }
                }
            }

            print_tree(&notes, None, 0);
        }
        Commands::Show { title, number, raw } => {
            let notes = find_notes_by_title(&conn, &title)
                .map_err(|e| format!("Failed to find note: {}", e))?;

            if notes.is_empty() {
                eprintln!("{}: No note found with title '{}'", "Error".red(), title);
                std::process::exit(1);
            }

            if let Some(note) = select_note(&notes, number) {
                println!("{}", "─".repeat(50).dimmed());
                println!("{}", note.title.cyan().bold());
                println!("{}", "─".repeat(50).dimmed());
                if raw {
                    println!("{}", note.content);
                } else {
                    println!("{}", strip_html(&note.content));
                }
            } else {
                std::process::exit(1);
            }
        }
    }

    Ok(())
}
