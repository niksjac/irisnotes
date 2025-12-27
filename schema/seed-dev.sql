-- Development seed data for IrisNotes
-- Minimal test data: 1 root note, 1 book with 2 sections, 1 note per section

-- Root-level note (testing new flexible hierarchy)
INSERT INTO items (id, type, title, content, content_type, parent_id, sort_order, metadata, created_at, updated_at) VALUES
('note-root', 'note', 'Quick Note', 'This is a root-level note without any parent book or section. Perfect for quick captures!', 'plain', NULL, 0, '{"is_pinned": true}', datetime('now'), datetime('now'));

-- One book
INSERT INTO items (id, type, title, parent_id, sort_order, metadata, created_at, updated_at) VALUES
('book-1', 'book', 'My Notebook', NULL, 1, '{"description": "A sample notebook"}', datetime('now'), datetime('now'));

-- Two sections in the book
INSERT INTO items (id, type, title, parent_id, sort_order, metadata, created_at, updated_at) VALUES
('section-1', 'section', 'Ideas', 'book-1', 1, '{"description": "Ideas and concepts"}', datetime('now'), datetime('now')),
('section-2', 'section', 'Tasks', 'book-1', 2, '{"description": "Things to do"}', datetime('now'), datetime('now'));

-- One note in each section
INSERT INTO items (id, type, title, content, content_type, parent_id, sort_order, metadata, created_at, updated_at) VALUES
('note-1', 'note', 'First Idea', 'This is a note inside the Ideas section.', 'plain', 'section-1', 1, '{}', datetime('now'), datetime('now')),
('note-2', 'note', 'Task One', 'This is a note inside the Tasks section.', 'plain', 'section-2', 1, '{}', datetime('now'), datetime('now'));
