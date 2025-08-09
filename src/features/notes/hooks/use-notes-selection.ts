import { useAtom, useSetAtom } from 'jotai';
import { useCallback } from 'react';
import { selectedNoteIdAtom, leftPaneNoteAtom, rightPaneNoteAtom, notesAtom } from '../../../atoms';
import type { Note, PaneId } from '../../../types';

export const useNotesSelection = () => {
	const [selectedNoteId, setSelectedNoteId] = useAtom(selectedNoteIdAtom);
	const [notes] = useAtom(notesAtom);
	const setLeftPaneNote = useSetAtom(leftPaneNoteAtom);
	const setRightPaneNote = useSetAtom(rightPaneNoteAtom);

	const setSelectedNoteIdForPane = useCallback(
		(paneId: PaneId, noteId: string | null) => {
			const note = noteId ? notes.find(n => n.id === noteId) || null : null;
			if (paneId === 'left') {
				setLeftPaneNote(note);
			} else {
				setRightPaneNote(note);
			}
		},
		[notes, setLeftPaneNote, setRightPaneNote]
	);

	const openNoteInPane = useCallback(
		(noteId: string, paneId: PaneId) => {
			const note = notes.find(n => n.id === noteId) || null;
			if (paneId === 'left') {
				setLeftPaneNote(note);
			} else {
				setRightPaneNote(note);
			}
		},
		[notes, setLeftPaneNote, setRightPaneNote]
	);

	const clearSelection = useCallback(() => {
		setSelectedNoteId(null);
		setLeftPaneNote(null);
		setRightPaneNote(null);
	}, [setSelectedNoteId, setLeftPaneNote, setRightPaneNote]);

	const clearSelectionForPane = useCallback(
		(paneId: PaneId) => {
			if (paneId === 'left') {
				setLeftPaneNote(null);
			} else {
				setRightPaneNote(null);
			}
		},
		[setLeftPaneNote, setRightPaneNote]
	);

	return {
		selectedNoteId,
		setSelectedNoteId,
		setSelectedNoteIdForPane,
		openNoteInPane,
		clearSelection,
		clearSelectionForPane,
	};
};
