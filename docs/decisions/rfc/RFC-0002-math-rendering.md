# RFC-0002: Math rendering in the rich editor

- **Status:** Draft
- **Date:** 2026-01-11 (opened as `docs/MATH_RENDERING.md`; moved here
  2026-10-04)
- **Resolved:** —
- **Related:** [ADR-0005](../adr/ADR-0005-line-oriented-editor-schema.md),
  [RFC-0004](RFC-0004-onenote-style-editor.md)

## Problem

Notes sometimes need formulas. Today they can only be typed as raw LaTeX text.
The question is how — and whether — the rich editor should render `$...$`
(inline) and `$$...$$` (display) math.

## What exists today

Verified 2026-10-04: **nothing is built.** No math library is a dependency
(`apps/main/package.json`), no plugin or node handles math, and `Ctrl+M`
(`Mod-m`) is not bound in either hotkey file.

Notes are stored as HTML (`items.content`), so any LaTeX typed today survives as
plain text — an approach that keeps the source in the text is compatible with
existing notes for free.

## Options

### Option A — Always rendered (math node with NodeView)

Parse math into a dedicated ProseMirror node; render it with KaTeX; edit the
source in a popup or on click. Most polished. Needs a schema change, HTML
serialization for the new node, and line-command behaviour for an atom node
(ADR-0005).

### Option B — Cursor-aware decorations

Leave the LaTeX in the text; a plugin finds `$...$` / `$$...$$` and shows a
rendered widget decoration, revealing the source when the cursor enters it.
No schema change; stored HTML stays plain text. Edge cases around selections
that span math.

### Option C — Toggle mode

Same decorations as B, but on/off for the whole note via a hotkey (e.g.
`Ctrl+M`). Simplest; no cursor tracking.

### Option D — Side-by-side preview

A rendered pane next to the editor. Least intrusive, but duplicates the view and
does not fit the single-pane-with-tabs layout.

**Library:** KaTeX over MathJax — synchronous, much faster, smaller; covers the
LaTeX subset relevant to notes.

## Recommendation

Start with **Option C on KaTeX**, then grow into **Option B**. Both keep the LaTeX
as plain text in the stored HTML, so they need no schema change, cannot damage
existing notes, and can be removed without migration. Revisit Option A only if
decorations prove insufficient.

## Open questions

- Is math needed often enough to justify a dependency at all? (Owner's call.)
- Should rendered math appear in HTML export, or only in the editor?
- Should the source editor (CodeMirror) show anything for math?

## Resolution

—
