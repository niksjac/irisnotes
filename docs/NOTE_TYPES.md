# Note Types Extension

> **Status**: Planned / Not Started  
> **Created**: January 2026

## Overview

Extend IrisNotes to support multiple note types beyond rich text, including:
- **Code snippets** with syntax highlighting (JavaScript, Python, SQL, etc.)
- **Markdown** with live preview
- **Plain text** for quick notes

## Current Schema Support

The schema is **already prepared** for this feature:

```sql
-- From schema/base.sql
content_type TEXT DEFAULT 'html' CHECK (content_type IN ('html', 'markdown', 'plain', 'custom')),
content_raw TEXT NULL, -- original format when content_type is 'custom'
```

The `custom` type with `content_raw` was designed for storing original source formats.

## Proposed Note Types

| Note Type | `content_type` | Editor | Use Case |
|-----------|---------------|--------|----------|
| Rich Text | `html` | ProseMirror | General notes (current default) |
| Markdown | `markdown` | CodeMirror + preview | Technical docs |
| Plain Text | `plain` | CodeMirror (minimal) | Quick notes |
| JavaScript | `code:javascript` | CodeMirror + syntax | Code snippets |
| TypeScript | `code:typescript` | CodeMirror + syntax | Code snippets |
| Python | `code:python` | CodeMirror + syntax | Scripts |
| Java | `code:java` | CodeMirror + syntax | Code snippets |
| C# | `code:csharp` | CodeMirror + syntax | Code snippets |
| Rust | `code:rust` | CodeMirror + syntax | Code snippets |
| SQL | `code:sql` | CodeMirror + syntax | Database queries |
| JSON | `code:json` | CodeMirror + syntax | Config files |
| CSS | `code:css` | CodeMirror + syntax | Stylesheets |
| HTML | `code:html` | CodeMirror + syntax | Markup |

## Implementation Options

### Option 1: Use Metadata (Recommended for MVP)

No schema changes required. Store language info in the existing `metadata` JSON column:

```typescript
// Example: JavaScript code note
{
  content_type: "custom",
  content: "console.log('hello')",
  metadata: {
    note_format: "code",
    language: "javascript",
    syntax_theme: "github-dark",
    show_line_numbers: true
  }
}
```

**Pros:**
- No database migration needed
- Flexible for experimentation
- Quick to implement

**Cons:**
- Less structured
- No SQL-level validation

### Option 2: Extend content_type (Future)

Update the schema CHECK constraint to include code languages:

```sql
content_type TEXT DEFAULT 'html' CHECK (
  content_type IN (
    'html', 'markdown', 'plain', 'custom',
    'code:javascript', 'code:typescript', 'code:python', 
    'code:java', 'code:csharp', 'code:rust', 'code:sql',
    'code:json', 'code:css', 'code:html'
  )
)
```

**Pros:**
- SQL-level validation
- Cleaner data model
- Better for querying by type

**Cons:**
- Requires schema migration
- Less flexible for adding new languages

## TypeScript Types (Draft)

```typescript
// src/types/items.ts

export type CodeLanguage = 
  | "javascript" 
  | "typescript" 
  | "python" 
  | "java" 
  | "csharp" 
  | "rust" 
  | "sql" 
  | "json" 
  | "css" 
  | "html";

export type ContentType = 
  | "html" 
  | "markdown" 
  | "plain" 
  | "custom"
  | `code:${CodeLanguage}`;

// Helper to extract language from content_type
export function getCodeLanguage(contentType: ContentType): CodeLanguage | null {
  if (contentType.startsWith("code:")) {
    return contentType.replace("code:", "") as CodeLanguage;
  }
  return null;
}
```

## Editor Selection Logic (Draft)

```typescript
function getEditorForContentType(contentType: ContentType) {
  switch (contentType) {
    case "html":
      return "prosemirror-rich";
    case "markdown":
      return "codemirror-markdown";
    case "plain":
      return "codemirror-plain";
    default:
      if (contentType.startsWith("code:")) {
        return "codemirror-code";
      }
      return "codemirror-plain";
  }
}
```

## CodeMirror Language Extensions

CodeMirror 6 packages needed:

```bash
pnpm add @codemirror/lang-javascript @codemirror/lang-python @codemirror/lang-sql @codemirror/lang-json @codemirror/lang-css @codemirror/lang-html @codemirror/lang-java @codemirror/lang-rust
```

```typescript
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { sql } from "@codemirror/lang-sql";
import { json } from "@codemirror/lang-json";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { java } from "@codemirror/lang-java";
import { rust } from "@codemirror/lang-rust";

const languageExtensions: Record<CodeLanguage, Extension> = {
  javascript: javascript(),
  typescript: javascript({ typescript: true }),
  python: python(),
  sql: sql(),
  json: json(),
  css: css(),
  html: html(),
  java: java(),
  rust: rust(),
  csharp: javascript(), // fallback until @codemirror/lang-csharp exists
};
```

## UI/UX Considerations

### Note Creation
- Add a "Note Type" selector when creating new notes
- Default to "Rich Text" for backwards compatibility
- Show language icon/badge in tree view for code notes

### Note Display
- Code notes: syntax highlighting, line numbers, copy button
- Markdown notes: split view or toggle between source/preview
- Consider a "Convert to..." action for changing note types

### Tree View Icons
- 📝 Rich text notes
- 📄 Markdown notes
- 📋 Plain text notes
- Code notes: language-specific icons (JS, PY, etc.)

## Implementation Phases

### Phase 1: Foundation
- [ ] Add TypeScript types for content types
- [ ] Create language extension mapping for CodeMirror
- [ ] Build code-aware editor view component

### Phase 2: UI Integration
- [ ] Add note type selector to create note dialog
- [ ] Show note type indicator in tree view
- [ ] Add note type to note metadata display

### Phase 3: Polish
- [ ] Add "Convert note type" action
- [ ] Language-specific features (run SQL, format JSON, etc.)
- [ ] Syntax theme selection in settings

## Related Files

- `schema/base.sql` - Database schema (content_type column)
- `src/types/items.ts` - TypeScript types for items
- `src/views/editor-source-view.tsx` - CodeMirror editor
- `src/views/editor-rich-view.tsx` - ProseMirror editor
