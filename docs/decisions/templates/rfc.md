# RFC-NNNN: <problem being explored>

- **Status:** Draft | Accepted | Rejected | Withdrawn
- **Date:** YYYY-MM-DD (opened)
- **Resolved:** — (date + resulting ADR number, once settled)
- **Related:** — (ADRs this builds on or would produce)

## Problem

What is unresolved, and why it needs resolving now. Be concrete about the
decision that is actually blocked — an RFC that does not name a decision is a
design doc, not an RFC.

## What exists today

The current state, verified against source rather than remembered. Cite code as
`path/file.ts:123`. Separate clearly:

- what is **implemented and working**,
- what is **implemented but unverified in the real world**,
- what is **not built at all**.

This section is what keeps the rest of the RFC honest about cost — an option is
cheap or expensive only relative to what already exists.

## Options

### Option A — <name>

What it is. What it costs in code, in operations, and in new failure modes.
State plainly whether it works with what exists today or requires a feature.

### Option B — <name>

As above. Include options you expect to reject; recording why they lose is half
the value of the document.

## Recommendation

A single clear recommendation with reasoning, not a survey. If the
recommendation is "defer", say what specifically would have to change or be
learned for the question to be worth reopening.

## Open questions

Things that genuinely must be answered before this can move to `Accepted`,
each with who or what can answer it. Gating facts about the real world (does the
ISP use CGNAT, how much RAM does the box have) belong here.

## Resolution

Left empty while `Draft`. On settling: the date, what was decided, and the ADR
that now carries it. Do not delete the options that lost.
