# IrisNotes - Project Overview

## Introduction

• **IrisNotes** - A modern note-taking application inspired by Trilium Notes
• Cross-platform desktop application built with Tauri + React
• Focuses on rich text editing, organization, and advanced features
• Supports custom markup syntax for enhanced text formatting
• Designed for power users with keyboard shortcuts and dual-pane editing

## Application Type & Architecture

• **Desktop Application**: Tauri-based (Rust + React frontend)
• **Cross-Platform**: Windows, macOS, Linux support
• **Offline-First**: Local SQLite database with optional cloud sync (planned)
• **Single-Window Application**: Custom window decorations, resizable panes
• **Atomic State Management**: Jotai for performance and scalability

## Tech Stack

### Frontend Framework

• **React 18** - Component-based UI framework
• **TypeScript** - Type-safe development
• **Vite** - Fast build tool and dev server
• **Jotai** - Atomic state management (recently migrated from React Context)

### Backend & Runtime

• **Tauri 2.0** - Rust-based app framework
• **Rust** - System-level operations and database access
• **Tauri Plugins** - File system, clipboard, notifications, window state, global shortcuts

### Database & Storage

• **SQLite** - Primary database with FTS5 full-text search
• **Multi-Storage Architecture** - Pluggable storage backends

- SQLite database (implemented)
- File system storage (placeholder)
- Cloud storage (Google Drive, Dropbox - planned)

### Styling & UI

• **Tailwind CSS v4** - Utility-first CSS framework
• **Custom CSS Variables** - Theme system without prefixes (--bg-primary, --text-primary)
• **Lucide React** - Icon library
• **Custom Components** - Button, Input, Modal components

### Text Editing

• **ProseMirror** - Rich text editor with plugins

- Custom color plugin
- Formatting marks
- Keyboard shortcuts
- Line highlighting
- Link click handling
  • **CodeMirror 6** - Source code editing
- HTML, JavaScript, Markdown language support
- Search functionality
- Theme support (One Dark)
  • **Custom Markup Syntax** - BBCode-like formatting ({bold}text{/bold})

## Programming Languages

• **TypeScript** (95%) - Frontend application logic
• **Rust** (5%) - Tauri backend, system integration
• **SQL** - Database schema and queries
• **CSS** - Custom styling and theme variables
• **Bash** - Development setup scripts

## Database Schema

### Core Tables

• **notes** - Main note storage (title, content, metadata, soft delete)
• **categories** - Hierarchical organization system
• **tags** - Flexible labeling system
• **settings** - Application configuration

### Relationship Tables

• **note_categories** - Many-to-many note-category relationships
• **note_tags** - Many-to-many note-tag relationships
• **note_relationships** - Links between notes (references, children)

### Additional Features

• **attachments** - File attachments linked to notes
• **note_versions** - Version history for notes
• **notes_fts** - Full-text search virtual table (FTS5)

## Core Features

### Note Management

• Create, edit, delete notes with rich text formatting
• Soft delete with trash/recovery functionality
• Note pinning and archiving
• Word and character count tracking
• Note templates system (planned)

### Text Editing

• **Rich Editor**: ProseMirror-based WYSIWYG editing
• **Source Editor**: Direct HTML/Markdown editing with CodeMirror
• **Custom Markup**: BBCode-like syntax ({color:red}text{/color})
• **Dual-Pane Mode**: Side-by-side editing/viewing
• **Font Customization**: Size, family, line wrapping options

### Organization

• **Categories**: Hierarchical folder structure with colors and icons
• **Tags**: Flexible labeling system with descriptions
• **Full-Text Search**: SQLite FTS5 with content and title indexing
• **Note Relationships**: Link notes together (references, children, related)

### Advanced Features

• **Storage Backends**: Configurable SQLite/File System/Cloud storage
• **Hotkey Sequences**: VSCode-style keyboard shortcuts (Ctrl+K, R)
• **Theme System**: Dark/light mode support
• **Window State**: Persistent window size and position
• **Configuration**: Development/production environment isolation

## Development Tools & Package Management

• **Package Manager**: pnpm (required, do not use npm/yarn)
• **Build Commands**:

- `pnpm install` - Install dependencies
- `pnpm run build` - Build for production
- `pnpm run dev` - Development server (for debugging only)
  • **Tauri CLI**: `pnpm tauri` for native app building

## Project Structure

### Source Organization

• `src/app.tsx` - Main application entry with Jotai Provider
• `src/features/` - Feature-based modules

- `editor/` - Text editing components and logic
- `notes/` - Note management and storage
- `layout/` - Application layout and panes
- `sidebar/` - Navigation and organization
- `theme/` - Theme management
  • `src/atoms/` - Jotai state management
  • `src/shared/` - Reusable components and utilities
  • `src/styles/` - Global styles and theme variables

### Configuration

• `dev/config/` - Development environment configuration
• `src-tauri/` - Rust backend code and configuration
• `docs/` - Project documentation
• `_TASKS/` - Development tasks and project management

## Environment Management

### Development Mode

• Local configuration: `./dev/config/app-config.json`
• Local database: `./dev/config/notes.db`
• Sample data: `./dev/config/sample-notes.json`
• Isolated from production data

### Production Mode

• System directories: `~/.config/irisnotes/` (Linux)
• User-configurable paths through UI
• Migration support from old configuration paths

## Current Status & Recent Changes

### Recently Completed

• **Jotai Migration**: Migrated from React Context to atomic state management
• **God Hook Refactoring**: Broke down monolithic hooks into focused, single-purpose hooks
• **Storage System**: Implemented configurable storage selection with SQLite backend
• **Open Props Removal**: Migrated from Open Props to custom CSS variables

### Performance Improvements

• Bundle size reduced by 5.6kB through hook refactoring
• Re-render optimization with atomic state management
• Eliminated 800+ lines of god hook code

### Architecture Patterns

• Focused hooks pattern (1-3 values per hook vs 20+ in god hooks)
• Feature-based organization
• Clear separation of concerns
• TypeScript strict mode compliance

## Known Limitations

• Cloud storage backends not yet implemented
• Some TypeScript `any` types need proper interfaces
• Missing comprehensive test coverage
• Note templates system not implemented
• Advanced search filters need UI implementation

## Future Roadmap

### Short Term

• Complete SQLite storage adapter implementation
• Build categories and tags UI
• Implement full-text search interface
• Add settings/preferences UI

### Medium Term

• File attachments support
• Note export/import (HTML, Markdown, PDF)
• Advanced search and filtering
• Plugin system architecture

### Long Term

• Cloud storage integration
• Collaborative editing
• Note encryption
• Cross-device synchronization
