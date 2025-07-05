# Configuration System

IrisNotes uses a flexible configuration system that supports both development and production environments with isolated data storage.

## Overview

The configuration system automatically detects whether you're running in development or production mode and uses appropriate data directories to keep your environments isolated.

## Development Mode

In development mode, all configuration and data files are stored locally in the project directory under `./dev/config/`.

### Features

- **Local Configuration**: Uses `./dev/config/app-config.json`
- **Local Database**: SQLite database at `./dev/config/notes.db`
- **Local Notes Directory**: File system storage at `./dev/config/notes/`
- **Sample Data**: Includes sample notes for testing
- **Isolation**: Completely isolated from production data

### Setup

1. **Automatic Setup**: Run the development server and the local config will be created automatically
2. **Manual Setup**: Run the setup script:
   ```bash
   ./scripts/setup-dev-config.sh
   ```

### Directory Structure

```
dev/
├── config/
│   ├── app-config.json       # Development configuration
│   ├── default-note.txt      # Default note content
│   ├── notes.db             # SQLite database (created on first run)
│   ├── notes/               # Notes directory for file-system backend
│   │   └── Untitled_Note.txt # Sample note
│   └── sample-notes.json    # Sample data for testing
└── .gitignore               # Git ignore rules for dev files
```

## Production Mode

In production mode, the app uses system-appropriate directories with full customization options.

### Default Paths

- **Linux**: `~/.config/irisnotes/`
- **Configuration**: `~/.config/irisnotes/app-config.json`
- **Database**: `~/.config/irisnotes/notes.db`
- **Notes Directory**: `~/.config/irisnotes/notes/`

### Custom Paths

Users can override default paths through the UI settings:

1. Open the Configuration view in the app
2. Navigate to the "Custom Paths" section
3. Set custom paths for:
   - Config Directory
   - Database Path
   - Notes Directory

### Migration from Old Configuration

If you have an existing configuration at `/home/niklas/.config/com.irisnotes.app/`, you can:

1. Copy the configuration to the new location:
   ```bash
   cp -r ~/.config/com.irisnotes.app/* ~/.config/irisnotes/
   ```
2. Update the app-config.json paths if needed
3. The app will automatically detect and use the new configuration

## Configuration File Format

```json
{
  "editor": {
    "lineWrapping": false
  },
  "debug": {
    "enableExampleNote": true
  },
  "storage": {
    "backend": "sqlite",
    "sqlite": {
      "database_path": "./dev/config/notes.db"
    },
    "fileSystem": {
      "notes_directory": "./dev/config/notes/"
    },
    "cloud": {
      "provider": "google-drive"
    }
  },
  "development": {
    "useLocalConfig": true,
    "configPath": "./dev/config/"
  },
  "production": {
    "customConfigPath": "/custom/path/to/config/",
    "customDatabasePath": "/custom/path/to/notes.db",
    "customNotesPath": "/custom/path/to/notes/"
  }
}
```

## Storage Backends

### SQLite (Default)

- **Development**: `./dev/config/notes.db`
- **Production**: `~/.config/irisnotes/notes.db`
- **Custom**: User-defined path in production

### File System

- **Development**: `./dev/config/notes/`
- **Production**: `~/.config/irisnotes/notes/`
- **Custom**: User-defined path in production

### Cloud Storage

- **Providers**: Google Drive, Dropbox, OneDrive
- **Status**: Not yet implemented
- **Configuration**: Provider selection in UI

## Environment Detection

The app automatically detects the environment:

- **Development**: `import.meta.env.DEV === true`
- **Production**: `import.meta.env.DEV === false`

## Best Practices

1. **Development**: Use local configuration for isolated testing
2. **Production**: Use default paths unless you have specific requirements
3. **Custom Paths**: Always use absolute paths for custom configuration
4. **Backups**: Regularly backup your configuration and data directories
5. **Migration**: Test configuration changes in development first

## Troubleshooting

### Configuration Not Found

If the app can't find your configuration:

1. Check if the config directory exists
2. Verify file permissions
3. Run the setup script: `./scripts/setup-dev-config.sh`
4. Check the console for error messages

### Database Issues

If you encounter database issues:

1. Check if the database file exists
2. Verify write permissions to the directory
3. Delete the database file to recreate it (you'll lose data)
4. Check the configured database path in app-config.json

### Path Issues

If custom paths don't work:

1. Use absolute paths (starting with `/` or `~`)
2. Ensure the directory exists and is writable
3. Check that the path doesn't contain special characters
4. Restart the app after changing paths

## API Reference

### Configuration Hook

```typescript
import { useConfig } from '../hooks/use-config';

const { config, loading, updateConfig } = useConfig();
```

### Update Configuration

```typescript
await updateConfig({
  storage: {
    backend: 'sqlite',
    sqlite: {
      database_path: '/custom/path/notes.db'
    }
  }
});
```

### Production Path Settings

```typescript
await updateConfig({
  production: {
    customConfigPath: '/custom/config/path/',
    customDatabasePath: '/custom/database/path/notes.db',
    customNotesPath: '/custom/notes/path/'
  }
});
```