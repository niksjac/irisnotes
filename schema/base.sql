-- Unified Items Database Schema for IrisNotes
-- SINGLE SOURCE OF TRUTH for database structure
-- Supports notes, books, and sections with flexible metadata
--
-- HIERARCHY RULES:
--   Books (type='book'):    parent_id MUST be NULL (root level)
--   Sections (type='section'): parent_id MUST reference a book
--   Notes (type='note'):    parent_id can reference a book OR a section
--
-- METADATA SCHEMA (JSON fields):
--   Common: {
--     "description": string,
--     "custom_icon": string (emoji or icon name),
--     "custom_text_color": string (hex color),
--     "is_pinned": boolean,
--     "is_favorite": boolean
--   }
--   Notes only: {
--     "last_cursor_position": number,
--     "editor_mode": "rich" | "source"
--   }

-- Main items table - unified storage for all content types
CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('note', 'book', 'section')),
    title TEXT NOT NULL DEFAULT 'Untitled',

    -- Content fields (primarily for notes, optional for books/sections)
    content TEXT DEFAULT '',
    content_type TEXT DEFAULT 'html' CHECK (content_type IN ('html', 'markdown', 'plain', 'custom')),
    content_raw TEXT NULL, -- original format when content_type is 'custom'
    content_plaintext TEXT DEFAULT '', -- for full-text search (auto-populated by trigger)

    -- Hierarchy - direct parent-child relationship
    parent_id TEXT NULL, -- references items(id), NULL for root level
    sort_order INTEGER NOT NULL DEFAULT 0, -- ordering within parent

    -- Flexible metadata - JSON column for experimentation (see schema above)
    metadata TEXT DEFAULT '{}', -- JSON object for custom fields

    -- Standard metadata
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT NULL, -- soft delete (user can recover)
    archived_at TEXT NULL, -- archive (hidden from main view but not deleted)

    -- Content metrics (for notes)
    word_count INTEGER DEFAULT 0,
    character_count INTEGER DEFAULT 0,

    -- Hierarchy constraints
    -- Books must be root, sections under books, notes under books or sections
    CHECK (
        (type = 'book' AND parent_id IS NULL) OR
        (type = 'section' AND parent_id IS NOT NULL) OR
        (type = 'note' AND parent_id IS NOT NULL)
    ),

    FOREIGN KEY (parent_id) REFERENCES items(id) ON DELETE SET NULL
);

-- Tags table - for flexible labeling (separate from hierarchy)
CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT NULL,
    description TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Item-Tag relationship (many-to-many)
CREATE TABLE IF NOT EXISTS item_tags (
    item_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (item_id, tag_id),
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Item revisions table - version history for notes
CREATE TABLE IF NOT EXISTS item_revisions (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,

    -- Snapshot of content at this version
    title TEXT NOT NULL,
    content TEXT,
    content_type TEXT,
    metadata TEXT,

    -- Audit trail
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_by TEXT DEFAULT 'system', -- future: user tracking
    change_summary TEXT, -- optional: what changed in this version

    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,

-- Archive index
CREATE INDEX IF NOT EXISTS idx_items_archived_at ON items(archived_at);

-- Revision indexes
CREATE INDEX IF NOT EXISTS idx_item_revisions_item_id ON item_revisions(item_id);
CREATE INDEX IF NOT EXISTS idx_item_revisions_created_at ON item_revisions(created_at DESC);
    UNIQUE(item_id, version_number)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
CREATE INDEX IF NOT EXISTS idx_items_parent_id ON items(parent_id);
CREATE INDEX IF NOT EXISTS idx_items_sort_order ON items(sort_order);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_items_updated_at ON items(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_items_title ON items(title);
CREATE INDEX IF NOT EXISTS idx_items_deleted_at ON items(deleted_at);

-- Index for hierarchy queries
CREATE INDEX IF NOT EXISTS idx_items_parent_sort ON items(parent_id, sort_order);

-- Index for type-specific queries
CREATE INDEX IF NOT EXISTS idx_items_type_parent ON items(type, parent_id);

-- Tag relationship indexes
CREATE INDEX IF NOT EXISTS idx_item_tags_item_id ON item_tags(item_id);
CREATE INDEX IF NOT EXISTS idx_item_tags_tag_id ON item_tags(tag_id);

-- Full-text search
CREATE VIRTUAL TABLE IF NOT EXISTS items_fts USING fts5(
    id UNINDEXED,
    title,
    content_plaintext
);

-- FTS triggers
CREATE TRIGGER IF NOT EXISTS items_fts_insert AFTER INSERT ON items BEGIN
    INSERT INTO items_fts(id, title, content_plaintext)
    VALUES (new.id, new.title, new.content_plaintext);
END;

CREA

-- Content plaintext extraction trigger
-- Note: This is a basic implementation. For production, consider using
-- a SQLite extension or application-level HTML stripping
CREATE TRIGGER IF NOT EXISTS items_content_plaintext_update
AFTER UPDATE OF content ON items
WHEN NEW.content_type IN ('html', 'markdown')
BEGIN
    -- Basic HTML tag stripping (limited - consider app-level processing)
    UPDATE items SET content_plaintext = 
        CASE 
            WHEN NEW.content_type = 'html' THEN
                -- Strip HTML tags (basic regex-like replacement)
                replace(replace(replace(NEW.content, '<', ' <'), '>', '> '), '  ', ' ')
            WHEN NEW.content_type = 'markdown' THEN
                NEW.content
            ELSE
                NEW.content
        END
    WHERE id = NEW.id;
END;

-- Version history trigger - auto-create revision on significant changes
CREATE TRIGGER IF NOT EXISTS items_revision_trigger 
AFTER UPDATE ON items
WHEN (NEW.content != OLD.content OR NEW.title != OLD.title)
    AND NEW.type = 'note'  -- Only track note revisions
    AND OLD.deleted_at IS NULL  -- Don't version deleted items
BEGIjson_extract(metadata, '$.is_favorite') as is_favorite,
    created_at,
    updated_at,
    archived_at
FROM items
WHERE deleted_at IS NULL  -- Hide deleted items
  AND archived_at IS NULL  -- Hide archived items (toggle separately in UI)
ORDER BY parent_id NULLS FIRST, sort_order ASC;

-- View for hierarchy validation queries
CREATE VIEW IF NOT EXISTS hierarchy_check AS
SELECT
    i.id,
    i.type,
    i.parent_id,
    p.type as parent_type,
    CASE
        WHEN i.type = 'book' AND i.parent_id IS NOT NULL THEN 'ERROR: Books must be root level'
        WHEN i.type = 'section' Ap.type IS NULL THEN 'ERROR: Notes must have a parent'
        WHEN i.type = 'note' AND p.type NOT IN ('book', 'section') THEN 'ERROR: Notes must have book orave book parent'
        WHEN i.type = 'note' AND (p.type IS NULL OR p.type != 'section') THEN 'ERROR: Notes must have section parent'
        ELSE 'OK'
    END as validation_status
FROM items i
LEFT JOIN items p ON i.parent_id = p.id
WHERE i.deleted_at IS NULL;

-- View for getting note revision history
CREATE VIEW IF NOT EXISTS note_revisions AS
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
ORDER BY r.item_id, r.version_number DE
    )
    SELECT
        lower(hex(randomblob(16))),
        NEW.id,
        COALESCE((SELECT MAX(version_number) + 1 FROM item_revisions WHERE item_id = NEW.id), 1),
        OLD.title,  -- Store the OLD version
        OLD.content,
        OLD.content_type,
        OLD.metadata,
        OLD.updated_at,  -- Use the old update time
        CASE
            WHEN NEW.title != OLD.title AND NEW.content != OLD.content THEN 'Title and content changed'
            WHEN NEW.title != OLD.title THEN 'Title changed'
            WHEN NEW.content != OLD.content THEN 'Content changed'
        END
    ;
END;TE TRIGGER IF NOT EXISTS items_fts_delete AFTER DELETE ON items BEGIN
    DELETE FROM items_fts WHERE id = old.id;
END;

CREATE TRIGGER IF NOT EXISTS items_fts_update AFTER UPDATE ON items BEGIN
    UPDATE items_fts SET title = new.title, content_plaintext = new.content_plaintext
    WHERE id = old.id;
END;

-- Timestamp triggers
CREATE TRIGGER IF NOT EXISTS update_items_timestamp AFTER UPDATE ON items
BEGIN
    UPDATE items SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_tags_timestamp AFTER UPDATE ON tags
BEGIN
    UPDATE tags SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_settings_timestamp AFTER UPDATE ON settings
BEGIN
    UPDATE settings SET updated_at = datetime('now') WHERE key = NEW.key;
END;

-- Tree view for easy querying
CREATE VIEW IF NOT EXISTS tree_items AS
SELECT
    id,
    title as name,
    type,
    parent_id,
    sort_order,
    json_extract(metadata, '$.custom_icon') as custom_icon,
    json_extract(metadata, '$.custom_text_color') as custom_text_color,
    json_extract(metadata, '$.is_pinned') as is_pinned,
    created_at,
    updated_at
FROM items
WHERE deleted_at IS NULL
ORDER BY parent_id NULLS FIRST, sort_order ASC;
