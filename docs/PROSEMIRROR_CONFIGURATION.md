# ProseMirror Configuration Guide

> Complete control over your rich-text editor through programmatic configuration.

This guide covers ProseMirror's architecture and configuration APIs. Every feature—from document structure to keyboard handling to collaborative editing—is configurable through code.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Schema Configuration](#schema-configuration)
3. [Plugin System](#plugin-system)
4. [Commands](#commands)
5. [View Configuration](#view-configuration)
6. [Transaction Flow](#transaction-flow)
7. [State Management](#state-management)
8. [Best Practices](#best-practices)

---

## Architecture Overview

ProseMirror consists of four essential modules:

| Module | Purpose |
|--------|---------|
| `prosemirror-model` | Document model (nodes, marks, schema) |
| `prosemirror-state` | Editor state, selection, transactions |
| `prosemirror-view` | DOM rendering and user interaction |
| `prosemirror-transform` | Document transformations and steps |

### Data Flow

```
User Action → DOM Event → View → Transaction → State.apply() → New State → View.updateState()
```

The cycle:
1. User interacts with the editable DOM
2. View creates a **transaction** describing changes
3. Transaction is applied to produce a **new state**
4. View updates to reflect new state

This one-way data flow makes state predictable and enables features like undo/redo and collaborative editing.

---

## Schema Configuration

The schema defines what your document can contain. **This is your primary control point** for document structure.

### Basic Schema Structure

```typescript
import { Schema } from "prosemirror-model";

const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: {
      content: "inline*",
      group: "block",
      parseDOM: [{ tag: "p" }],
      toDOM: () => ["p", 0],
    },
    text: { group: "inline" },
  },
  marks: {
    strong: {
      parseDOM: [
        { tag: "strong" },
        { tag: "b" },
        { style: "font-weight=bold" },
      ],
      toDOM: () => ["strong", 0],
    },
  },
});
```

### Node Spec Properties

| Property | Type | Description |
|----------|------|-------------|
| `content` | `string` | Content expression (e.g., `"paragraph+"`, `"inline*"`) |
| `group` | `string` | Group membership (e.g., `"block"`, `"inline"`) |
| `inline` | `boolean` | `true` for inline nodes |
| `atom` | `boolean` | Treated as single unit, not editable internally |
| `attrs` | `object` | Attribute definitions with defaults |
| `selectable` | `boolean` | Can be node-selected (default: `true` for non-text) |
| `draggable` | `boolean` | Can be dragged |
| `code` | `boolean` | Contains code (affects commands) |
| `defining` | `boolean` | Preserved when replacing content |
| `isolating` | `boolean` | Editing operations don't cross boundaries |
| `marks` | `string` | Allowed marks (`"_"` = all, `""` = none) |
| `parseDOM` | `ParseRule[]` | How to parse from HTML |
| `toDOM` | `function` | How to serialize to DOM |

### Content Expressions

```typescript
// Examples:
"paragraph"          // exactly one paragraph
"paragraph+"         // one or more paragraphs
"paragraph*"         // zero or more paragraphs
"paragraph?"         // zero or one paragraph
"paragraph{2}"       // exactly two
"paragraph{1,3}"     // one to three
"paragraph{2,}"      // two or more
"(paragraph | heading)*"  // alternation
"heading paragraph+" // sequence: heading then paragraphs
"block+"             // group reference
```

### Mark Spec Properties

| Property | Type | Description |
|----------|------|-------------|
| `attrs` | `object` | Mark attributes (e.g., `href` for links) |
| `inclusive` | `boolean` | Active at cursor when at edge (default: `true`) |
| `excludes` | `string` | Marks this excludes (`"_"` = all) |
| `group` | `string` | Mark group membership |
| `spanning` | `boolean` | Can span multiple nodes (default: `true`) |
| `parseDOM` | `ParseRule[]` | How to parse from HTML |
| `toDOM` | `function` | How to serialize to DOM |

### Attribute Definitions

```typescript
heading: {
  attrs: {
    level: {
      default: 1,              // Required: default value
      validate: "number",      // Optional: type validation
    }
  },
  // Or with custom validation:
  attrs: {
    level: {
      default: 1,
      validate(value) {
        if (value < 1 || value > 6) throw new Error("Level must be 1-6");
      }
    }
  }
}
```

### Extending Schemas

```typescript
import { schema as basicSchema } from "prosemirror-schema-basic";
import { addListNodes } from "prosemirror-schema-list";

// Add list nodes to existing schema
const extendedNodes = addListNodes(
  basicSchema.spec.nodes,
  "paragraph block*",  // list item content
  "block"              // list group
);

// Add custom nodes
const myNodes = extendedNodes.append({
  code_block: {
    content: "text*",
    marks: "",
    group: "block",
    code: true,
    parseDOM: [{ tag: "pre", preserveWhitespace: "full" }],
    toDOM: () => ["pre", ["code", 0]],
  }
});

const mySchema = new Schema({
  nodes: myNodes,
  marks: basicSchema.spec.marks,
});
```

---

## Plugin System

Plugins extend editor behavior without modifying core code. They're immutable and associated with state.

### Plugin Anatomy

```typescript
import { Plugin, PluginKey } from "prosemirror-state";

const myPluginKey = new PluginKey("myPlugin");

const myPlugin = new Plugin({
  key: myPluginKey,

  // Plugin state
  state: {
    init(config, editorState) {
      return { count: 0 };
    },
    apply(tr, pluginState, oldEditorState, newEditorState) {
      // Return new state (immutable!)
      if (tr.docChanged) {
        return { count: pluginState.count + 1 };
      }
      return pluginState;
    },
    toJSON(pluginState) { return pluginState; },
    fromJSON(config, value, editorState) { return value; },
  },

  // Editor props (view-related)
  props: {
    handleKeyDown(view, event) {
      // Return true to indicate handled
      return false;
    },
    handleClick(view, pos, event) { return false; },
    handlePaste(view, event, slice) { return false; },
    decorations(state) { return DecorationSet.empty; },
  },

  // View lifecycle
  view(editorView) {
    return {
      update(view, prevState) { /* called on state change */ },
      destroy() { /* cleanup */ },
    };
  },

  // Transaction hooks
  filterTransaction(tr, state) {
    // Return false to reject transaction
    return true;
  },
  appendTransaction(transactions, oldState, newState) {
    // Return a new transaction to append, or null
    return null;
  },
});
```

### Plugin Keys

Keys enable accessing plugin state and ensuring single instances:

```typescript
const counterKey = new PluginKey("counter");

// Get plugin from state
const plugin = counterKey.get(state);

// Get plugin state from editor state
const pluginState = counterKey.getState(state);
```

### Props Reference

| Prop | Signature | Purpose |
|------|-----------|---------|
| `handleKeyDown` | `(view, event) → bool` | Keyboard events |
| `handleKeyPress` | `(view, event) → bool` | Character input |
| `handleTextInput` | `(view, from, to, text) → bool` | Text insertion |
| `handleClick` | `(view, pos, event) → bool` | Click events |
| `handleDoubleClick` | `(view, pos, event) → bool` | Double-clicks |
| `handleTripleClick` | `(view, pos, event) → bool` | Triple-clicks |
| `handlePaste` | `(view, event, slice) → bool` | Paste events |
| `handleDrop` | `(view, event, slice, moved) → bool` | Drop events |
| `handleScrollToSelection` | `(view) → bool` | Selection scrolling |
| `transformPastedHTML` | `(html) → string` | Modify pasted HTML |
| `transformPastedText` | `(text, plain) → string` | Modify pasted text |
| `transformPasted` | `(slice) → Slice` | Modify pasted slice |
| `clipboardParser` | `DOMParser` | Custom clipboard parser |
| `clipboardSerializer` | `DOMSerializer` | Custom clipboard serializer |
| `clipboardTextParser` | `(text, $context) → Slice` | Plain text paste parser |
| `clipboardTextSerializer` | `(slice) → string` | Plain text copy serializer |
| `decorations` | `(state) → DecorationSet` | Visual decorations |
| `nodeViews` | `{[nodeType]: NodeViewConstructor}` | Custom node rendering |
| `markViews` | `{[markType]: MarkViewConstructor}` | Custom mark rendering |
| `editable` | `(state) → bool` | Control editability |
| `attributes` | `object \| (state) → object` | DOM attributes on editor |

### appendTransaction Pattern

React to state changes and create follow-up transactions:

```typescript
new Plugin({
  appendTransaction(transactions, oldState, newState) {
    // Only proceed if document changed
    const docChanged = transactions.some(tr => tr.docChanged);
    if (!docChanged) return null;

    // Example: auto-capitalize first letter
    const tr = newState.tr;
    let modified = false;

    newState.doc.descendants((node, pos) => {
      if (node.isTextblock && node.textContent.length > 0) {
        const firstChar = node.textContent[0];
        if (firstChar !== firstChar.toUpperCase()) {
          tr.insertText(firstChar.toUpperCase(), pos + 1, pos + 2);
          modified = true;
        }
      }
    });

    return modified ? tr : null;
  }
});
```

### filterTransaction Pattern

Reject or modify transactions before they're applied:

```typescript
new Plugin({
  filterTransaction(tr, state) {
    // Reject if document would exceed max size
    const newDoc = tr.doc;
    if (newDoc.content.size > 10000) {
      return false; // Transaction rejected
    }
    return true;
  }
});
```

---

## Commands

Commands are functions that perform editing actions. They must work both for execution and capability testing.

### Command Signature

```typescript
type Command = (
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
  view?: EditorView
) => boolean;
```

### Writing Commands

```typescript
function insertHorizontalRule(state, dispatch, view) {
  // Check: is this command applicable?
  const { $from } = state.selection;
  const hrType = state.schema.nodes.horizontal_rule;
  if (!hrType) return false;

  // Check if we can insert HR here
  if (!$from.parent.canReplaceWith($from.index(), $from.index(), hrType)) {
    return false;
  }

  // Execute: only if dispatch is provided
  if (dispatch) {
    dispatch(state.tr.replaceSelectionWith(hrType.create()).scrollIntoView());
  }
  return true;
}

// Usage:
// Test applicability: insertHorizontalRule(state, null)
// Execute: insertHorizontalRule(state, view.dispatch, view)
```

### Chaining Commands

```typescript
import { chainCommands } from "prosemirror-commands";

const handleBackspace = chainCommands(
  deleteSelection,    // Delete selected content
  joinBackward,       // Join with previous block
  selectNodeBackward  // Select node before cursor
);
```

### Built-in Commands

| Command | Action |
|---------|--------|
| `deleteSelection` | Delete selection |
| `joinBackward` | Join with previous block |
| `joinForward` | Join with next block |
| `selectNodeBackward` | Select previous node |
| `selectNodeForward` | Select next node |
| `selectAll` | Select entire document |
| `newlineInCode` | Insert newline in code block |
| `createParagraphNear` | Create paragraph near selection |
| `liftEmptyBlock` | Lift empty block out of parent |
| `splitBlock` | Split current block |
| `splitBlockKeepMarks` | Split block, preserve marks |
| `exitCode` | Exit code block |
| `toggleMark(markType, attrs?)` | Toggle mark on selection |
| `setBlockType(nodeType, attrs?)` | Change block type |
| `wrapIn(nodeType, attrs?)` | Wrap in given node |
| `lift` | Lift selection out of wrapping |

---

## View Configuration

The EditorView renders state and handles user interaction.

### Creating a View

```typescript
import { EditorView } from "prosemirror-view";

const view = new EditorView(document.querySelector("#editor"), {
  state: myState,

  // Transaction handling
  dispatchTransaction(transaction) {
    // Custom transaction processing
    console.log("Transaction:", transaction.steps.map(s => s.toJSON()));

    const newState = view.state.apply(transaction);
    view.updateState(newState);

    // Notify external systems
    onDocumentChange?.(newState.doc);
  },

  // Props (can also come from plugins)
  editable: (state) => !state.doc.attrs.locked,

  attributes: {
    class: "prose-editor",
    "data-testid": "main-editor",
  },

  // Custom node rendering
  nodeViews: {
    code_block: (node, view, getPos) => new CodeBlockView(node, view, getPos),
    image: ImageNodeView,
  },
});
```

### Updating State

```typescript
// Full state replacement
view.updateState(newState);

// Reconfigure plugins (creates new state)
const reconfiguredState = view.state.reconfigure({
  plugins: newPluginSet,
});
view.updateState(reconfiguredState);

// Update props
view.setProps({
  editable: () => false,
});
```

### Node Views

Custom rendering for specific node types:

```typescript
class ImageNodeView {
  dom: HTMLElement;
  contentDOM?: HTMLElement; // undefined = no editable content

  constructor(
    node: Node,
    view: EditorView,
    getPos: () => number | undefined
  ) {
    this.dom = document.createElement("figure");
    const img = document.createElement("img");
    img.src = node.attrs.src;
    img.alt = node.attrs.alt || "";
    this.dom.appendChild(img);

    // Handle clicks
    this.dom.addEventListener("click", (e) => {
      e.preventDefault();
      const pos = getPos();
      if (pos !== undefined) {
        view.dispatch(view.state.tr.setSelection(
          NodeSelection.create(view.state.doc, pos)
        ));
      }
    });
  }

  update(node: Node) {
    // Return false if can't update (different node type)
    if (node.type.name !== "image") return false;

    // Update DOM
    const img = this.dom.querySelector("img");
    if (img) img.src = node.attrs.src;
    return true;
  }

  selectNode() {
    this.dom.classList.add("selected");
  }

  deselectNode() {
    this.dom.classList.remove("selected");
  }

  stopEvent(event: Event) {
    // Return true to prevent ProseMirror from handling
    return event.type === "mousedown";
  }

  ignoreMutation(mutation: MutationRecord) {
    // Return true to ignore DOM mutation
    return true;
  }

  destroy() {
    // Cleanup
  }
}
```

### Decorations

Add visual elements without changing the document:

```typescript
import { Decoration, DecorationSet } from "prosemirror-view";

new Plugin({
  props: {
    decorations(state) {
      const decorations: Decoration[] = [];

      // Widget decoration (insert DOM at position)
      decorations.push(
        Decoration.widget(0, () => {
          const el = document.createElement("span");
          el.textContent = "📝";
          return el;
        }, { side: -1 }) // side: -1 = before cursor
      );

      // Inline decoration (style text range)
      decorations.push(
        Decoration.inline(5, 10, {
          class: "highlight",
          style: "background: yellow",
        })
      );

      // Node decoration (style entire node)
      decorations.push(
        Decoration.node(0, 20, {
          class: "first-paragraph",
        })
      );

      return DecorationSet.create(state.doc, decorations);
    }
  }
});
```

### Efficient Decoration Updates

```typescript
new Plugin({
  state: {
    init(_, { doc }) {
      return computeDecorations(doc);
    },
    apply(tr, decorations) {
      if (tr.docChanged) {
        // Map existing decorations through changes
        decorations = decorations.map(tr.mapping, tr.doc);
        // Optionally recompute for changed regions
      }
      return decorations;
    }
  },
  props: {
    decorations(state) {
      return this.getState(state);
    }
  }
});
```

---

## Transaction Flow

Transactions describe atomic state changes.

### Transaction Methods

```typescript
const tr = state.tr;

// Document modifications
tr.insert(pos, content);              // Insert nodes
tr.insertText(text, from?, to?);      // Insert text
tr.delete(from, to);                  // Delete range
tr.replace(from, to, slice);          // Replace with slice
tr.replaceWith(from, to, node);       // Replace with node
tr.replaceSelection(slice);           // Replace selection
tr.replaceSelectionWith(node);        // Replace selection with node
tr.deleteSelection();                 // Delete selection

// Marks
tr.addMark(from, to, mark);           // Add mark to range
tr.removeMark(from, to, mark?);       // Remove mark(s) from range
tr.addStoredMark(mark);               // Add to stored marks
tr.removeStoredMark(mark);            // Remove from stored marks
tr.setStoredMarks(marks);             // Set stored marks
tr.ensureMarks(marks);                // Ensure marks match

// Node operations
tr.setNodeMarkup(pos, type?, attrs?, marks?);  // Change node
tr.setNodeAttribute(pos, attr, value);          // Set single attr
tr.setDocAttribute(attr, value);               // Set doc attr

// Selection
tr.setSelection(selection);           // Set selection
tr.scrollIntoView();                  // Scroll selection into view

// Metadata
tr.setMeta(key, value);               // Set transaction metadata
tr.getMeta(key);                      // Get metadata
```

### Transaction Metadata

```typescript
// Mark transaction as not undoable
tr.setMeta("addToHistory", false);

// Check if transaction came from paste
if (tr.getMeta("paste")) {
  // Handle paste specially
}

// Custom metadata
tr.setMeta(myPluginKey, { action: "toggle" });
```

### Position Mapping

Track positions through document changes:

```typescript
const tr = state.tr.delete(0, 5);

// Map a position through the transaction
const oldPos = 10;
const newPos = tr.mapping.map(oldPos);      // Simple mapping
const newPosLeft = tr.mapping.map(oldPos, -1);  // Bias left
const newPosRight = tr.mapping.map(oldPos, 1);  // Bias right

// Map selection
const mappedSelection = state.selection.map(tr.doc, tr.mapping);
```

---

## State Management

### State Structure

```typescript
interface EditorState {
  doc: Node;                    // Current document
  selection: Selection;         // Current selection
  storedMarks: Mark[] | null;   // Marks to apply to next input
  schema: Schema;               // Document schema
  plugins: Plugin[];            // Active plugins
  tr: Transaction;              // Fresh transaction (getter)
}
```

### Creating State

```typescript
// From scratch
const state = EditorState.create({
  schema: mySchema,
  plugins: [history(), keymap(myKeymap)],
});

// From existing document
const state = EditorState.create({
  doc: existingDoc,
  plugins: myPlugins,
});

// From HTML
const doc = DOMParser.fromSchema(mySchema).parse(htmlElement);
const state = EditorState.create({ doc, plugins: myPlugins });

// From JSON
const state = EditorState.fromJSON(
  { schema: mySchema, plugins: myPlugins },
  jsonData,
  { myPlugin: myPlugin }  // Plugin state deserializers
);
```

### Serialization

```typescript
// To JSON
const json = state.toJSON({
  myPlugin: myPlugin  // Include plugin states
});

// To HTML
const serializer = DOMSerializer.fromSchema(state.schema);
const fragment = serializer.serializeFragment(state.doc.content);
const div = document.createElement("div");
div.appendChild(fragment);
const html = div.innerHTML;
```

### Selection Types

```typescript
import {
  Selection,
  TextSelection,
  NodeSelection,
  AllSelection
} from "prosemirror-state";

// Text selection (cursor or range)
const textSel = TextSelection.create(doc, anchor, head?);

// Node selection (single node)
const nodeSel = NodeSelection.create(doc, pos);

// All selection (entire document)
const allSel = new AllSelection(doc);

// Selection at start/end
const atStart = Selection.atStart(doc);
const atEnd = Selection.atEnd(doc);

// Near a position
const near = Selection.near(doc.resolve(pos), bias?);
```

---

## Best Practices

### 1. Schema Design

```typescript
// ✅ Good: Required nodes have defaults
heading: {
  attrs: { level: { default: 1 } },
  content: "inline*",
}

// ❌ Bad: Required nodes without defaults break schema constraints
heading: {
  attrs: { level: {} },  // No default = can't auto-create
}

// ✅ Good: Use groups for flexibility
paragraph: { group: "block", content: "inline*" },
blockquote: { group: "block", content: "block+" },

// ✅ Good: Explicit mark restrictions
code_block: { marks: "" },  // No marks allowed
paragraph: { marks: "_" },   // All marks allowed
```

### 2. Plugin Organization

```typescript
// ✅ Good: Separate concerns into focused plugins
const historyPlugin = history();
const keymapPlugin = keymap(myKeymap);
const autolinkPlugin = createAutolinkPlugin();

// ✅ Good: Use plugin keys for state access
const myKey = new PluginKey("myFeature");
const plugin = new Plugin({
  key: myKey,
  state: { /* ... */ },
});
// Access: myKey.getState(editorState)

// ✅ Good: Return immutable state
apply(tr, value) {
  return { ...value, count: value.count + 1 };  // New object
}

// ❌ Bad: Mutating plugin state
apply(tr, value) {
  value.count += 1;  // Mutation!
  return value;
}
```

### 3. Transaction Handling

```typescript
// ✅ Good: Check applicability before dispatching
if (myCommand(state, null)) {  // Check first
  myCommand(state, dispatch);   // Then execute
}

// ✅ Good: Use appendTransaction for follow-up changes
appendTransaction(trs, oldState, newState) {
  if (!trs.some(tr => tr.docChanged)) return null;
  // React to changes...
}

// ✅ Good: Preserve transaction metadata
dispatchTransaction(tr) {
  if (!tr.getMeta("addToHistory")) {
    // Handle non-history transactions
  }
  view.updateState(view.state.apply(tr));
}
```

### 4. Performance

```typescript
// ✅ Good: Map decorations through changes
apply(tr, decorations) {
  return tr.docChanged
    ? decorations.map(tr.mapping, tr.doc)
    : decorations;
}

// ❌ Bad: Recreating all decorations on every change
apply(tr, decorations) {
  return DecorationSet.create(tr.doc, computeAll(tr.doc));
}

// ✅ Good: Use nodesBetween for targeted operations
doc.nodesBetween(from, to, (node, pos) => {
  // Only process relevant range
});

// ❌ Bad: Processing entire document
doc.descendants((node, pos) => {
  // Processes everything
});
```

### 5. Keyboard Handling

```typescript
// ✅ Good: Use keymap plugin (normalized keys)
keymap({
  "Mod-b": toggleMark(schema.marks.strong),
  "Mod-z": undo,
  "Mod-Shift-z": redo,
});

// ✅ Good: Chain commands for fallback behavior
keymap({
  "Backspace": chainCommands(
    deleteSelection,
    joinBackward,
    selectNodeBackward
  ),
});

// ❌ Bad: Raw key handling with browser inconsistencies
handleKeyDown(view, event) {
  if (event.ctrlKey && event.key === "b") { // Not cross-platform
    // ...
  }
}
```

### 6. DOM Integration

```typescript
// ✅ Good: Use toDOM/parseDOM for serialization
paragraph: {
  parseDOM: [{ tag: "p" }],
  toDOM: () => ["p", 0],
}

// ✅ Good: Preserve whitespace in code
code_block: {
  parseDOM: [{ tag: "pre", preserveWhitespace: "full" }],
}

// ✅ Good: Node views for complex rendering
nodeViews: {
  code_block: (node, view, getPos) =>
    new CodeMirrorView(node, view, getPos),
}
```

---

## IrisNotes Implementation Reference

Current setup in `src/components/editor/prosemirror-editor.tsx`:

```typescript
// Schema extension pattern
const mySchema = new Schema({
  nodes: addListNodes(
    schema.spec.nodes,
    "paragraph block*",
    "block"
  ).append({ code_block: codeBlockSpec }),
  marks: schema.spec.marks,
});

// Plugin composition in prosemirror-setup.ts
export function customSetup(options: SetupOptions): Plugin[] {
  const plugins: Plugin[] = [];

  // 1. App-level shortcut passthrough (first = highest priority)
  plugins.push(keymap(appShortcutBindings));

  // 2. Input rules (markdown shortcuts)
  plugins.push(buildInputRules(options.schema));

  // 3. Editor keybindings
  plugins.push(keymap(filteredKeymap));
  plugins.push(keymap(baseKeymap));

  // 4. Core functionality
  plugins.push(history());
  plugins.push(dropCursor());
  plugins.push(gapCursor());

  // 5. Custom features
  plugins.push(...autolinkPlugin(options.schema));

  return plugins;
}
```

---

## Additional Resources

- [ProseMirror Guide](https://prosemirror.net/docs/guide/) - Official tutorial
- [ProseMirror Reference](https://prosemirror.net/docs/ref/) - Complete API docs
- [ProseMirror Forum](https://discuss.prosemirror.net/) - Community support
- [prosemirror-example-setup](https://github.com/ProseMirror/prosemirror-example-setup) - Reference implementation
