# ADR-0003: One `items` table for books, sections and notes

- **Status:** Accepted
- **Date:** 2025-08-15 (commit `d5b02e2`)
- **Recorded:** 2026-10-04, retroactively, from `docs/DATABASE_DESIGN.md` (since
  removed)
- **Supersedes:** —
- **Related:** [`schema/base.sql`](../../../schema/base.sql),
  [ADR-0004](ADR-0004-fractional-indexing-sort-order.md)

## Context

The first storage design had a `notes` table for content and a `categories`
table for books and sections. Every feature that touched the tree — moving,
searching, tagging, versioning — needed to know which table an entry lived in
and join across both. The hierarchy itself is small and fixed: books at the root,
sections under books, notes at the root or under books or sections, never inside
another note.

## Decision

All content lives in a single **`items`** table, discriminated by
`type IN ('note', 'book', 'section')` and linked by a self-referencing
`parent_id`. Fields that only some types use are nullable or defaulted. Fields
still being explored go in a JSON `metadata` column rather than new columns.

The hierarchy rules are enforced in the database, not only in the UI:

- a `CHECK` constraint: books have no parent, sections must have one;
- triggers `prevent_note_in_note_insert` / `_update` reject a note under a note.

`schema/base.sql` is the single source of truth for this schema. The frontend
imports it (`@schema/base.sql?raw`), the Tauri backend and `iris-server` embed it
with `include_str!`.

## Consequences

**Good**

- One query shape for the whole tree; moving an item between levels is an
  update of `parent_id` and `sort_order`.
- Search (`items_fts`), tags (`item_tags`), soft delete (`deleted_at`) and view
  tracking apply to every type without per-table variants.
- Sync can treat every row the same way, which is what made the content-opaque,
  row-level sync in ADR-0008 cheap.

**Bad**

- Books and sections carry unused content columns.
- Type rules live in `CHECK` constraints and triggers that SQLite enforces
  weakly compared to separate typed tables; the app must still respect them.
- `metadata` is unvalidated JSON — convenient for experiments, a source of drift
  if it grows quietly.

**Must be remembered**

- Hierarchy rules exist in three places — `schema/base.sql`,
  `apps/main/src/storage/hierarchy.ts`, and the tree's create/drop logic — and
  must be changed together.
- Version history is **not** a trigger. Versions are explicit rows in
  `note_versions`, written by the app. (The old design doc described an
  automatic `item_revisions` trigger; it no longer exists.)

## Alternatives considered

- **Separate `books`, `sections`, `notes` tables** — rejected: three-way joins
  for tree queries, duplicated common columns, and a schema change for every new
  type.
- **Keep `notes` + `categories`** — replaced by this decision; it had the same
  join cost with less clarity about which entries were books versus sections.
