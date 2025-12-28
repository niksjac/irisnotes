# Configurable Hotkeys System

The application now supports user-configurable hotkeys for layout, tab management, pane operations, and focus controls.

## Overview

Hotkeys are configured through a separate `hotkeys.json` file. If no custom configuration is provided, the application uses sensible defaults. You only need to specify the hotkeys you want to change.

## Configuration

### Location
- **Development**: `./dev/hotkeys.json`
- **Production**: Platform-specific config directory (e.g., `~/.config/irisnotes/hotkeys.json`)

### Quick Start

1. **Copy the template**: Use `./dev/hotkeys-template.json` as your starting point
2. **Rename to hotkeys.json**: Copy it to `hotkeys.json` in the same directory
3. **Customize**: Edit only the key combinations you want to change
4. **Remove defaults**: Delete any hotkeys you want to keep as defaults

### Basic Structure

Create a `hotkeys.json` file:

```json
{
  "toggleSidebar": {
    "key": "ctrl+shift+b",
    "description": "Toggle Notes Sidebar",
    "category": "Layout",
    "global": true
  },
  "closeTab": {
    "key": "alt+w",
    "description": "Close Active Tab",
    "category": "Tabs",
    "global": true
  },
  "focusPane1": {
    "key": "ctrl+h",
    "description": "Focus Left Pane",
    "category": "Focus",
    "global": true
  }
}
```

## Configurable Actions

### Layout
- `toggleSidebar` - Toggle the notes sidebar (default: `ctrl+b`)
- `toggleActivityBar` - Toggle the activity bar (default: `ctrl+j`)

### Tabs
- `closeTab` - Close the active tab (default: `ctrl+w`)
- `newTab` - Create a new tab (default: `ctrl+t`)
- `moveTabLeft` - Move tab left (default: `ctrl+shift+alt+left`)
- `moveTabRight` - Move tab right (default: `ctrl+shift+alt+right`)

### Panes
- `toggleDualPane` - Toggle dual pane mode (default: `ctrl+d`)
- `paneResizeLeft` - Resize pane left (default: `alt+left`)
- `paneResizeRight` - Resize pane right (default: `alt+right`)

### Sidebar
- `sidebarResizeLeft` - Resize sidebar left (default: `ctrl+left`)
- `sidebarResizeRight` - Resize sidebar right (default: `ctrl+right`)

### Focus
- `focusPane1` - Focus pane 1 (default: `ctrl+alt+1`)
- `focusPane2` - Focus pane 2 (default: `ctrl+alt+2`)

### Tab Movement
- `moveTabToPaneLeft` - Move tab to left pane (default: `ctrl+alt+left`)
- `moveTabToPaneRight` - Move tab to right pane (default: `ctrl+alt+right`)

### Tab Focus (by number)
- `focusTab1` through `focusTab9` - Focus specific tab (default: `ctrl+1` through `ctrl+9`)

### Tab Navigation
- `focusNextTab` - Focus next tab (default: `alt+tab`)
- `focusPreviousTab` - Focus previous tab (default: `alt+shift+tab`)

## Key Format

Use lowercase key combinations with `+` separators:
- `ctrl+b`
- `ctrl+shift+alt+left`
- `alt+f4`
- `ctrl+alt+1`

### Modifiers
- `ctrl` - Control key
- `shift` - Shift key
- `alt` - Alt key
- `meta` - Meta/Cmd key (macOS)

### Special Keys
- Arrow keys: `left`, `right`, `up`, `down`
- Function keys: `f1`, `f2`, etc.
- Numbers: `1`, `2`, etc.
- Letters: `a`, `b`, etc.

## Configuration Properties

Each hotkey configuration has these properties:

- `key` (required) - The key combination string
- `description` (required) - Human-readable description
- `category` (required) - Category for organization
- `global` (optional) - Whether hotkey works in form fields (default: true)

## Example Configurations

### Vim-style Navigation
```json
{
  "hotkeys": {
    "focusPane1": {
      "key": "ctrl+h",
      "description": "Focus Left Pane",
      "category": "Focus",
      "global": true
    },
    "focusPane2": {
      "key": "ctrl+l",
      "description": "Focus Right Pane",
      "category": "Focus",
      "global": true
    },
    "paneResizeLeft": {
      "key": "ctrl+shift+h",
      "description": "Resize Pane Left",
      "category": "Panes",
      "global": true
    },
    "paneResizeRight": {
      "key": "ctrl+shift+l",
      "description": "Resize Pane Right",
      "category": "Panes",
      "global": true
    }
  }
}
```

### macOS-style (using meta key)
```json
{
  "hotkeys": {
    "toggleSidebar": {
      "key": "meta+b",
      "description": "Toggle Notes Sidebar",
      "category": "Layout",
      "global": true
    },
    "closeTab": {
      "key": "meta+w",
      "description": "Close Active Tab",
      "category": "Tabs",
      "global": true
    },
    "newTab": {
      "key": "meta+t",
      "description": "New Tab",
      "category": "Tabs",
      "global": true
    }
  }
}
```

### Custom Tab Navigation
```json
{
  "hotkeys": {
    "focusTab1": {
      "key": "alt+1",
      "description": "Focus Tab 1",
      "category": "Tab Focus",
      "global": true
    },
    "focusTab2": {
      "key": "alt+2",
      "description": "Focus Tab 2",
      "category": "Tab Focus",
      "global": true
    },
    "moveTabLeft": {
      "key": "ctrl+shift+left",
      "description": "Move Tab Left",
      "category": "Tabs",
      "global": true
    },
    "moveTabRight": {
      "key": "ctrl+shift+right",
      "description": "Move Tab Right",
      "category": "Tabs",
      "global": true
    }
  }
}
```

## Live Reloading

Changes to the `config.json` file are automatically detected and applied without restarting the application.

## Troubleshooting

### Hotkeys Not Working
1. Check the key format is correct (lowercase, proper separators)
2. Ensure the JSON syntax is valid
3. Verify the action name matches exactly
4. Check if the key combination conflicts with browser/OS shortcuts

### Conflicts with Browser Shortcuts
Some key combinations may be intercepted by your browser or operating system. Try alternative combinations if a hotkey doesn't work.

### Resetting to Defaults
Remove the `hotkeys` section from your config file to restore default hotkey bindings.

## Non-Configurable Hotkeys

The following hotkeys are not yet configurable but may be added in future updates:
- Editor formatting shortcuts (Bold, Italic, etc.)
- Editor heading shortcuts
- Editor list shortcuts
- Color formatting shortcuts
- Application shortcuts (Line wrapping, Font size, etc.)
- Navigation shortcuts (Tree navigation, etc.)
- Hotkey sequences (Ctrl+K combinations)

These can be viewed in the application's "Keyboard Shortcuts" view.
