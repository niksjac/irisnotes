# ADR-0005: Line-oriented ProseMirror schema

- **Status:** Accepted
- **Date:** 2026-01-11 (commit `3a3782d`), completed 2026-01-20 (commit
  `4ab89c2`)
- **Recorded:** 2026-10-04, retroactively, from the two commits above and the
  header of `apps/main/src/components/editor/schema.ts`
- **Supersedes:** —
- **Related:** [RFC-0004](../rfc/RFC-0004-onenote-style-editor.md)

## Context

The rich editor started from `prosemirror-schema-basic`, which has semantic
headings (`h1`–`h6`) and soft line breaks (`hard_break`). The intended feel is a
line editor in the spirit of OneNote or Notepad++: every Enter is a new line,
line operations (move, copy, delete, select) act on whole lines, and text size is
a visible formatting property.

Semantic headings fought that model. Their size came from the tag, not from a
mark, so the toolbar could not show or change a heading's font size consistently,
and soft breaks made "a line" ambiguous for line commands.

## Decision

The editor uses a **custom line-based schema**
(`apps/main/src/components/editor/schema.ts`):

- a paragraph is a **line**; there is **no `hard_break`** — Enter and Shift+Enter
  both start a new block;
- there is **no semantic heading node** — visual headings are a `fontSize` mark;
  `h1`–`h6` in existing HTML are parsed as paragraphs;
- other block types remain available: lists, blockquote, code sections and
  blocks, tables, details/summary, images, horizontal rule.

## Consequences

**Good**

- Line commands (move/copy line, select word, delete line) have one clear unit.
- Font size is always explicit, so the toolbar and pickers reflect it exactly.

**Bad**

- HTML exported from IrisNotes carries no heading semantics, so outlines and
  accessibility tools see a flat document.
- Pasted or imported content loses its heading structure on parse.

**Must be remembered**

- Never reintroduce `hard_break` or a heading node; the editor plugins and
  keybindings assume their absence.

## Alternatives considered

- **Keep `prosemirror-schema-basic`** — rejected for the reasons in Context.
- **Headings as a node with a size attribute** — not pursued; it would keep two
  ways of expressing size (node and mark) instead of one.
