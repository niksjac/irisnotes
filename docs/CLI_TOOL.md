# IrisNotes CLI Tool

A command-line interface for interacting with IrisNotes from the terminal.

## Overview

The IrisNotes CLI provides fast, scriptable access to your notes database without launching the full GUI application. Perfect for power users, automation, and quick note operations.

## Architecture

**Recommended Implementation: Standalone Node.js/Bun CLI**

```
irisnotes-cli/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts          # CLI entry point (Commander.js)
│   ├── commands/         # Command handlers
│   │   ├── open.ts
│   │   ├── search.ts
│   │   ├── list.ts
│   │   ├── create.ts
│   │   └── ...
│   ├── db.ts             # Direct SQLite access
│   └── utils.ts          # Shared utilities
└── bin/
    └── iris              # Executable wrapper
```

**Technology Stack:**
- **Runtime**: Bun (preferred) or Node.js
- **CLI Framework**: Commander.js
- **Database**: better-sqlite3 (direct SQLite access)
- **Output**: chalk (colors), cli-table3 (tables)

**Why Standalone?**
- Fast startup (no Tauri overhead)
- Direct database access (no IPC)
- Works independently of main app
- Easy distribution (npm/bun install)

---

## Command Reference

### High Priority Commands (Easy Implementation)

#### `iris open <note-id>`
**Feasibility: ⭐⭐⭐⭐⭐ Easy**

Open a specific note in the main IrisNotes app.

```bash
iris open note-123
iris open note-abc --new-window  # open in new window
```

**Implementation:**
- Query database for note existence
- Launch main app via: `irisnotes://open/note/<id>`
- Use `xdg-open` (Linux), `open` (macOS), or `start` (Windows)

---

#### `iris search "term"`
**Feasibility: ⭐⭐⭐⭐⭐ Easy**

Search notes using full-text search.

```bash
iris search "react hooks"
iris search "performance" --limit 10
iris search "TODO" --format json
```

**Output:**
```
Found 3 matches:

[1] React Best Practices
    📂 Reading List → Articles
    ...Modern React patterns and performance tips...

[2] Project A Notes
    📂 Work → Projects
    ...TODO: Optimize React component performance...

[3] Learning Goals
    📂 Personal → Ideas
    ...Master React performance optimization...
```

**Implementation:**
- Use FTS5 query with snippet extraction
- Join hierarchy for breadcrumb paths
- Color highlight matching terms

---

#### `iris list [book]`
**Feasibility: ⭐⭐⭐⭐⭐ Easy**

List all notes, optionally filtered by book.

```bash
iris list                    # all notes
iris list "Work"             # notes in Work book
iris list --recent 10        # 10 most recent
iris list --format table     # table view
```

**Output:**
```
📚 Personal (8 notes)
  📁 Meeting Notes
    • Weekly Standup (2 days ago)
    • Project Review (1 week ago)
  📁 Ideas
    • App Concept (3 days ago)
    • Learning Goals (1 week ago)

📚 Work (4 notes)
  ...
```

---

#### `iris tree`
**Feasibility: ⭐⭐⭐⭐⭐ Easy**

Display hierarchical tree of all items.

```bash
iris tree
iris tree "Work"  # specific book
iris tree --depth 2  # limit depth
```

**Output:**
```
📚 Personal
├─ 📁 Meeting Notes
│  ├─ 📄 Weekly Standup
│  └─ 📄 Project Review
└─ 📁 Ideas
   ├─ 📄 App Concept
   └─ 📄 Learning Goals

📚 Work
├─ 📄 Quick Note (no section)
└─ 📁 Projects
   ├─ 📄 Project A
   └─ 📄 Project B
```

---

#### `iris create "title"`
**Feasibility: ⭐⭐⭐⭐ Medium**

Create a new note.

```bash
iris create "Meeting Notes"
iris create "Todo" --book "Personal" --section "Ideas"
iris create "Quick Note" --book "Inbox" --edit
```

**Implementation:**
- Generate UUID for new note
- Insert into items table
- Optionally open in $EDITOR or main app
- Handle section/book resolution (fuzzy match or select)

---

#### `iris cat <note-id>`
**Feasibility: ⭐⭐⭐⭐⭐ Easy**

Print note content to stdout.

```bash
iris cat note-123
iris cat note-123 --plaintext     # strip HTML/markdown
iris cat note-123 | grep "TODO"   # pipe to other commands
```

---

### Medium Priority Commands

#### `iris edit <note-id>`
**Feasibility: ⭐⭐⭐⭐ Medium**

Edit note in $EDITOR.

```bash
iris edit note-123
export EDITOR=vim && iris edit note-123
```

**Implementation:**
- Export content to temp file
- Open in $EDITOR (default: nano/vim)
- On save, update database + trigger version history
- Handle HTML ↔ plaintext conversion

---

#### `iris delete <note-id>`
**Feasibility: ⭐⭐⭐⭐⭐ Easy**

Soft delete a note.

```bash
iris delete note-123
iris delete note-123 --permanent  # hard delete (skip trash)
```

---

#### `iris archive <note-id>`
**Feasibility: ⭐⭐⭐⭐⭐ Easy**

Archive a note (hidden but not deleted).

```bash
iris archive note-123
iris archive note-123 --unarchive  # restore from archive
```

---

#### `iris restore <note-id>`
**Feasibility: ⭐⭐⭐⭐⭐ Easy**

Restore a soft-deleted note.

```bash
iris restore note-123
iris restore --list  # show all deleted notes
```

---

#### `iris recent [n]`
**Feasibility: ⭐⭐⭐⭐⭐ Easy**

Show N most recently modified notes.

```bash
iris recent       # default: 10
iris recent 20    # last 20
iris recent --open  # select and open
```

---

#### `iris export <note-id> [file]`
**Feasibility: ⭐⭐⭐⭐ Medium**

Export note to file.

```bash
iris export note-123 output.md      # markdown
iris export note-123 output.html    # HTML
iris export note-123 --format pdf   # PDF (requires pandoc)
```

---

### Advanced Commands

#### `iris revisions <note-id>`
**Feasibility: ⭐⭐⭐⭐⭐ Easy**

Show version history.

```bash
iris revisions note-123
iris revisions note-123 --diff  # show diffs between versions
```

**Output:**
```
Version History for "Project Notes"

[v5] 2 hours ago  • Content changed
[v4] 1 day ago    • Title and content changed
[v3] 3 days ago   • Content changed
[v2] 1 week ago   • Content changed
[v1] 2 weeks ago  • Initial version
```

---

#### `iris revert <note-id> <version>`
**Feasibility: ⭐⭐⭐⭐ Medium**

Restore note to previous version.

```bash
iris revert note-123 3  # restore to version 3
iris revert note-123 3 --preview  # show what would change
```

---

#### `iris tags <note-id>`
**Feasibility: ⭐⭐⭐⭐⭐ Easy**

Manage note tags.

```bash
iris tags note-123                    # list tags
iris tags note-123 add "important"    # add tag
iris tags note-123 remove "draft"     # remove tag
iris tags --list                      # all tags
```

---

#### `iris stats`
**Feasibility: ⭐⭐⭐⭐⭐ Easy**

Show database statistics.

```bash
iris stats
iris stats --verbose
```

**Output:**
```
IrisNotes Statistics

Books:      12
Sections:   34
Notes:      156
Tags:       8

Total words:     45,234
Deleted items:   5
Archived items:  12

Last modified: 2 hours ago
Database size: 2.4 MB
```

---

## Installation & Setup

### Option 1: npm/bun Package
```bash
npm install -g irisnotes-cli
# or
bun install -g irisnotes-cli
```

### Option 2: Build from Source
```bash
cd irisnotes-cli
bun install
bun run build
bun link  # creates global 'iris' command
```

### Configuration

Create `~/.config/irisnotes/cli-config.json`:
```json
{
  "dbPath": "~/Library/Application Support/com.irisnotes.app/notes.db",
  "editor": "code --wait",
  "defaultFormat": "table",
  "colorOutput": true
}
```

---

## Database Access Strategy

**Direct SQLite Access (Recommended):**
- Use `better-sqlite3` for synchronous queries
- Read-only operations are safe (multiple readers)
- Write operations: check if main app is running
  - If closed: safe to write
  - If open: warn user or use IPC fallback

**Handling Concurrent Access:**
```typescript
// Check if main app is running
const isAppRunning = await checkProcess('irisnotes');

if (isAppRunning && operation === 'write') {
  console.warn('⚠️  Main app is running. Changes may not sync immediately.');
  // Optional: use Tauri IPC instead
}
```

---

## Implementation Roadmap

### Phase 1: Core (Week 1)
- [ ] Setup CLI project structure
- [ ] Database connection & schema sync
- [ ] `search`, `list`, `tree`, `cat` commands
- [ ] Basic output formatting

### Phase 2: CRUD (Week 2)
- [ ] `open`, `create`, `delete`, `restore`
- [ ] App launching integration
- [ ] Configuration file support

### Phase 3: Advanced (Week 3)
- [ ] `edit` with $EDITOR support
- [ ] `revisions`, `revert` 
- [ ] `tags`, `export`, `stats`
- [ ] Interactive mode (TUI)

### Phase 4: Polish (Week 4)
- [ ] Comprehensive tests
- [ ] Documentation
- [ ] Package for distribution
- [ ] Shell completions (bash/zsh/fish)

---

## Example Workflows

### Quick Note Capture
```bash
# Create and edit in one flow
iris create "Meeting Notes" --edit --book "Work"
```

### Daily Review
```bash
# See what changed today
iris recent 20 | grep "today"
iris search "TODO" --recent
```

### Scripting Integration
```bash
# Backup all notes as markdown
for id in $(iris list --format ids); do
  iris export $id "backup/${id}.md"
done
```

### Grep Through Notes
```bash
# Find all TODOs
iris cat --all --plaintext | grep -n "TODO"
```

---

## Future Enhancements

- **Interactive TUI**: Full terminal UI (like lazygit)
- **Daemon mode**: Background process for instant commands
- **Git integration**: Track notes as markdown files
- **Plugin system**: Custom commands
- **Sync commands**: Trigger cloud sync from CLI
- **AI integration**: Summarize, categorize notes via AI

---

## Technical Notes

**Why Bun over Node.js?**
- 3x faster startup time
- Native TypeScript support
- Better SQLite bindings
- Single executable compilation

**Database Locking:**
- SQLite handles concurrent readers automatically
- WAL mode (Write-Ahead Logging) recommended
- CLI should use `PRAGMA query_only = ON` for read operations

**Error Handling:**
- Graceful degradation if DB locked
- Clear error messages
- Exit codes for scripting
