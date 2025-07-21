import { useEffect } from 'react';
import { useNotesStorage } from './use-notes-storage';
import { useNotesActions } from './use-notes-actions';

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
