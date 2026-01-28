use rusqlite::{Connection, Result as SqliteResult};
use serde::Serialize;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    AppHandle, Manager, State,
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};

// Search result structure
#[derive(Debug, Serialize, Clone)]
pub struct SearchResult {
    id: String,
    title: String,
    snippet: String,
    book_name: Option<String>,
    section_name: Option<String>,
}

// Database connection state
pub struct DbState {
    conn: Mutex<Option<Connection>>,
}

impl DbState {
    fn new() -> Self {
        Self {
            conn: Mutex::new(None),
        }
    }

    fn init(&self, path: &PathBuf) -> SqliteResult<()> {
        let conn = Connection::open(path)?;
        *self.conn.lock().unwrap() = Some(conn);
        Ok(())
    }
}

// Get the database path (same as main IrisNotes app)
fn get_database_path() -> PathBuf {
    // In development, use the dev database from monorepo root
    #[cfg(debug_assertions)]
    {
        // Find monorepo root by looking for pnpm-workspace.yaml
        let exe_path = std::env::current_exe().ok();
        let mut project_root = exe_path
            .and_then(|p| p.parent().map(|p| p.to_path_buf()))
            .unwrap_or_else(|| std::env::current_dir().unwrap_or_default());

        // Navigate up to find monorepo root
        loop {
            if project_root.join("pnpm-workspace.yaml").exists() {
                break;
            }
            if !project_root.pop() {
                // Fallback: try home directory path
                let home = dirs::home_dir().unwrap_or_default();
                project_root = home.join("repos/irisnotes");
                break;
            }
        }

        let dev_path = project_root.join("dev/notes.db");
        if dev_path.exists() {
            eprintln!("Using dev database at: {:?}", dev_path);
            return dev_path;
        }
        
        // Fallback to config dir
        let data_path = dirs::config_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("irisnotes")
            .join("notes.db");
        eprintln!("Fallback to: {:?}", data_path);
        data_path
    }

    #[cfg(not(debug_assertions))]
    {
        // Production: use config dir (same as main app)
        dirs::config_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("irisnotes")
            .join("notes.db")
    }
}

// Search notes command
#[tauri::command]
fn search_notes(query: String, state: State<DbState>) -> Result<Vec<SearchResult>, String> {
    let guard = state.conn.lock().unwrap();
    let conn = guard.as_ref().ok_or("Database not initialized")?;

    // Prepare FTS query - escape special characters and add wildcards
    let fts_query = query
        .split_whitespace()
        .map(|word| format!("{}*", word.replace('"', "")))
        .collect::<Vec<_>>()
        .join(" ");

    if fts_query.is_empty() {
        return Ok(vec![]);
    }

    let sql = r#"
        SELECT 
            i.id,
            i.title,
            snippet(items_fts, 1, '<mark>', '</mark>', '...', 32) as snippet,
            p.title as parent_title,
            p.type as parent_type,
            pp.title as grandparent_title
        FROM items_fts fts
        JOIN items i ON fts.item_id = i.id
        LEFT JOIN items p ON i.parent_id = p.id
        LEFT JOIN items pp ON p.parent_id = pp.id
        WHERE items_fts MATCH ?1
          AND i.type = 'note'
          AND i.deleted_at IS NULL
        ORDER BY rank
        LIMIT 10
    "#;

    let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;

    let results = stmt
        .query_map([&fts_query], |row| {
            let parent_title: Option<String> = row.get(3)?;
            let parent_type: Option<String> = row.get(4)?;
            let grandparent_title: Option<String> = row.get(5)?;

            // Determine book_name and section_name based on hierarchy
            let (book_name, section_name) = match parent_type.as_deref() {
                Some("section") => (grandparent_title, parent_title),
                Some("book") => (parent_title, None),
                _ => (None, None),
            };

            Ok(SearchResult {
                id: row.get(0)?,
                title: row.get(1)?,
                snippet: row.get::<_, Option<String>>(2)?.unwrap_or_default(),
                book_name,
                section_name,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut search_results = Vec::new();
    for result in results {
        if let Ok(r) = result {
            search_results.push(r);
        }
    }

    Ok(search_results)
}

// Open note in main IrisNotes app
#[tauri::command]
fn open_note_in_main_app(note_id: String) -> Result<(), String> {
    // Use xdg-open on Linux to open the deep link
    let url = format!("irisnotes://open/note/{}", note_id);
    
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&url)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/C", "start", "", &url])
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

// Hide window command for Escape key
#[tauri::command]
fn hide_window(window: tauri::WebviewWindow) -> Result<(), String> {
    window.hide().map_err(|e| e.to_string())
}

fn toggle_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            let _ = window.show();
            let _ = window.set_focus();
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db_state = DbState::new();

    // Initialize database
    let db_path = get_database_path();
    if let Err(e) = db_state.init(&db_path) {
        eprintln!("Failed to open database at {:?}: {}", db_path, e);
    } else {
        eprintln!("Successfully connected to database at {:?}", db_path);
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .manage(db_state)
        .invoke_handler(tauri::generate_handler![search_notes, open_note_in_main_app, hide_window])
        .setup(|app| {
            // Create system tray
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let show = MenuItem::with_id(app, "show", "Show Search", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;

            let _tray = TrayIconBuilder::new()
                .menu(&menu)
                .tooltip("IrisNotes Quick Search")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "show" => {
                        toggle_window(app);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::Click { .. } = event {
                        toggle_window(tray.app_handle());
                    }
                })
                .build(app)?;

            // Register global shortcut (Ctrl+Shift+Space - more compatible than Super+Space)
            let shortcut = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::Space);
            let app_handle = app.handle().clone();
            
            eprintln!("Registering global shortcut: Ctrl+Shift+Space");
            app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, _event| {
                eprintln!("Global shortcut triggered!");
                toggle_window(&app_handle);
            })?;

            // Also show the window on startup for testing
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
