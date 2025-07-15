// God hooks - for backward compatibility
export { useNotes } from './use-notes';
export { useSingleStorageNotes } from './use-single-storage-notes';
export { useMultiStorageNotes } from './use-multi-storage-notes';

// Focused hooks - new implementation
export { useNotesData } from './use-notes-data';
export { useNotesSelection } from './use-notes-selection';
export { useNotesActions } from './use-notes-actions';
export { useNotesStorage } from './use-notes-storage';
export { useNotesNavigation } from './use-notes-navigation';
export { useNotesInitialization } from './use-notes-initialization';

// Category management hooks
export { useCategoryManagement } from './use-category-management';
export { useAppHandlers } from './use-app-handlers';

// Types
export type { PaneId } from './use-notes-selection';