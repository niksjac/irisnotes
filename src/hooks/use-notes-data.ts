import { useAtom } from "jotai";
import { useCallback, useState } from "react";
import { notesAtom } from "@/atoms";
import type { Note } from "@/types/database";

export const useNotesData = () => {
	const [notes, setNotes] = useAtom(notesAtom);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const updateNotes = useCallback(
		(newNotes: Note[]) => {
			setNotes(newNotes);
		},
		[setNotes]
	);

	const addNote = useCallback(
		(note: Note) => {
			setNotes((prev) => [note, ...prev]);
		},
		[setNotes]
	);

	const updateNote = useCallback(
		(updatedNote: Note) => {
			setNotes((prev) => prev.map((note) => (note.id === updatedNote.id ? updatedNote : note)));
		},
		[setNotes]
	);

	const removeNote = useCallback(
		(noteId: string) => {
			setNotes((prev) => prev.filter((note) => note.id !== noteId));
		},
		[setNotes]
	);

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	return {
		notes,
		isLoading,
		error,
		setIsLoading,
		setError,
		updateNotes,
		addNote,
		updateNote,
		removeNote,
		clearError,
	};
};
