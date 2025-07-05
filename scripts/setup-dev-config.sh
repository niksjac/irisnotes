#!/bin/bash

# Setup script for local development configuration
echo "Setting up local development configuration..."

# Create config directory structure
mkdir -p dev/config/notes

# Copy default configuration if it doesn't exist
if [ ! -f "dev/config/app-config.json" ]; then
    echo "Creating default development configuration..."
    cat > dev/config/app-config.json << 'EOF'
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
  "production": {}
}
EOF
fi

# Create default note if it doesn't exist
if [ ! -f "dev/config/default-note.txt" ]; then
    echo "Creating default development note..."
    cat > dev/config/default-note.txt << 'EOF'
# Welcome to IrisNotes Development

This is the default note for local development mode.

## Development Features

- Local configuration directory: `./dev/config/`
- Local SQLite database: `./dev/config/notes.db`
- Local notes directory: `./dev/config/notes/`
- Sample data included for testing

## Getting Started

1. Edit this note to test the editor
2. Create new notes using the + button
3. Test different storage backends in settings
4. Try switching between rich and source modes

This setup keeps your development environment isolated from production data.
EOF
fi

# Create sample note if it doesn't exist
if [ ! -f "dev/config/notes/Untitled_Note.txt" ]; then
    echo "Creating sample development note..."
    mkdir -p dev/config/notes
    cat > dev/config/notes/Untitled_Note.txt << 'EOF'
# Sample Development Note

This is a sample note in the local development environment.

## Testing Features

- Rich text editing
- Source mode editing
- Note management
- Storage backend switching

Feel free to modify or delete this note during development.
EOF
fi

echo "✓ Local development configuration set up successfully!"
echo ""
echo "Usage:"
echo "  - Development mode automatically uses ./dev/config/ for all data"
echo "  - Production mode uses ~/.config/irisnotes/ by default"
echo "  - Custom paths can be configured in the UI settings (production only)"
echo ""
echo "Files created:"
echo "  - dev/config/app-config.json (configuration)"
echo "  - dev/config/default-note.txt (default note)"
echo "  - dev/config/notes/ (notes directory)"
echo "  - dev/config/notes.db (SQLite database - created on first run)"