/**
 * ProseMirror commands for applying formatting marks.
 *
 * These are used as keybinding targets in prosemirror-setup.ts for:
 * - Direct color application (Alt+1-6, Shift-Alt+1-6)
 * - Color/highlight removal (Alt+0, Shift-Alt+0)
 * - Clear all formatting (Ctrl+Shift+0)
 */

import type { Command } from "prosemirror-state";
import type { Schema, MarkType } from "prosemirror-model";

/**
 * Apply a text color mark to the selection or set as stored mark.
 */
export function applyTextColor(schema: Schema, color: string): Command {
	return (state, dispatch) => {
		const markType = schema.marks.textColor;
		if (!markType) return false;

		if (dispatch) {
			const { from, to, empty } = state.selection;
			const mark = markType.create({ color });
			if (empty) {
				dispatch(state.tr.addStoredMark(mark));
			} else {
				dispatch(state.tr.addMark(from, to, mark));
			}
		}
		return true;
	};
}

/**
 * Remove text color mark from the selection or stored marks.
 */
export function removeTextColor(schema: Schema): Command {
	return (state, dispatch) => {
		const markType = schema.marks.textColor;
		if (!markType) return false;

		if (dispatch) {
			const { from, to, empty } = state.selection;
			if (empty) {
				dispatch(state.tr.removeStoredMark(markType));
			} else {
				dispatch(state.tr.removeMark(from, to, markType));
			}
		}
		return true;
	};
}

/**
 * Apply a highlight (background color) mark to the selection or set as stored mark.
 */
export function applyHighlight(schema: Schema, color: string): Command {
	return (state, dispatch) => {
		const markType = schema.marks.highlight;
		if (!markType) return false;

		if (dispatch) {
			const { from, to, empty } = state.selection;
			const mark = markType.create({ color });
			if (empty) {
				dispatch(state.tr.addStoredMark(mark));
			} else {
				dispatch(state.tr.addMark(from, to, mark));
			}
		}
		return true;
	};
}

/**
 * Remove highlight mark from the selection or stored marks.
 */
export function removeHighlight(schema: Schema): Command {
	return (state, dispatch) => {
		const markType = schema.marks.highlight;
		if (!markType) return false;

		if (dispatch) {
			const { from, to, empty } = state.selection;
			if (empty) {
				dispatch(state.tr.removeStoredMark(markType));
			} else {
				dispatch(state.tr.removeMark(from, to, markType));
			}
		}
		return true;
	};
}

/**
 * Clear ALL formatting marks from the selection or stored marks.
 * Removes: textColor, highlight, fontSize, fontFamily, bold, italic,
 * underline, strikethrough, code, link.
 */
export function clearAllFormatting(schema: Schema): Command {
	return (state, dispatch) => {
		const marksToRemove: MarkType[] = [
			schema.marks.textColor,
			schema.marks.highlight,
			schema.marks.fontSize,
			schema.marks.fontFamily,
			schema.marks.strong,
			schema.marks.em,
			schema.marks.underline,
			schema.marks.strikethrough,
			schema.marks.code,
			schema.marks.link,
		].filter((m): m is MarkType => Boolean(m));

		if (marksToRemove.length === 0) return false;

		if (dispatch) {
			const { from, to, empty } = state.selection;
			let tr = state.tr;
			if (empty) {
				for (const markType of marksToRemove) {
					tr = tr.removeStoredMark(markType);
				}
			} else {
				for (const markType of marksToRemove) {
					tr = tr.removeMark(from, to, markType);
				}
			}
			dispatch(tr);
		}
		return true;
	};
}
