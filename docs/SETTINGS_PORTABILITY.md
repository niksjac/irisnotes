# Settings Portability

This document covers options for exporting, importing, and backing up user settings in IrisNotes.

## The Problem

When using `localStorage` for settings:
- Settings are lost on app reinstall
- Settings are browser/webview-specific
- No easy way to transfer settings between machines
- Settings aren't included in database backups

## Storage Options Comparison

| Approach | Survives Reinstall | Easy Export | Fast Access | Auto-backup |
|----------|-------------------|-------------|-------------|-------------|
| localStorage | ❌ | Manual | ✅ Fast | ❌ |
| SQLite table | ✅ (if DB kept) | With DB | ⚡ Fast | ✅ |
| Config file | ✅ | Copy file | 🐢 I/O | ✅ |
| Hybrid | ✅ | ✅ | ✅ Fast | ✅ |

## Option 1: SQLite Settings Table (Recommended)

Store settings in the same database as notes.

### Schema

```sql
-- Add to schema/base.sql
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER DEFAULT (unixepoch())
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
```

### Implementation

```typescript
// src/storage/settings.ts
import Database from '@tauri-apps/plugin-sql';

export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await Database.load('sqlite:notes.db');
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
  const db = await Database.load('sqlite:notes.db');
  await db.execute(
    `INSERT INTO settings (key, value, updated_at) 
     VALUES (?, ?, unixepoch())
     ON CONFLICT(key) DO UPDATE SET 
       value = excluded.value,
       updated_at = excluded.updated_at`,
    [key, JSON.stringify(value)]
  );
}

export async function deleteSetting(key: string): Promise<void> {
  const db = await Database.load('sqlite:notes.db');
  await db.execute('DELETE FROM settings WHERE key = ?', [key]);
}

export async function getAllSettings(): Promise<Record<string, unknown>> {
  const db = await Database.load('sqlite:notes.db');
  const result = await db.select<{ key: string; value: string }[]>(
    'SELECT key, value FROM settings'
  );
  
  const settings: Record<string, unknown> = {};
  for (const row of result) {
    try {
      settings[row.key] = JSON.parse(row.value);
    } catch {
      settings[row.key] = row.value;
    }
  }
  return settings;
}
```

### Benefits
- Settings backup included when user backs up database
- Single source of truth
- Works with future cloud sync
- Transactional updates

## Option 2: Export/Import to JSON File

Allow users to manually export and import settings.

### Export Function

```typescript
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';

export async function exportSettings(): Promise<void> {
  const settings = await getAllSettings();
  
  const exportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings,
  };
  
  const path = await save({
    defaultPath: `irisnotes-settings-${Date.now()}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }],
  });
  
  if (path) {
    await writeTextFile(path, JSON.stringify(exportData, null, 2));
  }
}
```

### Import Function

```typescript
import { open } from '@tauri-apps/plugin-dialog';
import { readTextFile } from '@tauri-apps/plugin-fs';

interface SettingsExport {
  version: number;
  exportedAt: string;
  settings: Record<string, unknown>;
}

export async function importSettings(): Promise<boolean> {
  const path = await open({
    filters: [{ name: 'JSON', extensions: ['json'] }],
  });
  
  if (!path || typeof path !== 'string') {
    return false;
  }
  
  try {
    const content = await readTextFile(path);
    const data = JSON.parse(content) as SettingsExport;
    
    // Validate version
    if (data.version !== 1) {
      throw new Error(`Unsupported settings version: ${data.version}`);
    }
    
    // Import each setting
    for (const [key, value] of Object.entries(data.settings)) {
      await setSetting(key, value);
    }
    
    return true;
  } catch (error) {
    console.error('Failed to import settings:', error);
    return false;
  }
}
```

## Option 3: Hybrid Approach (Best Performance)

Use localStorage for fast access, sync to SQLite for persistence.

```typescript
// src/hooks/use-persisted-setting.ts
import { useState, useEffect, useCallback } from 'react';
import { getSetting, setSetting } from '@/storage/settings';

export function usePersistedSetting<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void, boolean] {
  const [value, setValue] = useState<T>(() => {
    // Try localStorage first for instant load
    const cached = localStorage.getItem(`setting:${key}`);
    if (cached) {
      try {
        return JSON.parse(cached) as T;
      } catch {
        return defaultValue;
      }
    }
    return defaultValue;
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load from SQLite on mount
  useEffect(() => {
    getSetting(key, defaultValue).then((dbValue) => {
      setValue(dbValue);
      // Update localStorage cache
      localStorage.setItem(`setting:${key}`, JSON.stringify(dbValue));
      setIsLoading(false);
    });
  }, [key, defaultValue]);

  // Update both localStorage and SQLite
  const updateValue = useCallback(
    (newValue: T) => {
      setValue(newValue);
      
      // Sync to localStorage (instant)
      localStorage.setItem(`setting:${key}`, JSON.stringify(newValue));
      
      // Sync to SQLite (async, fire-and-forget)
      setSetting(key, newValue).catch(console.error);
    },
    [key]
  );

  return [value, updateValue, isLoading];
}
```

### Usage

```typescript
function ThemeToggle() {
  const [theme, setTheme, isLoading] = usePersistedSetting('theme', 'dark');

  if (isLoading) return <Skeleton />;

  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? '🌙' : '☀️'}
    </button>
  );
}
```

## Settings Categories

### What Goes Where

| Setting | Storage | Reason |
|---------|---------|--------|
| Storage backend path | `config.toml` | Needed before DB connects |
| Debug flags | `config.toml` | Development configuration |
| Theme | SQLite | User preference, exportable |
| Editor font/size | SQLite | User preference, exportable |
| Sidebar width | SQLite | UI state, worth preserving |
| Hotkey overrides | SQLite | User preference, exportable |
| Last opened note | localStorage | Ephemeral, not worth syncing |
| Scroll position | localStorage | Ephemeral |

## UI: Settings Management

```tsx
function SettingsManagement() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportSettings();
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const success = await importSettings();
      if (success) {
        // Reload to apply imported settings
        window.location.reload();
      }
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Settings Backup</h3>
      
      <div className="flex gap-4">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          {isExporting ? 'Exporting...' : 'Export Settings'}
        </button>
        
        <button
          onClick={handleImport}
          disabled={isImporting}
          className="px-4 py-2 bg-gray-500 text-white rounded"
        >
          {isImporting ? 'Importing...' : 'Import Settings'}
        </button>
      </div>
      
      <p className="text-sm text-gray-500">
        Settings are automatically saved in your notes database.
        Use export to create a backup file.
      </p>
    </div>
  );
}
```

## Related Documents

- [SETTINGS_ARCHITECTURE.md](./SETTINGS_ARCHITECTURE.md) - Overall configuration architecture
- [EDITOR_SETTINGS.md](./EDITOR_SETTINGS.md) - CSS custom properties and editor settings
- [CONFIGURATION.md](./CONFIGURATION.md) - config.toml documentation
