# File Storage System

IrisNotes now supports a flexible storage system that can work with multiple backends, including file-based storage alongside the existing SQLite database.

## Overview

The storage system consists of:

- **Storage Adapters**: Interface implementations for different storage backends
- **Format Handlers**: Converters between different file formats and the internal Note format
- **Multi-Storage Manager**: Coordinates multiple storage backends

## Supported Storage Backends

### File-Based Storage

Stores notes as individual files in the `appconfig/notes/` directory with support for:

- **Folder organization**: Files can be in root or subfolders (representing notebooks)
- **Multiple formats**: Custom format, Markdown, HTML, JSON, Plain text
- **Automatic sync**: Watches for file system changes
- **Metadata preservation**: Stores note metadata in file headers

### File Formats

#### Custom Format (.txt)
```
---
title: My Note
created_at: 2024-01-01T12:00:00Z
updated_at: 2024-01-01T12:00:00Z
content_type: custom
---

{size:large}{color:blue}Welcome to IrisNotes!{/color}{/size}

This is a note with {bold}custom formatting{/bold}.
```

#### Markdown (.md)
```markdown
---
title: "My Markdown Note"
created_at: 2024-01-01T12:00:00Z
updated_at: 2024-01-01T12:00:00Z
id: my-markdown-note
---

# Welcome to IrisNotes!

This is a **markdown** note with *formatting*.
```

#### HTML (.html)
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>My HTML Note</title>
  <meta name="created" content="2024-01-01T12:00:00Z">
  <meta name="updated" content="2024-01-01T12:00:00Z">
</head>
<body>
  <h1>Welcome to IrisNotes!</h1>
  <p>This is an <strong>HTML</strong> note.</p>
</body>
</html>
```

#### JSON (.json)
```json
{
  "id": "my-json-note",
  "title": "My JSON Note",
  "content": "<p>This is a JSON-stored note.</p>",
  "content_type": "html",
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:00:00Z",
  "is_pinned": false,
  "is_archived": false,
  "word_count": 6,
  "character_count": 32,
  "content_plaintext": "This is a JSON-stored note."
}
```

## Directory Structure

```
appconfig/
└── notes/
    ├── my-note.txt                    # Root-level note
    ├── quick-thoughts.md              # Markdown note
    ├── project-notes/                 # Notebook folder
    │   ├── meeting-notes.txt          # Notes in notebook
    │   └── todo-list.md
    └── personal/                      # Another notebook
        ├── journal.txt
        └── ideas.json
```

## Usage

### Using the Multi-Storage Hook

```typescript
import { useMultiStorageNotes } from '../features/notes';

function MyComponent() {
  const {
    notes,
    isLoading,
    error,
    createNewNote,
    updateNoteContent,
    deleteNote,
    syncStorage
  } = useMultiStorageNotes();

  // Notes are automatically loaded from all storage backends
  // Changes are saved to the default storage backend

  return (
    <div>
      {notes.map(note => (
        <div key={note.id}>{note.title}</div>
      ))}
    </div>
  );
}
```

### Manual Storage Management

```typescript
import {
  createMultiStorageManager,
  createFileStorageAdapter
} from '../features/notes/storage';

const manager = createMultiStorageManager();

// Add file storage
const fileStorage = createFileStorageAdapter('notes');
await manager.addStorage('file', fileStorage);

// Add another file storage for different location
const docsStorage = createFileStorageAdapter('documents');
await manager.addStorage('docs', docsStorage);

// Get all notes from all storages
const result = await manager.getAllNotes();
```

### Creating Custom Format Handlers

```typescript
import { FileFormatHandler, FileFormat } from '../features/notes/storage';

class MyCustomHandler implements FileFormatHandler {
  format: FileFormat = 'custom';
  extension: string = '.myformat';
  mimeType: string = 'text/plain';

  async serialize(note: Note): Promise<string> {
    // Convert note to your custom format
    return `TITLE: ${note.title}\nCONTENT: ${note.content}`;
  }

  async deserialize(content: string, filePath: string): Promise<Note> {
    // Parse your custom format back to Note object
    const lines = content.split('\n');
    const title = lines[0].replace('TITLE: ', '');
    const content = lines[1].replace('CONTENT: ', '');

    return {
      id: this.generateId(filePath),
      title,
      content,
      // ... other required fields
    };
  }

  // ... implement other required methods
}

// Register your handler
registerFormatHandler('custom', new MyCustomHandler());
```

## Features

### Automatic Synchronization
- File system changes are automatically detected
- Notes are reloaded when files change externally
- Manual sync available via `syncStorage()`

### Cross-Storage Operations
- Search across all storage backends
- Move notes between different storages
- Unified note listing from multiple sources

### Format Conversion
- Automatic conversion between formats when moving notes
- Preserves formatting as much as possible
- Fallback to plain text when conversion isn't perfect

### Error Handling
- Graceful degradation when storage backends fail
- Error reporting for individual operations
- Continues working with available backends

## Configuration

The storage system can be configured through the app config:

```typescript
const config = {
  storage: {
    defaultBackend: 'file',
    fileStorage: {
      basePath: 'notes',
      supportedFormats: ['custom', 'markdown', 'html', 'json', 'txt'],
      autoSync: true
    }
  }
};
```

## Migration

To migrate from the in-memory note system to file storage:

1. Use the `FileStorageDemo` component to test the system
2. Export existing notes to file format
3. Switch to `useMultiStorageNotes` hook in your components
4. Gradually migrate components to use the new system

## Performance Considerations

- File operations are asynchronous to avoid blocking the UI
- Large directories are loaded incrementally
- File watching is debounced to avoid excessive reloads
- Notes are cached in memory for fast access

## Limitations

- Only one level of folder nesting (notebooks)
- File names must be valid for the operating system
- Large files may impact performance
- No real-time collaboration (files can conflict if edited externally)

## Troubleshooting

### Common Issues

1. **Permission Errors**: Ensure the app has write access to the config directory
2. **File Not Found**: Check that the notes directory exists and is readable
3. **Format Validation Errors**: Verify file content matches the expected format
4. **Sync Issues**: Use manual sync if automatic detection isn't working

### Debug Information

Enable debug logging to see storage operations:

```typescript
const storage = createFileStorageAdapter('notes');
// Check storage info
const info = await storage.getStorageInfo();
console.log('Storage info:', info);
```