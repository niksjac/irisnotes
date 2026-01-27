/**
 * Editor Stats Atoms
 *
 * Tracks cursor position and word count from the active editor.
 * Updated by ProseMirror/CodeMirror editors on selection/content changes.
 */

import { atom } from "jotai";

export interface EditorStats {
	line: number;
	column: number;
	wordCount: number;
	charCount: number;
}

const defaultStats: EditorStats = {
	line: 1,
	column: 1,
	wordCount: 0,
	charCount: 0,
};

// Atom to hold editor stats
export const editorStatsAtom = atom<EditorStats>(defaultStats);

// Atom to update stats
export const updateEditorStatsAtom = atom(
	null,
	(_get, set, stats: Partial<EditorStats>) => {
		set(editorStatsAtom, (prev) => ({ ...prev, ...stats }));
	}
);

// Reset stats when no editor is active
export const resetEditorStatsAtom = atom(null, (_get, set) => {
	set(editorStatsAtom, defaultStats);
});
