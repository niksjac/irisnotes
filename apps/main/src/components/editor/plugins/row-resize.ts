/**
 * Row resize plugin for prosemirror-tables.
 *
 * Allows dragging the bottom edge of table rows to resize their height.
 * Stores the height in the table_row node's `minHeight` attribute.
 *
 * Cell attributes (borderColor, borderWidth, cellPadding, background) are
 * rendered via cellAttributes.setDOMAttr in schema.ts — no manual DOM sync needed.
 */

import { Plugin, PluginKey } from "prosemirror-state";

const rowResizeKey = new PluginKey("rowResize");

const HANDLE_WIDTH = 5; // pixels from bottom edge to trigger resize

function domCellAround(target: EventTarget | null): HTMLElement | null {
	let node = target as HTMLElement | null;
	while (node && node.nodeName !== "TD" && node.nodeName !== "TH") {
		node = node.classList?.contains("ProseMirror") ? null : (node.parentNode as HTMLElement | null);
	}
	return node;
}

function domRowAround(target: EventTarget | null): HTMLTableRowElement | null {
	let node = target as HTMLElement | null;
	while (node && node.nodeName !== "TR") {
		node = node.classList?.contains("ProseMirror") ? null : (node.parentNode as HTMLElement | null);
	}
	return node as HTMLTableRowElement | null;
}



export function rowResizing(): Plugin {
	let dragging: { row: HTMLTableRowElement; startY: number; startHeight: number } | null = null;

	return new Plugin({
		key: rowResizeKey,
		props: {
			handleDOMEvents: {
				mousemove(view, event) {
					if (dragging) {
						const diff = event.clientY - dragging.startY;
						const newHeight = Math.max(24, dragging.startHeight + diff);
						dragging.row.style.height = `${newHeight}px`;
						// Apply to all cells too for consistency
						for (const cell of Array.from(dragging.row.cells)) {
							cell.style.height = `${newHeight}px`;
						}
						return true;
					}
					// Show resize cursor near bottom edge
					const cell = domCellAround(event.target);
					if (cell) {
						const rect = cell.getBoundingClientRect();
						if (rect.bottom - event.clientY <= HANDLE_WIDTH) {
							(view.dom as HTMLElement).style.cursor = "row-resize";
							return false;
						}
					}
					if ((view.dom as HTMLElement).style.cursor === "row-resize") {
						(view.dom as HTMLElement).style.cursor = "";
					}
					return false;
				},
				mousedown(view, event) {
					const cell = domCellAround(event.target);
					if (!cell) return false;
					const rect = cell.getBoundingClientRect();
					if (rect.bottom - event.clientY > HANDLE_WIDTH) return false;

					const row = domRowAround(event.target);
					if (!row) return false;

					event.preventDefault();
					dragging = {
						row,
						startY: event.clientY,
						startHeight: row.getBoundingClientRect().height,
					};
					(view.dom as HTMLElement).style.cursor = "row-resize";

					function onMouseMove(e: MouseEvent) {
						if (!dragging) return;
						const diff = e.clientY - dragging.startY;
						const newHeight = Math.max(24, dragging.startHeight + diff);
						dragging.row.style.height = `${newHeight}px`;
						for (const cell of Array.from(dragging.row.cells)) {
							cell.style.height = `${newHeight}px`;
						}
					}

					function onMouseUp(e: MouseEvent) {
						document.removeEventListener("mousemove", onMouseMove);
						document.removeEventListener("mouseup", onMouseUp);
						if (!dragging) return;

						const diff = e.clientY - dragging.startY;
						const finalHeight = Math.max(24, dragging.startHeight + diff);

						// Find the ProseMirror position of the row and set minHeight attr
						// Walk up from any cell in the row to find the table_row pos
						const firstCell = dragging.row.cells[0];
						dragging = null;
						(view.dom as HTMLElement).style.cursor = "";

						if (!firstCell) return;
						const cellPos = view.posAtDOM(firstCell, 0);
						const $cell = view.state.doc.resolve(cellPos);

						// Find the table_row ancestor
						for (let d = $cell.depth; d > 0; d--) {
							if ($cell.node(d).type.name === "table_row") {
								const rowPos = $cell.before(d);
								const rowNode = $cell.node(d);
								const tr = view.state.tr.setNodeMarkup(rowPos, undefined, {
									...rowNode.attrs,
									minHeight: Math.round(finalHeight),
								});
								view.dispatch(tr);
								return;
							}
						}
					}

					document.addEventListener("mousemove", onMouseMove);
					document.addEventListener("mouseup", onMouseUp);
					return true;
				},
				mouseleave(view) {
					if (!dragging && (view.dom as HTMLElement).style.cursor === "row-resize") {
						(view.dom as HTMLElement).style.cursor = "";
					}
					return false;
				},
			},
		},
	});
}
