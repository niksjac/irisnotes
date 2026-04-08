import type { EditorView } from "prosemirror-view";

/**
 * Module-level store for the active ProseMirror EditorView.
 * Set by ProseMirrorEditor on mount, cleared on unmount.
 * Used by use-ascii-art.ts to insert text into the focused editor.
 */
export const activeEditorViewStore = {
	view: null as EditorView | null,
	set(view: EditorView | null) {
		this.view = view;
	},
	get() {
		return this.view;
	},
};
