# RFC-0004: OneNote-style editor — remaining features

- **Status:** Draft
- **Date:** 2026-01-05 (opened as `docs/PROSEMIRROR_ONENOTE_SPEC.md`; reduced to
  the unbuilt parts and moved here 2026-10-04)
- **Resolved:** —
- **Related:** [ADR-0005](../adr/ADR-0005-line-oriented-editor-schema.md),
  [RFC-0002](RFC-0002-math-rendering.md)

## Problem

The goal for the rich editor is the feel of OneNote Classic: fast keyboard-first
formatting, line operations, tables, and inline structure. The original spec
listed everything that implies as a five-week checklist. Much of it has since
been built; this RFC keeps only what is still open, so the list can be used to
pick the next editor work.

## What exists today

Verified against `apps/main/src/components/editor/` on 2026-10-04.

**Built:**

- Marks: bold, italic, inline code, underline, strikethrough, text colour,
  highlight, font size, font family, link.
- Blocks: paragraph (line), blockquote, horizontal rule, `code_section`,
  `code_block` (CodeMirror node view), details/summary (collapsible), image
  (node view), bullet and ordered lists, tables (`prosemirror-tables`, with a
  floating table toolbar: add/delete rows and columns, merge and split cells).
- Line commands (move, copy, delete line; select word/next occurrence), active
  line, custom cursor, find in note, autocorrect, autolink, paste-as-code-block,
  link dialog (`Ctrl+Shift+K`), fixed toolbar.

**Not built:**

| Feature | Notes from the original spec |
|---|---|
| Subscript / superscript marks | `Ctrl+=` / `Ctrl+Shift+=` |
| Task lists (checkbox items) | `[ ]` / `[x]` at line start |
| Callout / admonition blocks | `::info`, `::warning` |
| Internal note links | `[[` opens a title autocomplete; click navigates |
| Inline tags / labels | |
| Date and time stamps | `Ctrl+;` date, `Ctrl+Shift+;` time |
| Markdown-style input rules | none exist yet (`---`, `~~x~~`, `==x==`, …) |
| Block drag handles | |
| Floating text toolbar on selection | only tables have a floating toolbar |
| Block insert menu | |
| Smart paste beyond code blocks | URLs, images, tables from HTML |
| Math | see RFC-0002 |
| Drawing / ink | lowest priority in the original spec |

## Options

This RFC does not choose between alternatives for one feature; it decides
**order**. Each item, when picked up, is small enough to need only an ADR if it
involves a real design choice (for example, how internal links are stored).

## Recommendation

Next, in order of value for daily use relative to effort:

1. **Input rules** — cheap, and several other items (task lists, `[[`) build on
   them.
2. **Task lists** — the most common missing structure in notes.
3. **Internal note links** — needs a storage decision (link by item id, so
   renames don't break links) — write an ADR when starting.
4. **Date/time stamps** and **sub/superscript** — trivial, fill gaps.

Defer drag handles, block menu, floating text toolbar and ink until the above
exist.

## Open questions

- Internal links: `href` format (`iris://note/<id>`?), behaviour in quick search
  and the CLI, and what happens when the target is deleted.
- Task lists: a new node type or a list-item attribute? Either affects HTML
  export.

## Resolution

—
