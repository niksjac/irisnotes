-- Development seed data with rich test content
-- This file is used only for development database setup

-- Two main folders
INSERT OR IGNORE INTO categories (id, name, description, icon, parent_id, sort_order) VALUES
    ('folder-1', 'Work', 'Work-related notes', '🏢', NULL, 0),
    ('folder-2', 'Personal', 'Personal notes and ideas', '📝', NULL, 1);

-- Three notes in each folder
INSERT OR IGNORE INTO notes (id, title, content, content_plaintext, parent_category_id, sort_order) VALUES
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

-- Settings
INSERT OR IGNORE INTO settings (key, value) VALUES
    ('schema_version', '3'),
    ('tree_optimized', 'true'),
    ('theme', 'default'),
    ('editor_mode', 'rich'),
    ('line_wrapping', 'true'),
    ('auto_save', 'true'),
    ('auto_save_interval', '5000'),
    ('show_word_count', 'true');
