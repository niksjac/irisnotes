# ADR-0004: Fractional indexing for item order

- **Status:** Accepted
- **Date:** 2025-12-29 (commit `b27319c`)
- **Recorded:** 2026-10-04, retroactively, from `docs/FRACTIONAL_INDEXING.md`
  (since removed)
- **Supersedes:** —
- **Related:** [ADR-0003](ADR-0003-single-items-table.md),
  [ADR-0008](ADR-0008-local-first-sync-central-hub.md)

## Context

Items in the tree have a user-chosen order. Integer positions need every
following sibling renumbered on insert, and two devices inserting at the same
position produce the same number — a guaranteed conflict once sync exists.

## Decision

`items.sort_order` is a **text key from the `fractional-indexing` library**
(`generateKeyBetween`). Ordering is plain lexicographic comparison. Inserting
between two siblings generates a new key between theirs; no other row changes.
The column defaults to `'a0'`.

## Consequences

**Good**

- A move or insert writes exactly one row, which keeps sync payloads minimal and
  avoids cascades of `updated_at` changes.
- Concurrent inserts at the same position on different devices get different
  keys.

**Bad**

- Keys grow longer after many inserts in the same gap. Harmless at note-taking
  scale; a batch rebalance is possible if it ever matters.
- Identical keys are unlikely but not impossible. Any ordering code must use a
  stable tie-breaker (id or `created_at`) rather than assume uniqueness.

## Alternatives considered

- **Integer positions** — rejected: renumbering on every insert and
  conflict-prone under sync.
- **Floating-point positions** — rejected: precision runs out after repeated
  bisection, and floats compare badly across languages.
