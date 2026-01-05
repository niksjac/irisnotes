# ProseMirror Editor Formatting Guide

This document explains how formatting works in the IrisNotes ProseMirror editor, covering styling, marks, nodes, and keyboard shortcuts.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [CSS Styling](#css-styling)
3. [Schema: Nodes and Marks](#schema-nodes-and-marks)
4. [Keyboard Shortcuts](#keyboard-shortcuts)
5. [Customization](#customization)
6. [Adding New Formatting Options](#adding-new-formatting-options)

---

## Architecture Overview

ProseMirror formatting is controlled by three layers:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. SCHEMA (defines what's possible)                         │
│    - Nodes: block-level elements (paragraph, heading, list) │
│    - Marks: inline formatting (bold, italic, link)          │
├─────────────────────────────────────────────────────────────┤
│ 2. CSS STYLES (visual presentation)                         │
│    - Located in: src/styles/prosemirror.css                 │
│    - Uses CSS custom properties for customization           │
├─────────────────────────────────────────────────────────────┤
│ 3. COMMANDS & KEYMAPS (user interaction)                    │
│    - Toggle marks, set block types, etc.                    │
│    - Bound to keyboard shortcuts                            │
└─────────────────────────────────────────────────────────────┘
```

---

## CSS Styling

### File Location

All ProseMirror styles are in `/src/styles/prosemirror.css`.

### CSS Custom Properties

The editor uses CSS custom properties for easy customization:

```css
:root {
  /* Layout */
  --pm-padding: 1rem;           /* Editor internal padding */
  --pm-line-height: 1.6;        /* Line height for text */
  
  /* Typography */
  --pm-font-family: inherit;    /* Main font family */
  --pm-font-size: 1rem;         /* Base font size */
  
  /* Spacing */
  --pm-paragraph-spacing: 0.5em; /* Space between paragraphs */
  --pm-block-spacing: 0.5em;     /* Space around block elements */
  
  /* Colors */
  --pm-caret-color: #22c55e;     /* Cursor color */
  --pm-link-color: #3b82f6;      /* Link text color */
  --pm-code-bg: rgba(...);       /* Inline code background */
}
```

### Customizing Editor Appearance

#### 1. Margin/Padding Around Editor

```css
.ProseMirror {
  padding: 24px 32px;  /* top/bottom left/right */
}
```

#### 2. Line Height

```css
.ProseMirror {
  line-height: 1.8;  /* Increase for more spacing */
}
/* Or target specific elements */
.ProseMirror p {
  line-height: 1.5;
}
```

#### 3. Vertical Space Between Blocks

```css
.ProseMirror p {
  margin-bottom: 1em;  /* Space after paragraphs */
}
.ProseMirror h1 {
  margin-top: 1.5em;   /* Space before headings */
  margin-bottom: 0.5em;
}
```

#### 4. Font Family

```css
/* Global font */
.ProseMirror {
  font-family: "Inter", system-ui, sans-serif;
}

/* Headings only */
.ProseMirror h1, .ProseMirror h2, .ProseMirror h3 {
  font-family: "Georgia", serif;
}
```

---

## Schema: Nodes and Marks

### What are Nodes?

**Nodes** are block-level containers in the document tree. Each node can contain other nodes or text with marks.

| Node | HTML | Description |
|------|------|-------------|
| `doc` | - | Root document node |
| `paragraph` | `<p>` | Basic text block |
| `heading` | `<h1>`-`<h6>` | Heading with level attribute |
| `blockquote` | `<blockquote>` | Quoted text block |
| `code_block` | `<pre>` | Code block (with CodeMirror) |
| `bullet_list` | `<ul>` | Unordered list |
| `ordered_list` | `<ol>` | Ordered list |
| `list_item` | `<li>` | List item |
| `horizontal_rule` | `<hr>` | Horizontal divider |
| `hard_break` | `<br>` | Line break within paragraph |

### What are Marks?

**Marks** are inline formatting that can be applied to text within nodes.

| Mark | HTML | Description | Shortcut |
|------|------|-------------|----------|
| `strong` | `<strong>` | Bold text | `Ctrl+B` |
| `em` | `<em>` | Italic text | `Ctrl+I` |
| `code` | `<code>` | Inline code | `Ctrl+\`` |
| `link` | `<a>` | Hyperlink | `Ctrl+K` |

### Current vs Extended Schema

**Current IrisNotes Schema:**
```
Nodes: doc, paragraph, heading, blockquote, code_block, 
       bullet_list, ordered_list, list_item, horizontal_rule, hard_break
Marks: strong, em, code, link
```

**Potential Extensions:**
```
New Marks:
- underline: <u> or <span class="underline">
- strikethrough: <s> or <del>
- textColor: <span style="color: ...">
- highlight: <span style="background-color: ...">
- fontSize: <span style="font-size: ...">
- fontFamily: <span style="font-family: ...">
```

---

## Keyboard Shortcuts

### Current Shortcuts

| Action | Shortcut | Description |
|--------|----------|-------------|
| Bold | `Ctrl+B` | Toggle bold on selection |
| Italic | `Ctrl+I` | Toggle italic on selection |
| Code | `Ctrl+\`` | Toggle inline code |
| Link | Auto | Type URL + space |
| Open Link | `Ctrl+Click` or `Ctrl+Enter` | Open link in browser |
| Undo | `Ctrl+Z` | Undo last action |
| Redo | `Ctrl+Y` / `Ctrl+Shift+Z` | Redo undone action |

### Recommended Additional Shortcuts

| Action | Shortcut | Status |
|--------|----------|--------|
| Underline | `Ctrl+U` | Not implemented |
| Strikethrough | `Ctrl+Shift+S` | Not implemented |
| Heading 1 | `Ctrl+Alt+1` | Not implemented |
| Heading 2 | `Ctrl+Alt+2` | Not implemented |
| Heading 3 | `Ctrl+Alt+3` | Not implemented |
| Bullet List | `Ctrl+Shift+8` | Not implemented |
| Ordered List | `Ctrl+Shift+7` | Not implemented |
| Blockquote | `Ctrl+Shift+>` | Not implemented |
| Clear Formatting | `Ctrl+\` | Not implemented |
| Text Color | `Ctrl+Shift+C` | Not implemented |
| Highlight | `Ctrl+Shift+H` | Not implemented |

---

## Customization

### User-Configurable Settings (Future)

These settings could be exposed in the app's config view:

```typescript
interface EditorSettings {
  // Typography
  fontFamily: string;        // "system", "serif", "mono", or custom
  fontSize: number;          // 12-24px
  lineHeight: number;        // 1.2-2.0
  
  // Spacing
  paragraphSpacing: number;  // 0-2em
  editorPadding: number;     // 8-48px
  
  // Appearance
  caretColor: string;        // Cursor color
  linkColor: string;         // Link text color
  showLineNumbers: boolean;  // In code blocks
}
```

### Applying Settings via CSS Custom Properties

```typescript
// In a React component or hook
function applyEditorSettings(settings: EditorSettings) {
  const root = document.documentElement;
  root.style.setProperty('--pm-font-family', settings.fontFamily);
  root.style.setProperty('--pm-font-size', `${settings.fontSize}px`);
  root.style.setProperty('--pm-line-height', String(settings.lineHeight));
  root.style.setProperty('--pm-paragraph-spacing', `${settings.paragraphSpacing}em`);
  root.style.setProperty('--pm-padding', `${settings.editorPadding}px`);
}
```

---

## Adding New Formatting Options

### Step 1: Add Mark to Schema

```typescript
// In prosemirror-editor.tsx or a schema file

const mySchema = new Schema({
  nodes: { /* ... */ },
  marks: {
    // Existing marks...
    strong: { /* ... */ },
    em: { /* ... */ },
    
    // New: Underline mark
    underline: {
      parseDOM: [
        { tag: "u" },
        { style: "text-decoration=underline" }
      ],
      toDOM() {
        return ["u", 0];
      }
    },
    
    // New: Text color mark
    textColor: {
      attrs: { color: { default: null } },
      parseDOM: [{
        style: "color",
        getAttrs: (value) => ({ color: value })
      }],
      toDOM(mark) {
        return ["span", { style: `color: ${mark.attrs.color}` }, 0];
      }
    },
    
    // New: Highlight/background mark
    highlight: {
      attrs: { color: { default: "#ffff00" } },
      parseDOM: [{
        style: "background-color",
        getAttrs: (value) => ({ color: value })
      }],
      toDOM(mark) {
        return ["span", { 
          style: `background-color: ${mark.attrs.color}`,
          class: "highlight"
        }, 0];
      }
    }
  }
});
```

### Step 2: Create Toggle Command

```typescript
import { toggleMark } from "prosemirror-commands";
import type { Command } from "prosemirror-state";

// Simple toggle (no attributes)
const toggleUnderline: Command = (state, dispatch) => {
  return toggleMark(state.schema.marks.underline)(state, dispatch);
};

// Toggle with attributes
function setTextColor(color: string): Command {
  return (state, dispatch) => {
    const { textColor } = state.schema.marks;
    if (!textColor) return false;
    
    if (dispatch) {
      const { from, to } = state.selection;
      const tr = state.tr.addMark(from, to, textColor.create({ color }));
      dispatch(tr);
    }
    return true;
  };
}

// Remove text color
const removeTextColor: Command = (state, dispatch) => {
  const { textColor } = state.schema.marks;
  if (!textColor) return false;
  
  if (dispatch) {
    const { from, to } = state.selection;
    dispatch(state.tr.removeMark(from, to, textColor));
  }
  return true;
};
```

### Step 3: Add Keyboard Shortcut

```typescript
import { keymap } from "prosemirror-keymap";

const formattingKeymap = keymap({
  "Mod-u": toggleUnderline,
  "Mod-Shift-s": toggleStrikethrough,
  "Mod-\\": clearAllMarks,  // Clear formatting
});

// Add to plugins array
const plugins = [
  formattingKeymap,
  // ... other plugins
];
```

### Step 4: Add CSS Styles

```css
/* In prosemirror.css */

/* Underline */
.ProseMirror u {
  text-decoration: underline;
}

/* Strikethrough */
.ProseMirror s,
.ProseMirror del {
  text-decoration: line-through;
}

/* Highlight with padding for visual appeal */
.ProseMirror .highlight {
  padding: 0.1em 0.2em;
  border-radius: 2px;
}
```

---

## Content Storage

### HTML Serialization

Content is stored as HTML strings in SQLite. The editor serializes the ProseMirror document to HTML when saving:

```typescript
import { DOMSerializer } from "prosemirror-model";

function serializeToHTML(doc: Node, schema: Schema): string {
  const div = document.createElement("div");
  const fragment = DOMSerializer.fromSchema(schema).serializeFragment(doc.content);
  div.appendChild(fragment);
  return div.innerHTML;
}
```

### Supported HTML Tags

All marks and nodes serialize to standard HTML:

| Element | HTML Output |
|---------|-------------|
| Paragraph | `<p>text</p>` |
| Heading | `<h1>text</h1>` |
| Bold | `<strong>text</strong>` |
| Italic | `<em>text</em>` |
| Link | `<a href="...">text</a>` |
| Code | `<code>text</code>` |
| Text Color | `<span style="color: red">text</span>` |

---

## Best Practices

### 1. Mark Ordering

Marks can overlap. Define a consistent order in your schema to ensure predictable nesting:

```typescript
marks: {
  // Lower priority = closer to text
  textColor: { /* ... */ },     // Outermost
  highlight: { /* ... */ },
  link: { /* ... */ },
  strong: { /* ... */ },
  em: { /* ... */ },
  code: { excludes: "_" },      // Innermost, excludes other marks
}
```

### 2. Exclusive Marks

Some marks shouldn't combine (e.g., code shouldn't have bold inside):

```typescript
code: {
  excludes: "_",  // Exclude all other marks
  // ...
}
```

### 3. Preserving Unknown Content

When parsing HTML that might contain unsupported elements, configure parseDOM to preserve them as plain text or wrap in a paragraph.

### 4. CSS Specificity

Use `.ProseMirror` prefix for all styles to avoid conflicts:

```css
/* Good */
.ProseMirror strong { font-weight: bold; }

/* Bad - might affect other elements */
strong { font-weight: bold; }
```

---

## Related Files

| File | Purpose |
|------|---------|
| [src/styles/prosemirror.css](../src/styles/prosemirror.css) | Editor CSS styles |
| [src/components/editor/prosemirror-editor.tsx](../src/components/editor/prosemirror-editor.tsx) | Main editor component |
| [src/components/editor/prosemirror-setup.ts](../src/components/editor/prosemirror-setup.ts) | Plugin configuration |
| [src/components/editor/plugins/autolink.ts](../src/components/editor/plugins/autolink.ts) | Auto-link URLs plugin |
| [docs/PROSEMIRROR_CONFIGURATION.md](./PROSEMIRROR_CONFIGURATION.md) | ProseMirror programmatic config |
