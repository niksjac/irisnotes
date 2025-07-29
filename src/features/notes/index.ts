// Hooks
export {
	useNotes,
	useNotesData,
	useNotesActions,
	useNotesNavigation,
	useNotesSelection,
	useNotesInitialization,
	useCategoryManagement,
	useAppHandlers,
	useNotesStorage,
	useSingleStorageNotes,
	useMultiStorageNotes,
} from './hooks';

// Export single storage as the default storage hook
export { useSingleStorageNotes as useDefaultNotesStorage } from './hooks/use-single-storage-notes';

export * from './storage';
