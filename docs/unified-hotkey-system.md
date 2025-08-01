# App Hotkeys System

A minimal, centralized hotkey system for IrisNotes using `react-hotkeys-hook`. This system provides a simple way to manage keyboard shortcuts across the application.

## Architecture

The system uses a single hook (`useAppHotkeys`) that centralizes all keyboard shortcuts in one place, making them easy to manage and extend.

## Key Features

- **Minimal & Simple**: Single hook approach using `react-hotkeys-hook`
- **Centralized**: All hotkeys defined in one location
- **Type-safe**: Full TypeScript support
- **Extensible**: Easy to add new hotkey categories
- **Consistent Options**: Shared configuration for all hotkeys

## Basic Usage

### Layout Shortcuts (Current)

```typescript
import { useAppHotkeys } from '@/hooks';

function Layout() {
  const { sidebar, panes, views } = useLayout();

  // Centralized app hotkeys
  useAppHotkeys({
    onToggleSidebar: sidebar.toggle,
    onToggleDualPane: panes.toggleDualMode,
    onToggleActivityBar: views.toggleActivityBar,
  });

  return <div>Your layout content</div>;
}
```

### Available Shortcuts

| Shortcut | Action              | Description                                |
| -------- | ------------------- | ------------------------------------------ |
| `Ctrl+B` | Toggle Sidebar      | Show/hide the notes sidebar                |
| `Ctrl+D` | Toggle Dual Pane    | Switch between single and dual pane editor |
| `Ctrl+J` | Toggle Activity Bar | Show/hide the activity bar                 |

## Extending the System

```typescript
interface AppHotkeysProps {
	// Layout hotkeys (current)
	onToggleSidebar?: () => void;
	onToggleDualPane?: () => void;
	onToggleActivityBar?: () => void;

	// Editor hotkeys (future)
	onSave?: () => void;
	onUndo?: () => void;
	onRedo?: () => void;

	// Navigation hotkeys (future)
	onFocusEditor?: () => void;
	onFocusSidebar?: () => void;

	// Notes hotkeys (future)
	onNewNote?: () => void;
	onDeleteNote?: () => void;
}
```

### Adding New Hotkey Categories

To add new hotkeys, simply extend the interface and implementation:

```typescript
// 1. Add to interface in use-app-hotkeys.ts
interface AppHotkeysProps {
	// ... existing props

	// New editor hotkeys
	onSave?: () => void;
	onUndo?: () => void;
}

// 2. Add to hook implementation
export function useAppHotkeys({
	// ... existing destructured props
	onSave,
	onUndo,
}: AppHotkeysProps) {
	// ... existing hotkeys

	// New editor hotkeys
	useHotkeys('ctrl+s', () => onSave?.(), hotkeyOptions);
	useHotkeys('ctrl+z', () => onUndo?.(), hotkeyOptions);
}
```

### Usage Example with Future Extensions

```typescript
function App() {
  const { sidebar, panes, views } = useLayout();
  const { save, undo } = useEditor();
  const { newNote } = useNotes();

  useAppHotkeys({
    // Layout hotkeys
    onToggleSidebar: sidebar.toggle,
    onToggleDualPane: panes.toggleDualMode,
    onToggleActivityBar: views.toggleActivityBar,

    // Editor hotkeys
    onSave: save,
    onUndo: undo,

    // Notes hotkeys
    onNewNote: newNote,
  });

  return <div>App content</div>;
}
```

## Configuration

### Hotkey Options

All hotkeys use consistent options:

```typescript
const hotkeyOptions = {
	preventDefault: true, // Prevent default browser action
	enableOnContentEditable: false, // Disable in editable elements
	enableOnFormTags: false, // Disable in form inputs
};
```

### Adding Cross-Platform Support

To make hotkeys work on both Windows/Linux (Ctrl) and macOS (Cmd), replace `ctrl+` with `mod+`:

```typescript
// Cross-platform: mod+ becomes ctrl+ on Windows/Linux, cmd+ on macOS
useHotkeys('mod+s', () => onSave?.(), hotkeyOptions);
```

## File Structure

```
src/hooks/
├── use-app-hotkeys.ts    # Main hotkeys hook
├── index.ts              # Export from hooks
└── ...

src/layout.tsx            # Usage in layout component
```

## Migration from Complex System

The previous unified hotkey system has been removed in favor of this minimal approach. Key benefits:

- **Simpler**: Single hook instead of complex manager system
- **Maintainable**: Easy to understand and modify
- **Type-safe**: Full TypeScript support
- **Extensible**: Add new categories as needed
- **Lightweight**: Uses only `react-hotkeys-hook` dependency

This minimal system provides all the functionality needed for application hotkeys while being much easier to understand and maintain.
