-- Tree-Optimized Database Schema for IrisNotes
-- Designed specifically for hierarchical tree view UX patterns

-- Categories table - hierarchical folder structure
CREATE TABLE categories (
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
CREATE TABLE notes (
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
CREATE TABLE tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT NULL,
    description TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Note-Tag relationship (many-to-many, separate from tree hierarchy)
CREATE TABLE note_tags (
    note_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (note_id, tag_id),
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Settings table
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Performance indexes
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);

CREATE INDEX idx_notes_parent_category_id ON notes(parent_category_id);
CREATE INDEX idx_notes_sort_order ON notes(sort_order);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX idx_notes_updated_at ON notes(updated_at DESC);
CREATE INDEX idx_notes_title ON notes(title);
CREATE INDEX idx_notes_deleted_at ON notes(deleted_at);

CREATE INDEX idx_note_tags_note_id ON note_tags(note_id);
CREATE INDEX idx_note_tags_tag_id ON note_tags(tag_id);

-- Full-text search
CREATE VIRTUAL TABLE notes_fts USING fts5(
    title,
    content_plaintext,
    content=notes,
    content_rowid=rowid
);

-- FTS triggers
CREATE TRIGGER notes_fts_insert AFTER INSERT ON notes BEGIN
    INSERT INTO notes_fts(rowid, title, content_plaintext)
    VALUES (new.rowid, new.title, new.content_plaintext);
END;

CREATE TRIGGER notes_fts_delete AFTER DELETE ON notes BEGIN
    INSERT INTO notes_fts(notes_fts, rowid, title, content_plaintext)
    VALUES ('delete', old.rowid, old.title, old.content_plaintext);
END;

CREATE TRIGGER notes_fts_update AFTER UPDATE ON notes BEGIN
    INSERT INTO notes_fts(notes_fts, rowid, title, content_plaintext)
    VALUES ('delete', old.rowid, old.title, old.content_plaintext);
    INSERT INTO notes_fts(rowid, title, content_plaintext)
    VALUES (new.rowid, new.title, new.content_plaintext);
END;

-- Timestamp triggers
CREATE TRIGGER update_notes_timestamp AFTER UPDATE ON notes
BEGIN
    UPDATE notes SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER update_categories_timestamp AFTER UPDATE ON categories
BEGIN
    UPDATE categories SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER update_tags_timestamp AFTER UPDATE ON tags
BEGIN
    UPDATE tags SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER update_settings_timestamp AFTER UPDATE ON settings
BEGIN
    UPDATE settings SET updated_at = datetime('now') WHERE key = NEW.key;
END;

-- SEED DATA: Simple initial structure for testing

-- Two main folders
INSERT INTO categories (id, name, description, icon, parent_id, sort_order) VALUES
    ('folder-1', 'Work', 'Work-related notes', '🏢', NULL, 0),
    ('folder-2', 'Personal', 'Personal notes and ideas', '📝', NULL, 1);

-- Three notes in each folder
INSERT INTO notes (id, title, content, content_plaintext, parent_category_id, sort_order) VALUES
    -- Work folder notes
    ('note-1', 'Meeting Notes', '<h1>Meeting Notes</h1><p>Important discussion points from today''s meeting...</p>', 'Meeting Notes Important discussion points from todays meeting...', 'folder-1', 0),
    ('note-2', 'Project Ideas', '<h1>Project Ideas</h1><p>Brainstorming new features and improvements...</p>', 'Project Ideas Brainstorming new features and improvements...', 'folder-1', 1),
    ('note-3', 'Task List', '<h1>Task List</h1><p>Things to complete this week...</p>', 'Task List Things to complete this week...', 'folder-1', 2),

    -- Personal folder notes
    ('note-4', 'Book Notes', '<h1>Book Notes</h1><p>Key insights from recent reading...</p>', 'Book Notes Key insights from recent reading...', 'folder-2', 0),
    ('note-5', 'Travel Plans', '<h1>Travel Plans</h1><p>Ideas for upcoming vacation...</p>', 'Travel Plans Ideas for upcoming vacation...', 'folder-2', 1),
    ('note-6', 'Recipe Collection', '<h1>Recipe Collection</h1><p>Favorite recipes to try...</p>', 'Recipe Collection Favorite recipes to try...', 'folder-2', 2),

    -- Three root-level notes
    ('note-7', 'Quick Thoughts', '<h1>Quick Thoughts</h1><p>Random ideas and observations...</p>', 'Quick Thoughts Random ideas and observations...', NULL, 0),
    ('note-8', 'Inbox', '<h1>Inbox</h1><p>Temporary storage for unprocessed notes...</p>', 'Inbox Temporary storage for unprocessed notes...', NULL, 1),
    ('note-9', 'Scratch Pad', '<h1>Scratch Pad</h1><p>Quick notes and calculations...</p>', 'Scratch Pad Quick notes and calculations...', NULL, 2);

-- Simple flat view for tree data (to be processed in TypeScript)
CREATE VIEW tree_items AS
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

-- Settings
INSERT INTO settings (key, value) VALUES
    ('schema_version', '3'),
    ('tree_optimized', 'true'),
    ('theme', 'default'),
    ('editor_mode', 'rich'),
    ('line_wrapping', 'true'),
    ('auto_save', 'true'),
    ('auto_save_interval', '5000'),
    ('show_word_count', 'true');
