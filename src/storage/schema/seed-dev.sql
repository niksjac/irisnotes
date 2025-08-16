-- Development seed data for IrisNotes
-- Creates sample books, sections, and notes for testing

-- Insert sample books
INSERT INTO items (id, type, title, parent_id, sort_order, metadata, created_at, updated_at) VALUES
('book-1', 'book', 'Personal', NULL, 1, '{"description": "Personal notes and ideas"}', datetime('now'), datetime('now')),
('book-2', 'book', 'Work', NULL, 2, '{"description": "Work-related projects and documentation"}', datetime('now'), datetime('now')),
('book-3', 'book', 'Reading List', NULL, 3, '{"description": "Books and articles to read"}', datetime('now'), datetime('now'));

-- Insert sections under Personal
INSERT INTO items (id, type, title, parent_id, sort_order, metadata, created_at, updated_at) VALUES
('section-1', 'section', 'Meeting Notes', 'book-1', 1, '{"description": "Notes from various meetings"}', datetime('now'), datetime('now')),
('section-2', 'section', 'Ideas', 'book-1', 2, '{"description": "Personal ideas and concepts"}', datetime('now'), datetime('now'));

-- Insert sections under Work
INSERT INTO items (id, type, title, parent_id, sort_order, metadata, created_at, updated_at) VALUES
('section-3', 'section', 'Projects', 'book-2', 1, '{"description": "Active work projects"}', datetime('now'), datetime('now')),
('section-4', 'section', 'Documentation', 'book-2', 2, '{"description": "Technical documentation"}', datetime('now'), datetime('now'));

-- Insert sections under Reading List
INSERT INTO items (id, type, title, parent_id, sort_order, metadata, created_at, updated_at) VALUES
('section-5', 'section', 'Technical Books', 'book-3', 1, '{"description": "Programming and technical books"}', datetime('now'), datetime('now')),
('section-6', 'section', 'Articles', 'book-3', 2, '{"description": "Online articles and papers"}', datetime('now'), datetime('now'));

-- Insert notes under Meeting Notes
INSERT INTO items (id, type, title, content, content_type, parent_id, sort_order, metadata, created_at, updated_at) VALUES
('note-1', 'note', 'Weekly Standup', 'Team discussed progress on current sprint. Next milestone: API completion.', 'plain', 'section-1', 1, '{"word_count": 15, "is_pinned": false}', datetime('now'), datetime('now')),
('note-2', 'note', 'Project Review', 'Reviewed Q1 goals and identified areas for improvement.', 'plain', 'section-1', 2, '{"word_count": 12, "is_pinned": true}', datetime('now'), datetime('now'));

-- Insert notes under Ideas
INSERT INTO items (id, type, title, content, content_type, parent_id, sort_order, metadata, created_at, updated_at) VALUES
('note-3', 'note', 'App Concept', 'Mobile app for habit tracking with gamification elements.', 'plain', 'section-2', 1, '{"word_count": 12, "is_pinned": false}', datetime('now'), datetime('now')),
('note-4', 'note', 'Learning Goals', 'Master React performance optimization and TypeScript advanced patterns.', 'plain', 'section-2', 2, '{"word_count": 10, "is_pinned": true}', datetime('now'), datetime('now'));

-- Insert notes under Projects
INSERT INTO items (id, type, title, content, content_type, parent_id, sort_order, metadata, created_at, updated_at) VALUES
('note-5', 'note', 'Project A', 'E-commerce platform redesign. Status: In progress, 60% complete.', 'plain', 'section-3', 1, '{"word_count": 12, "is_pinned": true}', datetime('now'), datetime('now')),
('note-6', 'note', 'Project B', 'Mobile app for internal tools. Status: Planning phase.', 'plain', 'section-3', 2, '{"word_count": 11, "is_pinned": false}', datetime('now'), datetime('now'));

-- Insert notes under Documentation
INSERT INTO items (id, type, title, content, content_type, parent_id, sort_order, metadata, created_at, updated_at) VALUES
('note-7', 'note', 'API Spec', 'REST API documentation for user management endpoints.', 'markdown', 'section-4', 1, '{"word_count": 8, "is_pinned": true}', datetime('now'), datetime('now')),
('note-8', 'note', 'User Guide', 'Step-by-step guide for new team members.', 'markdown', 'section-4', 2, '{"word_count": 9, "is_pinned": false}', datetime('now'), datetime('now'));

-- Insert notes under Technical Books
INSERT INTO items (id, type, title, content, content_type, parent_id, sort_order, metadata, created_at, updated_at) VALUES
('note-9', 'note', 'Design Patterns', 'Gang of Four patterns for object-oriented design.', 'plain', 'section-5', 1, '{"word_count": 10, "is_pinned": false}', datetime('now'), datetime('now')),
('note-10', 'note', 'Clean Code', 'Robert Martin\'s principles for writing maintainable code.', 'plain', 'section-5', 2, '{"word_count": 9, "is_pinned": true}', datetime('now'), datetime('now'));

-- Insert notes under Articles
INSERT INTO items (id, type, title, content, content_type, parent_id, sort_order, metadata, created_at, updated_at) VALUES
('note-11', 'note', 'React Best Practices', 'Modern React patterns and performance tips.', 'markdown', 'section-6', 1, '{"word_count": 8, "is_pinned": true}', datetime('now'), datetime('now')),
('note-12', 'note', 'Performance Tips', 'Optimization techniques for web applications.', 'markdown', 'section-6', 2, '{"word_count": 9, "is_pinned": false}', datetime('now'), datetime('now'));
