use rusqlite::{Connection, Result as SqliteResult};
use serde::Serialize;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    AppHandle, Emitter, Manager, State, WindowEvent,
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};

// Search result structure
#[derive(Debug, Serialize, Clone)]
pub struct SearchResult {
    id: String,
    title: String,
    snippet: String,
    content_preview: String, // First ~60 chars of plain text content
    book_name: Option<String>,
    section_name: Option<String>,
    match_type: String, // "title", "content", or "parent"
    word_count: i32,    // Approximate word count of note content
}

/// Strip HTML tags and decode common entities for plain text output
fn strip_html(html: &str) -> String {
    // Remove HTML tags
    let mut result = String::with_capacity(html.len());
    let mut in_tag = false;

    for c in html.chars() {
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

    // Collapse multiple spaces
    let mut prev_space = false;
    let collapsed: String = result
        .chars()
        .filter(|c| {
            if c.is_whitespace() {
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
            return dev_path;
        }
        
        // Fallback to config dir
        dirs::config_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("irisnotes")
            .join("notes.db")
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

    let query_lower = query.to_lowercase();
    
    // Prepare FTS query - escape special characters and add wildcards
    let fts_query = query
        .split_whitespace()
        .map(|word| format!("{}*", word.replace('"', "")))
        .collect::<Vec<_>>()
        .join(" ");

    if fts_query.is_empty() {
        return Ok(vec![]);
    }

    // Combined search: FTS on note content + LIKE on note/parent titles
    // Uses UNION to combine results, with priority ordering
    let sql = r#"
        WITH fts_results AS (
            -- FTS matches on note title or content
            SELECT 
                i.id,
                i.title,
                i.title as note_title_for_match,
                snippet(items_fts, 1, '<mark>', '</mark>', '...', 32) as snippet,
                p.title as parent_title,
                p.type as parent_type,
                pp.title as grandparent_title,
                1 as priority,
                rank as sort_rank,
                LENGTH(i.content) as content_length,
                i.content as raw_content
            FROM items_fts fts
            JOIN items i ON fts.item_id = i.id
            LEFT JOIN items p ON i.parent_id = p.id
            LEFT JOIN items pp ON p.parent_id = pp.id
            WHERE items_fts MATCH ?1
              AND i.type = 'note'
              AND i.deleted_at IS NULL
        ),
        parent_matches AS (
            -- Notes inside books/sections whose title matches
            SELECT 
                i.id,
                i.title,
                i.title as note_title_for_match,
                '' as snippet,
                p.title as parent_title,
                p.type as parent_type,
                pp.title as grandparent_title,
                2 as priority,
                0 as sort_rank,
                LENGTH(i.content) as content_length,
                i.content as raw_content
            FROM items i
            LEFT JOIN items p ON i.parent_id = p.id
            LEFT JOIN items pp ON p.parent_id = pp.id
            WHERE i.type = 'note'
              AND i.deleted_at IS NULL
              AND (
                  (p.type IN ('book', 'section') AND LOWER(p.title) LIKE '%' || ?2 || '%')
                  OR (pp.type = 'book' AND LOWER(pp.title) LIKE '%' || ?2 || '%')
              )
              -- Exclude notes already found by FTS
              AND i.id NOT IN (SELECT id FROM fts_results)
        )
        SELECT * FROM (
            SELECT * FROM fts_results
            UNION ALL
            SELECT * FROM parent_matches
        )
        ORDER BY priority, sort_rank
        LIMIT 15
    "#;

    let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;

    let results = stmt
        .query_map(rusqlite::params![&fts_query, &query_lower], |row| {
            let note_title: String = row.get(2)?;
            let snippet: String = row.get::<_, Option<String>>(3)?.unwrap_or_default();
            let parent_title: Option<String> = row.get(4)?;
            let parent_type: Option<String> = row.get(5)?;
            let grandparent_title: Option<String> = row.get(6)?;
            let priority: i32 = row.get(7)?;
            let content_length: i32 = row.get::<_, Option<i32>>(9)?.unwrap_or(0);
            let raw_content: String = row.get::<_, Option<String>>(10)?.unwrap_or_default();

            // Create content preview from raw content (strip HTML, take first ~80 chars)
            let plain_content = strip_html(&raw_content);
            let content_preview = if plain_content.len() > 80 {
                format!("{}...", &plain_content[..80])
            } else if plain_content.is_empty() {
                "Empty note".to_string()
            } else {
                plain_content
            };

            // Determine book_name and section_name based on hierarchy
            let (book_name, section_name) = match parent_type.as_deref() {
                Some("section") => (grandparent_title.clone(), parent_title.clone()),
                Some("book") => (parent_title.clone(), None),
                _ => (None, None),
            };

            // Determine match type
            let match_type = if priority == 2 {
                // Parent match
                "parent".to_string()
            } else if note_title.to_lowercase().contains(&query_lower) {
                "title".to_string()
            } else {
                "content".to_string()
            };

            // Estimate word count (average ~5 chars per word for HTML content)
            let word_count = content_length / 6;

            Ok(SearchResult {
                id: row.get(0)?,
                title: row.get(1)?,
                snippet,
                content_preview,
                book_name,
                section_name,
                match_type,
                word_count,
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

// Get the main app executable path
fn get_main_app_path() -> Option<PathBuf> {
    #[cfg(debug_assertions)]
    {
        // In development, main app is in apps/main/src-tauri/target/debug/
        let exe_path = std::env::current_exe().ok();
        let mut project_root = exe_path
            .and_then(|p| p.parent().map(|p| p.to_path_buf()))
            .unwrap_or_else(|| std::env::current_dir().unwrap_or_default());

        loop {
            if project_root.join("pnpm-workspace.yaml").exists() {
                break;
            }
            if !project_root.pop() {
                break;
            }
        }

        return Some(project_root.join("apps/main/src-tauri/target/debug/irisnotes"));
    }

    #[cfg(not(debug_assertions))]
    {
        // Production: assume main app is in same directory or PATH
        let exe_dir = std::env::current_exe().ok()?.parent()?.to_path_buf();
        let main_exe = exe_dir.join("irisnotes");
        if main_exe.exists() {
            return Some(main_exe);
        }
        None
    }
}

// Open note in main IrisNotes app by launching it with --open-note argument
// The main app's single-instance plugin will receive this and emit an event
#[tauri::command]
fn open_note_in_main_app(note_id: String) -> Result<(), String> {
    let main_app_path = get_main_app_path()
        .ok_or("Could not find main app executable")?;
    
    if !main_app_path.exists() {
        return Err(format!("Main app not found at: {:?}", main_app_path));
    }
    
    // Launch main app with --open-note argument
    // If main app is already running, single-instance plugin will receive the args
    // If not running, it will start fresh and receive the args on startup
    std::process::Command::new(&main_app_path)
        .arg(format!("--open-note={}", note_id))
        .spawn()
        .map_err(|e| format!("Failed to launch main app: {}", e))?;
    
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
            // Emit event to clear search field
            let _ = window.emit("window-shown", ());
        }
    }
}

// Load custom tray icon from config directory (or dev folder in debug mode)
// Supports theme-specific icons: quick-tray-icon-dark.png and quick-tray-icon-light.png
fn load_custom_tray_icon() -> Option<Image<'static>> {
    let icon_path = get_tray_icon_path()?;
    
    if !icon_path.exists() {
        return None;
    }
    
    // Read and decode the PNG file
    let file_bytes = std::fs::read(&icon_path).ok()?;
    let img = image::load_from_memory(&file_bytes).ok()?;
    let rgba = img.to_rgba8();
    let (width, height) = rgba.dimensions();
    
    Some(Image::new_owned(rgba.into_raw(), width, height))
}

// Detect if system is using dark theme
fn is_dark_theme() -> bool {
    // Try to detect dark theme from environment/settings
    // Linux: Check GTK theme or XDG_CURRENT_DESKTOP hints
    #[cfg(target_os = "linux")]
    {
        // Check GNOME/GTK color scheme
        if let Ok(output) = std::process::Command::new("gsettings")
            .args(["get", "org.gnome.desktop.interface", "color-scheme"])
            .output()
        {
            let result = String::from_utf8_lossy(&output.stdout);
            if result.contains("dark") {
                return true;
            }
            if result.contains("light") {
                return false;
            }
        }
        
        // Check GTK theme name as fallback
        if let Ok(output) = std::process::Command::new("gsettings")
            .args(["get", "org.gnome.desktop.interface", "gtk-theme"])
            .output()
        {
            let result = String::from_utf8_lossy(&output.stdout).to_lowercase();
            if result.contains("dark") {
                return true;
            }
        }
    }
    
    // Default to dark theme (most users prefer dark)
    true
}

fn get_tray_icon_path() -> Option<PathBuf> {
    let is_dark = is_dark_theme();
    
    // Theme-specific icon names (use opposite color for visibility)
    // Dark theme -> use light icon, Light theme -> use dark icon
    let theme_suffix = if is_dark { "-light" } else { "-dark" };
    
    #[cfg(debug_assertions)]
    {
        // In development, check dev folder first
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
                break;
            }
        }

        // Try theme-specific icon first
        let themed_path = project_root.join(format!("dev/quick-tray-icon{}.png", theme_suffix));
        if themed_path.exists() {
            return Some(themed_path);
        }
        
        // Fall back to generic icon
        let dev_path = project_root.join("dev/quick-tray-icon.png");
        if dev_path.exists() {
            return Some(dev_path);
        }
    }
    
    // Production: check config dir
    let config_dir = dirs::config_dir()?.join("irisnotes");
    
    // Try theme-specific icon first
    let themed_path = config_dir.join(format!("quick-tray-icon{}.png", theme_suffix));
    if themed_path.exists() {
        return Some(themed_path);
    }
    
    // Fall back to generic icon
    let config_path = config_dir.join("quick-tray-icon.png");
    if config_path.exists() {
        return Some(config_path);
    }
    
    None
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db_state = DbState::new();

    // Initialize database
    let db_path = get_database_path();
    let _ = db_state.init(&db_path);

    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // Another instance tried to start - show our window instead
            toggle_window(app);
        }))
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .manage(db_state)
        .invoke_handler(tauri::generate_handler![search_notes, open_note_in_main_app, hide_window])
        .setup(|app| {
            // Create system tray
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let show = MenuItem::with_id(app, "show", "Show Search", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;

            // Build tray icon - use custom icon from config dir if available
            let mut tray_builder = TrayIconBuilder::new()
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
                });

            // Try to load custom icon from config dir
            if let Some(icon) = load_custom_tray_icon() {
                tray_builder = tray_builder.icon(icon);
            }

            let _tray = tray_builder.build(app)?;

            // Handle window close event - hide instead of closing
            if let Some(window) = app.get_webview_window("main") {
                let window_clone = window.clone();
                window.on_window_event(move |event| {
                    if let WindowEvent::CloseRequested { api, .. } = event {
                        // Prevent the window from actually closing
                        api.prevent_close();
                        // Just hide it instead
                        let _ = window_clone.hide();
                    }
                });
            }

            // Register global shortcut (Ctrl+Shift+Space - more compatible than Super+Space)
            // Note: This may not work on Wayland - use system keybinding instead
            let shortcut = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::Space);
            let app_handle = app.handle().clone();
            
            let _ = app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, _event| {
                toggle_window(&app_handle);
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
