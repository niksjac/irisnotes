# Settings Architecture

This document describes the recommended configuration architecture for IrisNotes.

## Three-Layer Configuration

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONFIGURATION LAYERS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Layer 1: config.toml (App Configuration)                        │
│  ─────────────────────────────────────────                        │
│  Location: ~/.config/irisnotes/config.toml (prod)                │
│            ./dev/config.toml (dev)                                │
│                                                                   │
│  Contains:                                                        │
│  • Storage backend selection (sqlite, json, etc.)                │
│  • Database path                                                  │
│  • Debug flags                                                    │
│  • Development vs production settings                            │
│                                                                   │
│  When: Read ONCE at startup, before database connects            │
│  Format: TOML (human-readable, editable by power users)          │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Layer 2: SQLite settings table (User Preferences)              │
│  ─────────────────────────────────────────────────               │
│  Location: Inside notes.db                                        │
│                                                                   │
│  Contains:                                                        │
│  • Theme (dark/light/system)                                     │
│  • Editor settings (font, size, line height, spacing)            │
│  • Layout preferences (sidebar width, collapsed state)           │
│  • Hotkey overrides                                              │
│  • Any user-configurable preference                              │
│                                                                   │
│  When: Loaded after DB connects, persists across reinstalls      │
│  Benefits: Exported with notes backup, survives reinstall        │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Layer 3: localStorage (Runtime Cache)                           │
│  ─────────────────────────────────────                            │
│  Location: Browser/WebView storage                               │
│                                                                   │
│  Contains:                                                        │
│  • Cache of SQLite settings (for fast startup)                   │
│  • Truly ephemeral state (scroll position, last pane focus)      │
│  • Transient UI state that doesn't need backup                   │
│                                                                   │
│  When: Instant access, sync'd from SQLite on change             │
│  Note: Can be lost without issue                                 │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
App Startup:
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ config.toml  │────▶│   Connect    │────▶│   SQLite     │
│  (read DB    │     │   Database   │     │  settings    │
│   path)      │     │              │     │   table      │
└──────────────┘     └──────────────┘     └──────────────┘
                                                  │
                                                  ▼
                                          ┌──────────────┐
                                          │ localStorage │
                                          │   (cache)    │
                                          └──────────────┘

User Changes Setting:
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│     UI       │────▶│ localStorage │────▶│   SQLite     │
│   Update     │     │   (instant)  │     │   (async)    │
└──────────────┘     └──────────────┘     └──────────────┘
```

## Implementation

### 1. SQLite Schema

Add to `schema/base.sql`:

```sql
-- Settings table for user preferences
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_settings_updated ON settings(updated_at);
```

### 2. Settings Storage Module

```typescript
// src/storage/settings.ts

import Database from '@tauri-apps/plugin-sql';

let dbInstance: Awaited<ReturnType<typeof Database.load>> | null = null;

async function getDb() {
  if (!dbInstance) {
    dbInstance = await Database.load('sqlite:notes.db');
  }
  return dbInstance;
}

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await getDb();
    const result = await db.select<{ value: string }[]>(
      'SELECT value FROM settings WHERE key = ?',
      [key]
    );
    
    if (result.length > 0) {
      return JSON.parse(result[0].value) as T;
    }
    return defaultValue;
  } catch {
    return defaultValue;
  }
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO settings (key, value, updated_at) 
     VALUES (?, ?, unixepoch())
     ON CONFLICT(key) DO UPDATE SET 
       value = excluded.value,
       updated_at = excluded.updated_at`,
    [key, JSON.stringify(value)]
  );
}

export async function getMultipleSettings<T extends Record<string, unknown>>(
  defaults: T
): Promise<T> {
  const db = await getDb();
  const keys = Object.keys(defaults);
  const placeholders = keys.map(() => '?').join(',');
  
  const result = await db.select<{ key: string; value: string }[]>(
    `SELECT key, value FROM settings WHERE key IN (${placeholders})`,
    keys
  );
  
  const settings = { ...defaults };
  for (const row of result) {
    try {
      (settings as Record<string, unknown>)[row.key] = JSON.parse(row.value);
    } catch {
      // Keep default
    }
  }
  
  return settings;
}

export async function setMultipleSettings(
  settings: Record<string, unknown>
): Promise<void> {
  const db = await getDb();
  
  for (const [key, value] of Object.entries(settings)) {
    await db.execute(
      `INSERT INTO settings (key, value, updated_at) 
       VALUES (?, ?, unixepoch())
       ON CONFLICT(key) DO UPDATE SET 
         value = excluded.value,
         updated_at = excluded.updated_at`,
      [key, JSON.stringify(value)]
    );
  }
}
```

### 3. Settings Atom with Persistence

```typescript
// src/atoms/settings.ts

import { atom } from 'jotai';
import { getSetting, setSetting } from '@/storage/settings';

// Create a persisted atom that syncs with SQLite
export function atomWithSQLite<T>(key: string, defaultValue: T) {
  const baseAtom = atom<T>(defaultValue);
  let isInitialized = false;

  const persistedAtom = atom(
    (get) => get(baseAtom),
    async (get, set, update: T | ((prev: T) => T)) => {
      const newValue = typeof update === 'function'
        ? (update as (prev: T) => T)(get(baseAtom))
        : update;
      
      set(baseAtom, newValue);
      
      // Sync to localStorage (instant)
      localStorage.setItem(`setting:${key}`, JSON.stringify(newValue));
      
      // Sync to SQLite (async)
      await setSetting(key, newValue);
    }
  );

  // Hydration atom - loads from SQLite on first read
  const hydratedAtom = atom(
    async (get) => {
      if (!isInitialized) {
        isInitialized = true;
        
        // Try localStorage cache first
        const cached = localStorage.getItem(`setting:${key}`);
        if (cached) {
          try {
            return JSON.parse(cached) as T;
          } catch {
            // Fall through to SQLite
          }
        }
        
        // Load from SQLite
        return await getSetting(key, defaultValue);
      }
      return get(baseAtom);
    },
    async (get, set, update: T | ((prev: T) => T)) => {
      set(persistedAtom, update);
    }
  );

  return hydratedAtom;
}

// Usage:
export const themeAtom = atomWithSQLite('theme', 'dark');
export const sidebarWidthAtom = atomWithSQLite('sidebar.width', 300);
export const editorSettingsAtom = atomWithSQLite('editor', {
  fontSize: 16,
  fontFamily: 'system',
  lineHeight: 1.6,
});
```

### 4. Settings Provider

```typescript
// src/components/settings-provider.tsx

import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { editorSettingsAtom, themeAtom, sidebarWidthAtom } from '@/atoms/settings';

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Load all settings on mount
  const [theme] = useAtom(themeAtom);
  const [editorSettings] = useAtom(editorSettingsAtom);
  const [sidebarWidth] = useAtom(sidebarWidthAtom);

  useEffect(() => {
    // Mark as loaded after first render
    setIsLoaded(true);
  }, []);

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Apply editor settings to CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--pm-font-size', `${editorSettings.fontSize}px`);
    root.style.setProperty('--pm-line-height', String(editorSettings.lineHeight));
    // ... other properties
  }, [editorSettings]);

  if (!isLoaded) {
    return null; // Or loading spinner
  }

  return <>{children}</>;
}
```

## Settings Keys Convention

Use dot notation for namespaced settings:

| Key | Type | Description |
|-----|------|-------------|
| `theme` | `'dark' \| 'light' \| 'system'` | App theme |
| `editor.fontSize` | `number` | Editor font size in px |
| `editor.fontFamily` | `string` | Editor font family |
| `editor.lineHeight` | `number` | Editor line height |
| `editor.paragraphSpacing` | `number` | Paragraph spacing in em |
| `layout.sidebarWidth` | `number` | Sidebar width in px |
| `layout.sidebarCollapsed` | `boolean` | Sidebar collapsed state |
| `layout.activityBarVisible` | `boolean` | Activity bar visibility |
| `hotkeys.*` | `string` | Custom hotkey bindings |

## Migration from config.toml

Settings currently in config.toml that should move to SQLite:

```toml
# KEEP in config.toml (app configuration):
[storage]
backend = "sqlite"

[storage.sqlite]
database_path = "./dev/notes.db"

[development]
useLocalConfig = true
configPath = "./dev/"

[debug]
enableExampleNote = false

# MOVE to SQLite settings table (user preferences):
theme = "dark"  # → settings.theme

[editor]
lineWrapping = false    # → settings.editor.lineWrapping
toolbarVisible = false  # → settings.editor.toolbarVisible

[layout]
sidebarWidth = 520        # → settings.layout.sidebarWidth
activityBarVisible = false # → settings.layout.activityBarVisible
sidebarCollapsed = true    # → settings.layout.sidebarCollapsed
```

## Benefits

1. **Portable**: Settings backup included when user backs up database
2. **Consistent**: Single source of truth for user preferences
3. **Fast**: localStorage cache provides instant access
4. **Syncable**: Ready for future cloud sync feature
5. **Exportable**: Easy to implement import/export
6. **Clean separation**: App config vs user preferences

## Related Documents

- [EDITOR_SETTINGS.md](./EDITOR_SETTINGS.md) - CSS custom properties
- [SETTINGS_PORTABILITY.md](./SETTINGS_PORTABILITY.md) - Export/import
- [CONFIGURATION.md](./CONFIGURATION.md) - config.toml reference
