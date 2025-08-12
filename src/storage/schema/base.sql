-- Tree-Optimized Database Schema for IrisNotes
-- SINGLE SOURCE OF TRUTH for database structure
-- Designed specifically for hierarchical tree view UX patterns

-- Categories table - hierarchical folder structure
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    color TEXT DEFAULT NULL, -- hex color code
    icon TEXT DEFAULT NULL, -- emoji or icon name
    parent_id TEXT NULL, -- hierarchical structure
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Notes table - simplified with direct parent relationship
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'Untitled Note',
    content TEXT NOT NULL DEFAULT '',
    content_type TEXT NOT NULL DEFAULT 'html', -- 'html', 'markdown', 'plain', 'custom'
    content_raw TEXT NULL, -- original format when content_type is 'custom'

    -- TREE OPTIMIZATION: Direct parent relationship (not many-to-many)
    parent_category_id TEXT NULL, -- belongs to ONE category or root level
    sort_order INTEGER NOT NULL DEFAULT 0, -- ordering within parent

    -- Metadata
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT NULL, -- soft delete
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,

    -- Content metrics
    word_count INTEGER NOT NULL DEFAULT 0,
    character_count INTEGER NOT NULL DEFAULT 0,
    content_plaintext TEXT NOT NULL DEFAULT '', -- for search

    FOREIGN KEY (parent_category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Tags table - for flexible labeling (separate from tree structure)
CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT NULL,
    description TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Note-Tag relationship (many-to-many, separate from tree hierarchy)
CREATE TABLE IF NOT EXISTS note_tags (
    note_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (note_id, tag_id),
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

CREATE INDEX IF NOT EXISTS idx_notes_parent_category_id ON notes(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_notes_sort_order ON notes(sort_order);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_title ON notes(title);
CREATE INDEX IF NOT EXISTS idx_notes_deleted_at ON notes(deleted_at);

CREATE INDEX IF NOT EXISTS idx_note_tags_note_id ON note_tags(note_id);
CREATE INDEX IF NOT EXISTS idx_note_tags_tag_id ON note_tags(tag_id);

-- Full-text search
CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
    title,
    content_plaintext,
    content=notes,
    content_rowid=rowid
);

-- FTS triggers
CREATE TRIGGER IF NOT EXISTS notes_fts_insert AFTER INSERT ON notes BEGIN
    INSERT INTO notes_fts(rowid, title, content_plaintext)
    VALUES (new.rowid, new.title, new.content_plaintext);
END;

CREATE TRIGGER IF NOT EXISTS notes_fts_delete AFTER DELETE ON notes BEGIN
    INSERT INTO notes_fts(notes_fts, rowid, title, content_plaintext)
    VALUES ('delete', old.rowid, old.title, old.content_plaintext);
END;

CREATE TRIGGER IF NOT EXISTS notes_fts_update AFTER UPDATE ON notes BEGIN
    INSERT INTO notes_fts(notes_fts, rowid, title, content_plaintext)
    VALUES ('delete', old.rowid, old.title, old.content_plaintext);
    INSERT INTO notes_fts(rowid, title, content_plaintext)
    VALUES (new.rowid, new.title, new.content_plaintext);
END;

-- Timestamp triggers
CREATE TRIGGER IF NOT EXISTS update_notes_timestamp AFTER UPDATE ON notes
BEGIN
    UPDATE notes SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_categories_timestamp AFTER UPDATE ON categories
BEGIN
    UPDATE categories SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_tags_timestamp AFTER UPDATE ON tags
BEGIN
    UPDATE tags SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_settings_timestamp AFTER UPDATE ON settings
BEGIN
    UPDATE settings SET updated_at = datetime('now') WHERE key = NEW.key;
END;

-- Simple flat view for tree data (to be processed in TypeScript)
CREATE VIEW IF NOT EXISTS tree_items AS
SELECT
    id,
    name,
    'category' as type,
    parent_id,
    sort_order
FROM categories
UNION ALL
SELECT
    id,
    title as name,
    'note' as type,
    parent_category_id as parent_id,
    sort_order
FROM notes
WHERE deleted_at IS NULL
ORDER BY parent_id NULLS FIRST, sort_order ASC;
