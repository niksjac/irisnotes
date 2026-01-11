# Math Rendering - Future Implementation Strategies

This document outlines possible approaches for implementing inline math rendering in IrisNotes using LaTeX syntax.

## Overview

Math rendering would allow users to write LaTeX-style math expressions like `$E = mc^2$` for inline math and `$$\int_0^\infty e^{-x^2} dx$$` for block math, with real-time visual rendering.

## Rendering Libraries

### KaTeX (Recommended)
- **Pros**: Fast, lightweight (~200KB), no external dependencies, works offline
- **Cons**: Doesn't support all LaTeX commands (but covers 95%+ of common use cases)
- **Install**: `pnpm add katex`
- **Usage**: `katex.renderToString("E = mc^2")`

### MathJax
- **Pros**: Full LaTeX support, highly configurable
- **Cons**: Larger (~500KB+), slower rendering, more complex setup
- **Best for**: Academic/scientific documents requiring obscure LaTeX features

### Recommendation
**KaTeX** is the best choice for a notes app - it's fast enough for real-time rendering and covers the vast majority of mathematical notation.

---

## Implementation Strategies

### Strategy A: Always Rendered (Notion Style)

Math is always displayed in rendered form. Users click on math to edit the source.

```
┌─────────────────────────────────────────────┐
│ The equation E = mc² is famous.             │  ← Rendered view
│                   ↑                         │
│              (click to edit)                │
└─────────────────────────────────────────────┘
                    ↓ click
┌─────────────────────────────────────────────┐
│ The equation $E = mc^2$ is famous.          │  ← Source view (focused)
│              └─────────┘                    │
│               editing math                  │
└─────────────────────────────────────────────┘
```

**Implementation:**
1. Create `math_inline` and `math_block` ProseMirror node types
2. Use NodeViews to render KaTeX output
3. On focus, switch NodeView to editable text input
4. On blur, re-render with KaTeX

**Pros:**
- Clean, distraction-free reading
- WYSIWYG experience

**Cons:**
- Can't see surrounding LaTeX syntax while reading
- Requires clicking to edit
- More complex implementation

---

### Strategy B: Cursor-Aware (Obsidian Style)

Math is rendered when the cursor is outside, shows source when cursor is inside.

```
┌─────────────────────────────────────────────┐
│ The equation E = mc² is famous.             │  ← Cursor elsewhere
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ The equation $E = mc^2|$ is famous.         │  ← Cursor inside math
│              └─────────┘                    │
│              source visible                 │
└─────────────────────────────────────────────┘
```

**Implementation:**
1. Use ProseMirror Decorations to overlay rendered math
2. Track cursor position with a plugin
3. Hide decoration and show source text when cursor enters math range
4. Re-show decoration when cursor leaves

**Pros:**
- Seamless editing experience
- No explicit "edit mode" needed
- Natural typing flow

**Cons:**
- Slightly more jarring when cursor enters/leaves
- Need to handle selection spanning math carefully

---

### Strategy C: Toggle Mode (Typora Style)

Global toggle between "source mode" and "preview mode" for all math.

```
[Ctrl+M to toggle]

Source Mode:                          Preview Mode:
┌──────────────────────┐              ┌──────────────────────┐
│ $E = mc^2$           │      ↔       │ E = mc²              │
│ $$\int_0^1 x dx$$    │              │ ∫₀¹ x dx             │
└──────────────────────┘              └──────────────────────┘
```

**Implementation:**
1. Use Decorations to replace math text with rendered widgets
2. Toggle decoration visibility with a command
3. Store toggle state in editor settings

**Pros:**
- Simple mental model
- Easy to implement
- No cursor tracking needed

**Cons:**
- Not as fluid as cursor-aware
- Need to toggle back and forth

---

### Strategy D: Side-by-Side Preview

Show source on left, rendered preview on right (or below).

```
┌─────────────────────┬─────────────────────┐
│ Source              │ Preview             │
├─────────────────────┼─────────────────────┤
│ $E = mc^2$          │ E = mc²             │
│ $$\int_0^1 x dx$$   │ ∫₀¹ x dx            │
└─────────────────────┴─────────────────────┘
```

**Implementation:**
1. Render a second read-only view synced to source
2. Process math in the preview pane only

**Pros:**
- Always see both source and output
- Good for learning LaTeX

**Cons:**
- Takes up screen space
- Overkill for simple notes

---

## Recommended Approach for IrisNotes

### Phase 1: Strategy C (Toggle Mode)
Start with the simplest implementation:
1. Add KaTeX dependency
2. Create a decoration plugin that finds `$...$` and `$$...$$` patterns
3. Replace with rendered widgets when preview mode is on
4. Add `Ctrl+M` hotkey to toggle math preview

### Phase 2: Strategy B (Cursor-Aware)
Upgrade to cursor-aware rendering:
1. Extend the decoration plugin to track cursor position
2. Dynamically hide/show decorations based on cursor
3. Handle edge cases (selection spanning math, etc.)

### Phase 3: Strategy A (Full NodeView)
For the most polished experience:
1. Convert math to proper ProseMirror nodes during parsing
2. Use NodeViews for complete control over rendering and editing
3. Add math toolbar/autocomplete

---

## Technical Considerations

### Parsing Math Delimiters
- Inline: `$...$` (single dollar signs)
- Block: `$$...$$` (double dollar signs)
- Alternative: `\(...\)` for inline, `\[...\]` for block
- Edge case: Escaped dollars `\$` should not trigger math mode

### Performance
- Cache rendered math (don't re-render if source unchanged)
- Use `requestIdleCallback` for non-visible math
- Consider virtualization for documents with many equations

### Accessibility
- Include alt text with the LaTeX source
- Ensure keyboard navigation works
- Support screen readers (KaTeX generates accessible markup)

### Error Handling
- Invalid LaTeX should show the source with error styling
- Display error message in tooltip
- Don't break the document if math fails to parse

---

## Schema Changes (for Strategy A)

```typescript
// New node types for schema.ts
const mathInlineSpec = {
  group: "inline",
  content: "text*",
  inline: true,
  atom: true,
  attrs: { latex: { default: "" } },
  parseDOM: [{ tag: "span.math-inline" }],
  toDOM: () => ["span", { class: "math-inline" }, 0],
};

const mathBlockSpec = {
  group: "block",
  content: "text*",
  attrs: { latex: { default: "" } },
  parseDOM: [{ tag: "div.math-block" }],
  toDOM: () => ["div", { class: "math-block" }, 0],
};
```

---

## Dependencies to Add

```bash
pnpm add katex
pnpm add -D @types/katex
```

---

## References

- [KaTeX Documentation](https://katex.org/docs/api.html)
- [ProseMirror NodeViews](https://prosemirror.net/docs/guide/#view.node_views)
- [ProseMirror Decorations](https://prosemirror.net/docs/guide/#view.decorations)
- [Obsidian Math Implementation](https://help.obsidian.md/Editing+and+formatting/Advanced+formatting+syntax#Math)
