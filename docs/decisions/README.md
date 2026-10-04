# Decision Records

Durable record of *why* IrisNotes is built the way it is. Unlike the rest of
`docs/` — which describes how things currently work and goes stale — these files
are dated, append-only history. An old record is not wrong; it is a snapshot of
what was decided and why.

Two kinds, with different jobs:

| | ADR — Architecture Decision Record | RFC — Request for Comments |
|---|---|---|
| Captures | a decision **already made** | a problem **still open** |
| Length | short (one page) | as long as the problem needs |
| Written | after deciding | before deciding |
| Lifecycle | `Accepted` → later `Superseded` | `Draft` → `Accepted` / `Rejected` / `Withdrawn` |
| Edited later? | **No** — supersede it with a new ADR | Yes, while still `Draft` |

The two connect: an RFC explores a problem and weighs options; once it settles,
it is marked `Accepted` and the outcome is written up as one or more ADRs. Small
decisions skip the RFC and go straight to an ADR. Not every decision needs a
record — write one when the reasoning would otherwise be lost, when a future
reader would reasonably ask "why not the obvious thing?", or when the choice
constrains later work.

## Layout

```
docs/decisions/
  README.md            this file
  templates/adr.md     copy for a new ADR
  templates/rfc.md     copy for a new RFC
  adr/ADR-NNNN-slug.md
  rfc/RFC-NNNN-slug.md
```

Numbers are sequential per kind and never reused, including for rejected or
withdrawn records — gaps are fine, renumbering is not. The slug is lowercase
kebab-case. ADR and RFC numbering are independent (ADR-0001 and RFC-0001 are
unrelated unless they say so).

## Writing one

1. Copy the matching template into `adr/` or `rfc/` with the next free number.
2. Fill in the front matter (status, date, and any relationship to other
   records). Dates are absolute — `2026-10-02`, never "last week".
3. Cite code as `path/to/file.ts:123` so a reader can check whether the claim
   still holds. Say plainly what is *implemented* versus *planned*; that
   distinction is the main thing these records exist to preserve.
4. Add a line to the index below, and to [`../README.md`](../README.md).

## Changing a decision

Never edit an `Accepted` ADR to reflect a new decision. Write a new ADR that
states the change, set its `Supersedes:` field, and set the old one's status to
`Superseded by ADR-NNNN`. The point is that the old reasoning stays readable —
you want to know what you believed then, not just what you believe now.

## Index

### ADRs

| # | Title | Status | Date |
|---|---|---|---|
| [0001](adr/ADR-0001-sync-overlay-network.md) | Private overlay network for sync transport | Accepted | 2026-10-02 |
| [0002](adr/ADR-0002-vps-hub-first-defer-home-infrastructure.md) | Single VPS hub first; NAS hub and OPNsense WireGuard deferred | Accepted | 2026-10-02 |
| [0003](adr/ADR-0003-single-items-table.md) | One `items` table for books, sections and notes | Accepted | 2025-08-15 |
| [0004](adr/ADR-0004-fractional-indexing-sort-order.md) | Fractional indexing for item order | Accepted | 2025-12-29 |
| [0005](adr/ADR-0005-line-oriented-editor-schema.md) | Line-oriented ProseMirror schema | Accepted | 2026-01-11 |
| [0006](adr/ADR-0006-quick-search-separate-app.md) | Quick search is a separate Tauri app | Accepted | 2025-12-27 |
| [0007](adr/ADR-0007-configuration-toml-and-settings-table.md) | Configuration in TOML files, UI preferences in the settings table | Accepted | 2025-12-31 |
| [0008](adr/ADR-0008-local-first-sync-central-hub.md) | Local-first sync through a central hub | Accepted | 2026-06-25 |
| [0009](adr/ADR-0009-local-builds-no-ci-no-formatter.md) | Local builds and checks — no hosted CI, formatter or linter | Accepted | 2026-10-04 |

ADRs 0003–0008 were written retroactively on 2026-10-04 from older design docs
and checked against the code; their **Date** is when the decision was made, and
each says where it was reconstructed from. Numbers follow the order records were
written, not the order decisions were made.

### RFCs

| # | Title | Status | Date |
|---|---|---|---|
| [0001](rfc/RFC-0001-sync-hub-topology.md) | Sync hub topology and redundancy | Accepted → ADR-0002 | 2026-10-02 |
| [0002](rfc/RFC-0002-math-rendering.md) | Math rendering in the rich editor | Draft | 2026-01-11 |
| [0003](rfc/RFC-0003-note-types.md) | Note types beyond rich text | Draft | 2026-01-03 |
| [0004](rfc/RFC-0004-onenote-style-editor.md) | OneNote-style editor — remaining features | Draft | 2026-01-05 |
