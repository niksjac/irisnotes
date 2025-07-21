export { useNotes } from './hooks/use-notes';
export { useSingleStorageNotes } from './hooks/use-single-storage-notes';
export { useMultiStorageNotes } from './hooks/use-multi-storage-notes';

// Export single storage as the default storage hook
export { useSingleStorageNotes as useStorageNotes } from './hooks/use-single-storage-notes';

export * from './storage';
