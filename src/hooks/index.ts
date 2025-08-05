// App-wide state management

// Re-export types
export type { PaneId } from '@/types';
export { useAppPersistence } from './use-app-persistence';
// Configuration
export { useConfig } from './use-config';
export { useEditorLayout } from './use-editor-layout';
export { usePane } from './use-pane';
// Backward compatibility exports
export { usePane as usePaneState } from './use-pane';
export { usePane as usePaneActions } from './use-pane';
// Performance
export { usePerformance } from './use-performance';
// Layout and UI state
export { useSidebar } from './use-sidebar';
export { useView } from './use-view';

// Backward compatibility exports
export { useSidebar as useSidebarState } from './use-sidebar';
export { useSidebar as useSidebarActions } from './use-sidebar';
export { useView as useViewState } from './use-view';
export { useView as useViewActions } from './use-view';
// Consolidated layout hook
export { useLayout } from './use-layout';
// App-wide hotkeys
export { useAppHotkeys } from './use-app-hotkeys';
