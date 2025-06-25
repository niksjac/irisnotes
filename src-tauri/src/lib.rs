// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use notify::{Config, Event, RecommendedWatcher, RecursiveMode, Watcher};
use std::sync::mpsc;
use std::thread;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, Manager};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn read_config(app_handle: tauri::AppHandle, filename: String) -> Result<String, String> {
    let app_config_dir = app_handle
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get app config dir: {}", e))?;

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
    let app_config_dir = app_handle
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get app config dir: {}", e))?;

    // Create the config directory if it doesn't exist
    std::fs::create_dir_all(&app_config_dir)
        .map_err(|e| format!("Failed to create config directory: {}", e))?;

    let config_path = app_config_dir.join(filename);

    std::fs::write(config_path, content).map_err(|e| format!("Failed to write config file: {}", e))
}

#[tauri::command]
async fn setup_config_watcher(app_handle: AppHandle) -> Result<(), String> {
    let app_config_dir = app_handle
        .path()
        .app_config_dir()
        .map_err(|e| format!("Failed to get app config dir: {}", e))?;

    // Ensure the config directory exists
    if !app_config_dir.exists() {
        std::fs::create_dir_all(&app_config_dir)
            .map_err(|e| format!("Failed to create config directory: {}", e))?;
    }

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
                if path.file_name() == Some(std::ffi::OsStr::new("app-config.json")) {
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
            setup_config_watcher
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
