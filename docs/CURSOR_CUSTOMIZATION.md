# Cursor Customization

IrisNotes provides VS Code-style cursor customization for the rich text editor. The cursor appearance is fully configurable through the Settings UI or CSS custom properties.

## Features

- **Custom Width**: Thin (1px), Normal (2px), Thick (3px), or Block cursor
- **Blink Animations**: Blink, Smooth fade, Expand/pulse, or Solid (no animation)
- **Smooth Movement**: Optional animation when cursor position changes
- **Theme Integration**: Cursor color follows the caret color setting

## Configuration

### Via Settings UI

Navigate to **Settings** → **Editor** → **Cursor** section:

| Setting | Options | Description |
|---------|---------|-------------|
| Cursor Width | Thin, Normal, Thick, Block | Width of the text cursor |
| Cursor Animation | Blink, Smooth, Expand, Solid | Cursor blink style |
| Smooth Cursor Movement | On/Off | Animate cursor position changes |

### Via CSS Custom Properties

Edit `src/styles/prosemirror.css`:

```css
:root {
  --pm-cursor-width: 2px;      /* 1px, 2px, 3px, or use block mode */
  --pm-caret-color: #22c55e;   /* Cursor color (any valid CSS color) */
}
```

### Animation Timing

Modify keyframe durations in `prosemirror.css`:

```css
/* Blink speed (default: 1s) */
:root.pm-cursor-blink .pm-custom-cursor {
  animation: cursor-blink 0.5s steps(1) infinite;  /* faster */
}

/* Smooth fade speed (default: 1s) */
:root.pm-cursor-smooth .pm-custom-cursor {
  animation: cursor-smooth 1.5s ease-in-out infinite;  /* slower */
}

/* Cursor movement transition (default: 80ms) */
:root.pm-cursor-smooth-movement .pm-custom-cursor {
  transition: left 120ms ease-out, top 120ms ease-out;  /* smoother */
}
```

## Architecture

### Plugin (`custom-cursor.ts`)

The custom cursor is implemented as a ProseMirror plugin that:

1. Creates an absolutely positioned `<div>` element outside the editor content
2. Uses `coordsAtPos()` to get pixel coordinates for the cursor position
3. Updates position on every editor state change
4. Listens for focus/blur events to show/hide the cursor
5. Reads all styling from CSS custom properties (no hardcoded values)

```typescript
import { customCursorPlugin } from "./plugins/custom-cursor";

// Add to ProseMirror plugins array
plugins.push(customCursorPlugin());
```

### CSS Classes

Classes applied to `:root` by `applyEditorSettings()`:

| Class | Effect |
|-------|--------|
| `.pm-cursor-block-mode` | Shows block cursor instead of line |
| `.pm-cursor-blink` | Classic on/off blink animation |
| `.pm-cursor-smooth` | Fade in/out animation |
| `.pm-cursor-expand` | Grow/shrink pulse animation |
| `.pm-cursor-solid` | No animation (always visible) |
| `.pm-cursor-smooth-movement` | Animate position changes |

### Settings Integration

Cursor settings are part of `EditorSettings` in `types/editor-settings.ts`:

```typescript
interface EditorSettings {
  cursorWidth: CursorWidth;        // 1 | 2 | 3 | "block"
  cursorBlinkStyle: CursorBlinkStyle;  // "blink" | "smooth" | "expand" | "solid"
  cursorSmoothMovement: boolean;
  caretColor: string;              // Hex color for cursor
}
```

Settings are applied via `applyEditorSettings()` which:
- Sets `--pm-cursor-width` CSS variable
- Adds/removes animation classes on `:root`
- Toggles `.pm-cursor-block-mode` for block cursor

## Technical Notes

### Why Absolute Positioning?

The cursor uses absolute positioning (not inline decorations) because:
- Inline elements affect document flow and cause text to shift
- Widget decorations can interfere with arrow key navigation
- Absolute positioning ensures zero impact on editing behavior

### Focus Handling

The cursor visibility is tied to editor focus:
- Shows immediately when editor receives focus
- Hides when editor loses focus
- Uses both `handleDOMEvents` and explicit event listeners for reliability

### Native Caret

The native browser caret is hidden via:

```css
.ProseMirror.custom-cursor-enabled {
  caret-color: transparent !important;
}
```

## Troubleshooting

### Cursor not visible
- Check if editor is focused
- Verify `--pm-caret-color` is set to a visible color
- Ensure `.custom-cursor-enabled` class is on the editor

### Cursor in wrong position
- Check that editor wrapper has `position: relative`
- Verify no CSS transforms on parent elements

### Settings not applying
- Settings require `applyEditorSettings()` to be called
- Check browser dev tools for classes on `:root`
