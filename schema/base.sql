-- Unified Items Database Schema for IrisNotes
-- SINGLE SOURCE OF TRUTH for database structure
-- Supports notes, books, and sections with flexible metadata
--
-- HIERARCHY RULES:
--   Books (type='book'):     parent_id MUST be NULL (root level only)
--   Sections (type='section'): parent_id MUST reference a book
--   Notes (type='note'):     parent_id can be NULL (root), a book, or a section
--                           Notes CANNOT be inside other notes (trigger enforced)
--
-- METADATA SCHEMA (JSON fields):
--   Common: { custom_icon, custom_text_color, is_pinned, is_favorite }
--   Notes only: { last_cursor_position, editor_mode }

-- Main items table - unified storage for all content types
CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('note', 'book', 'section')),
    title TEXT NOT NULL DEFAULT 'Untitled',

    -- Content fields (primarily for notes, optional for books/sections)
    content TEXT DEFAULT '',
    content_type TEXT DEFAULT 'html' CHECK (content_type IN ('html', 'markdown', 'plain', 'custom')),
    content_raw TEXT NULL, -- original format when content_type is 'custom'
    content_plaintext TEXT DEFAULT '', -- for full-text search

    -- Hierarchy - direct parent-child relationship
    parent_id TEXT NULL, -- references items(id), NULL for root level
    sort_order INTEGER NOT NULL DEFAULT 0, -- ordering within parent

    -- Flexible metadata - JSON column for experimentation
    metadata TEXT DEFAULT '{}', -- JSON object for custom fields

    -- Standard metadata
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT NULL, -- soft delete

    -- Content metrics (for notes)
    word_count INTEGER DEFAULT 0,
    character_count INTEGER DEFAULT 0,

    -- Hierarchy constraints
    -- Books must be root, sections under books, notes anywhere except inside notes
    CHECK (
        (type = 'book' AND parent_id IS NULL) OR
        (type = 'section' AND parent_id IS NOT NULL) OR
        (type = 'note')  -- notes can be at root or under books/sections (trigger prevents note-in-note)
    ),

    FOREIGN KEY (parent_id) REFERENCES items(id) ON DELETE SET NULL
);

-- Trigger to prevent notes being placed inside other notes (INSERT)
CREATE TRIGGER IF NOT EXISTS prevent_note_in_note_insert
BEFORE INSERT ON items
WHEN NEW.type = 'note' AND NEW.parent_id IS NOT NULL
BEGIN
    SELECT RAISE(ABORT, 'Notes cannot be placed inside other notes')
    WHERE EXISTS (
        SELECT 1 FROM items WHERE id = NEW.parent_id AND type = 'note'
    );
END;

-- Trigger to prevent notes being placed inside other notes (UPDATE)
CREATE TRIGGER IF NOT EXISTS prevent_note_in_note_update
BEFORE UPDATE ON items
WHEN NEW.type = 'note' AND NEW.parent_id IS NOT NULL
BEGIN
    SELECT RAISE(ABORT, 'Notes cannot be placed inside other notes')
    WHERE EXISTS (
        SELECT 1 FROM items WHERE id = NEW.parent_id AND type = 'note'
    );
END;

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
    title,
    content_plaintext,
    content=items,
    content_rowid=rowid
);

-- FTS triggers
CREATE TRIGGER IF NOT EXISTS items_fts_insert AFTER INSERT ON items BEGIN
    INSERT INTO items_fts(rowid, title, content_plaintext)
    VALUES (new.rowid, new.title, new.content_plaintext);
END;

CREATE TRIGGER IF NOT EXISTS items_fts_delete AFTER DELETE ON items BEGIN
    INSERT INTO items_fts(items_fts, rowid, title, content_plaintext)
    VALUES ('delete', old.rowid, old.title, old.content_plaintext);
END;

CREATE TRIGGER IF NOT EXISTS items_fts_update AFTER UPDATE ON items BEGIN
    INSERT INTO items_fts(items_fts, rowid, title, content_plaintext)
    VALUES ('delete', old.rowid, old.title, old.content_plaintext);
    INSERT INTO items_fts(rowid, title, content_plaintext)
    VALUES (new.rowid, new.title, new.content_plaintext);
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
