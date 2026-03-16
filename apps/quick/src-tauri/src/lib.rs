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
    /// Free text for title search
    title: String,
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
    let mut title_parts = Vec::new();
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
            title_parts.push(token);
        }
    }

    let title = title_parts.join(" ");
    ParsedQuery { title, content, book, section, root_only }
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
    if parsed.title.is_empty() && parsed.content.is_none() && parsed.book.is_none() && parsed.section.is_none() && !parsed.root_only {
        return Ok(vec![]);
    }

    let title_lower = escape_like(&parsed.title.to_lowercase());
    let has_title: i32 = if !parsed.title.is_empty() { 1 } else { 0 };

    // Build FTS query from content filter for content search
    let content_filter = escape_like(&parsed.content.unwrap_or_default());
    let content_fts = content_filter
        .split_whitespace()
        .map(|word| format!("{}*", word.replace('"', "")))
        .collect::<Vec<_>>()
        .join(" ");
    let has_content: i32 = if !content_filter.is_empty() { 1 } else { 0 };

    let book_filter = escape_like(&parsed.book.unwrap_or_default());
    let section_filter = escape_like(&parsed.section.unwrap_or_default());
    let has_book_filter: i32 = if !book_filter.is_empty() { 1 } else { 0 };
    let has_section_filter: i32 = if !section_filter.is_empty() { 1 } else { 0 };
    let root_flag: i32 = if parsed.root_only { 1 } else { 0 };

    let sql = r#"
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
          -- Title filter (free text = title LIKE)
          AND (
              ?1 = 0 OR LOWER(i.title) LIKE '%' || ?2 || '%' ESCAPE '\'
          )
          -- Content filter (~content: FTS on content, with LIKE fallback)
          AND (
              ?3 = 0 OR i.id IN (
                  SELECT fts.item_id FROM items_fts fts
                  WHERE items_fts MATCH ?4
              )
              OR (?3 = 1 AND LOWER(i.content) LIKE '%' || ?5 || '%' ESCAPE '\')
          )
          -- Book filter (@book)
          AND (
              ?6 = 0 OR (
                  (p.type = 'book' AND LOWER(p.title) LIKE '%' || ?7 || '%' ESCAPE '\')
                  OR (pp.type = 'book' AND LOWER(pp.title) LIKE '%' || ?7 || '%' ESCAPE '\')
              )
          )
          -- Section filter (#section)
          AND (
              ?8 = 0 OR (
                  p.type = 'section' AND LOWER(p.title) LIKE '%' || ?9 || '%' ESCAPE '\'
              )
          )
          -- Root filter (/)
          AND (
              ?10 = 0 OR i.parent_id IS NULL
          )
        ORDER BY i.title
        LIMIT 30
    "#;

    let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;

    let results = stmt
        .query_map(
            rusqlite::params![
                &has_title,          // ?1
                &title_lower,        // ?2
                &has_content,        // ?3
                &content_fts,        // ?4 - FTS MATCH for content
                &content_filter,     // ?5 - LIKE fallback for content
                &has_book_filter,    // ?6
                &book_filter,        // ?7
                &has_section_filter, // ?8
                &section_filter,     // ?9
                &root_flag,          // ?10
            ],
            |row| {
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
            let match_type = if has_title == 1 && note_title.to_lowercase().contains(&title_lower) {
                "title"
            } else if has_content == 1 {
                "content"
            } else if root_flag == 1 {
                "root"
            } else if has_book_filter == 1 || has_section_filter == 1 {
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
        let _ = window.show();
        let _ = window.set_focus();
        // Emit event to clear search field
        let _ = window.emit("window-shown", ());
    }
}

// Load custom tray icon from config directory (or dev folder in debug mode)
// Supports both SVG and PNG formats
// Theme-specific icons: quick-tray-icon-dark.{svg,png} and quick-tray-icon-light.{svg,png}
fn load_custom_tray_icon() -> Option<Image<'static>> {
    let icon_path = get_tray_icon_path()?;
    
    if !icon_path.exists() {
        return None;
    }
    
    let file_bytes = std::fs::read(&icon_path).ok()?;
    
    // Check if it's an SVG file
    let extension = icon_path.extension()?.to_str()?;
    
    if extension.eq_ignore_ascii_case("svg") {
        // Render SVG to RGBA using resvg
        load_svg_icon(&file_bytes)
    } else {
        // Load PNG/other raster formats with image crate
        load_raster_icon(&file_bytes)
    }
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
    
    // Extensions to try, in order of preference (SVG first for quality)
    let extensions = ["svg", "png"];
    
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

        // Try theme-specific icons first (SVG then PNG)
        for ext in &extensions {
            let themed_path = project_root.join(format!("dev/quick-tray-icon{}.{}", theme_suffix, ext));
            if themed_path.exists() {
                return Some(themed_path);
            }
        }
        
        // Fall back to generic icons (SVG then PNG)
        for ext in &extensions {
            let dev_path = project_root.join(format!("dev/quick-tray-icon.{}", ext));
            if dev_path.exists() {
                return Some(dev_path);
            }
        }
    }
    
    // Production: check config dir
    let config_dir = dirs::config_dir()?.join("irisnotes");
    
    // Try theme-specific icons first (SVG then PNG)
    for ext in &extensions {
        let themed_path = config_dir.join(format!("quick-tray-icon{}.{}", theme_suffix, ext));
        if themed_path.exists() {
            return Some(themed_path);
        }
    }
    
    // Fall back to generic icons (SVG then PNG)
    for ext in &extensions {
        let config_path = config_dir.join(format!("quick-tray-icon.{}", ext));
        if config_path.exists() {
            return Some(config_path);
        }
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
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .manage(db_state)
        .invoke_handler(tauri::generate_handler![search_notes, open_note_in_main_app, hide_window, read_config])
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

            // Handle window close event - hide instead of closing (tray keeps app alive)
            if let Some(window) = app.get_webview_window("main") {
                let window_clone = window.clone();
                window.on_window_event(move |event| {
                    if let WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
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
