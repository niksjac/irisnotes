# Sidebar Future Features

This document tracks features that were previously commented out from the sidebar components and need to be implemented later.

## Core Functionality to Implement

### 1. Notes Data Management

- **useNotesData**: Hook for accessing notes data
- **useNotesSelection**: Hook for managing selected note state
- **useNotesActions**: Hook for note CRUD operations
- **useNotesNavigation**: Hook for opening notes in panes

### 2. Note Operations

- **Note Selection**: Handle clicking on notes to select them
- **Note Creation**: Create new notes from the sidebar
- **Note Deletion**: Delete notes with confirmation dialog
- **Note Renaming**: Rename note titles inline
- **Note Moving**: Move notes between categories/folders

### 3. Category Management

- **useCategoryManagement**: Hook for folder/category operations
- **Create Folders**: Add new categories to organize notes
- **Delete Categories**: Remove categories (with note handling)
- **Rename Categories**: Edit category names

### 4. Search and Filtering

- **SidebarSearch Component**: Reusable search input component with:
  - Props: `searchQuery`, `onSearchChange`, `placeholder` (optional)
  - Styled input with dark mode support
  - Focus ring styling with blue color scheme
  - Real-time onChange handling
- **Note Filtering**: Filter notes based on search query
- **Search Integration**: Connect search input to note filtering
- **Advanced Search Features**:
  - Search by note title
  - Search by note content
  - Category-based filtering
  - Date range filtering
  - Tag-based search

### 5. Tree View Integration

- **ArboristNotesTree**: Full-featured tree component for notes
- **Tree Props**: All the handlers for tree interactions
  - onNoteSelect
  - onCreateNote
  - onCreateFolder
  - onDeleteNote
  - onDeleteCategory
  - onRenameNote
  - onRenameCategory
  - onMoveNote

## Implementation Priority

1. Notes data management and basic operations
2. Note selection and navigation
3. Search and filtering functionality
4. Category management
5. Full tree view integration

## Technical Notes

- All handlers need proper error handling
- Consider optimistic UI updates for better UX
- Implement proper loading states
- Add keyboard shortcuts for common operations
- Ensure proper accessibility for tree navigation
