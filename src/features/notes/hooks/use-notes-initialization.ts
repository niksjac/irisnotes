import { useEffect } from 'react';
import { useNotesActions } from './use-notes-actions';
import { useNotesStorage } from './use-notes-storage';

export const useNotesInitialization = () => {
	const { isInitialized } = useNotesStorage();
	const { loadAllNotes } = useNotesActions();

	// Load notes when storage is initialized
	useEffect(() => {
		if (isInitialized) {
			loadAllNotes();
		}
	}, [isInitialized, loadAllNotes]);

	return {
		isInitialized,
	};
};
