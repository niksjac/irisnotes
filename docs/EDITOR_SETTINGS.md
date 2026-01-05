# Editor Settings & CSS Custom Properties

This document explains how to dynamically change editor appearance settings using CSS custom properties.

## Overview

The ProseMirror editor uses CSS custom properties (CSS variables) defined in `/src/styles/prosemirror.css`. These can be changed at runtime to instantly update the editor's appearance without page reload.

## Available CSS Custom Properties

```css
:root {
  /* Editor Layout */
  --pm-padding: 1rem;              /* Internal padding */
  --pm-line-height: 1.6;           /* Line height for text */
  
  /* Typography */
  --pm-font-family: inherit;       /* Main font family */
  --pm-font-size: 1rem;            /* Base font size */
  --pm-heading-font-family: inherit; /* Heading font family */
  
  /* Spacing */
  --pm-paragraph-spacing: 0.5em;   /* Space between paragraphs */
  --pm-block-spacing: 0.5em;       /* Space around block elements */
  
  /* Colors */
  --pm-text-color: inherit;        /* Main text color */
  --pm-caret-color: #22c55e;       /* Cursor color */
  --pm-link-color: #3b82f6;        /* Link text color */
  --pm-link-hover-color: #2563eb;  /* Link hover color */
  --pm-code-bg: rgba(...);         /* Inline code background */
  --pm-code-color: #e01e5a;        /* Inline code text color */
  --pm-blockquote-border: #ccc;    /* Blockquote left border */
  --pm-blockquote-text: #666;      /* Blockquote text color */
  --pm-selection-bg: #b4d5fe;      /* Text selection background */
}
```

## Changing Properties Dynamically

### Basic API

```typescript
// Set a single property
document.documentElement.style.setProperty('--pm-font-size', '18px');

// Get current value
const currentSize = getComputedStyle(document.documentElement)
  .getPropertyValue('--pm-font-size');

// Remove override (revert to CSS default)
document.documentElement.style.removeProperty('--pm-font-size');
```

### Helper Function

```typescript
function setEditorProperty(property: string, value: string): void {
  document.documentElement.style.setProperty(property, value);
}

function getEditorProperty(property: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(property)
    .trim();
}
```

## Implementation: useEditorSettings Hook

### Settings Interface

```typescript
// src/types/editor-settings.ts
export interface EditorSettings {
  // Typography
  fontSize: number;           // 12-24 px
  fontFamily: EditorFontFamily;
  lineHeight: number;         // 1.2-2.0
  
  // Spacing
  paragraphSpacing: number;   // 0-1 em
  editorPadding: number;      // 8-48 px
  
  // Appearance
  caretColor: string;         // Hex color
}

export type EditorFontFamily = 
  | 'system'      // system-ui, sans-serif
  | 'serif'       // Georgia, serif
  | 'mono'        // Monaco, Menlo, monospace
  | 'inter'       // Inter (if installed)
  | string;       // Custom font family

export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  fontSize: 16,
  fontFamily: 'system',
  lineHeight: 1.6,
  paragraphSpacing: 0.5,
  editorPadding: 16,
  caretColor: '#22c55e',
};
```

### The Hook

```typescript
// src/hooks/use-editor-settings.ts
import { useEffect } from 'react';
import { atom, useAtom } from 'jotai';
import type { EditorSettings } from '@/types/editor-settings';
import { DEFAULT_EDITOR_SETTINGS } from '@/types/editor-settings';

// Atom with persistence (will be connected to SQLite)
export const editorSettingsAtom = atom<EditorSettings>(DEFAULT_EDITOR_SETTINGS);

// Font family mapping
const FONT_FAMILIES: Record<string, string> = {
  system: 'system-ui, -apple-system, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  mono: '"Monaco", "Menlo", "Consolas", monospace',
  inter: '"Inter", system-ui, sans-serif',
};

function resolveFontFamily(family: string): string {
  return FONT_FAMILIES[family] || family;
}

export function useEditorSettings() {
  const [settings, setSettings] = useAtom(editorSettingsAtom);

  // Apply settings to CSS custom properties whenever they change
  useEffect(() => {
    const root = document.documentElement;
    
    root.style.setProperty('--pm-font-size', `${settings.fontSize}px`);
    root.style.setProperty('--pm-font-family', resolveFontFamily(settings.fontFamily));
    root.style.setProperty('--pm-line-height', String(settings.lineHeight));
    root.style.setProperty('--pm-paragraph-spacing', `${settings.paragraphSpacing}em`);
    root.style.setProperty('--pm-block-spacing', `${settings.paragraphSpacing}em`);
    root.style.setProperty('--pm-padding', `${settings.editorPadding}px`);
    root.style.setProperty('--pm-caret-color', settings.caretColor);
  }, [settings]);

  // Update individual settings
  const updateSetting = <K extends keyof EditorSettings>(
    key: K,
    value: EditorSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Reset to defaults
  const resetSettings = () => {
    setSettings(DEFAULT_EDITOR_SETTINGS);
  };

  return {
    settings,
    setSettings,
    updateSetting,
    resetSettings,
  };
}
```

## UI Components

### Font Size Slider

```tsx
function FontSizeControl() {
  const { settings, updateSetting } = useEditorSettings();

  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium">
        Font Size: {settings.fontSize}px
      </span>
      <input
        type="range"
        min={12}
        max={24}
        step={1}
        value={settings.fontSize}
        onChange={(e) => updateSetting('fontSize', Number(e.target.value))}
        className="w-full"
      />
    </label>
  );
}
```

### Font Family Select

```tsx
function FontFamilyControl() {
  const { settings, updateSetting } = useEditorSettings();

  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium">Font Family</span>
      <select
        value={settings.fontFamily}
        onChange={(e) => updateSetting('fontFamily', e.target.value)}
        className="px-3 py-2 rounded border"
      >
        <option value="system">System Default</option>
        <option value="serif">Serif (Georgia)</option>
        <option value="mono">Monospace</option>
        <option value="inter">Inter</option>
      </select>
    </label>
  );
}
```

### Line Height Slider

```tsx
function LineHeightControl() {
  const { settings, updateSetting } = useEditorSettings();

  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium">
        Line Height: {settings.lineHeight.toFixed(1)}
      </span>
      <input
        type="range"
        min={1.2}
        max={2.0}
        step={0.1}
        value={settings.lineHeight}
        onChange={(e) => updateSetting('lineHeight', Number(e.target.value))}
        className="w-full"
      />
    </label>
  );
}
```

### Complete Settings Panel

```tsx
function EditorSettingsPanel() {
  const { resetSettings } = useEditorSettings();

  return (
    <div className="space-y-6 p-4">
      <h3 className="text-lg font-semibold">Editor Appearance</h3>
      
      <FontSizeControl />
      <FontFamilyControl />
      <LineHeightControl />
      <ParagraphSpacingControl />
      <EditorPaddingControl />
      <CaretColorControl />
      
      <button
        onClick={resetSettings}
        className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300"
      >
        Reset to Defaults
      </button>
    </div>
  );
}
```

## Persistence

Editor settings should be persisted to SQLite for portability. See [SETTINGS_ARCHITECTURE.md](./SETTINGS_ARCHITECTURE.md) for the recommended approach.

## Related Files

| File | Purpose |
|------|---------|
| [src/styles/prosemirror.css](../src/styles/prosemirror.css) | CSS custom property definitions |
| [src/hooks/use-editor-settings.ts](../src/hooks/use-editor-settings.ts) | Settings hook (to be created) |
| [src/types/editor-settings.ts](../src/types/editor-settings.ts) | TypeScript interfaces (to be created) |
