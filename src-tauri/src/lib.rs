// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use notify::{Config, Event, RecommendedWatcher, RecursiveMode, Watcher};
use std::sync::mpsc;
use std::thread;
use std::time::{Duration, Instant};
use std::path::PathBuf;
use tauri::{AppHandle, Emitter, Manager};

// Helper function to determine if we're in development mode
fn is_development_mode() -> bool {
    cfg!(debug_assertions) || std::env::var("TAURI_ENV").as_deref() == Ok("dev")
}

// Helper function to get the appropriate config directory
fn get_config_dir(app_handle: &AppHandle) -> Result<PathBuf, String> {
    if is_development_mode() {
        // In development mode, use ./dev/config relative to project root
        let exe_path = std::env::current_exe()
            .map_err(|e| format!("Failed to get exe path: {}", e))?;
        let mut project_root = exe_path.parent()
            .ok_or("Failed to get exe parent")?
            .to_path_buf();

        // Navigate up to find project root (where package.json exists)
        loop {
            if project_root.join("package.json").exists() {
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
        // In production mode, use platform-specific config directory
        app_handle
            .path()
            .app_config_dir()
            .map_err(|e| format!("Failed to get app config dir: {}", e))
    }
}

// Helper function to get the appropriate data directory for databases
fn get_data_dir(app_handle: &AppHandle) -> Result<PathBuf, String> {
    if is_development_mode() {
        // In development mode, use ./dev relative to project root
        let exe_path = std::env::current_exe()
            .map_err(|e| format!("Failed to get exe path: {}", e))?;
        let mut project_root = exe_path.parent()
            .ok_or("Failed to get exe parent")?
            .to_path_buf();

        // Navigate up to find project root (where package.json exists)
        loop {
            if project_root.join("package.json").exists() {
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
        // In production mode, use platform-specific data directory
        app_handle
            .path()
            .app_data_dir()
            .map_err(|e| format!("Failed to get app data dir: {}", e))
    }
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
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
    let config_path = app_config_dir.join(filename);

    if !config_path.exists() {
        return Err("Config file does not exist".to_string());
    }

    std::fs::read_to_string(config_path).map_err(|e| format!("Failed to read config file: {}", e))
}

#[tauri::command]
async fn write_config(
    app_handle: tauri::AppHandle,
    filename: String,
    content: String,
) -> Result<(), String> {
    let app_config_dir = get_config_dir(&app_handle)?;
    let config_path = app_config_dir.join(filename);

    std::fs::write(config_path, content).map_err(|e| format!("Failed to write config file: {}", e))
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

        let mut last_event_time = Instant::now();
        let debounce_duration = Duration::from_millis(100); // 100ms debounce

        for event in rx {
            if let Some(path) = event.paths.first() {
                if path.file_name() == Some(std::ffi::OsStr::new("config.json")) {
                    let now = Instant::now();

                    // Debounce rapid file events
                    if now.duration_since(last_event_time) > debounce_duration {
                        last_event_time = now;

                        // Emit an event to the frontend when config file changes
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_global_shortcut::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            greet,
            read_config,
            write_config,
            setup_config_watcher,
            open_app_config_folder,
            get_database_path,
            get_app_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
