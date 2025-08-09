// App-wide state management

// Re-export types
export type { PaneId } from "./use-layout";
export { useAppPersistence } from "./use-app-persistence";
// Configuration
export { useConfig } from "./use-config";
export { useEditorLayout } from "./use-editor-layout";

// Performance
export { usePerformance } from "./use-performance";
// Layout and UI state
export { useSidebar } from "./use-sidebar";
export { useView } from "./use-view";
// Consolidated layout hook
export { useLayout } from "./use-layout";
// App-wide hotkeys
export { useAppHotkeys } from "./use-app-hotkeys";

// Editor hooks
export { useEditorState } from "./use-editor-state";
export { useLineWrapping } from "./use-line-wrapping";

// Theme hook
export { useTheme } from "./use-theme";

// Notes hooks (moved from nested structure)
export { useNotesActions } from "./use-notes-actions";
export { useNotesData } from "./use-notes-data";
export { useNotesCategories } from "./use-notes-categories";
export { useNotesHandlers } from "./use-notes-handlers";
export { useNotesSelection } from "./use-notes-selection";
export { useNotesStorage } from "./use-notes-storage";

// Tree hooks
export { useTreeData } from "./use-tree-data";
