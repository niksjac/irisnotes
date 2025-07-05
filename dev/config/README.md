# Local Development Configuration

This directory contains configuration files for local development that don't require external data sources.

## Files

- `app-config.json` - Main application configuration for development
- `notes.db` - SQLite database with sample notes (auto-generated on first run)
- `notes/` - Directory for file-system storage backend
- `sample-notes.json` - Sample notes data for testing

## Setup

The development environment is configured to use local storage by default:

1. **SQLite Backend**: Uses `./dev/config/notes.db`
2. **File System Backend**: Uses `./dev/config/notes/` directory
3. **Debug Mode**: Enabled with example notes

## Usage

1. Copy `app-config.json` to your Tauri app data directory or let the app create it automatically
2. The app will use these local paths for all storage operations
3. Sample data will be created automatically when you first run the app

## Customization

You can modify `app-config.json` to:
- Change storage backend (`sqlite`, `file-system`, or `cloud`)
- Adjust file paths
- Toggle debug features
- Configure editor settings

## Note

This configuration is designed for local development only. Do not use these settings in production.