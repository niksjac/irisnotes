// App-wide state management

// Re-export types

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
export { useHotkeysConfig } from "./use-hotkeys-config";
export { useHotkeyHandlers } from "./use-hotkey-handlers";

// Re-export useHotkeyConfig for backward compatibility
export { useHotkeysConfig as useHotkeyConfig } from "./use-hotkeys-config";

// Editor hooks
export { useEditorState } from "./use-editor-state";
export { useLineWrapping } from "./use-line-wrapping";

// Theme hook
export { useTheme } from "./use-theme";

// Notes hooks (moved from nested structure)
export { useNotesActions } from "./use-notes-actions";
export { useNotesData } from "./use-notes-data";
export { useNotesHandlers } from "./use-notes-handlers";
export { useNotesSelection } from "./use-notes-selection";
export { useNotesStorage } from "./use-notes-storage";

// Categories infrastructure (new pattern)
export { useCategoriesData } from "./use-categories-data";
export { useCategoriesActions } from "./use-categories-actions";

// Context menu hooks
export { useContextMenu } from "./use-context-menu";
export { useContextMenuActions } from "./use-context-menu-actions";

// Debug and development
export { useAppInfo } from "./use-app-info";
