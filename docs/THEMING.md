# IrisNotes Theming System

This document describes how theming works in IrisNotes and how to configure it.

> **Note:** Theming is part of the larger configuration system. See [CONFIGURATION.md](CONFIGURATION.md) for the full picture.

## Overview

IrisNotes uses a **VS Code-style configuration system** where `config.toml` is the single source of truth. Theme changes are persisted immediately and take effect across app restarts.

**Supported themes:**
- **Dark mode** (default) - Dark background with light text
- **Light mode** - Light background with dark text

## How to Change the Theme

### Option 1: Activity Bar Toggle (Recommended)

Click the sun/moon icon in the activity bar:
- ☀️ Sun icon = Currently dark, click for light
- 🌙 Moon icon = Currently light, click for dark

The change is written to `config.toml` immediately and persists across restarts.

### Option 2: Edit Config File Directly

Edit `dev/config.toml` (or your production config location):

```toml
# Theme: "dark" or "light"
theme = "dark"
```

Valid values:
- `"dark"` - Dark mode
- `"light"` - Light mode

The app will detect the file change and update immediately (no restart needed).

## Technical Implementation

### Architecture

The theming system has three layers:

1. **Config File** (`dev/config.toml`)
   - Source of truth for theme setting
   - Watched for external changes
   - UI writes here on toggle

2. **HTML Pre-hydration** (`index.html`)
   - The `<html>` element has `class="dark"` by default
   - Inline script checks localStorage **hint** (not source of truth)
   - Inline CSS provides immediate background color
   - This prevents the "flash of wrong theme" on page load

3. **React Hook** (`src/hooks/use-theme.ts`)
   - Derives `darkMode` from `config.theme`
   - `toggleDarkMode()` writes to config via `updateConfig()`
   - Syncs localStorage hint for next page load
   - Applies `.dark` class to `document.documentElement`

4. **Tailwind CSS** (`src/styles/tailwind.css`)
   - Uses class-based dark mode via `@custom-variant`
   - All components use `dark:` variant for dark mode styles

### Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│                    config.toml                       │
│                 theme = "dark"                       │
│                (source of truth)                     │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
   File Watcher              Toggle Button
   (external edit)           (activity bar)
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
         useTheme derives darkMode
                     │
                     ▼
         Apply .dark class + sync localStorage hint
```

### Flash Prevention

To prevent flash of wrong theme before React loads:

```html
<html class="dark">
  <head>
    <!-- Critical CSS - immediate background color -->
    <style>
      html.dark { background-color: #111827; color: #f9fafb; }
      html:not(.dark) { background-color: #f9fafb; color: #111827; }
    </style>
    <!-- Check localStorage hint -->
    <script>
      var saved = localStorage.getItem('darkMode');
      if (saved === 'false') {
        document.documentElement.classList.remove('dark');
      }
    </script>
  </head>
</html>
```

**Key insight:** localStorage is just a **hint** for flash prevention, not the source of truth. The config file is always authoritative.

### File Locations

| File | Purpose |
|------|---------|
| `dev/config.toml` | Source of truth (theme field) |
| `index.html` | Pre-hydration dark class + inline script |
| `src/hooks/use-theme.ts` | Theme hook (reads config, writes on toggle) |
| `src/hooks/use-config.ts` | Config hook with file watcher |
| `src/layout.tsx` | Calls `useTheme()` at app root |
| `src/styles/tailwind.css` | `@custom-variant dark` definition |

## CSS Implementation

Tailwind v4 uses custom variants for dark mode:

```css
/* src/styles/tailwind.css */
@custom-variant dark (&:where(.dark, .dark *));
```

This enables class-based dark mode. Components use the `dark:` prefix:

```tsx
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
```

### Focus Colors

Focus indicators use pre-computed solid colors to avoid opacity blending issues:

```css
@theme {
  --color-focus-light: #dbeafe;  /* blue-100 */
  --color-focus-dark: #132247;   /* blue-900/30 over gray-900 */
}
```

Usage in components:
```tsx
className={hasFocus ? "bg-blue-100 dark:bg-[#132247]" : "bg-gray-50 dark:bg-gray-800"}
```

## Troubleshooting

### Flash of Light Theme on Refresh

If you see a brief flash of light theme:
1. Ensure `index.html` has `class="dark"` on the `<html>` element
2. Ensure the inline `<style>` provides critical CSS
3. Check that the inline script runs before body content

### Theme Not Persisting After Toggle

1. Check that `config.toml` is being written (look for file modification)
2. Ensure file watcher is running (check console for errors)
3. Verify the app has write permissions to the config directory

### Theme Not Changing When Editing Config

1. Verify the file watcher is set up (`setup_config_watcher` was called)
2. Check JSON syntax is valid
3. Look for `config-file-changed` events in console

### Dark Mode Styles Not Applying

1. Verify `@custom-variant dark` is in `tailwind.css`
2. Check the `.dark` class is on the `<html>` element (inspect in DevTools)
3. Ensure you're using `dark:` prefix correctly in Tailwind classes
