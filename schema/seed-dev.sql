-- Development seed data for IrisNotes
-- Test data: multiple books, sections, and notes for comprehensive testing
-- Using fractional indexing (lexicographic strings) for sync-safe ordering

-- Root-level notes (testing new flexible hierarchy)
INSERT INTO items (id, type, title, content, content_type, parent_id, sort_order, metadata, created_at, updated_at) VALUES
('note-root-1', 'note', 'Quick Note', 'This is a root-level note without any parent book or section. Perfect for quick captures!', 'plain', NULL, 'a0', '{"is_pinned": true}', datetime('now'), datetime('now')),
('note-root-2', 'note', 'Shopping List', '- Milk\n- Bread\n- Eggs\n- Coffee', 'plain', NULL, 'a1', '{}', datetime('now'), datetime('now')),
('note-root-3', 'note', 'Meeting Notes', 'Quick notes from the standup meeting.', 'plain', NULL, 'a2', '{}', datetime('now'), datetime('now'));

-- Books
INSERT INTO items (id, type, title, parent_id, sort_order, metadata, created_at, updated_at) VALUES
('book-1', 'book', 'My Notebook', NULL, 'a3', '{"description": "A sample notebook"}', datetime('now'), datetime('now')),
('book-2', 'book', 'Work Projects', NULL, 'a4', '{"description": "Work related projects"}', datetime('now'), datetime('now')),
('book-3', 'book', 'Personal', NULL, 'a5', '{"description": "Personal notes and ideas"}', datetime('now'), datetime('now'));

-- Sections in My Notebook
INSERT INTO items (id, type, title, parent_id, sort_order, metadata, created_at, updated_at) VALUES
('section-1', 'section', 'Ideas', 'book-1', 'a0', '{"description": "Ideas and concepts"}', datetime('now'), datetime('now')),
('section-2', 'section', 'Tasks', 'book-1', 'a1', '{"description": "Things to do"}', datetime('now'), datetime('now')),
('section-3', 'section', 'Archive', 'book-1', 'a2', '{"description": "Archived items"}', datetime('now'), datetime('now'));

-- Sections in Work Projects
INSERT INTO items (id, type, title, parent_id, sort_order, metadata, created_at, updated_at) VALUES
('section-4', 'section', 'Project Alpha', 'book-2', 'a0', '{"description": "Main project"}', datetime('now'), datetime('now')),
('section-5', 'section', 'Project Beta', 'book-2', 'a1', '{"description": "Secondary project"}', datetime('now'), datetime('now'));

-- Sections in Personal
INSERT INTO items (id, type, title, parent_id, sort_order, metadata, created_at, updated_at) VALUES
('section-6', 'section', 'Recipes', 'book-3', 'a0', '{"description": "Favorite recipes"}', datetime('now'), datetime('now')),
('section-7', 'section', 'Travel', 'book-3', 'a1', '{"description": "Travel plans"}', datetime('now'), datetime('now'));

-- Notes in Ideas section
INSERT INTO items (id, type, title, content, content_type, parent_id, sort_order, metadata, created_at, updated_at) VALUES
('note-1', 'note', 'First Idea', 'This is a note inside the Ideas section.', 'plain', 'section-1', 'a0', '{}', datetime('now'), datetime('now')),
('note-2', 'note', 'App Concept', 'An idea for a new mobile app that helps with note-taking.', 'plain', 'section-1', 'a1', '{}', datetime('now'), datetime('now')),
('note-3', 'note', 'Design Thoughts', 'Some thoughts on UI/UX design patterns.', 'plain', 'section-1', 'a2', '{}', datetime('now'), datetime('now')),
('note-4', 'note', 'Feature List', '1. Dark mode\n2. Sync\n3. Markdown support\n4. Tags', 'plain', 'section-1', 'a3', '{}', datetime('now'), datetime('now'));

-- Notes in Tasks section
INSERT INTO items (id, type, title, content, content_type, parent_id, sort_order, metadata, created_at, updated_at) VALUES
('note-5', 'note', 'Task One', 'This is a note inside the Tasks section.', 'plain', 'section-2', 'a0', '{}', datetime('now'), datetime('now')),
('note-6', 'note', 'Weekly Review', 'Review tasks for the week.', 'plain', 'section-2', 'a1', '{}', datetime('now'), datetime('now')),
('note-7', 'note', 'Bug Fixes', 'List of bugs to fix in the app.', 'plain', 'section-2', 'a2', '{}', datetime('now'), datetime('now'));

-- Notes in Archive section
INSERT INTO items (id, type, title, content, content_type, parent_id, sort_order, metadata, created_at, updated_at) VALUES
('note-8', 'note', 'Old Project Notes', 'Notes from a completed project.', 'plain', 'section-3', 'a0', '{}', datetime('now'), datetime('now')),
('note-9', 'note', 'Deprecated Ideas', 'Ideas that were not pursued.', 'plain', 'section-3', 'a1', '{}', datetime('now'), datetime('now'));

-- Notes in Project Alpha
INSERT INTO items (id, type, title, content, content_type, parent_id, sort_order, metadata, created_at, updated_at) VALUES
('note-10', 'note', 'Alpha Requirements', 'Requirements document for Project Alpha.', 'plain', 'section-4', 'a0', '{}', datetime('now'), datetime('now')),
('note-11', 'note', 'Alpha Timeline', 'Project timeline and milestones.', 'plain', 'section-4', 'a1', '{}', datetime('now'), datetime('now')),
('note-12', 'note', 'Alpha Meeting 1', 'Notes from first project meeting.', 'plain', 'section-4', 'a2', '{}', datetime('now'), datetime('now')),
('note-13', 'note', 'Alpha Meeting 2', 'Notes from second project meeting.', 'plain', 'section-4', 'a3', '{}', datetime('now'), datetime('now')),
('note-14', 'note', 'Alpha Retrospective', 'What went well and what to improve.', 'plain', 'section-4', 'a4', '{}', datetime('now'), datetime('now'));

-- Notes in Project Beta
INSERT INTO items (id, type, title, content, content_type, parent_id, sort_order, metadata, created_at, updated_at) VALUES
('note-15', 'note', 'Beta Kickoff', 'Project Beta kickoff notes.', 'plain', 'section-5', 'a0', '{}', datetime('now'), datetime('now')),
('note-16', 'note', 'Beta Research', 'Research findings for the project.', 'plain', 'section-5', 'a1', '{}', datetime('now'), datetime('now'));

-- Notes in Recipes
INSERT INTO items (id, type, title, content, content_type, parent_id, sort_order, metadata, created_at, updated_at) VALUES
('note-17', 'note', 'Pasta Carbonara', 'Classic Italian pasta recipe with eggs and bacon.', 'plain', 'section-6', 'a0', '{}', datetime('now'), datetime('now')),
('note-18', 'note', 'Chocolate Cake', 'Rich chocolate cake recipe.', 'plain', 'section-6', 'a1', '{}', datetime('now'), datetime('now')),
('note-19', 'note', 'Smoothie Ideas', 'Various smoothie combinations to try.', 'plain', 'section-6', 'a2', '{}', datetime('now'), datetime('now'));

-- Notes in Travel
INSERT INTO items (id, type, title, content, content_type, parent_id, sort_order, metadata, created_at, updated_at) VALUES
('note-20', 'note', 'Japan Trip', 'Planning notes for Japan trip.', 'plain', 'section-7', 'a0', '{}', datetime('now'), datetime('now')),
('note-21', 'note', 'Packing List', 'Essential items to pack for travel.', 'plain', 'section-7', 'a1', '{}', datetime('now'), datetime('now')),
('note-22', 'note', 'Flight Bookings', 'Links and confirmation numbers.', 'plain', 'section-7', 'a2', '{}', datetime('now'), datetime('now'));

-- Direct notes under books (testing notes directly in books)
INSERT INTO items (id, type, title, content, content_type, parent_id, sort_order, metadata, created_at, updated_at) VALUES
('note-23', 'note', 'Notebook Overview', 'Overview of this notebook and its purpose.', 'plain', 'book-1', 'Zz', '{}', datetime('now'), datetime('now')),
('note-24', 'note', 'Work Overview', 'High-level work notes that dont fit in a specific project.', 'plain', 'book-2', 'Zz', '{}', datetime('now'), datetime('now'));
