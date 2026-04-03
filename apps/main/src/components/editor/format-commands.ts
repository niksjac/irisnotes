/**
 * ProseMirror commands for applying formatting marks.
 *
 * These are used as keybinding targets in prosemirror-setup.ts for:
 * - Direct color application (Alt+1-6, Shift-Alt+1-6)
 * - Color/highlight removal (Alt+0, Shift-Alt+0)
 * - Clear all formatting (Ctrl+Shift+0)
 */

import type { Command, EditorState, Transaction } from "prosemirror-state";
import type { Schema, MarkType, Node as PMNode } from "prosemirror-model";
import { CellSelection } from "prosemirror-tables";
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

// ============ Text Alignment Commands ============

/**
 * Set alignment on paragraphs and tables in the selection.
 * - Paragraphs outside tables get textAlign for text alignment.
 * - Table nodes get textAlign for table position (left/center/right in editor).
 * - Paragraphs inside table cells are NOT affected (use setCellContentAlign for those).
 */
export function setTextAlign(align: "left" | "center" | "right" | null): Command {
	return (state, dispatch) => {
		const { from, to } = state.selection;
		if (dispatch) {
			const tr = state.tr;
			state.doc.nodesBetween(from, to, (node, pos) => {
				if (node.type.name === "table") {
					tr.setNodeMarkup(pos, undefined, {
						...node.attrs,
						textAlign: align,
					});
					return false; // don't descend — cell content alignment is separate
				}
				if (node.type.name === "paragraph") {
					tr.setNodeMarkup(pos, undefined, {
						...node.attrs,
						textAlign: align,
					});
				}
				return true;
			});
			dispatch(tr.scrollIntoView());
		}
		return true;
	};
}

/**
 * Set text alignment on paragraphs inside the current table cell(s).
 * Works with CellSelection (multiple cells) and regular selection (single cell).
 */
export function setCellContentAlign(align: "left" | "center" | "right" | null): Command {
	return (state, dispatch) => {
		if (dispatch) {
			const tr = state.tr;
			const { selection } = state;
			if (selection instanceof CellSelection) {
				(selection as CellSelection).forEachCell((cell, pos) => {
					cell.descendants((node, childPos) => {
						if (node.type.name === "paragraph") {
							tr.setNodeMarkup(pos + 1 + childPos, undefined, {
								...node.attrs,
								textAlign: align,
							});
						}
					});
				});
			} else {
				// Find the cell ancestor and align paragraphs within it
				const { $from } = selection;
				for (let d = $from.depth; d > 0; d--) {
					const n = $from.node(d);
					if (n.type.name === "table_cell" || n.type.name === "table_header") {
						const cellStart = $from.start(d);
						n.descendants((node, childPos) => {
							if (node.type.name === "paragraph") {
								tr.setNodeMarkup(cellStart + childPos, undefined, {
									...node.attrs,
									textAlign: align,
								});
							}
						});
						break;
					}
				}
			}
			dispatch(tr.scrollIntoView());
		}
		return true;
	};
}

// ============ Table Alignment Commands ============

/**
 * Set alignment on the nearest ancestor table node.
 * Pass null to remove alignment (back to default/left).
 */
export function setTableAlign(align: "left" | "center" | "right" | null): Command {
	return (state, dispatch) => {
		const { $from } = state.selection;
		// Walk up from cursor to find a table node
		for (let d = $from.depth; d > 0; d--) {
			const node = $from.node(d);
			if (node.type.name === "table") {
				if (dispatch) {
					const pos = $from.before(d);
					const tr = state.tr.setNodeMarkup(pos, undefined, {
						...node.attrs,
						textAlign: align,
					});
					dispatch(tr.scrollIntoView());
				}
				return true;
			}
		}
		return false;
	};
}

// ============ Fit Column Width to Content ============

/**
 * Fit table column widths to their longest cell content.
 * Needs EditorView for DOM measurement (pass as third arg or via handleKeyDown).
 *
 * Strategy: clear all colwidth attrs first, let the browser reflow in auto layout,
 * measure natural column widths, then apply them as explicit colwidths.
 */
export function fitColumnWidths(state: EditorState, dispatch?: (tr: Transaction) => void, view?: any): boolean {
	const { $from } = state.selection;

	// Find the table node and its position
	let tableNode: PMNode | null = null;
	let tablePos = -1;
	for (let d = $from.depth; d > 0; d--) {
		if ($from.node(d).type.name === "table") {
			tableNode = $from.node(d);
			tablePos = $from.before(d);
			break;
		}
	}
	if (!tableNode || !view) return false;

	// Find the DOM table element
	const domNode = view.nodeDOM(tablePos);
	if (!domNode) return false;
	const tableEl = domNode instanceof HTMLTableElement
		? domNode
		: (domNode as HTMLElement).querySelector("table");
	if (!tableEl) return false;

	const rows = tableEl.rows;
	if (rows.length === 0) return true;

	const colCount = tableNode.child(0).childCount;

	// Step 1: Remove all inline col widths and colgroup widths so the browser
	// can reflow with natural content sizing.
	const origLayout = tableEl.style.tableLayout;
	const origWidth = tableEl.style.width;

	// Remove col element widths set by columnResizing's TableView
	const colgroup = tableEl.querySelector("colgroup");
	const origColWidths: string[] = [];
	if (colgroup) {
		for (const col of Array.from(colgroup.children) as HTMLElement[]) {
			origColWidths.push(col.style.width);
			col.style.width = "";
		}
	}

	// Remove inline widths on cells (set by columnResizing)
	const origCellWidths: Map<HTMLElement, string> = new Map();
	for (let r = 0; r < rows.length; r++) {
		const row = rows[r];
		if (!row) continue;
		for (let c = 0; c < row.cells.length; c++) {
			const cell = row.cells[c];
			if (cell && cell.style.width) {
				origCellWidths.set(cell, cell.style.width);
				cell.style.width = "";
			}
		}
	}

	// Switch to auto layout for natural sizing
	tableEl.style.tableLayout = "auto";
	tableEl.style.width = "auto";

	// Force reflow
	void tableEl.offsetWidth;

	// Step 2: Measure natural column widths from the first row's cells
	const measuredWidths: number[] = new Array(colCount).fill(40);
	for (let r = 0; r < rows.length; r++) {
		const rowEl = rows[r];
		if (!rowEl) continue;
		const cells = rowEl.cells;
		for (let c = 0; c < cells.length && c < colCount; c++) {
			const w = cells[c]?.offsetWidth ?? 0;
			if (w > (measuredWidths[c] ?? 0)) {
				measuredWidths[c] = w;
			}
		}
	}

	// Step 3: Restore original DOM state
	tableEl.style.tableLayout = origLayout;
	tableEl.style.width = origWidth;
	if (colgroup) {
		const cols = Array.from(colgroup.children) as HTMLElement[];
		for (let i = 0; i < cols.length && i < origColWidths.length; i++) {
			const col = cols[i];
			if (col) col.style.width = origColWidths[i] ?? "";
		}
	}
	for (const [cell, w] of origCellWidths) {
		cell.style.width = w;
	}

	if (!dispatch) return true;

	// Step 4: Apply measured widths as colwidth on every cell
	const tr = state.tr;
	let pos = tablePos + 1; // inside <table>, at first <table_row>
	for (let r = 0; r < tableNode.childCount; r++) {
		const row = tableNode.child(r);
		let cellPos = pos + 1; // inside <table_row>, at first cell
		let colIdx = 0;
		for (let c = 0; c < row.childCount; c++) {
			const cell = row.child(c);
			const colspan = (cell.attrs.colspan as number) || 1;
			if (colIdx < colCount) {
				const newColwidth = colspan === 1
					? [measuredWidths[colIdx]]
					: Array.from({ length: colspan }, (_, i) => measuredWidths[colIdx + i] || 40);
				tr.setNodeMarkup(cellPos, undefined, {
					...cell.attrs,
					colwidth: newColwidth,
				});
			}
			colIdx += colspan;
			cellPos += cell.nodeSize;
		}
		pos += row.nodeSize;
	}

	dispatch(tr.scrollIntoView());
	return true;
}
