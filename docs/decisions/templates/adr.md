# ADR-NNNN: <short imperative title>

- **Status:** Proposed | Accepted | Superseded by ADR-NNNN
- **Date:** YYYY-MM-DD
- **Supersedes:** — (or ADR-NNNN)
- **Related:** — (RFC-NNNN, other ADRs, relevant docs)

## Context

The forces at play, in present tense. What constraint, requirement, or problem
made a decision necessary? Include the facts a future reader cannot reconstruct:
what hardware/services were available, what was already built, what the
non-negotiables were. Cite code as `path/file.ts:123` where a claim depends on
it. Keep it factual — the argument belongs under Decision and Consequences.

## Decision

What was decided, stated plainly and in the active voice ("Sync traffic rides a
private overlay", not "it was decided that..."). If the decision depends on an
invariant holding, name the invariant explicitly — that is usually the most
valuable line in the whole record.

## Consequences

Both directions, honestly. A record listing only upsides is not trustworthy.

- Good: what this buys.
- Bad: what it costs, what it forecloses, what new failure mode it introduces.
- Neutral: what now has to be remembered, maintained, or watched.

## Alternatives considered

For each: what it was, and the specific reason it lost. "Rejected because X" —
not "we preferred the other one". A plausible alternative with no stated reason
for rejection is the most common way one of these records becomes useless.
