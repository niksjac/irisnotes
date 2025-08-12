# Development Environment Setup

This directory contains the local development configuration and database for IrisNotes.

## Directory Structure

```
dev/
├── config/
│   └── app-config.json     # Development app configuration
├── notes.db                # Development SQLite database
├── schema.sql             # Database schema and seed data
├── setup-dev-db.sh        # Database setup script
└── README.md              # This file
```

## How It Works

When you run `pnpm tauri dev`, the app automatically detects development mode and uses:

- **Config Directory**: `./dev/config/` (instead of `~/.config/com.irisnotes.app/`)
- **Database File**: `./dev/notes.db` (instead of platform-specific data directory)

In production builds, the app uses standard platform directories:

- **Linux**: `~/.config/com.irisnotes.app/` and `~/.local/share/com.irisnotes.app/`
- **macOS**: `~/Library/Application Support/com.irisnotes.app/`
- **Windows**: `%APPDATA%\com.irisnotes.app\`

## Database Schema

The development database uses a **tree-optimized schema** designed specifically for hierarchical note organization:

### Key Features

- **Direct parent-child relationships** (not many-to-many)
- **Single ownership model** - each note belongs to one category or root
- **Optimized for arborist tree views** - no complex joins needed
- **Full-text search** with SQLite FTS5
- **16 sample notes** in realistic hierarchy

### Schema Overview

```sql
notes.parent_category_id → categories.id  -- Direct relationship
categories.parent_id → categories.id      -- Hierarchical categories
```

## Sample Data Structure

The database includes realistic sample data:

```
📚 Learning
  ├── 💻 Programming
  │   ├── React Best Practices
  │   ├── TypeScript Tips
  │   └── CSS Grid Layout
  └── 🎨 Design
      ├── Color Theory
      └── Typography Rules
🏢 Work
  ├── 📅 Meetings
  │   ├── Sprint Planning
  │   └── Team Retrospective
  └── 📋 Projects
      ├── Project Ideas
      └── Performance Review Notes
🌟 Personal
  ├── Book Recommendations
  ├── Travel Plans
  └── Recipes to Try
📝 Quick Notes (root)
💭 Random Thoughts (root)
📥 Inbox (root)
```

## Quick Setup

1. **Reset database** (if needed):

   ```bash
   ./dev/setup-dev-db.sh
   ```

2. **Start development**:

   ```bash
   pnpm tauri dev
   ```

3. **View database** (optional):
   ```bash
   sqlite3 ./dev/notes.db
   ```

## Database Operations

The optimized schema makes tree operations simple:

```sql
-- Move note to different category
UPDATE notes SET parent_category_id = 'new-category' WHERE id = 'note-id';

-- Get all notes in category
SELECT * FROM notes WHERE parent_category_id = 'category-id';

-- Get root notes
SELECT * FROM notes WHERE parent_category_id IS NULL;
```

## Benefits

✅ **Fast Development** - No complex database setup
✅ **Realistic Testing** - Sample data matches real usage
✅ **Isolated Environment** - Won't affect production data
✅ **Tree-Optimized** - Schema designed for hierarchical UX
✅ **Easy Reset** - Run setup script to start fresh
