use rusqlite::{Connection, Result as SqliteResult};
use serde::Serialize;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    AppHandle, Emitter, LogicalSize, Manager, State, WindowEvent,
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

mod capture;
mod hyprland;

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
        // Quick capture writes while the main app may be writing too
        conn.busy_timeout(std::time::Duration::from_secs(3))?;
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

// Get the config directory (same as main IrisNotes app)
fn get_config_dir() -> PathBuf {
    #[cfg(debug_assertions)]
    {
        // In development, use the dev directory from monorepo root
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
                let home = dirs::home_dir().unwrap_or_default();
                project_root = home.join("repos/irisnotes");
                break;
            }
        }

        project_root.join("dev")
    }

    #[cfg(not(debug_assertions))]
    {
        // Production: use config dir (same as main app)
        dirs::config_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("irisnotes")
    }
}

// Read config command - reads config.toml and returns JSON
#[tauri::command]
fn read_config() -> Result<String, String> {
    let config_dir = get_config_dir();
    let toml_path = config_dir.join("config.toml");
    
    if toml_path.exists() {
        let toml_content = std::fs::read_to_string(&toml_path)
            .map_err(|e| format!("Failed to read config.toml: {}", e))?;
        let value: toml::Value = toml::from_str(&toml_content)
            .map_err(|e| format!("Failed to parse TOML: {}", e))?;
        serde_json::to_string(&value)
            .map_err(|e| format!("Failed to convert TOML to JSON: {}", e))
    } else {
        // Return empty object if config doesn't exist
        Ok("{}".to_string())
    }
}

// Parsed search query with field-specific filters
struct ParsedQuery {
    /// Free text tokens for title search (AND-combined)
    title_tokens: Vec<String>,
    /// ~content filter
    content: Option<String>,
    /// @book filter
    book: Option<String>,
    /// #section filter
    section: Option<String>,
    /// / means root notes only
    root_only: bool,
}

fn parse_query(input: &str) -> ParsedQuery {
    let mut title_tokens = Vec::new();
    let mut content = None;
    let mut book = None;
    let mut section = None;
    let mut root_only = false;

    let chars: Vec<char> = input.chars().collect();
    let len = chars.len();
    let mut i = 0;

    while i < len {
        // Skip whitespace
        if chars[i].is_whitespace() {
            i += 1;
            continue;
        }

        if chars[i] == '/' && (i + 1 >= len || chars[i + 1].is_whitespace()) {
            root_only = true;
            i += 1;
        } else if chars[i] == '@' || chars[i] == '#' || chars[i] == '~' {
            let prefix = chars[i];
            i += 1;
            let value = extract_value(&chars, &mut i);
            if !value.is_empty() {
                match prefix {
                    '@' => book = Some(value.to_lowercase()),
                    '#' => section = Some(value.to_lowercase()),
                    '~' => content = Some(value.to_lowercase()),
                    _ => {}
                }
            }
        } else {
            // Regular text token — title search
            let start = i;
            while i < len && !chars[i].is_whitespace() {
                i += 1;
            }
            let token: String = chars[start..i].iter().collect();
            title_tokens.push(token);
        }
    }

    ParsedQuery { title_tokens, content, book, section, root_only }
}

/// Extract a value after @ or #, supporting quoted strings: @"my book" or @word
fn extract_value(chars: &[char], i: &mut usize) -> String {
    let len = chars.len();
    if *i >= len {
        return String::new();
    }

    if chars[*i] == '"' {
        // Quoted value: read until closing quote
        *i += 1; // skip opening quote
        let start = *i;
        while *i < len && chars[*i] != '"' {
            *i += 1;
        }
        let value: String = chars[start..*i].iter().collect();
        if *i < len {
            *i += 1; // skip closing quote
        }
        value
    } else {
        // Unquoted: read until whitespace
        let start = *i;
        while *i < len && !chars[*i].is_whitespace() {
            *i += 1;
        }
        chars[start..*i].iter().collect()
    }
}

/// Escape SQL LIKE wildcards (% and _) so they match literally
fn escape_like(s: &str) -> String {
    s.replace('\\', "\\\\").replace('%', "\\%").replace('_', "\\_")
}

// Search notes command
#[tauri::command]
fn search_notes(query: String, state: State<DbState>) -> Result<Vec<SearchResult>, String> {
    let guard = state.conn.lock().unwrap();
    let conn = guard.as_ref().ok_or("Database not initialized")?;

    let parsed = parse_query(&query);

    // If nothing to search, return empty
    if parsed.title_tokens.is_empty() && parsed.content.is_none() && parsed.book.is_none() && parsed.section.is_none() && !parsed.root_only {
        return Ok(vec![]);
    }

    let has_title = !parsed.title_tokens.is_empty();
    let has_content = parsed.content.is_some();
    let has_book = parsed.book.is_some();
    let has_section = parsed.section.is_some();
    let root_only = parsed.root_only;

    // Build dynamic params and WHERE conditions
    let mut params: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();
    let mut conditions: Vec<String> = Vec::new();

    // Title filter: one LIKE per token, AND-combined
    if has_title {
        let mut title_conds = Vec::new();
        for token in &parsed.title_tokens {
            let escaped = escape_like(&token.to_lowercase());
            title_conds.push("LOWER(i.title) LIKE '%' || ? || '%' ESCAPE '\\'".to_string());
            params.push(Box::new(escaped));
        }
        conditions.push(format!("({})", title_conds.join(" AND ")));
    }

    // Content filter (~content: FTS + LIKE fallback)
    if let Some(ref content) = parsed.content {
        let content_lower = escape_like(&content.to_lowercase());
        let content_fts = content_lower
            .split_whitespace()
            .map(|word| format!("{}*", word.replace('"', "")))
            .collect::<Vec<_>>()
            .join(" ");
        params.push(Box::new(content_fts));
        params.push(Box::new(content_lower));
        conditions.push(
            "(i.id IN (SELECT fts.item_id FROM items_fts fts WHERE items_fts MATCH ?) OR LOWER(i.content) LIKE '%' || ? || '%' ESCAPE '\\')".to_string()
        );
    }

    // Book filter (@book)
    if let Some(ref book) = parsed.book {
        let book_lower = escape_like(&book.to_lowercase());
        params.push(Box::new(book_lower.clone()));
        params.push(Box::new(book_lower));
        conditions.push(
            "((p.type = 'book' AND LOWER(p.title) LIKE '%' || ? || '%' ESCAPE '\\') OR (pp.type = 'book' AND LOWER(pp.title) LIKE '%' || ? || '%' ESCAPE '\\'))".to_string()
        );
    }

    // Section filter (#section)
    if let Some(ref section) = parsed.section {
        let section_lower = escape_like(&section.to_lowercase());
        params.push(Box::new(section_lower));
        conditions.push(
            "(p.type = 'section' AND LOWER(p.title) LIKE '%' || ? || '%' ESCAPE '\\')".to_string()
        );
    }

    // Root filter (/)
    if root_only {
        conditions.push("i.parent_id IS NULL".to_string());
    }

    let where_clause = conditions.join("\n          AND ");

    let sql = format!("
        SELECT
            i.id,
            i.title,
            p.title as parent_title,
            p.type as parent_type,
            pp.title as grandparent_title,
            LENGTH(i.content) as content_length,
            i.content as raw_content
        FROM items i
        LEFT JOIN items p ON i.parent_id = p.id
        LEFT JOIN items pp ON p.parent_id = pp.id
        WHERE i.type = 'note'
          AND i.deleted_at IS NULL
          AND {}
        ORDER BY i.title
        LIMIT 30
    ", where_clause);

    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params.iter().map(|p| p.as_ref()).collect();
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;

    let results = stmt
        .query_map(param_refs.as_slice(), |row| {
            let parent_title: Option<String> = row.get(2)?;
            let parent_type: Option<String> = row.get(3)?;
            let grandparent_title: Option<String> = row.get(4)?;
            let content_length: i32 = row.get::<_, Option<i32>>(5)?.unwrap_or(0);
            let raw_content: String = row.get::<_, Option<String>>(6)?.unwrap_or_default();

            let plain_content = strip_html(&raw_content);
            let content_preview = if plain_content.chars().count() > 80 {
                let preview: String = plain_content.chars().take(80).collect();
                format!("{}...", preview)
            } else if plain_content.is_empty() {
                "Empty note".to_string()
            } else {
                plain_content
            };

            let (book_name, section_name) = match parent_type.as_deref() {
                Some("section") => (grandparent_title.clone(), parent_title.clone()),
                Some("book") => (parent_title.clone(), None),
                _ => (None, None),
            };

            let note_title: String = row.get(1)?;
            let match_type = if has_title {
                "title"
            } else if has_content {
                "content"
            } else if root_only {
                "root"
            } else if has_book || has_section {
                "parent"
            } else {
                "title"
            }.to_string();

            let word_count = content_length / 6;

            Ok(SearchResult {
                id: row.get(0)?,
                title: note_title,
                snippet: String::new(),
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

/// Launch the main app with one argument. If it's already running, its
/// single-instance plugin receives the argument and shows its window; if not,
/// it starts and handles the argument once its UI is ready.
fn launch_main_app(arg: String) -> Result<(), String> {
    let main_app_path = get_main_app_path()
        .ok_or("Could not find main app executable")?;

    if !main_app_path.exists() {
        return Err(format!("Main app not found at: {:?}", main_app_path));
    }

    std::process::Command::new(&main_app_path)
        .arg(arg)
        .spawn()
        .map_err(|e| format!("Failed to launch main app: {}", e))?;

    Ok(())
}

// Open a note in the main app (--open-note=<id>)
#[tauri::command]
fn open_note_in_main_app(note_id: String) -> Result<(), String> {
    launch_main_app(format!("--open-note={}", note_id))
}

// Create a root note with this title in the main app and open it (--new-note=<title>)
#[tauri::command]
fn create_note_in_main_app(title: String) -> Result<(), String> {
    launch_main_app(format!("--new-note={}", title))
}

/// Save a root note straight into the database without opening the main app
/// ("quick capture"). Mirrors SQLiteStorageAdapter.createItem in the main app:
/// same id format, appended after the last root note (fractional index), ISO
/// timestamps so sync picks it up. Returns the new note's id.
#[tauri::command]
fn capture_note(title: String, body: String, state: State<DbState>) -> Result<String, String> {
    let guard = state.conn.lock().map_err(|e| e.to_string())?;
    let conn = guard.as_ref().ok_or("Database not open")?;
    capture::insert_root_note(conn, &title, &body).map_err(|e| format!("Failed to save note: {}", e))
}

// Hide window command for Escape key
#[tauri::command]
fn hide_window(window: tauri::WebviewWindow) -> Result<(), String> {
    window.hide().map_err(|e| e.to_string())
}

/// Launcher width; the height follows the content (see resize_launcher)
const LAUNCHER_WIDTH: f64 = 720.0;

/// The frontend sizes the window to its content: just the input until
/// something is typed, then the result list.
#[tauri::command]
fn resize_launcher(height: f64, window: tauri::WebviewWindow) -> Result<(), String> {
    let height = height.clamp(48.0, 640.0);
    // Hyprland ignores a floating window resizing itself: ask it directly.
    // Not also through GTK, whose ignored resize can flash a frame at the
    // wrong size.
    if hyprland::resize_keeping_top(LAUNCHER_WIDTH as u32, height.ceil() as u32) {
        return Ok(());
    }
    // Other compositors, and Hyprland while the window is hidden (the size
    // then applies when it is shown)
    window
        .set_size(LogicalSize::new(LAUNCHER_WIDTH, height))
        .map_err(|e| e.to_string())
}

fn show_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
        // Clears the input and refreshes the theme
        let _ = window.emit("window-shown", ());
    }
}

/// Launcher key (a second `irisnotes-quick`), tray click, global shortcut:
/// show the launcher, or hide it if it's already up and focused
fn toggle_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let up = window.is_visible().unwrap_or(false) && window.is_focused().unwrap_or(false);
        if up {
            let _ = window.hide();
        } else {
            show_window(app);
        }
    }
}

// Logos selectable in the main app's Branding view (apps/main/public, mirrored
// from LOGO_OPTIONS in apps/main/src/atoms/settings.ts). The first is the default.
const LOGOS: &[(&str, &[u8])] = &[
    ("logo-purple", include_bytes!("../../../main/public/logo-purple.png")),
    ("logo-white", include_bytes!("../../../main/public/logo-white.png")),
    ("logo-transparent", include_bytes!("../../../main/public/logo-transparent.svg")),
    ("iris-detailed-blue", include_bytes!("../../../main/public/iris-detailed-blue.svg")),
    ("iris-detailed-purple", include_bytes!("../../../main/public/iris-detailed-purple.svg")),
    ("iris-detailed-periwinkle", include_bytes!("../../../main/public/iris-detailed-periwinkle.svg")),
    ("iris-detailed-mono-dark", include_bytes!("../../../main/public/iris-detailed-mono-dark.svg")),
    ("iris-detailed-mono-light", include_bytes!("../../../main/public/iris-detailed-mono-light.svg")),
];

// Read the logo chosen in the main app from the shared settings table
// (key "branding", JSON written by the main app). `activityBarLogo` is the
// field's earlier name.
fn read_configured_logo(conn: &Connection) -> Option<String> {
    let value: String = conn
        .query_row("SELECT value FROM settings WHERE key = 'branding'", [], |row| row.get(0))
        .ok()?;
    let branding: serde_json::Value = serde_json::from_str(&value).ok()?;
    branding
        .get("logo")
        .or_else(|| branding.get("activityBarLogo"))?
        .as_str()
        .map(str::to_string)
}

// Render a logo variant as a tray image, falling back to the default logo
fn tray_icon_for(logo: Option<&str>) -> Option<Image<'static>> {
    let (_, bytes) = LOGOS
        .iter()
        .find(|(id, _)| Some(*id) == logo)
        .or_else(|| LOGOS.first())?;
    if bytes.starts_with(b"\x89PNG") {
        load_raster_icon(bytes)
    } else {
        load_svg_icon(bytes)
    }
}

// Open the shared database read-only for polling the branding setting
fn open_settings_connection() -> Option<Connection> {
    Connection::open_with_flags(
        get_database_path(),
        rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY | rusqlite::OpenFlags::SQLITE_OPEN_NO_MUTEX,
    )
    .ok()
}

// Render SVG to RGBA image using resvg
fn load_svg_icon(svg_data: &[u8]) -> Option<Image<'static>> {
    use resvg::tiny_skia;
    use resvg::usvg;
    
    // Parse SVG
    let tree = usvg::Tree::from_data(svg_data, &usvg::Options::default()).ok()?;
    
    // Target size for tray icon (32x32 is standard, but render at 64 for HiDPI)
    let size = 64u32;
    
    // Calculate scale to fit in target size while maintaining aspect ratio
    let svg_size = tree.size();
    let scale = (size as f32 / svg_size.width()).min(size as f32 / svg_size.height());
    
    let width = (svg_size.width() * scale).ceil() as u32;
    let height = (svg_size.height() * scale).ceil() as u32;
    
    // Create pixel buffer
    let mut pixmap = tiny_skia::Pixmap::new(width, height)?;
    
    // Render SVG
    let transform = tiny_skia::Transform::from_scale(scale, scale);
    resvg::render(&tree, transform, &mut pixmap.as_mut());
    
    // Convert to RGBA (resvg uses premultiplied alpha, need to unpremultiply)
    let rgba_data: Vec<u8> = pixmap.pixels().iter().flat_map(|pixel| {
        let a = pixel.alpha();
        if a == 0 {
            [0, 0, 0, 0]
        } else {
            // Unpremultiply alpha
            let r = ((pixel.red() as u16 * 255) / a as u16) as u8;
            let g = ((pixel.green() as u16 * 255) / a as u16) as u8;
            let b = ((pixel.blue() as u16 * 255) / a as u16) as u8;
            [r, g, b, a]
        }
    }).collect();
    
    Some(Image::new_owned(rgba_data, width, height))
}

// Load raster image (PNG, etc.)
fn load_raster_icon(image_data: &[u8]) -> Option<Image<'static>> {
    let img = image::load_from_memory(image_data).ok()?;
    let rgba = img.to_rgba8();
    let (width, height) = rgba.dimensions();
    
    Some(Image::new_owned(rgba.into_raw(), width, height))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Set the program name before Tauri/GTK init so Wayland app_id and X11 WM_CLASS
    // match our .desktop files (irisnotes-quick vs irisnotes-quick-dev)
    #[cfg(target_os = "linux")]
    {
        let prgname = if cfg!(debug_assertions) { "irisnotes-quick-dev" } else { "irisnotes-quick" };
        let c_name = std::ffi::CString::new(prgname).unwrap();
        unsafe {
            extern "C" { fn g_set_prgname(prgname: *const std::ffi::c_char); }
            g_set_prgname(c_name.as_ptr());
        }
    }

    let db_state = DbState::new();

    // Initialize database
    let db_path = get_database_path();
    let _ = db_state.init(&db_path);

    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            // Another instance tried to start: toggle the launcher. A second
            // `--hidden` start (e.g. a re-run autostart) leaves it alone.
            if !args.iter().any(|a| a == "--hidden") {
                toggle_window(app);
            }
        }))
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .manage(db_state)
        .invoke_handler(tauri::generate_handler![
            search_notes,
            open_note_in_main_app,
            create_note_in_main_app,
            capture_note,
            hide_window,
            resize_launcher,
            read_config
        ])
        .setup(|app| {
            // Create system tray
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let show = MenuItem::with_id(app, "show", "Show Search", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;

            // Build tray icon with the logo configured in the main app
            let mut settings_conn = open_settings_connection();
            let mut current_logo = settings_conn.as_ref().and_then(read_configured_logo);
            let mut tray_builder = TrayIconBuilder::new()
                .menu(&menu)
                .tooltip("IrisNotes Quick Search")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "show" => {
                        show_window(app);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::Click { .. } = event {
                        toggle_window(tray.app_handle());
                    }
                });

            if let Some(icon) = tray_icon_for(current_logo.as_deref()) {
                tray_builder = tray_builder.icon(icon);
            }

            let tray = tray_builder.build(app)?;

            // Follow logo changes made in the main app while we run
            std::thread::spawn(move || loop {
                std::thread::sleep(std::time::Duration::from_secs(3));
                if settings_conn.is_none() {
                    settings_conn = open_settings_connection();
                }
                let Some(conn) = settings_conn.as_ref() else { continue };
                let logo = read_configured_logo(conn);
                if logo != current_logo {
                    if let Some(icon) = tray_icon_for(logo.as_deref()) {
                        let _ = tray.set_icon(Some(icon));
                    }
                    current_logo = logo;
                }
            });

            if let Some(window) = app.get_webview_window("main") {
                let window_clone = window.clone();
                window.on_window_event(move |event| match event {
                    // Closing hides (the tray keeps the app alive)
                    WindowEvent::CloseRequested { api, .. } => {
                        api.prevent_close();
                        let _ = window_clone.hide();
                    }
                    // Like a launcher: clicking elsewhere dismisses it
                    WindowEvent::Focused(false) => {
                        let _ = window_clone.hide();
                    }
                    _ => {}
                });

                // `--hidden` (autostart at login) preloads without showing
                if !std::env::args().any(|a| a == "--hidden") {
                    show_window(app.handle());
                }
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn renders_every_logo_variant() {
        for (id, _) in LOGOS {
            let icon = tray_icon_for(Some(id)).unwrap_or_else(|| panic!("{id} did not render"));
            assert!(icon.width() > 0 && icon.height() > 0, "{id}");
        }
    }

    #[test]
    fn unknown_logo_falls_back_to_default() {
        assert!(tray_icon_for(Some("no-such-logo")).is_some());
        assert!(tray_icon_for(None).is_some());
    }

    #[test]
    fn reads_logo_and_legacy_field_from_settings() {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch("CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)").unwrap();
        assert_eq!(read_configured_logo(&conn), None);

        let set = |json: &str| {
            conn.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('branding', ?1)", [json]).unwrap();
        };
        set(r#"{"activityBarLogo":"logo-white","quickTrayLogo":"logo-purple"}"#);
        assert_eq!(read_configured_logo(&conn).as_deref(), Some("logo-white"));
        set(r#"{"logo":"iris-detailed-blue"}"#);
        assert_eq!(read_configured_logo(&conn).as_deref(), Some("iris-detailed-blue"));
    }
}
