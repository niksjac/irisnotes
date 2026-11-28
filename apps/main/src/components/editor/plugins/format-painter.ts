/**
 * Format painter for ProseMirror (Word-style "copy formatting")
 *
 * Formatting is every mark except links: colour, highlight, font size and
 * family, bold, italic, inline code, underline, strikethrough. Paragraph
 * alignment is not copied.
 *
 * - copyFormatting (Shift+Alt+C, toolbar brush): picks up the marks at the
 *   start of the selection (or at the cursor) and arms the painter. While
 *   armed, the next mouse selection — or a click on a word — gets that
 *   formatting once, then the painter disarms. Escape cancels.
 * - applyFormatting (Shift+Alt+V): applies the copied formatting to the
 *   selection, or to the word at the cursor; repeatable.
 *
 * Applying replaces the target's formatting: its old marks are removed first,
 * so painting plain text onto bold text makes it plain.
 */

import { type Command, type EditorState, Plugin, PluginKey, type Transaction } from "prosemirror-state";
import type { Mark, MarkType, Schema } from "prosemirror-model";
import type { EditorView } from "prosemirror-view";
import { getWordAt } from "./line-commands";

interface FormatPainterState {
	/** Copied marks; null until something was copied */
	marks: readonly Mark[] | null;
	/** Next mouse selection gets the formatting */
	armed: boolean;
}

type PainterMeta = { type: "copy"; marks: readonly Mark[] } | { type: "disarm" };

export const formatPainterKey = new PluginKey<FormatPainterState>("formatPainter");

/** Mark types that count as formatting (everything but links) */
function formattingTypes(schema: Schema): MarkType[] {
	return Object.values(schema.marks).filter((type) => type.name !== "link");
}

/** Formatting marks of the first selected character, or at the cursor */
function marksAtSelection(state: EditorState): readonly Mark[] {
	const { $from, empty, from, to } = state.selection;
	let marks: readonly Mark[] = empty ? (state.storedMarks ?? $from.marks()) : $from.marks();
	if (!empty) {
		// $from.marks() can miss marks that start exactly at the selection start
		const found: (readonly Mark[])[] = [];
		state.doc.nodesBetween(from, to, (node) => {
			if (found.length > 0) return false;
			if (node.isText) found.push(node.marks);
			return true;
		});
		if (found[0]) marks = found[0];
	}
	return marks.filter((mark) => mark.type.name !== "link");
}

export function getFormatPainterState(state: EditorState): FormatPainterState | undefined {
	return formatPainterKey.getState(state);
}

export const copyFormatting: Command = (state, dispatch) => {
	if (!formatPainterKey.getState(state)) return false;
	if (dispatch) {
		const meta: PainterMeta = { type: "copy", marks: marksAtSelection(state) };
		dispatch(state.tr.setMeta(formatPainterKey, meta));
	}
	return true;
};

/** Replace the formatting in [from, to) with the copied marks */
function paint(tr: Transaction, from: number, to: number, marks: readonly Mark[]): Transaction {
	for (const type of formattingTypes(tr.doc.type.schema)) tr.removeMark(from, to, type);
	for (const mark of marks) tr.addMark(from, to, mark);
	return tr;
}

export const applyFormatting: Command = (state, dispatch) => {
	const painter = formatPainterKey.getState(state);
	if (!painter?.marks) return false;

	let { from, to } = state.selection;
	if (from === to) {
		const word = getWordAt(state.doc, from);
		if (!word) {
			// No word at the cursor: type the next text with this formatting
			if (dispatch) {
				const disarm: PainterMeta = { type: "disarm" };
				dispatch(state.tr.setStoredMarks([...painter.marks]).setMeta(formatPainterKey, disarm));
			}
			return true;
		}
		({ from, to } = word);
	}

	if (dispatch) {
		const disarm: PainterMeta = { type: "disarm" };
		dispatch(paint(state.tr, from, to, painter.marks).setMeta(formatPainterKey, disarm));
	}
	return true;
};

export const cancelFormatPainter: Command = (state, dispatch) => {
	if (!formatPainterKey.getState(state)?.armed) return false;
	if (dispatch) {
		const disarm: PainterMeta = { type: "disarm" };
		dispatch(state.tr.setMeta(formatPainterKey, disarm));
	}
	return true;
};

export function formatPainterPlugin(): Plugin<FormatPainterState> {
	return new Plugin<FormatPainterState>({
		key: formatPainterKey,
		state: {
			init: () => ({ marks: null, armed: false }),
			apply(tr, value) {
				const meta = tr.getMeta(formatPainterKey) as PainterMeta | undefined;
				if (meta?.type === "copy") return { marks: meta.marks, armed: true };
				if (meta?.type === "disarm") return value.armed ? { ...value, armed: false } : value;
				return value;
			},
		},
		props: {
			attributes: (state): Record<string, string> =>
				formatPainterKey.getState(state)?.armed ? { class: "format-painter-armed" } : {},
			handleKeyDown(view, event) {
				if (event.key === "Escape") return cancelFormatPainter(view.state, view.dispatch);
				return false;
			},
			handleDOMEvents: {
				// Paint once the mouse selection is final (after the browser updates it)
				mouseup(view: EditorView) {
					if (!formatPainterKey.getState(view.state)?.armed) return false;
					setTimeout(() => {
						if (formatPainterKey.getState(view.state)?.armed) applyFormatting(view.state, view.dispatch);
					}, 0);
					return false;
				},
			},
		},
	});
}
