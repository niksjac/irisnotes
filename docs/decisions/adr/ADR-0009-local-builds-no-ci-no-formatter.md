# ADR-0009: Local builds and checks — no hosted CI, formatter or linter

- **Status:** Accepted
- **Date:** 2026-10-04
- **Supersedes:** —
- **Related:** [`install-local.sh`](../../../install-local.sh),
  [`AGENTS.md`](../../../AGENTS.md)

## Context

IrisNotes has one developer and one primary install target: their own Arch Linux
machine. Infrastructure for a wider audience was added on 2026-02-08 (commit
`8f0f189`) but never used:

- `.github/workflows/release.yml` built for Linux, macOS and Windows on tag
  push. It never ran — 0 workflow runs and 0 GitHub releases as of 2026-10-04 —
  and referenced a non-existent action (`dtolnay/rust-action`), so it would have
  failed.
- `PKGBUILD` still held placeholder maintainer and URL values, a fixed version
  of 1.0.0, and a source tarball from a release tag that has never existed.

Formatting tools were set up and abandoned the same way: `.biomeignore`,
`.prettierignore`, a Biome guide and ESLint/Prettier checks in a script, with no
config, no installed binary and no script that ran them.

Every real release has been made with `install-local.sh`.

## Decision

1. **Releases are built and installed locally** with
   `./install-local.sh --bump --commit`: it bumps the patch version across the
   release files, builds both Tauri apps, installs them to `~/.local`, and
   commits `chore(release): bump apps to X.Y.Z`. No CI release pipeline and no
   distro package.
2. **No hosted CI.** Checks run locally before committing.
3. **No formatter and no linter.** Style is "match the file you are editing"
   (tabs for indentation). `pnpm run type-check` (`tsc --noEmit`, strict) is the
   required check for TypeScript changes; `pnpm test` covers the unit tests;
   `cargo check` / `cargo build` cover the Rust crates.

All the unused pieces above were removed on 2026-10-04.

## Consequences

**Good**

- No configuration that looks authoritative but does nothing — the previous
  state misled both people and AI agents.
- No reformatting churn in diffs.

**Bad**

- Nothing enforces checks: a broken type-check can be committed. The discipline
  lives in [`AGENTS.md`](../../../AGENTS.md) and in habit.
- Style drifts between files over time.
- Builds for other platforms, or for anyone else, need this decision revisited.

## Alternatives considered

- **Small CI on push (type-check, unit tests, `cargo check`)** — considered and
  declined for now; reasonable to add later if broken commits become a problem.
- **Adopt Biome with a one-time reformat and a CI check** — declined: a large
  one-time diff and ongoing tooling for a single-developer codebase.
- **Keep the release workflow and fix it** — declined: no use for cross-platform
  release artifacts today.
