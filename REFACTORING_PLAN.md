# God Hook Refactoring Plan

## Overview
Breaking down god hooks into focused, single-purpose hooks for better performance and maintainability.

## Current God Hooks → Recommended Refactoring

### 1. `useAppState` (94 lines, 20+ values)
**Break into:**
```typescript
// Instead of one god hook
const { notes, selectedNote, sidebarCollapsed, fontSize, ... } = useAppState();

// Use focused hooks
const { notes, selectedNote } = useNotesState();
const { sidebarCollapsed } = useLayoutState();
const { fontSize } = useEditorState();
```

### 2. `useSingleStorageNotes` (293 lines, 22 values)
**Break into:**
```typescript
// Data hooks
const { notes, isLoading, error } = useNotesData();
const { selectedNote, selectedNoteId } = useNotesSelection();

// Action hooks
const { createNote, updateNote, deleteNote } = useNotesActions();
const { openNoteInPane } = useNotesNavigation();

// Storage hooks
const { storageManager, syncStorage } = useNotesStorage();
```

### 3. `useLayout` (91 lines, 16 values)
**Break into:**
```typescript
// State hooks
const { sidebarCollapsed } = useSidebarState();
const { isDualPaneMode, activePaneId } = usePaneState();
const { configViewActive } = useViewState();

// Action hooks
const { toggleSidebar } = useSidebarActions();
const { toggleDualPaneMode } = usePaneActions();
```

## Benefits of Refactoring

### Performance
- **Selective Re-rendering**: Components only re-render when atoms they use change
- **Smaller Bundle Size**: Only import what you need
- **Better Memoization**: Smaller hooks are easier to optimize

### Developer Experience
- **Clear Dependencies**: See exactly what state each component uses
- **Easier Testing**: Test individual concerns in isolation
- **Better IntelliSense**: Focused hooks have better autocomplete

### Maintainability
- **Single Responsibility**: Each hook has one clear purpose
- **Loose Coupling**: Changes in one area don't affect others
- **Easier Debugging**: Smaller scope makes issues easier to track

## Implementation Strategy

### Phase 1: Create Focused Hooks (No Breaking Changes)
1. Create new focused hooks alongside existing ones
2. Keep god hooks as compatibility layer
3. Start refactoring components one by one

### Phase 2: Gradual Migration
1. Update components to use focused hooks
2. Remove unused god hook dependencies
3. Add performance monitoring

### Phase 3: Cleanup
1. Remove god hooks once all components migrated
2. Clean up unused code
3. Document new patterns

## Example: MainLayout Refactoring

### Before (God Hook)
```typescript
const {
  sidebarCollapsed, activityBarVisible, configViewActive,
  hotkeysViewActive, databaseStatusVisible, isDualPaneMode,
  toolbarVisible, isWrapping, fontSize, focusManagement,
  toggleSidebar, toggleConfigView, toggleHotkeysView,
  toggleDatabaseStatus, toggleDualPaneMode, toggleToolbar,
  toggleLineWrapping, handleSidebarCollapsedChange
} = useAppContext(); // 18 values from god hook!
```

### After (Focused Hooks)
```typescript
// Only import what we need
const sidebarCollapsed = useAtomValue(sidebarCollapsedAtom);
const activityBarVisible = useAtomValue(activityBarVisibleAtom);
const configViewActive = useAtomValue(configViewActiveAtom);
const toggleSidebar = useSetAtom(toggleSidebarAtom);
const toggleConfigView = useSetAtom(toggleConfigViewAtom);

// Component only re-renders when these specific atoms change
```

## Jotai-Specific Advantages

With Jotai, we can:
- **Atomic Updates**: Only subscribe to atoms we need
- **Derived State**: Create computed values automatically
- **Async Actions**: Handle async operations cleanly
- **Dev Tools**: Better debugging with atom inspector

## Next Steps

1. **Start with Layout**: Refactor `useLayout` first (smaller scope)
2. **Move to Notes**: Break down `useSingleStorageNotes`
3. **Finish with State**: Refactor `useAppState` last
4. **Monitor Performance**: Track re-render improvements

Would you like me to start with a specific god hook refactoring?