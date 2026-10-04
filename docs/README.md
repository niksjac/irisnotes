# IrisNotes docs

Two kinds of documentation live here. For how to work in this repo — commands,
conventions, rules for changes — start with [`/AGENTS.md`](../AGENTS.md).

## [Decision records](decisions/README.md)

Why IrisNotes is built the way it is: **ADRs** for decisions made, **RFCs** for
questions still open. Dated and append-only — an old record is history, not an
error. See the [index](decisions/README.md) for the full list.

## Guides

How to use and extend parts of the app. Each guide is checked against the source
and dated; if code and guide disagree, the code wins and the guide needs fixing.

- [building.md](guides/building.md) — prerequisites, dev workflow, local releases
- [configuration.md](guides/configuration.md) — config files, themes, autocorrect,
  ASCII art, what lives in the database
- [hotkeys.md](guides/hotkeys.md) — app hotkeys and editor keybindings, and how
  to override them
- [editor.md](guides/editor.md) — editor appearance settings and the custom
  cursor
- [icons.md](guides/icons.md) — app, launcher and tray icons on Linux

## Elsewhere

- [`apps/server/README.md`](../apps/server/README.md) — sync server, contract
- [`apps/server/DEPLOY.md`](../apps/server/DEPLOY.md) — deploying the sync server
- [`schema/base.sql`](../schema/base.sql) — the database schema (source of truth)
