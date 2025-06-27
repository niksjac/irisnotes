# Hotkey Sequences

IrisNotes supports VSCode-style hotkey sequences for advanced keyboard navigation and commands.

## Available Sequences

### Application Management

- **Ctrl+K, R** - Open App Config folder in system file manager
  - First press `Ctrl+K`, then press `R`
  - Works cross-platform (Windows, macOS, Linux)
  - Uses the system's default file manager via Tauri's opener plugin

## How It Works

The hotkey sequence system:

1. **Sequence Detection**: Listens for multi-key sequences with a 2-second timeout
2. **Cross-Platform**: Uses appropriate system commands for each OS
3. **Non-Intrusive**: Only captures keys when not focused on input elements
4. **Visual Feedback**: Provides clear indication when waiting for sequence completion

## Implementation Details

- Built with React hooks and Tauri commands
- Supports unlimited sequence length
- Configurable timeout (default: 2000ms)
- Extensible for adding new sequences

## Adding New Sequences

To add new hotkey sequences, modify the `createAppConfigSequences()` function in `src/features/hotkeys/hooks/use-hotkey-sequences.ts`:

```typescript
export const createAppConfigSequences = () => {
  return [
    {
      keys: ['Mod-k', 'r'],
      action: openAppConfigFolder,
      description: 'Open App Config folder in file manager'
    },
    // Add your new sequences here
    {
      keys: ['Mod-k', 'o'],
      action: yourCustomAction,
      description: 'Your custom action description'
    }
  ];
};
```

## Key Format

- `Mod` - Ctrl on Windows/Linux, Cmd on macOS
- `Alt` - Alt key
- `Shift` - Shift key
- Letters are lowercase: `a`, `b`, `c`
- Special keys: `Space`, `Enter`, `Escape`, etc.
- Combinations: `Mod-k`, `Alt-Shift-a`