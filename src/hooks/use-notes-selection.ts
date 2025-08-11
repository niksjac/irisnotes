import { useAtom } from "jotai";
import { useCallback } from "react";
import { selectedNoteIdAtom } from "@/atoms";

export const useNotesSelection = () => {
	const [selectedNoteId, setSelectedNoteId] = useAtom(selectedNoteIdAtom);

	const clearSelection = useCallback(() => {
		setSelectedNoteId(null);
	}, [setSelectedNoteId]);

	// Keep openNoteInPane for backward compatibility but make it a no-op
	const openNoteInPane = useCallback(() => {
		// No-op for backward compatibility
	}, []);

	return {
		selectedNoteId,
		setSelectedNoteId,
		openNoteInPane,
		clearSelection,
	};
};
