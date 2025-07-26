# Unified Hotkey System

The new unified hotkey system provides a comprehensive, configurable, and extensible solution for keyboard shortcuts in IrisNotes. It supports global shortcuts (Tauri), local shortcuts (React), editor shortcuts (ProseMirror/CodeMirror), and VSCode-style sequence shortcuts.

## Architecture Overview

The system consists of four main components:

1. **Global Shortcuts** - Tauri-based shortcuts that work even when the app isn't focused
2. **Local Shortcuts** - React-based shortcuts using react-hotkeys-hook
3. **Editor Shortcuts** - ProseMirror/CodeMirror integration via event system
4. **Sequence Shortcuts** - VSCode-style multi-key sequences

## Key Features

- **Unified Configuration**: Single configuration system for all shortcut types
- **Conflict Detection**: Automatic detection and reporting of conflicting shortcuts
- **Platform Awareness**: Cross-platform modifier key handling (Cmd/Ctrl)
- **Context Awareness**: Shortcuts can be scoped to specific components or contexts
- **Event System**: Decoupled action system using custom events
- **Persistence**: Configuration automatically saved to localStorage
- **Type Safety**: Full TypeScript support with comprehensive types

## Basic Usage

### Application-Level Shortcuts

```typescript
import { useApplicationShortcuts, hotkeyActions } from '@/features/hotkeys';

function App() {
  // Initialize the unified hotkey system
  const { configuration, localShortcuts, sequenceShortcuts } = useApplicationShortcuts(
    hotkeyActions,
    {
      enableGlobal: true,
      enableLocal: true,
      enableSequences: true,
      sequenceTimeout: 2000
    }
  );

  return <div>Your app content</div>;
}
```

### Editor-Specific Shortcuts

```typescript
import { useEditorShortcutsManager, hotkeyActions } from '@/features/hotkeys';

function Editor() {
  const { editorShortcuts } = useEditorShortcutsManager(hotkeyActions);

  return (
    <div data-editor="true">
      {/* Editor content */}
    </div>
  );
}
```

### Context-Specific Shortcuts

```typescript
import { useContextShortcuts, hotkeyActions } from '@/features/hotkeys';

function NotesTree() {
  const { contextShortcuts } = useContextShortcuts('notes-tree', hotkeyActions);

  return (
    <div data-notes-tree="true">
      {/* Tree content */}
    </div>
  );
}
```

## Configuration

### Default Bindings

The system comes with comprehensive default bindings:

```typescript
// Global shortcuts
'mod+b' -> Toggle Sidebar
'mod+j' -> Toggle Activity Bar
'mod+d' -> Toggle Dual Pane
'F5' -> Reload Note
'alt+z' -> Toggle Line Wrapping
'mod+plus' -> Increase Font Size
'mod+minus' -> Decrease Font Size

// Editor shortcuts
'mod+b' -> Bold (in editor context)
'mod+i' -> Italic
'mod+`' -> Inline Code
'mod+shift+1' -> Heading 1
// ... and more

// Sequence shortcuts
'mod+k, r' -> Open App Config Folder

// Navigation shortcuts
'mod+1' -> Focus Editor
'mod+0' -> Focus Sidebar
```

### Custom Actions

Create custom actions by implementing the HotkeyAction interface:

```typescript
import { HotkeyAction } from '@/features/hotkeys';

const customAction: HotkeyAction = {
  id: 'custom-action',
  name: 'Custom Action',
  description: 'Does something custom',
  scope: 'local',
  handler: async () => {
    // Your custom logic here
    console.log('Custom action executed!');
  },
};
```

### Adding Custom Bindings

```typescript
import { useAtom } from 'jotai';
import { addBindingAtom } from '@/features/hotkeys';

function CustomComponent() {
  const addBinding = useAtom(addBindingAtom);

  const addCustomBinding = () => {
    addBinding({
      id: 'custom-binding',
      name: 'Custom Binding',
      description: 'My custom shortcut',
      scope: 'local',
      category: 'custom',
      keys: 'mod+shift+x',
      action: 'custom-action',
      enabled: true,
      preventDefault: true,
      allowInInputs: false,
    });
  };
}
```

## Hotkey Scopes

### Global Scope

- **Purpose**: Application-level shortcuts that work even when unfocused
- **Implementation**: Tauri global shortcuts
- **Examples**: Toggle sidebar, reload note, font size changes
- **Limitations**: Cannot use sequence shortcuts

### Local Scope

- **Purpose**: Component-specific shortcuts when app is focused
- **Implementation**: react-hotkeys-hook
- **Examples**: Focus management, navigation shortcuts
- **Context Support**: Can be limited to specific components

### Editor Scope

- **Purpose**: Text editing shortcuts
- **Implementation**: Event system integration with ProseMirror/CodeMirror
- **Examples**: Bold, italic, headings, lists
- **Input Handling**: Works within contenteditable and input elements

### Sequence Scope

- **Purpose**: VSCode-style multi-key sequences
- **Implementation**: Custom sequence detection system
- **Examples**: 'Ctrl+K, R' for opening config folder
- **Timeout**: Configurable timeout for sequence completion

## Event System

The system uses custom events for decoupled communication:

### Hotkey Events

```typescript
// Listen to hotkey execution events
window.addEventListener('hotkey-event', event => {
  const { type, binding, scope, context } = event.detail;
  console.log(`Hotkey executed: ${binding.name} in ${scope} scope`);
});
```

### Editor Command Events

```typescript
// Listen to editor command events
window.addEventListener('hotkey-editor-command', event => {
  const { command, payload } = event.detail;
  // Handle editor commands (bold, italic, etc.)
});
```

### Tree Command Events

```typescript
// Listen to tree command events
window.addEventListener('hotkey-tree-command', event => {
  const { command } = event.detail;
  // Handle tree commands (expand all, collapse all, etc.)
});
```

## Configuration Interface

The system includes a React component for hotkey configuration:

```typescript
import { HotkeyConfig } from '@/features/hotkeys';

function SettingsPage() {
  return (
    <div>
      <h1>Settings</h1>
      <HotkeyConfig className="mt-4" />
    </div>
  );
}
```

Features of the configuration interface:

- Search and filter bindings
- Enable/disable individual shortcuts
- Conflict detection and warnings
- Scope-based filtering
- Category grouping
- Real-time configuration updates

## Conflict Detection

The system automatically detects conflicts between shortcuts:

```typescript
import { useAtomValue } from 'jotai';
import { detectConflictsAtom } from '@/features/hotkeys';

function ConflictWarning() {
  const conflicts = useAtomValue(detectConflictsAtom);

  if (conflicts.length === 0) return null;

  return (
    <div className="warning">
      {conflicts.length} shortcut conflict(s) detected!
    </div>
  );
}
```

## Migration from Old System

The legacy shortcuts system has been completely removed. Use the new unified hotkey system:

```typescript
// Unified shortcuts hook for backward compatibility
import { useUnifiedShortcuts } from '@/features/hotkeys/hooks/use-unified-shortcuts';

// Or use the new API directly for more control
import { useApplicationShortcuts } from '@/features/hotkeys';
```

### Migration Steps

1. Replace imports from old shortcut system
2. Update component data attributes for context awareness
3. Replace direct ProseMirror/CodeMirror shortcuts with event listeners
4. Test all shortcuts in different scopes and contexts

## Platform Support

### Windows/Linux

- Uses `Ctrl` as primary modifier
- Alt, Shift supported
- Function keys F1-F12

### macOS

- Uses `Cmd` as primary modifier (mapped from `mod`)
- Option (Alt), Shift supported
- Function keys F1-F12

### Key Format

- `mod` - Platform-appropriate modifier (Ctrl/Cmd)
- `alt` - Alt/Option key
- `shift` - Shift key
- `plus`, `minus`, `equal` - Special keys
- `f1`, `f2`, etc. - Function keys
- `space`, `enter`, `escape` - Special keys

## Performance Considerations

- Global shortcuts use minimal Tauri API calls
- Local shortcuts leverage optimized react-hotkeys-hook
- Sequence detection has configurable timeout (default 2s)
- Event system prevents direct React re-renders
- Configuration changes are debounced in localStorage

## Troubleshooting

### Shortcuts Not Working

1. Check if binding is enabled in configuration
2. Verify correct scope for context
3. Check for conflicts with other shortcuts
4. Ensure proper data attributes on elements

### Global Shortcuts Not Registering

1. Check Tauri permissions in tauri.conf.json
2. Verify globalShortcuts plugin is installed
3. Check for platform-specific key mapping issues

### Editor Shortcuts Not Working

1. Ensure editor has proper event listeners
2. Check data-editor attribute is present
3. Verify ProseMirror/CodeMirror integration

### Sequence Shortcuts Timing Out

1. Increase sequence timeout in configuration
2. Check for modifier key conflicts
3. Verify sequence format is correct

## API Reference

### Types

- `HotkeyBinding` - Individual shortcut configuration
- `HotkeyAction` - Action handler definition
- `HotkeyScope` - Scope enumeration
- `HotkeyConfiguration` - Complete system configuration

### Hooks

- `useApplicationShortcuts` - Main application shortcuts
- `useEditorShortcutsManager` - Editor-specific shortcuts
- `useContextShortcuts` - Context-specific shortcuts
- `useSequenceShortcuts` - Sequence shortcuts only

### Atoms

- `hotkeyConfigurationAtom` - Main configuration state
- `detectConflictsAtom` - Real-time conflict detection
- `addBindingAtom`, `updateBindingAtom`, `removeBindingAtom` - CRUD operations

### Managers

- `globalShortcutsManager` - Tauri global shortcuts
- `LocalShortcutsManager` - React local shortcuts
- `SequenceShortcutsManager` - Sequence detection
- `HotkeyManager` - Unified coordination

This unified system provides a solid foundation for keyboard shortcuts that can scale with the application's needs while maintaining excellent user experience and developer productivity.
