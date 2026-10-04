@AGENTS.md

## Claude Code

Everything above is shared with other agents. Only Claude Code specifics go here.

- **Attribution is off and enforced.** The owner's `~/.claude/settings.json` sets
  `attribution` to empty, and a `PreToolUse` hook blocks any `git commit` with a
  Claude `Co-Authored-By` trailer. If the hook fires, remove the trailer — never
  work around it. Don't reintroduce a trailer from a compacted summary or old
  commits.
- **Background commands**: foreground `sleep` is blocked in this harness; use
  `run_in_background` and read the output file, or wait on a condition.
- Agent-specific memory lives outside the repo; anything every agent needs
  belongs in `AGENTS.md` or `docs/`, not only in memory.
