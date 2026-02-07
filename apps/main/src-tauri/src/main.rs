// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use clap::Parser;

fn main() {
    // Parse CLI arguments
    let cli = irisnotes_lib::cli::Cli::parse();

    // If --open-note is provided, start the GUI (Tauri handles this argument)
    // If a CLI command was provided, run it and exit
    if cli.open_note.is_none() && cli.command.is_some() {
        if let Err(e) = irisnotes_lib::cli::run_cli(cli) {
            if e != "no-command" {
                eprintln!("Error: {}", e);
                std::process::exit(1);
            }
        } else {
            // CLI command succeeded, exit
            return;
        }
    }

    // No CLI command or --open-note provided - start the GUI
    irisnotes_lib::run()
}
