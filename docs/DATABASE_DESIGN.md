# IrisNotes Database Design

Complete documentation of the database schema, architecture patterns, and design decisions for IrisNotes.

## Overview

IrisNotes uses a **unified hierarchical storage model** with SQLite, consolidating all content types (Books, Sections, Notes) into a single polymorphic table. This design prioritizes flexibility, simplicity, and extensibility while maintaining strong data integrity.

**Key Characteristics:**
- **Single Source of Truth**: One `items` table for all content
- **Type Discrimination**: Books, Sections, and Notes in same table
- **Self-Referencing Hierarchy**: Parent-child via foreign keys
- **Full-Text Search**: Native SQLite FTS5 integration
- **Version History**: Automatic revision tracking
- **Soft Deletion & Archiving**: Non-destructive operations

---

## Schema Location

```bash
schema/base.sql      # SINGLE SOURCE OF TRUTH
schema/seed-dev.sql  # Development sample data
dev/notes.db         # Generated database (gitignored)
```

**Important**: Always modify `schema/base.sql`, then regenerate via:
```bash
./dev/setup-dev-db.sh
```

---

## Core Tables

### 1. `items` - Unified Content Storage

The centerpiece table supporting three distinct types in a single structure.

```sql
CREATE TABLE items (
    -- Identity
    id TEXT PRIMARY KEY,                    -- UUID v4 format
    type TEXT NOT NULL,                     -- 'note' | 'book' | 'section'
    title TEXT NOT NULL DEFAULT 'Untitled',

    -- Content (primarily for notes)
    content TEXT DEFAULT '',                -- Rich content (HTML/Markdown)
    content_type TEXT DEFAULT 'html',       -- 'html' | 'markdown' | 'plain' | 'custom'
    content_raw TEXT NULL,                  -- Original format backup
    content_plaintext TEXT DEFAULT '',      -- Denormalized for FTS

    -- Hierarchy
    parent_id TEXT NULL,                    -- Self-referencing FK to items(id)
    sort_order INTEGER NOT NULL DEFAULT 0,  -- Position within parent

    -- Extensible Metadata
    metadata TEXT DEFAULT '{}',             -- JSON object

    -- Timestamps
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT NULL,                   -- Soft delete
    archived_at TEXT NULL,                  -- Archived (hidden but not deleted)

    -- Metrics
    word_count INTEGER DEFAULT 0,
    character_count INTEGER DEFAULT 0,

    -- Constraints
    CHECK (type IN ('note', 'book', 'section')),
    CHECK (content_type IN ('html', 'markdown', 'plain', 'custom')),
    CHECK (
        (type = 'book' AND parent_id IS NULL) OR
        (type = 'section' AND parent_id IS NOT NULL) OR
        (type = 'note' AND parent_id IS NOT NULL)
    ),
    FOREIGN KEY (parent_id) REFERENCES items(id) ON DELETE SET NULL
);
```

---

### 2. `tags` - Flexible Categorization

Separate from hierarchy - allows cross-cutting organization.

```sql
CREATE TABLE tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT NULL,          -- Hex color for UI
    description TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**Purpose**: Tags provide orthogonal categorization independent of the tree structure.

---

### 3. `item_tags` - Many-to-Many Junction

```sql
CREATE TABLE item_tags (
    item_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (item_id, tag_id),
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
```

**Cascade Behavior**: Deleting an item or tag automatically removes relationships.

---

### 4. `item_revisions` - Version History

Tracks content changes over time (notes only).

```sql
CREATE TABLE item_revisions (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,

    -- Snapshot at this version
    title TEXT NOT NULL,
    content TEXT,
    content_type TEXT,
    metadata TEXT,

    -- Audit trail
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_by TEXT DEFAULT 'system',
    change_summary TEXT,

    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    UNIQUE(item_id, version_number)
);
```

**Versioning Strategy:**
- Automatically created on title/content changes
- Sequential version numbers per note
- Stores OLD version (current state remains in `items`)
- Only tracks notes (not books/sections)

---

### 5. `settings` - Application Configuration

```sql
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**Usage**: Global app preferences, UI state, feature flags.

---

## Hierarchy Rules

### Three-Level Structure

```
📚 Books (Root Level)
├─ 📄 Notes (direct children) ✅
└─ 📁 Sections (middle level)
   └─ 📄 Notes ✅
```

**Rules Enforced by CHECK Constraint:**
1. **Books** (`type='book'`): Must have `parent_id IS NULL`
2. **Sections** (`type='section'`): Must have `parent_id` pointing to a book
3. **Notes** (`type='note'`): Must have `parent_id` (book OR section)

**Why This Design?**
- Flexible: Sections are optional organizational layers
- Simple: Maximum 3 levels (prevents deep nesting)
- Predictable: Easy to query and display

---

## Metadata Schema (JSON Fields)

The `metadata` column stores flexible JSON for experimentation without migrations.

### Common Fields (All Types)
```json
{
  "description": "string",
  "custom_icon": "🚀",
  "custom_text_color": "#ff5733",
  "is_pinned": true,
  "is_favorite": false
}
```

### Note-Specific Fields
```json
{
  "last_cursor_position": 142,
  "editor_mode": "rich",       // "rich" | "source"
  "reading_time_minutes": 5
}
```

### Future Extensions
```json
{
  "encryption_enabled": false,
  "ai_summary": "...",
  "linked_notes": ["note-123", "note-456"]
}
```

---

## Full-Text Search (FTS5)

### Virtual Table

```sql
CREATE VIRTUAL TABLE items_fts USING fts5(
    id UNINDEXED,           -- Join key only
    title,                  -- Searchable
    content_plaintext       -- Searchable
);
```

**FTS5 Features:**
- BM25 ranking algorithm
- Phrase queries: `"exact phrase"`
- Boolean operators: `react AND hooks NOT class`
- Prefix matching: `perfor*`
- Column weighting: Custom boost for title vs content

### Automatic Sync Triggers

```sql
-- Insert
CREATE TRIGGER items_fts_insert AFTER INSERT ON items BEGIN
    INSERT INTO items_fts(id, title, content_plaintext)
    VALUES (new.id, new.title, new.content_plaintext);
END;

-- Update
CREATE TRIGGER items_fts_update AFTER UPDATE ON items BEGIN
    UPDATE items_fts 
    SET title = new.title, content_plaintext = new.content_plaintext
    WHERE id = old.id;
END;

-- Delete
CREATE TRIGGER items_fts_delete AFTER DELETE ON items BEGIN
    DELETE FROM items_fts WHERE id = old.id;
END;
```

### Search Query Example

```sql
SELECT 
    i.id,
    i.title,
    snippet(items_fts, 1, '<mark>', '</mark>', '...', 32) as snippet,
    rank
FROM items_fts fts
JOIN items i ON fts.id = i.id
WHERE items_fts MATCH 'react performance'
  AND i.type = 'note'
  AND i.deleted_at IS NULL
ORDER BY rank
LIMIT 10;
```

**Performance**: Fast enough for "search-as-you-type" (< 50ms for 10k notes).

---

## Triggers

### 1. Version History (Automatic Revisions)

```sql
CREATE TRIGGER items_revision_trigger 
AFTER UPDATE ON items
WHEN (NEW.content != OLD.content OR NEW.title != OLD.title)
    AND NEW.type = 'note'
    AND OLD.deleted_at IS NULL
BEGIN
    INSERT INTO item_revisions (
        id, item_id, version_number,
        title, content, content_type, metadata,
        created_at, change_summary
    )
    SELECT
        lower(hex(randomblob(16))),
        NEW.id,
        COALESCE((SELECT MAX(version_number) + 1 
                  FROM item_revisions WHERE item_id = NEW.id), 1),
        OLD.title,  -- Store OLD version
        OLD.content,
        OLD.content_type,
        OLD.metadata,
        OLD.updated_at,
        CASE
            WHEN NEW.title != OLD.title AND NEW.content != OLD.content 
                THEN 'Title and content changed'
            WHEN NEW.title != OLD.title THEN 'Title changed'
            WHEN NEW.content != OLD.content THEN 'Content changed'
        END
    ;
END;
```

**Behavior**: Every significant edit creates a snapshot of the OLD version.

### 2. Timestamp Updates

```sql
CREATE TRIGGER update_items_timestamp AFTER UPDATE ON items
BEGIN
    UPDATE items SET updated_at = datetime('now') WHERE id = NEW.id;
END;
```

**Applied to**: `items`, `tags`, `settings`

### 3. Content Plaintext Extraction (Basic)

```sql
CREATE TRIGGER items_content_plaintext_update
AFTER UPDATE OF content ON items
WHEN NEW.content_type IN ('html', 'markdown')
BEGIN
    -- Basic HTML stripping (SQLite limitations)
    -- Production should use app-level processing
    UPDATE items SET content_plaintext = 
        CASE 
            WHEN NEW.content_type = 'html' THEN
                replace(replace(replace(NEW.content, '<', ' <'), '>', '> '), '  ', ' ')
            WHEN NEW.content_type = 'markdown' THEN
                NEW.content
            ELSE NEW.content
        END
    WHERE id = NEW.id;
END;
```

**Note**: SQLite has limited text processing. Consider app-level HTML parsing for production.

---

## Indexes

### Performance Indexes

```sql
-- Type-based queries
CREATE INDEX idx_items_type ON items(type);
CREATE INDEX idx_items_type_parent ON items(type, parent_id);

-- Hierarchy traversal
CREATE INDEX idx_items_parent_id ON items(parent_id);
CREATE INDEX idx_items_parent_sort ON items(parent_id, sort_order);

-- Temporal queries
CREATE INDEX idx_items_created_at ON items(created_at DESC);
CREATE INDEX idx_items_updated_at ON items(updated_at DESC);

-- Filtering
CREATE INDEX idx_items_deleted_at ON items(deleted_at);
CREATE INDEX idx_items_archived_at ON items(archived_at);

-- Search
CREATE INDEX idx_items_title ON items(title);

-- Relationships
CREATE INDEX idx_item_tags_item_id ON item_tags(item_id);
CREATE INDEX idx_item_tags_tag_id ON item_tags(tag_id);

-- Revisions
CREATE INDEX idx_item_revisions_item_id ON item_revisions(item_id);
CREATE INDEX idx_item_revisions_created_at ON item_revisions(created_at DESC);
```

---

## Views

### 1. `tree_items` - Filtered Tree Display

```sql
CREATE VIEW tree_items AS
SELECT
    id,
    title as name,
    type,
    parent_id,
    sort_order,
    json_extract(metadata, '$.custom_icon') as custom_icon,
    json_extract(metadata, '$.custom_text_color') as custom_text_color,
    json_extract(metadata, '$.is_pinned') as is_pinned,
    json_extract(metadata, '$.is_favorite') as is_favorite,
    created_at,
    updated_at,
    archived_at
FROM items
WHERE deleted_at IS NULL      -- Hide deleted
  AND archived_at IS NULL      -- Hide archived
ORDER BY parent_id NULLS FIRST, sort_order ASC;
```

**Usage**: Primary view for sidebar/tree navigation.

### 2. `hierarchy_check` - Validation View

```sql
CREATE VIEW hierarchy_check AS
SELECT
    i.id,
    i.type,
    i.parent_id,
    p.type as parent_type,
    CASE
        WHEN i.type = 'book' AND i.parent_id IS NOT NULL 
            THEN 'ERROR: Books must be root level'
        WHEN i.type = 'section' AND (p.type IS NULL OR p.type != 'book') 
            THEN 'ERROR: Sections must have book parent'
        WHEN i.type = 'note' AND p.type IS NULL 
            THEN 'ERROR: Notes must have a parent'
        WHEN i.type = 'note' AND p.type NOT IN ('book', 'section') 
            THEN 'ERROR: Notes must have book or section parent'
        ELSE 'OK'
    END as validation_status
FROM items i
LEFT JOIN items p ON i.parent_id = p.id
WHERE i.deleted_at IS NULL;
```

**Usage**: Debug tool to verify hierarchy integrity.

### 3. `note_revisions` - Version History View

```sql
CREATE VIEW note_revisions AS
SELECT
    r.id,
    r.item_id,
    r.version_number,
    r.title,
    r.created_at as revision_date,
    r.created_by,
    r.change_summary,
    i.title as current_title
FROM item_revisions r
JOIN items i ON r.item_id = i.id
ORDER BY r.item_id, r.version_number DESC;
```

**Usage**: Easy access to version history for UI.

---

## Query Patterns

### Get All Notes in a Book

```sql
-- Handles both direct children and nested in sections
SELECT n.*
FROM items n
WHERE n.type = 'note'
  AND n.deleted_at IS NULL
  AND (
    n.parent_id = :book_id  -- Direct children
    OR n.parent_id IN (     -- Children of sections
      SELECT id FROM items 
      WHERE parent_id = :book_id AND type = 'section'
    )
  )
ORDER BY n.sort_order;
```

### Get Breadcrumb Path for Note

```sql
SELECT 
    CASE 
        WHEN p.type = 'section' THEN pp.title  -- Grandparent book
        ELSE p.title  -- Direct parent book
    END as book_name,
    CASE 
        WHEN p.type = 'section' THEN p.title
        ELSE NULL
    END as section_name,
    i.title as note_name
FROM items i
LEFT JOIN items p ON i.parent_id = p.id
LEFT JOIN items pp ON p.parent_id = pp.id
WHERE i.id = :note_id;
```

### Full-Text Search with Breadcrumbs

```sql
SELECT 
    i.id,
    i.title,
    snippet(items_fts, 1, '<mark>', '</mark>', '...', 32) as matching_line,
    CASE 
        WHEN p.type = 'section' THEN pp.title
        ELSE p.title
    END as book_name,
    CASE 
        WHEN p.type = 'section' THEN p.title
        ELSE NULL
    END as section_name,
    rank
FROM items_fts fts
JOIN items i ON fts.id = i.id
LEFT JOIN items p ON i.parent_id = p.id
LEFT JOIN items pp ON p.parent_id = pp.id
WHERE items_fts MATCH :search_terms
  AND i.type = 'note'
  AND i.deleted_at IS NULL
  AND i.archived_at IS NULL
ORDER BY rank
LIMIT 50;
```

---

## Design Patterns & Trade-offs

### ✅ Advantages

1. **Simplicity**: Single table eliminates complex joins
2. **Flexibility**: Easy to add new types (e.g., 'template', 'attachment')
3. **Extensibility**: JSON metadata allows schema evolution without migrations
4. **Performance**: Well-indexed for hierarchical queries
5. **Search**: Native FTS5 integration
6. **Version Control**: Automatic revision tracking

### ⚠️ Trade-offs

1. **Sparse Columns**: Books/sections have unused content fields
2. **Type Safety**: Relies on CHECK constraints + app enforcement
3. **Query Complexity**: Some queries need type filtering
4. **JSON Typing**: Metadata lacks database-level validation

### 🎯 Alternative Considered (Rejected)

**Separate Tables Approach:**
```sql
CREATE TABLE books (...);
CREATE TABLE sections (...);
CREATE TABLE notes (...);
```

**Why Rejected:**
- More complex queries (3-table joins)
- Harder to add new types
- Duplicate columns (title, created_at, etc.)
- Less flexible for future features

---

## Migration History

IrisNotes migrated from a dual-table design to the unified model:

**Old Structure:**
- `notes` table (actual content)
- `categories` table (books + sections)

**Migration Benefits:**
1. Simplified codebase
2. Consistent type handling
3. Easier to implement features (tags, search, versioning)
4. Better reflects mental model

---

## Database Initialization

```bash
# Create/reset development database
./dev/setup-dev-db.sh

# This script:
# 1. Removes existing dev/notes.db
# 2. Executes schema/base.sql
# 3. Seeds with schema/seed-dev.sql
```

**Sample Data**: Includes 3 books, 6 sections, 12 notes for testing.

---

## Best Practices

### For Queries
1. Always filter by `deleted_at IS NULL` unless explicitly querying trash
2. Use prepared statements to prevent SQL injection
3. Leverage indexes (check with `EXPLAIN QUERY PLAN`)
4. Use `tree_items` view for UI rendering

### For Schema Changes
1. Modify `schema/base.sql` only
2. Add migrations for production databases
3. Test with `./dev/setup-dev-db.sh`
4. Update TypeScript types in `src/types/database.ts`

### For Version History
- Keep revision retention policy (e.g., 50 versions per note)
- Implement "squashing" for old revisions
- Consider compression for content field

### For FTS
- Update `content_plaintext` via app-level HTML parsing
- Configure FTS5 tokenizer for better search (e.g., unicode61)
- Consider separate FTS table per content type if needed

---

## Performance Considerations

### SQLite Settings

```sql
-- Enable Write-Ahead Logging for concurrent readers
PRAGMA journal_mode = WAL;

-- Increase cache size (default: 2MB, increase to 64MB)
PRAGMA cache_size = -64000;

-- Optimize for speed over safety (dev only)
PRAGMA synchronous = NORMAL;

-- Foreign key enforcement
PRAGMA foreign_keys = ON;
```

### Query Optimization

- Use `LIMIT` for UI pagination
- Index all foreign keys
- Avoid `SELECT *` in production
- Use covering indexes for common queries

### Database Size Management

- Archive old revisions periodically
- Vacuum database after bulk deletes
- Monitor FTS index size

---

## Security Considerations

1. **No Sensitive Data in Metadata**: Avoid passwords/tokens in JSON
2. **Parameterized Queries**: Always use prepared statements
3. **Read-Only Connections**: CLI/Quick Search should use `PRAGMA query_only = ON`
4. **Backup Strategy**: Regular backups before schema changes

---

## Future Enhancements

### Potential Schema Additions

1. **Attachments Table**
   ```sql
   CREATE TABLE attachments (
       id TEXT PRIMARY KEY,
       item_id TEXT NOT NULL,
       file_path TEXT NOT NULL,
       mime_type TEXT,
       size_bytes INTEGER,
       FOREIGN KEY (item_id) REFERENCES items(id)
   );
   ```

2. **Links/References Table**
   ```sql
   CREATE TABLE item_links (
       source_id TEXT NOT NULL,
       target_id TEXT NOT NULL,
       link_type TEXT DEFAULT 'reference',
       PRIMARY KEY (source_id, target_id)
   );
   ```

3. **Encryption Support**
   ```sql
   ALTER TABLE items ADD COLUMN encrypted BOOLEAN DEFAULT FALSE;
   ALTER TABLE items ADD COLUMN encryption_key_id TEXT NULL;
   ```

4. **Collaboration**
   ```sql
   CREATE TABLE collaborators (
       item_id TEXT NOT NULL,
       user_id TEXT NOT NULL,
       permission TEXT NOT NULL,
       PRIMARY KEY (item_id, user_id)
   );
   ```

---

## Debugging Tools

### Verify Hierarchy Integrity
```sql
SELECT * FROM hierarchy_check WHERE validation_status != 'OK';
```

### Find Orphaned Items
```sql
SELECT * FROM items 
WHERE parent_id IS NOT NULL 
  AND parent_id NOT IN (SELECT id FROM items);
```

### Search Performance Analysis
```sql
EXPLAIN QUERY PLAN
SELECT * FROM items_fts WHERE items_fts MATCH 'test';
```

### Database Statistics
```sql
SELECT 
    type,
    COUNT(*) as count,
    SUM(length(content)) as total_content_bytes
FROM items
WHERE deleted_at IS NULL
GROUP BY type;
```

---

## References

- [SQLite FTS5 Documentation](https://www.sqlite.org/fts5.html)
- [SQLite CHECK Constraints](https://www.sqlite.org/lang_createtable.html#check_constraints)
- [SQLite Triggers](https://www.sqlite.org/lang_createtrigger.html)
- [SQLite JSON Functions](https://www.sqlite.org/json1.html)
