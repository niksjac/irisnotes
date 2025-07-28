// God hook - for backward compatibility

export { useFocusManagement } from './use-focus-management';

// Focused hooks - new implementation
export { useSidebarState } from './use-sidebar-state';
export { usePaneState } from './use-pane-state';
export { useViewState } from './use-view-state';
export { useSidebarActions } from './use-sidebar-actions';
export { usePaneActions } from './use-pane-actions';
export { useViewActions } from './use-view-actions';
export { useEditorLayout } from './use-editor-layout';
export { useContentState } from './use-content-state';

// Types
export type { PaneId } from './use-pane-state';
export type { FocusableElement } from './use-focus-management';
