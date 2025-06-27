# Database Schema and Migrations

This directory contains SQL migration files for the IrisNotes database.

## Schema Overview

The IrisNotes database uses SQLite with the following main tables:

### Core Tables

- **notes** - Main note storage with content, metadata, and status flags
  - Supports multiple content types: HTML, Markdown, Plain text, and Custom format
  - Custom format uses color markup like `{color:red}text{/color}`
  - Stores both rendered HTML and original custom format for lossless editing
- **categories** - Hierarchical organization system for notes
- **tags** - Flexible labeling system for notes
- **settings** - App configuration and user preferences

### Relationship Tables

- **note_categories** - Many-to-many relationship between notes and categories
- **note_tags** - Many-to-many relationship between notes and tags
- **note_relationships** - Links between notes (references, children, related)

### Additional Tables

- **attachments** - File attachments linked to notes
- **note_versions** - Version history for notes
- **notes_fts** - Full-text search virtual table

## Features

### Full-Text Search
- SQLite FTS5 virtual table for fast text search
- Automatic index updates via triggers
- Search both titles and content

### Soft Delete
- Notes can be soft-deleted (deleted_at timestamp)
- Allows for recovery and trash functionality

### Versioning
- Automatic version tracking for notes
- Enables undo/redo and history features

### Performance
- Comprehensive indexing for common queries
- Optimized for read-heavy workloads
- Efficient relationship queries

## Migration Files

- `001_initial_schema.sql` - Initial database structure with all tables, indexes, triggers, and default data

## Usage

The database will be automatically created when the app first runs. The migration system uses Tauri's SQL plugin to execute these files in order.

## Default Data

The schema includes default categories and settings:

### Categories
- General (default)
- Quick Notes
- Projects
- Personal
- Work

### Settings
- Theme preference
- Editor mode
- Line wrapping
- Auto-save configuration
- Default category