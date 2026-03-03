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
import { getContrastTextColor, FONT_SIZE_SCALES } from "./format-constants";

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
 * Also auto-applies a contrasting text color for readability.
 */
export function applyHighlight(schema: Schema, color: string): Command {
	return (state, dispatch) => {
		const markType = schema.marks.highlight;
		if (!markType) return false;

		if (dispatch) {
			const { from, to, empty } = state.selection;
			const mark = markType.create({ color });
			let tr = state.tr;
			if (empty) {
				tr = tr.addStoredMark(mark);
			} else {
				tr = tr.addMark(from, to, mark);
			}
			// Auto-apply contrasting text color
			const textColorMark = schema.marks.textColor;
			if (textColorMark) {
				const contrastColor = getContrastTextColor(color);
				const textMark = textColorMark.create({ color: contrastColor });
				if (empty) {
					tr = tr.addStoredMark(textMark);
				} else {
					tr = tr.addMark(from, to, textMark);
				}
			}
			dispatch(tr);
		}
		return true;
	};
}

/**
 * Remove highlight mark from the selection or stored marks.
 * Also removes the auto-applied text color.
 */
export function removeHighlight(schema: Schema): Command {
	return (state, dispatch) => {
		const markType = schema.marks.highlight;
		if (!markType) return false;

		if (dispatch) {
			const { from, to, empty } = state.selection;
			let tr = state.tr;
			if (empty) {
				tr = tr.removeStoredMark(markType);
			} else {
				tr = tr.removeMark(from, to, markType);
			}
			// Also remove auto-applied text color
			const textColorMark = schema.marks.textColor;
			if (textColorMark) {
				if (empty) {
					tr = tr.removeStoredMark(textColorMark);
				} else {
					tr = tr.removeMark(from, to, textColorMark);
				}
			}
			dispatch(tr);
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

// ============ Inline Font Size Step Commands ============

/**
 * Get the current fontSize scale (em) at the cursor/selection.
 * Returns 1.0 (base) when no fontSize mark is present.
 */
function getCurrentFontScale(schema: Schema, state: import("prosemirror-state").EditorState): number {
	const markType = schema.marks.fontSize;
	if (!markType) return 1.0;

	const { from, $from, to, empty } = state.selection;
	let fontSizeMark: any = null;

	if (empty) {
		const marks = state.storedMarks || $from.marks();
		fontSizeMark = marks.find((m: any) => m.type === markType);
	} else {
		state.doc.nodesBetween(from, to, (node) => {
			if (fontSizeMark) return false;
			if (node.isText) {
				const m = node.marks.find((m: any) => m.type === markType);
				if (m) fontSizeMark = m;
				return false;
			}
			return true;
		});
	}

	const size = fontSizeMark?.attrs?.size;
	if (!size) return 1.0;
	if (typeof size === "string" && size.endsWith("em")) return parseFloat(size);
	return 1.0;
}

/**
 * Increase the inline fontSize mark by one step through FONT_SIZE_SCALES.
 */
export function increaseFontSizeMark(schema: Schema): Command {
	return (state, dispatch) => {
		const markType = schema.marks.fontSize;
		if (!markType) return false;

		const current = getCurrentFontScale(schema, state);
		let nextScale: number | null = null;
		for (const scale of FONT_SIZE_SCALES) {
			if (scale > current + 0.001) {
				nextScale = scale;
				break;
			}
		}
		if (nextScale === null) return false;

		if (dispatch) {
			const { from, to, empty } = state.selection;
			const mark = markType.create({ size: `${nextScale}em` });
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
 * Decrease the inline fontSize mark by one step through FONT_SIZE_SCALES.
 */
export function decreaseFontSizeMark(schema: Schema): Command {
	return (state, dispatch) => {
		const markType = schema.marks.fontSize;
		if (!markType) return false;

		const current = getCurrentFontScale(schema, state);
		let prevScale: number | null = null;
		for (let i = FONT_SIZE_SCALES.length - 1; i >= 0; i--) {
			const scale = FONT_SIZE_SCALES[i];
			if (scale !== undefined && scale < current - 0.001) {
				prevScale = scale;
				break;
			}
		}
		if (prevScale === null) return false;

		if (dispatch) {
			const { from, to, empty } = state.selection;
			const mark = markType.create({ size: `${prevScale}em` });
			if (empty) {
				dispatch(state.tr.addStoredMark(mark));
			} else {
				dispatch(state.tr.addMark(from, to, mark));
			}
		}
		return true;
	};
}
