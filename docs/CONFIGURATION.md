# IrisNotes Configuration System

This document describes how configuration works in IrisNotes, following the VS Code pattern of a single config file as the source of truth.

## Overview

IrisNotes uses a **VS Code-style configuration system**:

- **Single `config.toml` file** is the source of truth
- **File watcher** detects external changes and reloads immediately
- **UI changes** write directly to the file
- **No split-brain** between localStorage and file
- **TOML format** for human-readable, commentable config

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    config.toml                       │
│                 (source of truth)                    │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
   File Watcher              UI Change
   (external edit)        (toggle button)
        │                         │
        ▼                         ▼
   Rust detects           updateConfig()
   change, emits          writes to file
   event                        │
        │                         │
        └────────────┬────────────┘
                     ▼
         useConfig reloads config
                     │
                     ▼
              React re-renders
```

## File Locations

| Environment | Config Location |
|-------------|-----------------|
| Development | `./dev/config.toml` (project root) |
| Production  | `~/.config/irisnotes/config.toml` (Linux) |
|             | `~/Library/Application Support/irisnotes/config.toml` (macOS) |
|             | `%APPDATA%\irisnotes\config.toml` (Windows) |

## Configuration Format

IrisNotes uses **TOML** (Tom's Obvious Minimal Language) for configuration:

```toml
# IrisNotes Configuration
# Comments are supported!

theme = "dark"

[editor]
lineWrapping = false
toolbarVisible = true

[debug]
enableExampleNote = false

[storage]
backend = "sqlite"

[storage.sqlite]
database_path = "./dev/notes.db"

[layout]
sidebarWidth = 300
sidebarCollapsed = false
activityBarVisible = true
```

### Why TOML?

| Feature | TOML | JSON |
|---------|------|------|
| Comments | ✅ `# comment` | ❌ |
| Trailing commas | ✅ | ❌ |
| Multi-line strings | ✅ `"""..."""` | ❌ |
| Readable nesting | ✅ `[section]` | ❌ Deep braces |
| Rust-native | ✅ | Via serde |

### Backward Compatibility

If `config.toml` doesn't exist but `config.json` does, the app will read from JSON. Once you create `config.toml`, it takes priority.

### Theme Options

| Value | Description |
|-------|-------------|
| `"dark"` | Dark mode (default) |
| `"light"` | Light mode |

### Editor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `lineWrapping` | boolean | `false` | Wrap long lines in editor |
| `toolbarVisible` | boolean | `true` | Show editor toolbar |

### Storage Options

| Backend | Description |
|---------|-------------|
| `"sqlite"` | SQLite database (default) |
| `"json-single"` | Single JSON file |
| `"json-hybrid"` | Structure + content files |

## Implementation Details

### Rust Backend (`src-tauri/src/lib.rs`)

**Commands:**
- `read_config(filename)` - Reads config.toml (or config.json fallback), returns JSON to frontend
- `write_config(filename, content)` - Receives JSON from frontend, writes as TOML
- `setup_config_watcher()` - Watches for changes to config.toml or config.json

**TOML ↔ JSON Conversion:**
The Rust backend handles format conversion transparently:
- Read: TOML file → parsed → converted to JSON → sent to frontend
- Write: JSON from frontend → converted to TOML → written to file

**File Watcher:**
- Uses `notify` crate with 100ms debounce
- Watches config directory (non-recursive)
- Emits `config-file-changed` event to frontend

### React Frontend

**`useConfig` hook (`src/hooks/use-config.ts`):**
```typescript
const { config, loading, updateConfig, loadConfig } = useConfig();

// Read a value
const theme = config.theme;

// Update a value (writes to file)
await updateConfig({ theme: "light" });
```

**Event Listener:**
- Listens for `config-file-changed` events
- Calls `loadConfig()` to reload from file
- Triggers React re-render

### Flash Prevention

To prevent a flash of wrong theme on page load:

1. **`index.html`** has `class="dark"` by default on `<html>`
2. **Inline `<script>`** checks localStorage hint and removes class if needed
3. **Inline `<style>`** provides critical CSS for immediate background color
4. **localStorage** is just a hint, synced from config after load

```html
<html class="dark">
  <head>
    <style>
      html.dark { background-color: #111827; }
      html:not(.dark) { background-color: #f9fafb; }
    </style>
    <script>
      var saved = localStorage.getItem('darkMode');
      if (saved === 'false') {
        document.documentElement.classList.remove('dark');
      }
    </script>
  </head>
</html>
```

## Making Changes

### From UI

Click the theme toggle in the activity bar:
1. `toggleDarkMode()` is called
2. `updateConfig({ theme: "light" })` writes to file
3. File watcher detects change
4. Config reloads, UI updates

### From File (External Editor)

1. Open `dev/config.json` in any editor
2. Change `"theme": "light"`
3. Save the file
4. File watcher detects change
5. Config reloads, UI updates immediately

### Programmatically

```typescript
import { useConfig } from "@/hooks/use-config";

function MyComponent() {
  const { config, updateConfig } = useConfig();
  
  const handleChange = async () => {
    await updateConfig({
      editor: { lineWrapping: true }
    });
  };
}
```

## Default Values

If a config key is missing, defaults are used:

```typescript
const DEFAULT_CONFIG: AppConfig = {
  editor: {
    lineWrapping: false,
    toolbarVisible: true,
  },
  debug: {
    enableExampleNote: false,
  },
  storage: {
    backend: "sqlite",
    sqlite: { database_path: "notes.db" },
  },
  theme: "dark",
};
```

Configs are deep-merged with defaults, so partial configs work fine.

## Troubleshooting

### Config changes not taking effect

1. Check file watcher is running (look for console messages)
2. Verify JSON syntax is valid
3. Check the file is in the correct location (`dev/config.json` in dev)

### Theme flash on load

1. Ensure `index.html` has `class="dark"` on `<html>`
2. Ensure inline script and style are present
3. Clear localStorage: `localStorage.removeItem('darkMode')`

### Config file not found

The app will use defaults. Check:
1. File exists at `dev/config.json`
2. Rust backend can access the path (check console for errors)

## Comparison with VS Code

| Feature | VS Code | IrisNotes |
|---------|---------|-----------|
| File format | JSON | JSON |
| Location | User data dir | Dev dir (dev) / App data (prod) |
| Layers | Default → User → Workspace | Default → User |
| File watcher | ✅ | ✅ |
| Immediate write | ✅ | ✅ |
| Hot reload | ✅ | ✅ |
| JSON with comments | ✅ (JSONC) | ❌ (standard JSON) |

## Future Enhancements

- [ ] JSON5/JSONC support for comments
- [ ] Workspace-level settings override
- [ ] Settings UI (like VS Code's settings editor)
- [ ] Schema validation with helpful errors
