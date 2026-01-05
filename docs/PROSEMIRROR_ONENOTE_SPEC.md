# IrisNotes ProseMirror Editor — OneNote-Style Requirements

This document outlines the requirements for building an advanced rich-text editor using ProseMirror that mirrors the functionality of Microsoft OneNote Classic desktop application.

---

## 1. Core Philosophy

OneNote's editor feels like a **free-form canvas** where you can type anywhere and content "just works." Key principles:

1. **Inline Rendering** — Elements render as you type (no separate preview)
2. **Low Friction** — Minimal mode switching; formatting feels natural
3. **Rich Content** — Support for diverse content types in a single note
4. **Keyboard-First** — Power users can do everything via keyboard

---

## 2. Feature Categories Overview

| Category | Priority | Complexity |
|----------|----------|------------|
| Text Formatting | P0 | Low |
| Block Types | P0 | Medium |
| Lists (nested, mixed) | P0 | Medium |
| Tables | P1 | High |
| Inline Elements | P1 | Medium |
| Checkboxes/Tasks | P1 | Medium |
| Images & Media | P1 | Medium |
| Code Blocks | P0 | Done ✓ |
| Math Equations | P2 | High |
| Drawing/Ink | P3 | Very High |

---

## 3. Text Formatting (Marks)

### 3.1 Current Marks (Already Implemented)
- **Bold** (`Ctrl+B`)
- **Italic** (`Ctrl+I`)
- **Inline Code** (`` Ctrl+` ``)
- **Link** (basic support)

### 3.2 Required Additional Marks

| Mark | Shortcut | Rendering | Notes |
|------|----------|-----------|-------|
| **Underline** | `Ctrl+U` | `<u>text</u>` | Standard formatting |
| **Strikethrough** | `Ctrl+Shift+S` | `<s>text</s>` | Cross out text |
| **Highlight** | `Ctrl+Shift+H` | `<mark>text</mark>` | Yellow background (configurable) |
| **Subscript** | `Ctrl+=` | `<sub>text</sub>` | H₂O |
| **Superscript** | `Ctrl+Shift+=` | `<sup>text</sup>` | E=mc² |
| **Text Color** | (toolbar) | `<span style="color:X">` | Color picker |
| **Background Color** | (toolbar) | `<span style="background:X">` | Highlight alternative |

### 3.3 Schema Extension

```typescript
// Additional marks to add to schema
const additionalMarks = {
  underline: {
    parseDOM: [{ tag: "u" }, { style: "text-decoration=underline" }],
    toDOM: () => ["u", 0],
  },
  strikethrough: {
    parseDOM: [{ tag: "s" }, { tag: "strike" }, { style: "text-decoration=line-through" }],
    toDOM: () => ["s", 0],
  },
  highlight: {
    attrs: { color: { default: "#ffff00" } },
    parseDOM: [{ tag: "mark" }, { style: "background-color", getAttrs: (value) => ({ color: value }) }],
    toDOM: (mark) => ["mark", { style: `background-color: ${mark.attrs.color}` }, 0],
  },
  subscript: {
    parseDOM: [{ tag: "sub" }],
    toDOM: () => ["sub", 0],
    excludes: "superscript",
  },
  superscript: {
    parseDOM: [{ tag: "sup" }],
    toDOM: () => ["sup", 0],
    excludes: "subscript",
  },
  textColor: {
    attrs: { color: { default: null } },
    parseDOM: [{ style: "color", getAttrs: (value) => ({ color: value }) }],
    toDOM: (mark) => mark.attrs.color ? ["span", { style: `color: ${mark.attrs.color}` }, 0] : ["span", 0],
  },
};
```

---

## 4. Block Types (Nodes)

### 4.1 Current Nodes (Already Implemented)
- Paragraph
- Headings (H1-H6)
- Bullet List / Ordered List / List Item
- Blockquote
- Code Block (with CodeMirror nodeview)

### 4.2 Required Additional Nodes

#### 4.2.1 Horizontal Rule
```typescript
horizontal_rule: {
  group: "block",
  parseDOM: [{ tag: "hr" }],
  toDOM: () => ["hr"],
}
```
- **Input Rule**: `---` at start of line → `<hr>`
- **Shortcut**: `Ctrl+Shift+-`

#### 4.2.2 Task List (Checkboxes)
OneNote's checkbox feature is essential for task management.

```typescript
task_list: {
  content: "task_list_item+",
  group: "block",
  parseDOM: [{ tag: 'ul[data-type="taskList"]' }],
  toDOM: () => ["ul", { "data-type": "taskList", class: "task-list" }, 0],
}

task_list_item: {
  content: "paragraph block*",
  attrs: { checked: { default: false } },
  parseDOM: [{
    tag: 'li[data-type="taskItem"]',
    getAttrs: (dom) => ({ checked: dom.getAttribute("data-checked") === "true" }),
  }],
  toDOM: (node) => [
    "li",
    { "data-type": "taskItem", "data-checked": node.attrs.checked },
    ["input", { type: "checkbox", checked: node.attrs.checked }],
    ["div", { class: "task-content" }, 0],
  ],
}
```

- **Input Rule**: `[ ]` or `[]` at start → unchecked task
- **Input Rule**: `[x]` or `[X]` at start → checked task
- **Shortcut**: `Ctrl+Shift+C` to toggle checkbox
- **Click Behavior**: Clicking checkbox toggles state

#### 4.2.3 Collapsible/Toggle Block
Useful for hiding details or creating expandable sections.

```typescript
toggle: {
  content: "paragraph block+",
  group: "block",
  attrs: { open: { default: true } },
  parseDOM: [{ tag: "details" }],
  toDOM: (node) => ["details", { open: node.attrs.open }, ["summary", 0], ["div", 0]],
}
```

#### 4.2.4 Callout/Admonition Boxes
Info, warning, tip, danger boxes.

```typescript
callout: {
  content: "block+",
  group: "block",
  attrs: { type: { default: "info" } }, // info, warning, tip, danger
  parseDOM: [{ tag: 'div[data-callout]', getAttrs: (dom) => ({ type: dom.dataset.callout }) }],
  toDOM: (node) => ["div", { "data-callout": node.attrs.type, class: `callout callout-${node.attrs.type}` }, 0],
}
```

#### 4.2.5 Table Support
Tables are P1 but critical for structured data.

```typescript
// Use prosemirror-tables package
import { tableNodes } from "prosemirror-tables";

const tableNodeSpecs = tableNodes({
  tableGroup: "block",
  cellContent: "block+",
  cellAttributes: {
    background: { default: null },
    colspan: { default: 1 },
    rowspan: { default: 1 },
  },
});
// Adds: table, table_row, table_cell, table_header
```

Features needed:
- Insert table with row/column picker
- Add/remove rows and columns
- Merge/split cells
- Resize columns
- Cell background color

---

## 5. Inline Elements

### 5.1 Inline Images
Images that flow with text.

```typescript
image: {
  inline: true,
  group: "inline",
  attrs: {
    src: {},
    alt: { default: null },
    title: { default: null },
    width: { default: null },
    height: { default: null },
  },
  parseDOM: [{
    tag: "img[src]",
    getAttrs: (dom) => ({
      src: dom.getAttribute("src"),
      alt: dom.getAttribute("alt"),
      title: dom.getAttribute("title"),
      width: dom.getAttribute("width"),
      height: dom.getAttribute("height"),
    }),
  }],
  toDOM: (node) => ["img", node.attrs],
}
```

### 5.2 Inline Tags/Labels
For categorization within notes.

```typescript
tag: {
  inline: true,
  group: "inline",
  atom: true,
  attrs: { label: {} },
  parseDOM: [{ tag: 'span[data-tag]', getAttrs: (dom) => ({ label: dom.dataset.tag }) }],
  toDOM: (node) => ["span", { "data-tag": node.attrs.label, class: "inline-tag" }, node.attrs.label],
}
```

### 5.3 Mentions / Internal Links
Link to other notes within IrisNotes.

```typescript
noteLink: {
  inline: true,
  group: "inline",
  atom: true,
  attrs: { noteId: {}, title: {} },
  parseDOM: [{ tag: 'a[data-note-link]', getAttrs: (dom) => ({
    noteId: dom.dataset.noteLink,
    title: dom.textContent,
  }) }],
  toDOM: (node) => ["a", {
    "data-note-link": node.attrs.noteId,
    class: "note-link",
    href: `#note/${node.attrs.noteId}`,
  }, node.attrs.title],
}
```

- **Input Rule**: `[[` triggers autocomplete for note titles
- Clicking navigates to the linked note

### 5.4 Date/Time Stamps
Quick insert of current date/time.

```typescript
timestamp: {
  inline: true,
  group: "inline",
  atom: true,
  attrs: { datetime: {}, format: { default: "date" } },
  parseDOM: [{ tag: 'time', getAttrs: (dom) => ({
    datetime: dom.getAttribute("datetime"),
    format: dom.dataset.format || "date",
  }) }],
  toDOM: (node) => ["time", {
    datetime: node.attrs.datetime,
    "data-format": node.attrs.format,
  }, formatDate(node.attrs.datetime, node.attrs.format)],
}
```

- **Shortcut**: `Ctrl+;` insert date, `Ctrl+Shift+;` insert time

---

## 6. Input Rules (Markdown-Style Shortcuts)

These allow formatting as you type, which is key to the OneNote-like feel.

### 6.1 Current Input Rules
From `prosemirror-example-setup`:
- `#` → H1, `##` → H2, etc.
- `*text*` or `_text_` → italic
- `**text**` → bold
- `` `text` `` → code
- `>` → blockquote
- `-` or `*` → bullet list
- `1.` → ordered list

### 6.2 Additional Input Rules Needed

| Pattern | Result | Notes |
|---------|--------|-------|
| `---` or `***` | Horizontal rule | At start of line |
| `[ ]` | Unchecked task item | At start of line |
| `[x]` | Checked task item | At start of line |
| `~~text~~` | Strikethrough | Inline |
| `==text==` | Highlight | Inline |
| `^text^` | Superscript | Inline |
| `~text~` | Subscript | Inline |
| `[[` | Note link autocomplete | Triggers popup |
| `::info` | Info callout | At start of line |
| `::warning` | Warning callout | At start of line |
| `\|---\|` | Table | Simple table insert |

### 6.3 Implementation

```typescript
import { InputRule, inputRules } from "prosemirror-inputrules";

// Horizontal rule
const hrRule = new InputRule(/^(?:---|\*\*\*|___)\s$/, (state, match, start, end) => {
  return state.tr.replaceWith(start, end, schema.nodes.horizontal_rule.create());
});

// Task list item
const taskRule = new InputRule(/^\[([ xX]?)\]\s$/, (state, match, start, end) => {
  const checked = match[1].toLowerCase() === "x";
  // Convert current paragraph to task list
  // ... implementation
});

// Strikethrough (inline)
const strikeRule = new InputRule(/~~([^~]+)~~$/, (state, match, start, end) => {
  const { tr } = state;
  tr.delete(start, end);
  tr.insertText(match[1], start);
  tr.addMark(start, start + match[1].length, schema.marks.strikethrough.create());
  return tr;
});
```

---

## 7. Commands & Keyboard Shortcuts

### 7.1 Complete Shortcut Map

| Category | Shortcut | Action |
|----------|----------|--------|
| **Formatting** | `Ctrl+B` | Bold |
| | `Ctrl+I` | Italic |
| | `Ctrl+U` | Underline |
| | `Ctrl+Shift+S` | Strikethrough |
| | `Ctrl+Shift+H` | Highlight |
| | `` Ctrl+` `` | Inline code |
| | `Ctrl+K` | Insert/edit link |
| | `Ctrl+Shift+X` | Clear formatting |
| **Blocks** | `Ctrl+Shift+1` | Heading 1 |
| | `Ctrl+Shift+2` | Heading 2 |
| | `Ctrl+Shift+3` | Heading 3 |
| | `Ctrl+Shift+0` | Normal paragraph |
| | `Ctrl+Shift+.` | Bullet list |
| | `Ctrl+Shift+/` | Numbered list |
| | `Ctrl+Shift+C` | Toggle checkbox |
| | `Ctrl+Shift+>` | Blockquote |
| | `Ctrl+Alt+C` | Code block |
| **Tables** | `Ctrl+Alt+T` | Insert table |
| | `Tab` | Next cell |
| | `Shift+Tab` | Previous cell |
| | `Ctrl+Alt+R` | Add row below |
| | `Ctrl+Alt+E` | Add column right |
| **Insert** | `Ctrl+Shift+-` | Horizontal rule |
| | `Ctrl+;` | Insert date |
| | `Ctrl+Shift+;` | Insert time |
| | `Ctrl+Shift+I` | Insert image |
| **Navigation** | `Ctrl+Enter` | Insert paragraph below block |
| | `Shift+Enter` | Soft line break |
| | `Tab` (in list) | Indent list item |
| | `Shift+Tab` (in list) | Outdent list item |
| **History** | `Ctrl+Z` | Undo |
| | `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |

---

## 8. Paste Handling

### 8.1 Smart Paste Behavior

| Clipboard Content | Action |
|-------------------|--------|
| Plain text | Insert as paragraphs (split on double newlines) |
| Rich text / HTML | Parse and convert to ProseMirror nodes |
| URL | If selection exists, wrap in link. Otherwise insert as link. |
| Image | Insert inline image (as base64 or upload) |
| Excel/Table data | Insert as table |
| Code (detected) | Wrap in code block |

### 8.2 Implementation

```typescript
const pasteHandler = new Plugin({
  props: {
    handlePaste(view, event, slice) {
      const clipboardData = event.clipboardData;
      
      // Handle image paste
      const imageFile = Array.from(clipboardData.files).find(f => f.type.startsWith("image/"));
      if (imageFile) {
        // Upload or convert to base64
        handleImagePaste(view, imageFile);
        return true;
      }
      
      // Handle URL paste with selection
      const text = clipboardData.getData("text/plain");
      const { from, to, empty } = view.state.selection;
      if (!empty && isUrl(text)) {
        const tr = view.state.tr.addMark(from, to, schema.marks.link.create({ href: text }));
        view.dispatch(tr);
        return true;
      }
      
      // Let ProseMirror handle HTML paste normally
      return false;
    },
  },
});
```

---

## 9. Drag & Drop

### 9.1 Block Drag Handles
Each block should have a drag handle on the left for reordering.

```typescript
// NodeView with drag handle
class DraggableBlockView {
  constructor(node, view, getPos) {
    this.dom = document.createElement("div");
    this.dom.className = "draggable-block";
    
    this.dragHandle = document.createElement("div");
    this.dragHandle.className = "drag-handle";
    this.dragHandle.contentEditable = "false";
    this.dragHandle.innerHTML = "⋮⋮"; // Grip icon
    this.dragHandle.draggable = true;
    
    this.contentDOM = document.createElement("div");
    this.contentDOM.className = "block-content";
    
    this.dom.appendChild(this.dragHandle);
    this.dom.appendChild(this.contentDOM);
  }
}
```

### 9.2 Drop Handling
- File drop → Insert as image/attachment
- Text drop → Insert at cursor
- Block drop → Reorder

---

## 10. Toolbar Design

### 10.1 Fixed Toolbar (Primary)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [Undo][Redo] | [B][I][U][S] [A↓][🖍️] | [H▾] | [•][1.][☑] | ["] [</>] | [+▾] │
└──────────────────────────────────────────────────────────────────────────────┘

Legend:
- [A↓] = Text color dropdown
- [🖍️] = Highlight color dropdown  
- [H▾] = Heading level dropdown
- [☑] = Task list
- ["] = Blockquote
- [</>] = Code block
- [+▾] = Insert menu (table, image, hr, date, etc.)
```

### 10.2 Floating Toolbar (On Selection)

```
      Selected text here
           ↓
┌─────────────────────────┐
│ [B] [I] [U] [🔗] [⋯]   │ ← Appears above selection
└─────────────────────────┘
```

### 10.3 Block-Level Menu

```
    Paragraph text starts here...
  ↓
  ⋮⋮  ← Drag handle (appears on hover)
  +   ← Click to show block insert menu
```

---

## 11. Implementation Phases

### Phase 1: Core Text Formatting (Week 1)
- [ ] Add underline, strikethrough, highlight marks
- [ ] Add subscript/superscript marks
- [ ] Implement keyboard shortcuts for new marks
- [ ] Add input rules for inline formatting (`~~strike~~`, `==highlight==`)
- [ ] Update toolbar with new formatting buttons

### Phase 2: Enhanced Blocks (Week 2)
- [ ] Implement horizontal rule with input rule
- [ ] Create task list nodes (checkbox lists)
- [ ] Add task list input rules and commands
- [ ] Implement toggle/collapsible blocks
- [ ] Add callout/admonition blocks

### Phase 3: Tables (Week 3)
- [ ] Integrate `prosemirror-tables` package
- [ ] Create table insertion UI
- [ ] Implement table keyboard navigation
- [ ] Add row/column manipulation commands
- [ ] Cell merging and splitting
- [ ] Column resize handles

### Phase 4: Inline Elements (Week 4)
- [ ] Inline image support with resize handles
- [ ] Internal note linking (`[[note]]` syntax)
- [ ] Autocomplete popup for note links
- [ ] Date/time stamp insertion
- [ ] Inline tags/labels

### Phase 5: Polish & UX (Week 5)
- [ ] Smart paste handling (URLs, images, tables)
- [ ] Block drag handles
- [ ] Floating toolbar on selection
- [ ] Block-level insert menu
- [ ] Keyboard shortcut cheatsheet modal

---

## 12. Package Dependencies

### Current
```json
{
  "prosemirror-commands": "^1.x",
  "prosemirror-dropcursor": "^1.x",
  "prosemirror-gapcursor": "^1.x",
  "prosemirror-history": "^1.x",
  "prosemirror-inputrules": "^1.x",
  "prosemirror-keymap": "^1.x",
  "prosemirror-model": "^1.x",
  "prosemirror-schema-basic": "^1.x",
  "prosemirror-schema-list": "^1.x",
  "prosemirror-state": "^1.x",
  "prosemirror-view": "^1.x"
}
```

### To Add
```json
{
  "prosemirror-tables": "^1.x",
  "prosemirror-menu": "^1.x"
}
```

---

## 13. File Structure Proposal

```
src/components/editor/
├── prosemirror-editor.tsx       # Main editor component
├── prosemirror-setup.ts         # Plugin configuration
├── editor-toolbar.tsx           # Fixed toolbar
├── floating-toolbar.tsx         # Selection-based toolbar (new)
├── codemirror-nodeview.tsx      # CodeMirror for code blocks
├── schema/
│   ├── index.ts                 # Combined schema export
│   ├── nodes.ts                 # All node definitions
│   ├── marks.ts                 # All mark definitions
│   └── input-rules.ts           # Custom input rules
├── plugins/
│   ├── paste-handler.ts         # Smart paste plugin
│   ├── drag-drop.ts             # Drag & drop plugin
│   ├── placeholder.ts           # Empty editor placeholder
│   └── autocomplete.ts          # [[note]] autocomplete
├── nodeviews/
│   ├── task-item.tsx            # Checkbox nodeview
│   ├── image.tsx                # Resizable image nodeview
│   ├── table-cell.tsx           # Table cell with menu
│   └── callout.tsx              # Callout box nodeview
└── utils/
    ├── commands.ts              # Custom commands
    ├── helpers.ts               # Utility functions
    └── keymaps.ts               # Keymap configuration
```

---

## 14. Styling Considerations

### 14.1 Theme Variables
All editor styles should use CSS custom properties for theming:

```css
.ProseMirror {
  --pm-font-family: system-ui, sans-serif;
  --pm-font-size: 16px;
  --pm-line-height: 1.6;
  --pm-text-color: var(--color-text);
  --pm-heading-color: var(--color-text-heading);
  --pm-link-color: var(--color-primary);
  --pm-code-bg: var(--color-code-bg);
  --pm-code-color: var(--color-code-text);
  --pm-highlight-bg: #ffff00;
  --pm-blockquote-border: var(--color-border);
  --pm-task-checked: var(--color-success);
}
```

### 14.2 Print Styles
Ensure notes print correctly:
- Hide toolbars
- Proper page breaks
- Links shown as text + URL

---

## 15. Testing Strategy

### Unit Tests
- Schema parsing/serialization
- Command execution
- Input rule matching

### Integration Tests
- Keyboard shortcut functionality
- Paste handling
- Content persistence round-trip

### E2E Tests
- Full editing workflows
- Multi-pane editing
- Toggle between rich/source view

---

## 16. References

- [ProseMirror Documentation](https://prosemirror.net/docs/)
- [ProseMirror Examples](https://prosemirror.net/examples/)
- [prosemirror-tables](https://github.com/ProseMirror/prosemirror-tables)
- [Tiptap (ProseMirror wrapper)](https://tiptap.dev/) - Good reference for features
- [Notion's Editor](https://notion.so) - Block-style inspiration
- [Outline (OSS Notes App)](https://github.com/outline/outline) - ProseMirror implementation

---

## Summary

This specification outlines building a feature-rich ProseMirror editor that matches OneNote's capabilities. The phased approach ensures each feature is properly implemented before moving on. The modular file structure allows for maintainability as complexity grows.

**Next Steps:**
1. Review and prioritize features based on your needs
2. Start with Phase 1 (core formatting marks)
3. Set up the new file structure
4. Begin implementing additional marks and their shortcuts
