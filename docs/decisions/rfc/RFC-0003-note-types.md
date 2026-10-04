# RFC-0003: Note types beyond rich text

- **Status:** Draft
- **Date:** 2026-01-03 (opened as `docs/NOTE_TYPES.md`; moved here 2026-10-04)
- **Resolved:** —
- **Related:** [ADR-0003](../adr/ADR-0003-single-items-table.md)

## Problem

Every note is rich text edited in ProseMirror (with a CodeMirror view of its
HTML via `Ctrl+E`). Some notes would be better as a different kind of document:
a Markdown file, plain text, or a single code snippet with syntax highlighting.
The question is whether to support per-note types and how to store them.

## What exists today

Verified 2026-10-04:

- **Schema is ready but unused.** `items.content_type` allows
  `'html' | 'markdown' | 'plain' | 'custom'`, with `content_raw` for an original
  format. No code writes anything other than `html`.
- **Code inside rich notes already works** — `code_block` and `code_section`
  nodes render through a CodeMirror node view.
- **CodeMirror language packages installed:** css, html, javascript, json,
  markdown, python.
- No UI for choosing a note's type; no per-type editor selection.

## Options

### Option A — Type in `metadata`

Keep `content_type` for the storage format and put the note kind in JSON:
`metadata.note_format = "code"`, `metadata.language = "python"`. No schema
change, easy to experiment with, unvalidated.

### Option B — Extend the `content_type` CHECK

Add values such as `code:python`. Validated by SQLite, but every new language is
a schema change and touches `schema/base.sql`, the server (which embeds it), and
the sync contract version.

### Option C — Don't add types

Rely on code blocks inside rich notes. Zero cost; no full-file code or Markdown
notes.

## Recommendation

**Option A**, limited at first to `markdown`, `plain` and `code` (with a
language): CodeMirror is already in the app, the schema already has the storage
values, and nothing about sync changes — rows stay content-opaque (ADR-0008).
Reserve Option B for if a type proves permanent enough to deserve validation.

## Open questions

- Does Markdown need a live preview, or is highlighted source enough?
- Can a note change type after creation, and what happens to its content?
- How should the tree show a note's type (icon per type)?
- How do quick search and the CLIs display non-HTML content?

## Resolution

—
