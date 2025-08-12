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

-- SEED DATA: Create realistic category hierarchy matching example structure

-- Root categories
INSERT INTO categories (id, name, description, icon, parent_id, sort_order) VALUES
    ('learning', 'Learning', 'Educational content and resources', '📚', NULL, 0),
    ('work', 'Work', 'Work-related notes and projects', '🏢', NULL, 1),
    ('personal', 'Personal', 'Personal notes and thoughts', '🌟', NULL, 2);

-- Subcategories
INSERT INTO categories (id, name, description, icon, parent_id, sort_order) VALUES
    ('programming', 'Programming', 'Code, tutorials, and development notes', '💻', 'learning', 0),
    ('design', 'Design', 'UI/UX and visual design resources', '🎨', 'learning', 1),
    ('meetings', 'Meetings', 'Meeting notes and minutes', '📅', 'work', 0),
    ('projects', 'Projects', 'Project documentation and planning', '📋', 'work', 1);

-- Sample notes with realistic content
INSERT INTO notes (id, title, content, content_plaintext, parent_category_id, sort_order) VALUES
    ('note-1', 'React Best Practices', '<h1>React Best Practices</h1><p>Key patterns for building maintainable React applications...</p>', 'React Best Practices Key patterns for building maintainable React applications...', 'programming', 1000),
    ('note-2', 'TypeScript Tips', '<h1>TypeScript Tips</h1><p>Advanced TypeScript techniques and patterns...</p>', 'TypeScript Tips Advanced TypeScript techniques and patterns...', 'programming', 999),
    ('note-3', 'CSS Grid Layout', '<h1>CSS Grid Layout</h1><p>Modern CSS Grid techniques for responsive layouts...</p>', 'CSS Grid Layout Modern CSS Grid techniques for responsive layouts...', 'programming', 998),

    ('note-4', 'Color Theory', '<h1>Color Theory</h1><p>Understanding color relationships in design...</p>', 'Color Theory Understanding color relationships in design...', 'design', 1000),
    ('note-5', 'Typography Rules', '<h1>Typography Rules</h1><p>Essential typography principles for readable designs...</p>', 'Typography Rules Essential typography principles for readable designs...', 'design', 999),

    ('note-6', 'Learning Techniques', '<h1>Learning Techniques</h1><p>Effective methods for acquiring new skills...</p>', 'Learning Techniques Effective methods for acquiring new skills...', 'learning', 1000),

    ('note-7', 'Sprint Planning 2024-01-15', '<h1>Sprint Planning</h1><p>Goals and tasks for the upcoming sprint...</p>', 'Sprint Planning Goals and tasks for the upcoming sprint...', 'meetings', 1000),
    ('note-8', 'Team Retrospective', '<h1>Team Retrospective</h1><p>What went well and areas for improvement...</p>', 'Team Retrospective What went well and areas for improvement...', 'meetings', 999),

    ('note-9', 'Project Ideas', '<h1>Project Ideas</h1><p>Collection of potential project concepts...</p>', 'Project Ideas Collection of potential project concepts...', 'projects', 1000),
    ('note-10', 'Performance Review Notes', '<h1>Performance Review</h1><p>Key achievements and development goals...</p>', 'Performance Review Key achievements and development goals...', 'projects', 999),

    ('note-11', 'Book Recommendations', '<h1>Book Recommendations</h1><p>Must-read books across various topics...</p>', 'Book Recommendations Must-read books across various topics...', 'personal', 1000),
    ('note-12', 'Travel Plans', '<h1>Travel Plans</h1><p>Upcoming trips and destination research...</p>', 'Travel Plans Upcoming trips and destination research...', 'personal', 999),
    ('note-13', 'Recipes to Try', '<h1>Recipes to Try</h1><p>Interesting recipes to experiment with...</p>', 'Recipes to Try Interesting recipes to experiment with...', 'personal', 998),

    -- Root level notes (no category)
    ('note-14', 'Quick Notes', '<h1>Quick Notes</h1><p>Fast capture space for temporary thoughts...</p>', 'Quick Notes Fast capture space for temporary thoughts...', NULL, 1000),
    ('note-15', 'Random Thoughts', '<h1>Random Thoughts</h1><p>Stream of consciousness and ideas...</p>', 'Random Thoughts Stream of consciousness and ideas...', NULL, 999),
    ('note-16', 'Inbox', '<h1>Inbox</h1><p>Temporary storage for unprocessed notes...</p>', 'Inbox Temporary storage for unprocessed notes...', NULL, 998);

-- Sample tags
INSERT INTO tags (id, name, color, description) VALUES
    ('javascript', 'JavaScript', '#f7df1e', 'JavaScript programming language'),
    ('react', 'React', '#61dafb', 'React framework'),
    ('typescript', 'TypeScript', '#3178c6', 'TypeScript language'),
    ('css', 'CSS', '#1572b6', 'Cascading Style Sheets'),
    ('design-system', 'Design System', '#ff6b6b', 'Design system patterns'),
    ('meeting', 'Meeting', '#51cf66', 'Meeting notes'),
    ('todo', 'Todo', '#ffd43b', 'Tasks and todos'),
    ('idea', 'Idea', '#da77f2', 'Creative ideas'),
    ('reference', 'Reference', '#74c0fc', 'Reference material');

-- Sample note-tag relationships
INSERT INTO note_tags (note_id, tag_id) VALUES
    ('note-1', 'react'),
    ('note-1', 'javascript'),
    ('note-2', 'typescript'),
    ('note-2', 'javascript'),
    ('note-3', 'css'),
    ('note-4', 'design-system'),
    ('note-5', 'design-system'),
    ('note-7', 'meeting'),
    ('note-8', 'meeting'),
    ('note-9', 'idea'),
    ('note-11', 'reference'),
    ('note-14', 'todo'),
    ('note-15', 'idea');

-- Settings
INSERT INTO settings (key, value) VALUES
    ('schema_version', '2'),
    ('tree_optimized', 'true'),
    ('theme', 'default'),
    ('editor_mode', 'rich'),
    ('line_wrapping', 'true'),
    ('auto_save', 'true'),
    ('auto_save_interval', '5000'),
    ('show_word_count', 'true');
