# IrisNotes Editor Features

Documentation for editor implementations and future enhancements.

## Current Editor Implementation

IrisNotes uses two editors that can be toggled via **Ctrl+E**:

1. **ProseMirror** - Rich text WYSIWYG editor (default)
2. **CodeMirror** - Source code/markdown editor

---

## ProseMirror Rich Editor

### Current Features

- **Basic Formatting**: Bold, italic, code
- **Headings**: H1-H6 support
- **Lists**: Ordered and unordered lists
- **Paragraph Support**: Automatic paragraph wrapping
- **HTML Paste**: Paste HTML and it renders properly (links, formatting, etc.)
- **Line Wrapping**: Toggle via activity bar button
- **Dark Mode**: Automatic theme switching

### Schema

The editor uses an extended basic schema with list support:

```typescript
import { schema } from "prosemirror-schema-basic";
import { addListNodes } from "prosemirror-schema-list";

const mySchema = new Schema({
  nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
  marks: schema.spec.marks,
});
```

**Supported Nodes:**
- `paragraph` - Basic text paragraphs
- `heading` - Headings (level 1-6)
- `blockquote` - Quoted text
- `code_block` - Code blocks
- `ordered_list` - Numbered lists
- `bullet_list` - Bullet lists
- `list_item` - List items
- `horizontal_rule` - Horizontal dividers

**Supported Marks:**
- `strong` - Bold text
- `em` - Italic text
- `code` - Inline code
- `link` - Hyperlinks

### Removed: Default Toolbar

**Previously used**: `prosemirror-example-setup` package provided a basic toolbar with formatting buttons.

**Why removed**: Planning custom toolbar implementation to match app design.

**Toolbar features from exampleSetup:**
1. **Text Formatting**
   - Strong (Ctrl+B)
   - Emphasis (Ctrl+I)
   - Code (Ctrl+`)

2. **Block Types**
   - Plain paragraph
   - Headings (H1-H6)
   - Code block
   - Blockquote

3. **List Management**
   - Ordered list
   - Unordered list
   - Lift list item
   - Sink list item

4. **History**
   - Undo (Ctrl+Z)
   - Redo (Ctrl+Y / Ctrl+Shift+Z)

5. **Insert**
   - Horizontal rule
   - Image (if schema supports)
   - Link

---

## Future: Custom Toolbar Implementation

### Design Goals

1. **Minimal Design**: Match IrisNotes aesthetic
2. **Keyboard-First**: Show keyboard shortcuts in tooltips
3. **Contextual**: Show/hide based on selection
4. **Customizable**: User can enable/disable buttons
5. **Floating or Fixed**: Option for floating toolbar on selection

### Proposed UI

```
┌─────────────────────────────────────────────────────────┐
│ [B] [I] [Code] │ [H1▼] │ [•] [1.] │ [Link] [↶] [↷]      │ ← Fixed toolbar
└─────────────────────────────────────────────────────────┘
```

Or floating on selection:
```
Selected text
  ↓
┌─────────────────────┐
│ [B] [I] [Code] [🔗] │ ← Appears above selection
└─────────────────────┘
```

### Implementation Options

#### Option 1: Custom React Toolbar
```typescript
// components/editor/prosemirror-toolbar.tsx
export function ProseMirrorToolbar({ view }: { view: EditorView }) {
  const applyMark = (markType: MarkType) => {
    // Toggle mark on selection
    const { from, to } = view.state.selection;
    const hasMark = view.state.doc.rangeHasMark(from, to, markType);
    
    if (hasMark) {
      view.dispatch(view.state.tr.removeMark(from, to, markType));
    } else {
      view.dispatch(view.state.tr.addMark(from, to, markType.create()));
    }
  };

  return (
    <div className="toolbar">
      <button onClick={() => applyMark(schema.marks.strong)}>
        <Bold size={16} />
      </button>
      {/* ... */}
    </div>
  );
}
```

#### Option 2: Prosemirror-Menu (Customized)
```typescript
import { menuBar } from "prosemirror-menu";
import { buildMenuItems } from "prosemirror-example-setup";

// Create custom menu with only desired items
const customMenu = buildMenuItems(schema).fullMenu;
const filteredMenu = [
  [customMenu[0][0], customMenu[0][1]], // Bold, Italic
  [customMenu[1][0]], // Heading
  // ...select only what you want
];

plugins: [menuBar({ content: filteredMenu })]
```

#### Option 3: Floating Menu (tiptap-style)
```typescript
// Show toolbar only when text is selected
const [showToolbar, setShowToolbar] = useState(false);
const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0 });

EditorView.updateListener.of((update) => {
  if (update.selectionSet) {
    const { from, to } = update.state.selection;
    if (from !== to) {
      // Calculate position above selection
      const coords = view.coordsAtPos(from);
      setToolbarPos({ top: coords.top - 50, left: coords.left });
      setShowToolbar(true);
    } else {
      setShowToolbar(false);
    }
  }
});
```

### Recommended Commands to Include

**Essential:**
- Bold (Ctrl+B)
- Italic (Ctrl+I)
- Link (Ctrl+K)
- Undo/Redo

**Nice to Have:**
- Headings dropdown
- Lists (bullet/numbered)
- Code block
- Blockquote
- Clear formatting

**Advanced (Future):**
- Image upload
- Table insert
- Inline code
- Highlight color
- Text color

### State Management

Track active marks/nodes to highlight toolbar buttons:

```typescript
const getActiveMarks = (state: EditorState) => {
  const { from, to } = state.selection;
  const marks = new Set<string>();
  
  state.doc.nodesBetween(from, to, (node) => {
    node.marks.forEach(mark => marks.add(mark.type.name));
  });
  
  return marks;
};

// In component:
const activeMarks = getActiveMarks(view.state);
const isBold = activeMarks.has('strong');
```

---

## CodeMirror Source Editor

### Current Features

- **Syntax Highlighting**: Markdown support
- **Line Numbers**: Always visible
- **Active Line Highlight**: Current line emphasized
- **Bracket Matching**: Auto-close and match brackets
- **Search**: Ctrl+F for find/replace
- **History**: Full undo/redo support
- **Autocomplete**: Context-aware suggestions
- **Dark Mode**: One Dark theme
- **Line Wrapping**: Toggle via activity bar button

### Extensions Used

```typescript
import { lineNumbers, highlightActiveLine } from "@codemirror/view";
import { history } from "@codemirror/commands";
import { bracketMatching } from "@codemirror/language";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { closeBrackets, autocompletion } from "@codemirror/autocomplete";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
```

### Future Enhancements

1. **Multiple Language Support**
   - HTML mode for raw HTML editing
   - Plain text mode
   - JSON mode for metadata

2. **Custom Autocomplete**
   - Note title suggestions
   - Link suggestions to other notes
   - Tag suggestions

3. **Vim/Emacs Keybindings** (Optional)
   ```typescript
   import { vim } from "@replit/codemirror-vim";
   extensions.push(vim());
   ```

4. **Minimap** (VS Code style)
   ```typescript
   import { showMinimap } from "@replit/codemirror-minimap";
   extensions.push(showMinimap.of({ showOverlay: 'mouse' }));
   ```

---

## Editor Toggle (Ctrl+E)

Current implementation in [use-editor-view-toggle.ts](../src/hooks/use-editor-view-toggle.ts):

- Toggles between `editor-rich-view` and `editor-source-view`
- Preserves content when switching
- Updates tab state with new editor mode
- Works across multiple panes

**Note**: Content is stored as HTML in database, converted to ProseMirror doc or shown as raw HTML in CodeMirror.

---

## Content Synchronization

### Rich → Source
1. ProseMirror serializes document to HTML using `DOMSerializer`
2. HTML is formatted with newlines for readability
3. Stored in database as HTML string

### Source → Rich
1. HTML string parsed from database
2. Plain text wrapped in `<p>` tags if no HTML detected
3. `DOMParser.fromSchema()` converts to ProseMirror document

### HTML Formatting

The onChange handler in ProseMirror adds newlines after block elements:

```typescript
const html = div.innerHTML
  .replace(/<\/p>/g, '</p>\n')
  .replace(/<\/li>/g, '</li>\n')
  .replace(/<\/ul>/g, '</ul>\n')
  .replace(/<\/ol>/g, '</ol>\n')
  .replace(/<\/h[1-6]>/g, '$&\n')
  .replace(/<\/blockquote>/g, '</blockquote>\n')
  .trim();
```

This makes the HTML more readable in source view without affecting rendering.

---

## Performance Considerations

### ProseMirror
- Uses `requestAnimationFrame` to debounce onChange calls
- Skips updates when editor has focus (prevents interruptions)
- Normalizes HTML before comparison to avoid unnecessary updates

### CodeMirror
- Efficient diff-based updates via transactions
- Minimal redraws when typing
- Virtual scrolling for large documents

### Content Updates
Both editors check if content actually changed before updating to prevent unnecessary recreations.

---

## Accessibility

### Keyboard Navigation
- All formatting accessible via keyboard shortcuts
- Tab navigation for toolbar buttons
- Screen reader support via ARIA labels (TODO: implement)

### Focus Management
- Auto-focus on mount
- Focus preserved when toggling views
- Clear focus indicators

---

## References

- [ProseMirror Guide](https://prosemirror.net/docs/guide/)
- [CodeMirror 6 Documentation](https://codemirror.net/docs/)
- [ProseMirror Schema Reference](https://prosemirror.net/docs/ref/#model.Schema)
- [CodeMirror Extensions](https://codemirror.net/docs/ref/#state.Extension)
