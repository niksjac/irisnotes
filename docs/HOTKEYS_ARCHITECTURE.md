# Hotkeys & Event Handling Architecture

This document describes how keyboard shortcuts and click events are organized in IrisNotes.

## Overview

Event handling is split into two main systems:

1. **Tree-specific behaviors** - Handled by headless-tree library features
2. **Global app hotkeys** - Handled by react-hotkeys-hook

This separation ensures tree navigation hotkeys only fire when the tree has focus, while global hotkeys work from anywhere in the app.

---

## Tree Behaviors (`src/components/tree/behaviors/`)

Custom features that extend/override headless-tree's default behaviors. Each file handles a specific concern:

### File Structure

```
behaviors/
├── index.ts          # Re-exports all features
├── types.ts          # Shared TreeFeature type
├── single-click.ts   # Click behavior override
├── navigation.ts     # Arrow key navigation
├── selection.ts      # Multi-select hotkeys
├── clipboard.ts      # Cut/paste operations
└── reorder.ts        # Move items up/down
```

### Feature Types

**Static features** - No external state needed:
- `singleClickSelectFeature`
- `customNavigationFeature`
- `selectionHotkeysFeature`

**Factory features** - Need React state access:
- `createClipboardFeature({ clipboardItemIds, setClipboardItemIds, moveItem, itemMap })`
- `createReorderFeature({ moveItem, itemMap, childrenMap })`

### Hotkey Reference

| File | Hotkey | Action |
|------|--------|--------|
| single-click.ts | `Click` | Select/focus item, toggle expand/collapse |
| single-click.ts | `Shift+Click` | Range select |
| single-click.ts | `Ctrl+Click` | Toggle selection |
| navigation.ts | `ArrowLeft` | Collapse folder OR go to previous item |
| navigation.ts | `Ctrl+ArrowUp` | Navigate up (for multi-select workflow) |
| navigation.ts | `Ctrl+ArrowDown` | Navigate down (for multi-select workflow) |
| selection.ts | `Shift+ArrowUp` | Extend selection up |
| selection.ts | `Shift+ArrowDown` | Extend selection down |
| selection.ts | `Ctrl+Space` | Toggle selection on focused item |
| clipboard.ts | `Ctrl+X` | Cut selected/focused items |
| clipboard.ts | `Ctrl+V` | Paste into focused folder |
| clipboard.ts | `Escape` | Clear clipboard and selection |
| reorder.ts | `Ctrl+Shift+ArrowUp` | Move item up within parent |
| reorder.ts | `Ctrl+Shift+ArrowDown` | Move item down within parent |

### Built-in Hotkeys (from headless-tree)

These are provided by the library's core features:

| Hotkey | Action |
|--------|--------|
| `ArrowUp` | Focus previous item |
| `ArrowDown` | Focus next item |
| `ArrowRight` | Expand folder OR focus first child |
| `Enter` / `Space` | Primary action (open note) |
| `Home` | Focus first item |
| `End` | Focus last item |

---

## Global App Hotkeys (`src/hooks/use-app-hotkeys.ts`)

Uses `react-hotkeys-hook` for app-wide keyboard shortcuts that work regardless of focus.

### Configuration

Hotkeys are configurable via:
- `dev/hotkeys.json` - User configuration
- `src/config/default-hotkeys.ts` - Default values

### Hotkey Reference

| Hotkey | Action | Handler |
|--------|--------|---------|
| `Ctrl+N` | New note | `onNewNote` |
| `Ctrl+S` | Save | `onSave` |
| `Ctrl+Shift+S` | Save as | `onSaveAs` |
| `Ctrl+B` | Toggle sidebar | `onToggleSidebar` |
| `Ctrl+Shift+E` | Focus tree view | `onFocusTreeView` |
| `Ctrl+T` | New tab | `onNewTab` |
| `Ctrl+W` | Close tab | `onCloseTab` |
| `Ctrl+Tab` | Next tab | `onNextTab` |
| `Ctrl+Shift+Tab` | Previous tab | `onPreviousTab` |
| `Ctrl+1-9` | Go to tab N | `onGoToTab` |
| `Ctrl+,` | Open settings | `onOpenSettings` |
| `F1` | Open hotkeys view | `onOpenHotkeys` |
| `Ctrl+E` | Toggle edit mode | `onToggleEditMode` |
| `Alt+Shift+F` | Format document | `onFormatDocument` |
| `Ctrl+Shift+B` | New book | `onNewBook` |

---

## Other Event Handlers

### Click Handlers

| Location | Purpose |
|----------|---------|
| `tree-view.tsx` | Double-click to open note, right-click context menu |
| `editor-toolbar.tsx` | Toolbar button clicks, dropdown menus |
| `right-click-menu.tsx` | Context menu item clicks |
| `activity-bar.tsx` | Activity bar button clicks |

### Keyboard Handlers

| Location | Purpose |
|----------|---------|
| `sidebar-resizer.tsx` | Arrow keys to resize sidebar |

---

## Adding New Hotkeys

### Tree-specific hotkey

1. Choose the appropriate behavior file (or create a new one)
2. Add to the `hotkeys` object in the feature:

```typescript
export const myFeature: TreeFeature = {
  hotkeys: {
    myHotkey: {
      hotkey: "Control+KeyM",
      handler: (_e, tree) => {
        // Your logic here
      },
    },
  },
};
```

3. Ensure the feature is included in tree-view.tsx's `features` array

### Global hotkey

1. Add to `src/config/default-hotkeys.ts`:
```typescript
myHotkey: "ctrl+m",
```

2. Add type to `src/types/index.ts` in `HotkeyMapping` and `AppHotkeysProps`

3. Add handler in `src/utils/hotkey-mapping.ts`

4. Register in `src/hooks/use-app-hotkeys.ts`:
```typescript
useHotkeys(hotkeyMapping.myHotkey, handlers.onMyHotkey);
```

---

## Design Decisions

### Why two systems?

- **Tree hotkeys** need access to tree state (focused item, selection, etc.)
- **Global hotkeys** need to work from anywhere (editor, settings, etc.)
- Separation prevents conflicts (e.g., ArrowUp in tree vs editor)

### Why factory features?

Factory features like `createClipboardFeature()` need access to React state that changes over time. By passing state as parameters, the feature always has current values.

### Why object params?

```typescript
// ✅ Clear and extensible
createClipboardFeature({ clipboardItemIds, setClipboardItemIds, moveItem, itemMap })

// ❌ Positional args are error-prone
createClipboardFeature(clipboardItemIds, setClipboardItemIds, moveItem, itemMap)
```
