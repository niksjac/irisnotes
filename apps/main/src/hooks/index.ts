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
export {
	useLayoutPersistence,
	loadLayoutState,
} from "./use-layout-persistence";
export { useTabPersistence, loadTabState } from "./use-tab-persistence";
// App-wide hotkeys
export { useAppHotkeys } from "./use-app-hotkeys";
export { useHotkeysConfig } from "./use-hotkeys-config";
export { useHotkeyHandlers } from "./use-hotkey-handlers";
export { useNoteActions } from "./use-note-actions";

// Re-export useHotkeyConfig for backward compatibility
export { useHotkeysConfig as useHotkeyConfig } from "./use-hotkeys-config";

// Editor hooks
export { useEditorState } from "./use-editor-state";
export { useLineWrapping } from "./use-line-wrapping";
export { useEditorViewToggle } from "./use-editor-view-toggle";
export {
	useEditorSettings,
	useEditorFontSize,
	useEditorFontFamily,
	useEditorLineHeight,
	useEditorLineWrapping,
} from "./use-editor-settings";

// Theme hook
export { useTheme } from "./use-theme";

// Unified items system (replaces notes/categories)
export { useItems } from "./use-items";

// Tree view management
export { useTreeView } from "./use-tree-view";

// Container views (section/book)
export { useContainerView } from "./use-container-view";

// Tab management
export { useTabManagement } from "./use-tab-management";

// Storage and handlers
export { useNotesHandlers } from "./use-notes-handlers";
export { useNotesStorage } from "./use-notes-storage";

// Right-click menu hooks
export { useRightClickMenu } from "./use-right-click-menu";
export { useRightClickMenuActions } from "./use-right-click-menu-actions";

// Responsive design hooks
export {
	useMediaQuery,
	useIsMobile,
	useIsTablet,
	useIsDesktop,
} from "./use-media-query";

// Debug and development
export { useAppInfo } from "./use-app-info";

// Quick app integration (IrisNotes Quick Search)
export { useQuickAppListener } from "./use-quick-app-listener";

// KeyTips (Access Keys) - Alt+key shortcuts
export { useKeyTips, useKeyTipActions, altKeyHeldAtom } from "./use-key-tips";

// Editor zoom (Ctrl+scroll wheel)
export { useEditorZoom, useEditorZoomRef } from "./use-editor-zoom";
