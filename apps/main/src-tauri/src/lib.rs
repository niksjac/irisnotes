// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
pub mod cli;

use notify::{Config, Event, RecommendedWatcher, RecursiveMode, Watcher};
use std::sync::mpsc;
use std::thread;
use std::time::{Duration, Instant};
use std::path::PathBuf;
use tauri::{AppHandle, Emitter, Manager};

// Embed the database schema at compile time
const DATABASE_SCHEMA: &str = include_str!("../../../../schema/base.sql");

// Helper function to determine if we're in development mode
fn is_development_mode() -> bool {
    cfg!(debug_assertions) || std::env::var("TAURI_ENV").as_deref() == Ok("dev")
}

// Helper function to get the appropriate config directory
fn get_config_dir(_app_handle: &AppHandle) -> Result<PathBuf, String> {
    if is_development_mode() {
        // In development mode, use ./dev/config relative to project root
        let exe_path = std::env::current_exe()
            .map_err(|e| format!("Failed to get exe path: {}", e))?;
        let mut project_root = exe_path.parent()
            .ok_or("Failed to get exe parent")?
            .to_path_buf();

        // Navigate up to find monorepo root (where pnpm-workspace.yaml exists)
        // We use pnpm-workspace.yaml instead of package.json because apps/main 
        // also has a package.json
        loop {
            if project_root.join("pnpm-workspace.yaml").exists() {
                break;
            }
            if !project_root.pop() {
                // Fallback: use current directory
                project_root = std::env::current_dir()
                    .map_err(|e| format!("Failed to get current dir: {}", e))?;
                break;
            }
        }

        let dev_config = project_root.join("dev");

        // Create the directory if it doesn't exist
        std::fs::create_dir_all(&dev_config)
            .map_err(|e| format!("Failed to create dev config directory: {}", e))?;

        Ok(dev_config)
    } else {
        // In production mode, use ~/.config/irisnotes/ (Linux) or platform equivalent
        let config_dir = dirs::config_dir()
            .ok_or("Failed to get system config directory")?
            .join("irisnotes");
        
        std::fs::create_dir_all(&config_dir)
            .map_err(|e| format!("Failed to create config directory: {}", e))?;
        
        Ok(config_dir)
    }
}

// Helper function to get the appropriate data directory for databases
// NOTE: Currently using the same directory as config (~/.config/irisnotes/) to keep
// everything in one place, matching the dev layout. If we want to follow XDG standards
// in the future, change dirs::config_dir() to dirs::data_dir() which would put the
// database in ~/.local/share/irisnotes/ on Linux instead.
fn get_data_dir(_app_handle: &AppHandle) -> Result<PathBuf, String> {
    if is_development_mode() {
        // In development mode, use ./dev relative to project root
        let exe_path = std::env::current_exe()
            .map_err(|e| format!("Failed to get exe path: {}", e))?;
        let mut project_root = exe_path.parent()
            .ok_or("Failed to get exe parent")?
            .to_path_buf();

        // Navigate up to find monorepo root (where pnpm-workspace.yaml exists)
        // We use pnpm-workspace.yaml instead of package.json because apps/main 
        // also has a package.json
        loop {
            if project_root.join("pnpm-workspace.yaml").exists() {
                break;
            }
            if !project_root.pop() {
                // Fallback: use current directory
                project_root = std::env::current_dir()
                    .map_err(|e| format!("Failed to get current dir: {}", e))?;
                break;
            }
        }

        let dev_data = project_root.join("dev");

        // Create the directory if it doesn't exist
        std::fs::create_dir_all(&dev_data)
            .map_err(|e| format!("Failed to create dev data directory: {}", e))?;

        Ok(dev_data)
    } else {
        // In production mode, use ~/.config/irisnotes/ (same as config dir for simplicity)
        let data_dir = dirs::config_dir()
            .ok_or("Failed to get system config directory")?
            .join("irisnotes");
        
        std::fs::create_dir_all(&data_dir)
            .map_err(|e| format!("Failed to create data directory: {}", e))?;
        
        Ok(data_dir)
    }
}

/// Initialize the database if it doesn't exist
/// Creates the schema from base.sql embedded at compile time
fn init_database(app_handle: &AppHandle) -> Result<(), String> {
    use rusqlite::Connection;
    
    let data_dir = get_data_dir(app_handle)?;
    let db_path = data_dir.join("notes.db");
    
    // Check if the database file already exists
    if db_path.exists() {
        // Database exists - check if it has tables
        let conn = Connection::open(&db_path)
            .map_err(|e| format!("Failed to open database: {}", e))?;
        
        let table_count: i32 = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='items'",
                [],
                |row| row.get(0),
            )
            .unwrap_or(0);
        
        if table_count > 0 {
            // Database is already initialized
            return Ok(());
        }
    }
    
    // Create new database with schema
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to create database: {}", e))?;
    
    conn.execute_batch(DATABASE_SCHEMA)
        .map_err(|e| format!("Failed to initialize database schema: {}", e))?;
    
    println!("Database initialized at: {}", db_path.display());
    Ok(())
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Check if running on Wayland
fn is_wayland() -> bool {
    std::env::var("WAYLAND_DISPLAY").is_ok() || std::env::var("XDG_SESSION_TYPE").as_deref() == Ok("wayland")
}

/// Read clipboard content with a specific MIME type/target
/// Uses wl-paste on Wayland, xclip on X11
#[tauri::command]
fn read_clipboard_target(target: String) -> Result<String, String> {
    use std::process::Command;

    let output = if is_wayland() {
        // Wayland: use wl-paste with -t for type
        Command::new("wl-paste")
            .args(["--no-newline", "-t", &target])
            .output()
            .map_err(|e| format!("Failed to run wl-paste: {}. Is wl-clipboard installed?", e))?
    } else {
        // X11: use xclip
        Command::new("xclip")
            .args(["-selection", "clipboard", "-target", &target, "-o"])
            .output()
            .map_err(|e| format!("Failed to run xclip: {}. Is xclip installed?", e))?
    };

    if output.status.success() {
        String::from_utf8(output.stdout)
            .map_err(|e| format!("Clipboard content is not valid UTF-8: {}", e))
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("Clipboard read failed: {}", stderr))
    }
}

/// List all available clipboard targets (MIME types)
#[tauri::command]
fn list_clipboard_targets() -> Result<Vec<String>, String> {
    use std::process::Command;

    let output = if is_wayland() {
        // Wayland: use wl-paste -l to list types
        Command::new("wl-paste")
            .args(["--list-types"])
            .output()
            .map_err(|e| format!("Failed to run wl-paste: {}. Is wl-clipboard installed?", e))?
    } else {
        // X11: use xclip with TARGETS
        Command::new("xclip")
            .args(["-selection", "clipboard", "-target", "TARGETS", "-o"])
            .output()
            .map_err(|e| format!("Failed to run xclip: {}. Is xclip installed?", e))?
    };

    if output.status.success() {
        let content = String::from_utf8_lossy(&output.stdout);
        Ok(content.lines().map(|s| s.to_string()).collect())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("Clipboard list failed: {}", stderr))
    }
}

/// Read VS Code editor data from clipboard
/// Handles both direct vscode-editor-data (X11) and embedded in chromium/x-web-custom-data (Wayland)
#[tauri::command]
fn read_vscode_editor_data() -> Result<String, String> {
    use std::process::Command;
    
    // First, try to read vscode-editor-data directly
    let targets = list_clipboard_targets()?;
    
    if targets.iter().any(|t| t == "vscode-editor-data") {
        return read_clipboard_target("vscode-editor-data".to_string());
    }
    
    // On Wayland/Chromium, vscode-editor-data is embedded in chromium/x-web-custom-data as UTF-16LE
    if targets.iter().any(|t| t == "chromium/x-web-custom-data") {
        let output = if is_wayland() {
            Command::new("wl-paste")
                .args(["--no-newline", "-t", "chromium/x-web-custom-data"])
                .output()
                .map_err(|e| format!("Failed to run wl-paste: {}", e))?
        } else {
            Command::new("xclip")
                .args(["-selection", "clipboard", "-target", "chromium/x-web-custom-data", "-o"])
                .output()
                .map_err(|e| format!("Failed to run xclip: {}", e))?
        };
        
        if output.status.success() {
            // The data is UTF-16LE encoded, decode it
            let bytes = &output.stdout;
            
            // Find "vscode-editor-data" marker and extract the JSON after it
            // The format is: ... "vscode-editor-data" (UTF-16LE) then length byte then JSON (UTF-16LE)
            let needle = "vscode-editor-data";
            
            // Convert bytes to UTF-16LE string for searching
            if bytes.len() >= 2 {
                let utf16_chars: Vec<u16> = bytes
                    .chunks_exact(2)
                    .filter_map(|chunk| {
                        if chunk.len() == 2 {
                            Some(u16::from_le_bytes([chunk[0], chunk[1]]))
                        } else {
                            None
                        }
                    })
                    .collect();
                
                let decoded = String::from_utf16_lossy(&utf16_chars);
                
                // Find the vscode-editor-data JSON - it starts with {"version":
                if let Some(start_idx) = decoded.find("vscode-editor-data") {
                    // Look for the JSON after the marker
                    let after_marker = &decoded[start_idx + needle.len()..];
                    if let Some(json_start) = after_marker.find("{\"version\":") {
                        let json_part = &after_marker[json_start..];
                        // Find the end of the JSON object
                        if let Some(end) = find_json_object_end(json_part) {
                            return Ok(json_part[..end].to_string());
                        }
                    }
                }
            }
        }
    }
    
    Err("vscode-editor-data not found in clipboard".to_string())
}

/// Find the end of a JSON object by counting braces
fn find_json_object_end(s: &str) -> Option<usize> {
    let mut depth = 0;
    let mut in_string = false;
    let mut escape_next = false;
    
    for (i, c) in s.chars().enumerate() {
        if escape_next {
            escape_next = false;
            continue;
        }
        
        match c {
            '\\' if in_string => escape_next = true,
            '"' => in_string = !in_string,
            '{' if !in_string => depth += 1,
            '}' if !in_string => {
                depth -= 1;
                if depth == 0 {
                    return Some(i + 1);
                }
            }
            _ => {}
        }
    }
    None
}

#[tauri::command]
async fn open_app_config_folder(app_handle: tauri::AppHandle) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;

    let app_config_dir = get_config_dir(&app_handle)?;

    // Open the directory using the opener plugin
    app_handle
        .opener()
        .open_path(app_config_dir.to_string_lossy().to_string(), None::<&str>)
        .map_err(|e| format!("Failed to open app config folder: {}", e))?;

    Ok(())
}

#[tauri::command]
async fn read_config(app_handle: tauri::AppHandle, filename: String) -> Result<String, String> {
    let app_config_dir = get_config_dir(&app_handle)?;
    
    // Determine the base name (without extension) and try TOML first, then JSON
    let base_name = filename
        .strip_suffix(".json")
        .or_else(|| filename.strip_suffix(".toml"))
        .unwrap_or(&filename);
    
    let toml_path = app_config_dir.join(format!("{}.toml", base_name));
    let json_path = app_config_dir.join(format!("{}.json", base_name));
    
    if toml_path.exists() {
        // Read TOML and convert to JSON for frontend
        let toml_content = std::fs::read_to_string(&toml_path)
            .map_err(|e| format!("Failed to read {}.toml: {}", base_name, e))?;
        let value: toml::Value = toml::from_str(&toml_content)
            .map_err(|e| format!("Failed to parse TOML: {}", e))?;
        serde_json::to_string(&value)
            .map_err(|e| format!("Failed to convert TOML to JSON: {}", e))
    } else if json_path.exists() {
        // Fall back to JSON for backward compatibility
        std::fs::read_to_string(&json_path)
            .map_err(|e| format!("Failed to read config file: {}", e))
    } else {
        Err(format!("Config file {}.toml does not exist", base_name))
    }
}

#[tauri::command]
async fn write_config(
    app_handle: tauri::AppHandle,
    filename: String,
    content: String,
) -> Result<(), String> {
    let app_config_dir = get_config_dir(&app_handle)?;
    
    // Determine the base name and always write as TOML
    let base_name = filename
        .strip_suffix(".json")
        .or_else(|| filename.strip_suffix(".toml"))
        .unwrap_or(&filename);
    
    let toml_path = app_config_dir.join(format!("{}.toml", base_name));
    
    // Parse JSON from frontend and convert to TOML
    let json_value: serde_json::Value = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;
    let toml_value: toml::Value = serde_json::from_value(
        serde_json::to_value(&json_value).unwrap()
    ).map_err(|e| format!("Failed to convert to TOML value: {}", e))?;
    let toml_string = toml::to_string_pretty(&toml_value)
        .map_err(|e| format!("Failed to serialize TOML: {}", e))?;
    std::fs::write(&toml_path, toml_string)
        .map_err(|e| format!("Failed to write {}.toml: {}", base_name, e))
}

#[tauri::command]
async fn setup_config_watcher(app_handle: AppHandle) -> Result<(), String> {
    let app_config_dir = get_config_dir(&app_handle)?;

    // Create a channel to receive the events
    let (tx, rx) = mpsc::channel();

    // Create a watcher object, delivering debounced events
    let mut watcher = RecommendedWatcher::new(
        move |res: Result<Event, notify::Error>| match res {
            Ok(event) => {
                if let Err(e) = tx.send(event) {
                    eprintln!("Failed to send file event: {}", e);
                }
            }
            Err(e) => eprintln!("File watch error: {:?}", e),
        },
        Config::default(),
    )
    .map_err(|e| format!("Failed to create file watcher: {}", e))?;

    // Watch the config directory
    watcher
        .watch(&app_config_dir, RecursiveMode::NonRecursive)
        .map_err(|e| format!("Failed to watch config directory: {}", e))?;

    // Spawn a thread to handle file events
    let app_handle_clone = app_handle.clone();
    thread::spawn(move || {
        // Keep the watcher alive
        let _watcher = watcher;

        let mut last_config_event = Instant::now();
        let debounce_duration = Duration::from_millis(100); // 100ms debounce

        for event in rx {
            if let Some(path) = event.paths.first() {
                let file_name = path.file_name();
                let is_config_file = file_name == Some(std::ffi::OsStr::new("config.json"))
                    || file_name == Some(std::ffi::OsStr::new("config.toml"));
                
                if is_config_file {
                    let now = Instant::now();
                    if now.duration_since(last_config_event) > debounce_duration {
                        last_config_event = now;
                        if let Err(e) = app_handle_clone.emit("config-file-changed", ()) {
                            eprintln!("Failed to emit config change event: {}", e);
                        }
                    }
                }
            }
        }
    });

    Ok(())
}

#[tauri::command]
async fn get_database_path(app_handle: tauri::AppHandle) -> Result<String, String> {
    let data_dir = get_data_dir(&app_handle)?;
    let db_path = data_dir.join("notes.db");
    Ok(db_path.to_string_lossy().to_string())
}

#[tauri::command]
async fn get_app_info(app_handle: tauri::AppHandle) -> Result<serde_json::Value, String> {
    let config_dir = get_config_dir(&app_handle)?;
    let data_dir = get_data_dir(&app_handle)?;
    let is_dev = is_development_mode();

    Ok(serde_json::json!({
        "development_mode": is_dev,
        "config_dir": config_dir.to_string_lossy(),
        "data_dir": data_dir.to_string_lossy(),
        "database_path": data_dir.join("notes.db").to_string_lossy()
    }))
}

/// Get the assets directory path
#[tauri::command]
async fn get_assets_dir(app_handle: tauri::AppHandle) -> Result<String, String> {
    let data_dir = get_data_dir(&app_handle)?;
    let assets_dir = data_dir.join("assets");
    std::fs::create_dir_all(&assets_dir)
        .map_err(|e| format!("Failed to create assets directory: {}", e))?;
    Ok(assets_dir.to_string_lossy().to_string())
}

/// Save image data to the assets directory, returning the filename.
/// The image is saved as `{uuid}.{ext}` under the assets dir.
#[tauri::command]
async fn save_image_asset(
    app_handle: tauri::AppHandle,
    data: Vec<u8>,
    extension: String,
) -> Result<String, String> {
    // Validate extension (only allow image types)
    let ext = extension.to_lowercase();
    let allowed = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico"];
    if !allowed.contains(&ext.as_str()) {
        return Err(format!("Unsupported image extension: {}", ext));
    }

    let data_dir = get_data_dir(&app_handle)?;
    let assets_dir = data_dir.join("assets");
    std::fs::create_dir_all(&assets_dir)
        .map_err(|e| format!("Failed to create assets directory: {}", e))?;

    // Generate a unique filename
    let filename = format!(
        "{:x}.{}",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_nanos(),
        ext
    );
    let file_path = assets_dir.join(&filename);

    std::fs::write(&file_path, &data)
        .map_err(|e| format!("Failed to write image: {}", e))?;

    Ok(filename)
}

/// Open the assets directory in the system file manager.
/// On macOS, reveals the specific file. On Linux/Windows, opens the directory.
#[tauri::command]
async fn reveal_asset(app_handle: tauri::AppHandle, filename: String) -> Result<(), String> {
    // Sanitise: reject path traversal
    if filename.contains("..") || filename.contains('/') || filename.contains('\\') {
        return Err("Invalid filename".to_string());
    }
    let data_dir = get_data_dir(&app_handle)?;
    let assets_dir = data_dir.join("assets");
    let file_path = assets_dir.join(&filename);

    #[cfg(target_os = "linux")]
    {
        // Try dbus-based file selection first (works with Nautilus, Dolphin, etc.)
        let dbus_result = std::process::Command::new("dbus-send")
            .args([
                "--session",
                "--dest=org.freedesktop.FileManager1",
                "--type=method_call",
                "/org/freedesktop/FileManager1",
                "org.freedesktop.FileManager1.ShowItems",
                &format!("array:string:file://{}", file_path.to_string_lossy()),
                "string:",
            ])
            .output();
        if dbus_result.is_ok() && dbus_result.unwrap().status.success() {
            return Ok(());
        }
        // Fallback: open the assets directory
        std::process::Command::new("xdg-open")
            .arg(&assets_dir)
            .spawn()
            .map_err(|e| format!("Failed to open directory: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg("-R")
            .arg(&file_path)
            .spawn()
            .map_err(|e| format!("Failed to reveal file: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg("/select,")
            .arg(&file_path)
            .spawn()
            .map_err(|e| format!("Failed to reveal file: {}", e))?;
    }

    Ok(())
}

/// Read an image file from an arbitrary path and return its bytes.
/// Only allows known image extensions.
#[tauri::command]
async fn read_image_file(path: String) -> Result<Vec<u8>, String> {
    let p = std::path::Path::new(&path);
    let ext = p.extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase())
        .unwrap_or_default();
    let allowed = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico"];
    if !allowed.contains(&ext.as_str()) {
        return Err(format!("Not a supported image type: {}", ext));
    }
    std::fs::read(&path)
        .map_err(|e| format!("Failed to read image file: {}", e))
}

/// Remove asset files not referenced by any note's content.
/// Returns the number of deleted files.
#[tauri::command]
async fn cleanup_orphaned_assets(app_handle: tauri::AppHandle) -> Result<u32, String> {
    use rusqlite::Connection;
    use std::collections::HashSet;

    let data_dir = get_data_dir(&app_handle)?;
    let db_path = data_dir.join("notes.db");
    let assets_dir = data_dir.join("assets");

    if !assets_dir.exists() {
        return Ok(0);
    }

    // 1. Collect all asset filenames referenced in any note's content
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("Failed to open database: {}", e))?;

    let mut stmt = conn
        .prepare("SELECT content FROM items WHERE type = 'note' AND content IS NOT NULL")
        .map_err(|e| format!("Failed to prepare query: {}", e))?;

    let mut referenced: HashSet<String> = HashSet::new();
    let rows = stmt
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(|e| format!("Failed to query notes: {}", e))?;

    for row in rows {
        if let Ok(content) = row {
            // Find all asset://localhost/{filename} references
            let prefix = "asset://localhost/";
            let mut search_from = 0;
            while let Some(start) = content[search_from..].find(prefix) {
                let abs_start = search_from + start + prefix.len();
                // Filename ends at next quote or whitespace
                let end = content[abs_start..]
                    .find(|c: char| c == '"' || c == '\'' || c == ' ' || c == '<' || c == '>')
                    .map(|i| abs_start + i)
                    .unwrap_or(content.len());
                let filename = &content[abs_start..end];
                if !filename.is_empty() {
                    referenced.insert(filename.to_string());
                }
                search_from = end;
            }
        }
    }

    // 2. Walk the assets directory and delete files not in the referenced set
    let mut deleted = 0u32;
    let entries = std::fs::read_dir(&assets_dir)
        .map_err(|e| format!("Failed to read assets directory: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let path = entry.path();
        if !path.is_file() {
            continue;
        }
        if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
            if !referenced.contains(name) {
                if std::fs::remove_file(&path).is_ok() {
                    deleted += 1;
                }
            }
        }
    }

    Ok(deleted)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            // Another instance tried to start - check for --open-note argument
            for arg in &args {
                if let Some(note_id) = arg.strip_prefix("--open-note=") {
                    // Emit to the specific window
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.emit("open-note-from-quick", note_id.to_string());
                    }
                }
            }
            
            // Focus our window
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_global_shortcut::Builder::default().build())
        .register_uri_scheme_protocol("asset", |_app, request| {
            // Serve images from the assets directory
            // URL format: asset://localhost/{filename}
            let uri = request.uri();
            let path_str = uri.path().trim_start_matches('/');

            // Sanitise: reject path traversal
            if path_str.contains("..") || path_str.contains('/') || path_str.contains('\\') {
                return tauri::http::Response::builder()
                    .status(400)
                    .body(Vec::new())
                    .unwrap();
            }

            // Resolve assets dir
            let data_dir = if is_development_mode() {
                let exe_path = std::env::current_exe().unwrap_or_default();
                let mut root = exe_path.parent().unwrap_or(std::path::Path::new(".")).to_path_buf();
                loop {
                    if root.join("pnpm-workspace.yaml").exists() { break; }
                    if !root.pop() { root = std::env::current_dir().unwrap_or_default(); break; }
                }
                root.join("dev")
            } else {
                dirs::config_dir().unwrap_or_default().join("irisnotes")
            };
            let file_path = data_dir.join("assets").join(path_str);

            match std::fs::read(&file_path) {
                Ok(data) => {
                    let mime = match file_path.extension().and_then(|e| e.to_str()) {
                        Some("png") => "image/png",
                        Some("jpg") | Some("jpeg") => "image/jpeg",
                        Some("gif") => "image/gif",
                        Some("webp") => "image/webp",
                        Some("svg") => "image/svg+xml",
                        Some("bmp") => "image/bmp",
                        Some("ico") => "image/x-icon",
                        _ => "application/octet-stream",
                    };
                    tauri::http::Response::builder()
                        .status(200)
                        .header("Content-Type", mime)
                        .body(data)
                        .unwrap()
                }
                Err(_) => {
                    tauri::http::Response::builder()
                        .status(404)
                        .body(Vec::new())
                        .unwrap()
                }
            }
        })
        .setup(|app| {
            // Initialize database if it doesn't exist
            if let Err(e) = init_database(app.handle()) {
                eprintln!("Warning: Failed to initialize database: {}", e);
            }
            
            // Check for --open-note argument on startup (from quick app launching us)
            let args: Vec<String> = std::env::args().collect();
            
            for arg in &args {
                if let Some(note_id) = arg.strip_prefix("--open-note=") {
                    let note_id = note_id.to_string();
                    let app_handle = app.handle().clone();
                    // Emit event after a short delay to let frontend initialize
                    std::thread::spawn(move || {
                        std::thread::sleep(std::time::Duration::from_millis(500));
                        let _ = app_handle.emit("open-note-from-quick", note_id);
                    });
                    break;
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            read_config,
            write_config,
            setup_config_watcher,
            open_app_config_folder,
            get_database_path,
            get_app_info,
            get_assets_dir,
            save_image_asset,
            read_image_file,
            reveal_asset,
            cleanup_orphaned_assets,
            read_clipboard_target,
            list_clipboard_targets,
            read_vscode_editor_data
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
