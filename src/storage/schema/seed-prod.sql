-- Production seed data with minimal content
-- This file provides basic setup for new users

-- Default categories
INSERT OR IGNORE INTO categories (id, name, description, icon, parent_id, sort_order) VALUES
    ('folder-1', 'Work', 'Work-related notes', '🏢', NULL, 0),
    ('folder-2', 'Personal', 'Personal notes and ideas', '📝', NULL, 1);

-- Welcome note
INSERT OR IGNORE INTO notes (id, title, content, content_plaintext, parent_category_id, sort_order) VALUES
    ('welcome-note', 'Welcome to IrisNotes', '<h1>Welcome to IrisNotes</h1><p>Start taking notes by creating new folders and notes. Use the sidebar to organize your content.</p>', 'Welcome to IrisNotes Start taking notes by creating new folders and notes. Use the sidebar to organize your content.', NULL, 0);

-- Default settings
INSERT OR IGNORE INTO settings (key, value) VALUES
    ('schema_version', '3'),
    ('tree_optimized', 'true'),
    ('theme', 'default'),
    ('editor_mode', 'rich'),
    ('line_wrapping', 'true'),
    ('auto_save', 'true'),
    ('auto_save_interval', '5000'),
    ('show_word_count', 'true');
