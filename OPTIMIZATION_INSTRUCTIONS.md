# How to Optimize Note Loading Architecture

## 🎯 Goal

Transform the redundant multi-layer data loading system into a clean, performant atom-first architecture while preserving folder hierarchy.

## 📋 Step-by-Step Instructions

### Phase 1: Create New Architecture

1. **Create `src/atoms/computed.ts`**
   - Add `treeDataAtom` that computes tree structure from `notesAtom + categoriesAtom + noteCategoriesAtom`
   - Add `selectedNoteAtom` that derives from `selectedNoteIdAtom + notesAtom`
   - Add `notesForPaneAtom` for dual-pane support

2. **Create `src/hooks/use-app-data.ts`**
   - Single data loader that loads notes, categories, AND note-categories into atoms
   - Replace all the separate `useNotesData`, `useNotesCategories`, `useTreeData` hooks
   - Load note-category relationships via `storageAdapter.getCategoryNotes()` for each category

3. **Update `src/atoms/index.ts`**
   - Add proper typing for `noteCategoriesAtom: atom<{ noteId: string; categoryId: string }[]>([])`
   - Remove duplicated computed atoms (move to computed.ts)

### Phase 2: Update Components

4. **Update `src/layout.tsx`**
   - Replace `useAtomDatabaseSync()` with `useAppData()`

5. **Update `src/features/treeview/tree-view.tsx`**
   - Replace `useTreeData()` with `useAtomValue(treeDataAtom)`
   - Remove loading/error states (computed atoms are always available)

6. **Update views to use computed atoms**
   - `editor-rich-view.tsx`: Import from `@/atoms/computed`
   - `editor-source-view.tsx`: Import from `@/atoms/computed`
   - `folder-view.tsx`: Use `useAtomValue(noteCategoriesAtom)` instead of hook

### Phase 3: Simplify Actions

7. **Simplify `src/features/notes/hooks/use-notes-actions.ts`**
   - Remove data loading logic (now in useAppData)
   - Keep only CRUD operations that update atoms directly
   - Use `setNotes(prev => [...])` to update atoms
   - Fix UpdateNoteParams to include `id` field

### Phase 4: Clean Up

8. **Delete redundant files**
   - `src/hooks/use-atom-database-sync.ts`
   - `src/features/notes/hooks/use-notes-data.ts`
   - `src/features/notes/hooks/use-notes-categories.ts`
   - `src/features/treeview/hooks/use-tree-data.ts`

9. **Update exports**
   - Remove deleted hooks from `src/features/notes/hooks/index.ts`
   - Remove deleted hooks from `src/features/notes/index.ts`
   - Update `src/features/treeview/index.ts`
   - Update `src/hooks/index.ts`

10. **Fix remaining components**
    - `src/features/sidebar/components/sidebar.tsx`: Use atoms instead of hooks
    - `src/features/editor/components/database-status-view.tsx`: Use atoms
    - `src/views/welcome-view.tsx`: Use atoms or remove unused imports

## ⚠️ Critical Requirements

### MUST PRESERVE: Note-Category Relationships

- **Essential**: Load `note_categories` table relationships
- **Method**: Call `storageAdapter.getCategoryNotes(categoryId)` for each category
- **Structure**: `{ noteId: string; categoryId: string }[]`
- **Purpose**: Enables notes to appear nested inside folders in tree view

### MUST IMPLEMENT: Proper Tree Building

```typescript
// In treeDataAtom, use all 3 data sources:
const notes = get(notesAtom);
const categories = get(categoriesAtom);
const noteCategories = get(noteCategoriesAtom); // CRITICAL!

// Build note-category map
const noteCategoryMap = new Map<string, string[]>();
noteCategories.forEach(nc => {
	const existing = noteCategoryMap.get(nc.noteId) || [];
	existing.push(nc.categoryId);
	noteCategoryMap.set(nc.noteId, existing);
});

// Place notes inside their categories
const categoryNotes = notes.filter(note => {
	const noteCategs = noteCategoryMap.get(note.id) || [];
	return noteCategs.includes(category.id);
});
```

## 🎯 Expected Results

- **Tree shows**: Folders containing their notes (not all notes at root)
- **Performance**: 50% fewer hooks, smaller bundle, reactive updates
- **Maintainability**: Single data loading path, computed derived state
- **Functionality**: All existing features preserved

## 🚨 Common Pitfalls to Avoid

1. **Don't skip note-category relationships** - Tree will be flat without them
2. **Don't forget to update UpdateNoteParams** - Add `id` field for CRUD operations
3. **Don't leave unused imports** - Clean up component imports after hook removal
4. **Don't break folder creation** - Update folder creation handlers in views

## ✅ Verification Checklist

- [ ] Notes appear inside correct folders in tree view
- [ ] Root-level notes (without categories) still show
- [ ] Editor opens when clicking notes
- [ ] Folder view shows folder contents
- [ ] New note creation works
- [ ] TypeScript builds without errors
- [ ] No console errors about missing data
