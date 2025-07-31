// Hooks
export {
	useAppHandlers,
	useCategoryManagement,
	useMultiStorageNotes,
	useNotes,
	useNotesActions,
	useNotesData,
	useNotesInitialization,
	useNotesNavigation,
	useNotesSelection,
	useNotesStorage,
	useSingleStorageNotes,
} from './hooks';

// Export single storage as the default storage hook
export { useSingleStorageNotes as useDefaultNotesStorage } from './hooks/use-single-storage-notes';

export * from './storage';
