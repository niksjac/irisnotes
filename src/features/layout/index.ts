// God hook - for backward compatibility
export { useLayout } from './hooks/use-layout';
export { useFocusManagement, type FocusableElement } from './hooks/use-focus-management';

// Focused hooks - new implementation
export { useSidebarState } from './hooks/use-sidebar-state';
export { usePaneState } from './hooks/use-pane-state';
export { useViewState } from './hooks/use-view-state';
export { useSidebarActions } from './hooks/use-sidebar-actions';
export { usePaneActions } from './hooks/use-pane-actions';
export { useViewActions } from './hooks/use-view-actions';
export { useEditorLayout } from './hooks/use-editor-layout';

// Layout components
export { MainLayout } from './components/main-layout';
export { AppMainContent } from './components/app-main-content';
export { AppSidebar } from './components/app-sidebar';

// Types
export type { PaneId } from './hooks/use-pane-state';
