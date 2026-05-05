import type { Schema, NodeType, Node as PMNode } from "prosemirror-model";
import { Fragment, Slice } from "prosemirror-model";
import { Plugin, PluginKey, TextSelection, NodeSelection } from "prosemirror-state";
import type { Command, EditorState, Transaction } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { keymap } from "prosemirror-keymap";
import { history, undo, redo } from "prosemirror-history";
import {
	baseKeymap,
	toggleMark,
	setBlockType,
	wrapIn,
	chainCommands,
	createParagraphNear,
	liftEmptyBlock,
	lift,
} from "prosemirror-commands";
import { wrapInList, liftListItem, sinkListItem, splitListItem } from "prosemirror-schema-list";
import { dropCursor } from "prosemirror-dropcursor";
import { gapCursor } from "prosemirror-gapcursor";
import { tableEditing, columnResizing, goToNextCell, deleteRow, deleteColumn, deleteTable, isInTable, CellSelection, addRowAfter, addRowBefore, addColumnAfter, addColumnBefore } from "prosemirror-tables";
import { autolinkPlugin, linkifySelection } from "./plugins/autolink";
import { tightSelectionPlugin } from "./plugins/tight-selection";
import { customCursorPlugin } from "./plugins/custom-cursor";
import { activeLinePlugin } from "./plugins/active-line";
import { buildLineCommandsKeymap, resetSmartSelectLevel } from "./plugins/line-commands";
import { searchPlugin } from "./plugins/search";
import { autocorrectPlugin } from "./plugins/autocorrect";
import { deleteChunkBackward, deleteChunkForward, jumpParagraphDown, jumpParagraphUp } from "./plugins/chunk-commands";
import { clearAllFormatting, increaseFontSizeMark, decreaseFontSizeMark, setTextAlign, setTableAlign, fitColumnWidths } from "./format-commands";
import { DEFAULT_EDITOR_KEYBINDINGS, type EditorKeybindings } from "@/config/default-editor-keybindings";

/**
 * Toggle list command - wraps in list if not in one, or lifts out if already in one
 */
function toggleList(listType: NodeType, itemType: NodeType): Command {
	return (state, dispatch) => {
		const { $from, $to } = state.selection;
		const range = $from.blockRange($to);
		
		if (!range) return false;
		
		// Check if we're already in this type of list
		for (let d = range.depth; d >= 0; d--) {
			const node = $from.node(d);
			if (node.type === listType) {
				// We're in this list type - lift out of it
				return liftListItem(itemType)(state, dispatch);
			}
		}
		
		// Not in this list type - wrap in it
		return wrapInList(listType)(state, dispatch);
	};
}

/**
 * Toggle blockquote - wraps in blockquote if not in one, or lifts out if already in one
 */
function toggleBlockquote(quoteType: NodeType): Command {
	return (state, dispatch) => {
		const { $from, $to } = state.selection;
		const range = $from.blockRange($to);
		
		if (!range) return false;
		
		// Check if we're already in a blockquote
		for (let d = range.depth; d >= 0; d--) {
			const node = $from.node(d);
			if (node.type === quoteType) {
				// We're in a blockquote - lift out of it
				return lift(state, dispatch);
			}
		}
		
		// Not in blockquote - wrap in it
		return wrapIn(quoteType)(state, dispatch);
	};
}

/**
 * Alt+X: Bidirectional Unicode hex ↔ character conversion.
 * - If the text before cursor ends with \XXXX (4-6 hex digits), convert to the character.
 * - Otherwise, take the single character before cursor and replace it with \XXXX hex code.
 */
const reverseUnicodeLookup: Command = (state, dispatch) => {
	const { $from } = state.selection;

	if (!state.selection.empty) return false;

	const offset = $from.parentOffset;
	if (offset === 0) return false;

	const textBefore = $from.parent.textContent.slice(0, offset);
	if (!textBefore) return false;

	const curPos = $from.pos;

	// First check: does text end with \XXXX hex code? → convert to character
	const hexMatch = textBefore.match(/\\([0-9a-fA-F]{4,6})$/);
	if (hexMatch?.[1]) {
		const codePoint = Number.parseInt(hexMatch[1], 16);
		if (codePoint > 0 && codePoint <= 0x10FFFF) {
			if (dispatch) {
				const triggerLen = hexMatch[0].length;
				const from = curPos - triggerLen;
				const char = String.fromCodePoint(codePoint);
				const tr = state.tr.replaceWith(from, curPos, state.schema.text(char));
				tr.setMeta("reverseUnicodeLookup", true);
				dispatch(tr);
			}
			return true;
		}
	}

	// Second check: take character before cursor → replace with \XXXX
	const chars = Array.from(textBefore);
	const lastChar = chars[chars.length - 1];
	if (!lastChar) return false;

	const codePoint = lastChar.codePointAt(0)!;
	const charLen = lastChar.length; // 1 for BMP, 2 for surrogate pairs
	const hex = codePoint.toString(16).toUpperCase().padStart(4, "0");

	if (dispatch) {
		const from = curPos - charLen;
		const tr = state.tr.replaceWith(from, curPos, state.schema.text(`\\${hex}`));
		tr.setMeta("reverseUnicodeLookup", true);
		dispatch(tr);
	}
	return true;
};

/**
 * Split block while preserving marks from the current position.
 * This makes formatting persist to new lines when pressing Enter.
 */
const splitBlockPreserveMarks: Command = (state, dispatch) => {
	const { $from } = state.selection;
	
	// Get the marks at the current cursor position
	// Priority: stored marks > marks from text node before/at cursor
	let marks = state.storedMarks;
	
	if (!marks || marks.length === 0) {
		// Method 1: Check nodeBefore (the node immediately before cursor)
		const nodeBefore = $from.nodeBefore;
		if (nodeBefore?.isText && nodeBefore.marks.length > 0) {
			marks = nodeBefore.marks;
		}
	}
	
	if (!marks || marks.length === 0) {
		// Method 2: Walk through parent content to find marks at cursor position
		const parent = $from.parent;
		const offsetInParent = $from.parentOffset;
		
		if (offsetInParent > 0) {
			let currentOffset = 0;
			parent.forEach((node) => {
				// Check if cursor is within or at the end of this node
				if (currentOffset < offsetInParent && currentOffset + node.nodeSize >= offsetInParent) {
					if (node.isText && node.marks.length > 0) {
						marks = node.marks;
					}
				}
				currentOffset += node.nodeSize;
			});
		}
	}
	
	if (!marks || marks.length === 0) {
		// Method 3: Use $from.marks() as final fallback
		const fromMarks = $from.marks();
		if (fromMarks.length > 0) {
			marks = fromMarks;
		}
	}
	
	// Create our own transaction that does both split and mark preservation
	if (dispatch) {
		const tr = state.tr;
		
		// Delete selection if not empty
		if (!state.selection.empty) {
			tr.deleteSelection();
		}
		
		// Get the position to split at (after potential deletion)
		const pos = tr.selection.$from.pos;
		
		// Split the block
		tr.split(pos);
		
		// Set stored marks for the new position AFTER split
		if (marks && marks.length > 0) {
			tr.setStoredMarks(marks);
		}
		
		dispatch(tr.scrollIntoView());
		return true;
	}
	
	return true;
};

interface SetupOptions {
	schema: Schema;
	history?: boolean;
	// App shortcuts that should be handled by the app, not the editor
	appShortcuts?: string[];
	// User-overridable editor keybindings (merged defaults + TOML overrides)
	editorKeybindings?: EditorKeybindings;
}

/**
 * Custom ProseMirror setup that avoids conflicts with app-level shortcuts
 */
export function customSetup(options: SetupOptions): Plugin[] {
	const plugins: Plugin[] = [];
	const kb = options.editorKeybindings || DEFAULT_EDITOR_KEYBINDINGS;

	// App-aware keymap (must come first to intercept app shortcuts)
	const appShortcuts = options.appShortcuts || [
		"Mod-g", // Toggle sidebar (changed from Mod-b to free up bold)
		"Mod-j", // Toggle activity bar
		"Mod-w", // Close tab
		"Mod-e", // Toggle editor view
	];

	const appShortcutBindings: { [key: string]: () => boolean } = {};
	appShortcuts.forEach((key) => {
		appShortcutBindings[key] = () => false; // Return false to let event bubble
	});
	plugins.push(keymap(appShortcutBindings));

	// No built-in input rules — all text replacements are handled by
	// the autocorrect plugin via autocorrect.toml

	// Line commands FIRST - must come before base keymap to override Mod-a
	// (Alt+Up/Down to move lines, Alt+Shift+Up/Down to copy, Ctrl+A smart select, etc.)
	plugins.push(keymap(buildLineCommandsKeymap(kb)));

	// Line-based model: Both Enter and Shift+Enter create new blocks with preserved formatting
	// This enforces the concept that each "paragraph" is really a "line"
	// MUST come before baseKeymap to override default Enter behavior
	// splitListItem comes first to handle Enter in lists (creates next numbered/bulleted item)
	const { nodes } = options.schema;
	const listItemType = nodes.list_item;
	const enterKeymap: Record<string, Command> = {
		"Enter": chainCommands(
			...(listItemType ? [splitListItem(listItemType)] : []),
			liftEmptyBlock,
			createParagraphNear,
			splitBlockPreserveMarks
		),
		"Shift-Enter": chainCommands(
			...(listItemType ? [splitListItem(listItemType)] : []),
			liftEmptyBlock,
			createParagraphNear,
			splitBlockPreserveMarks
		),
		// Ctrl+Enter: Split block WITHOUT splitting list item (new paragraph within same list item)
		"Mod-Enter": chainCommands(
			liftEmptyBlock,
			createParagraphNear,
			splitBlockPreserveMarks
		),
	};
	plugins.push(keymap(enterKeymap));

	plugins.push(keymap({
		"Ctrl-Backspace": deleteChunkBackward,
		"Ctrl-Delete": deleteChunkForward,
		"Ctrl-ArrowUp": jumpParagraphUp,
		"Ctrl-ArrowDown": jumpParagraphDown,
	}));

	// Base keymap (arrows, enter, backspace, etc.)
	// Remove Escape → selectParentNode so our custom Escape handler (blur/toolbar) takes priority
	const { Escape: _removed, ...baseKeymapWithoutEscape } = baseKeymap;
	plugins.push(keymap(baseKeymapWithoutEscape));

	// History (undo/redo)
	if (options.history !== false) {
		plugins.push(history());
	}

	// Drop cursor (shows where dragged content will drop)
	plugins.push(dropCursor());

	// Gap cursor (allows cursor in hard-to-reach places like between blocks)
	plugins.push(gapCursor());

	// Allow Shift+Arrow selection to extend across table nodes.
	// Without this, ProseMirror can't extend a TextSelection past a table
	// because TextSelection endpoints must point into inline content.
	plugins.push(new Plugin({
		key: new PluginKey("selectAcrossTable"),
		props: {
			handleKeyDown(view, event) {
				if (!event.shiftKey) return false;
				if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return false;

				const { state } = view;
				const sel = state.selection;
				if (!(sel instanceof TextSelection)) return false;

				const doc = state.doc;
				const $head = sel.$head;
				const anchor = sel.anchor;
				const dir = event.key === "ArrowDown" ? 1 : -1;

				// Only act when head is at the edge of its top-level block
				if (dir === 1 && !view.endOfTextblock("down")) return false;
				if (dir === -1 && !view.endOfTextblock("up")) return false;

				// Find the top-level block the head is in and look at the neighbor
				const headTopIndex = $head.index(0);
				const neighborIndex = headTopIndex + dir;

				if (neighborIndex < 0 || neighborIndex >= doc.childCount) return false;

				const neighbor = doc.child(neighborIndex);
				if (neighbor.type.name !== "table") return false;

				// Compute position after/before the table
				let pos = 0;
				for (let i = 0; i < neighborIndex; i++) {
					pos += doc.child(i).nodeSize;
				}

				let targetPos: number;
				if (dir === 1) {
					// Skip past the table → start of the block after it
					const afterTable = pos + neighbor.nodeSize;
					if (afterTable >= doc.content.size) {
						// Table is the last node, select to end of doc
						targetPos = doc.content.size;
					} else {
						const nodeAfterTable = doc.nodeAt(afterTable);
						targetPos = nodeAfterTable && nodeAfterTable.isTextblock
							? afterTable + 1 // inside the textblock
							: afterTable;
					}
				} else {
					// Skip before the table → end of the block before it
					if (pos === 0) {
						targetPos = 0;
					} else {
						const prevIndex = neighborIndex - 1;
						if (prevIndex >= 0) {
							let prevEnd = 0;
							for (let i = 0; i <= prevIndex; i++) {
								prevEnd += doc.child(i).nodeSize;
							}
							const prevNode = doc.child(prevIndex);
							targetPos = prevNode.isTextblock
								? prevEnd - 1 // end of textblock content
								: prevEnd;
						} else {
							targetPos = 0;
						}
					}
				}

				try {
					const newSel = TextSelection.create(doc, anchor, targetPos);
					view.dispatch(state.tr.setSelection(newSel).scrollIntoView());
					event.preventDefault();
					return true;
				} catch {
					return false;
				}
			},
		},
	}));

	// Table editing support (cell selection, column resize)
	plugins.push(columnResizing());

	// Table structure keys — MUST be before tableEditing() so it intercepts
	// Delete/Backspace before tableEditing's deleteCellSelection handler,
	// which only clears cell content instead of removing rows/columns/table.
	//
	// Deletion system:
	//   Delete/Backspace          → NodeSelection on table: delete table
	//                             → CellSelection (all rows+cols): delete table
	//                             → CellSelection (rows): delete rows
	//                             → CellSelection (cols): delete columns
	//                             → otherwise: fall through to tableEditing (clear content)
	//   Shift+Delete              → delete current row (handled by deleteLine in line-commands)
	//   Ctrl+Shift+Delete         → delete current column (positional, always works in table)
	//
	// Insertion system:
	//   Ctrl+Enter                → add row after current row
	//   Ctrl+Shift+Enter          → add row before current row
	//   Ctrl+Alt+Enter            → add column after current column
	//   Ctrl+Alt+Shift+Enter      → add column before current column
	plugins.push(new Plugin({
		key: new PluginKey("tableDeleteKeys"),
		props: {
			handleKeyDown(view, event) {
				// ── Row/column insertion ──
				if (event.key === "Enter" && (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey) {
					// Ctrl+Enter → add row after
					if (isInTable(view.state)) {
						if (addRowAfter(view.state, view.dispatch)) {
							event.preventDefault();
							return true;
						}
					}
					return false;
				}
				if (event.key === "Enter" && (event.ctrlKey || event.metaKey) && !event.altKey && event.shiftKey) {
					// Ctrl+Shift+Enter → add row before
					if (isInTable(view.state)) {
						if (addRowBefore(view.state, view.dispatch)) {
							event.preventDefault();
							return true;
						}
					}
					return false;
				}
				if (event.key === "Enter" && (event.ctrlKey || event.metaKey) && event.altKey && !event.shiftKey) {
					// Ctrl+Alt+Enter → add column after
					if (isInTable(view.state)) {
						if (addColumnAfter(view.state, view.dispatch)) {
							event.preventDefault();
							return true;
						}
					}
					return false;
				}
				if (event.key === "Enter" && (event.ctrlKey || event.metaKey) && event.altKey && event.shiftKey) {
					// Ctrl+Alt+Shift+Enter → add column before
					if (isInTable(view.state)) {
						if (addColumnBefore(view.state, view.dispatch)) {
							event.preventDefault();
							return true;
						}
					}
					return false;
				}

				// ── Ctrl+Shift+W → fit column widths to content ──
				if (event.key === "W" && event.shiftKey && (event.ctrlKey || event.metaKey) && !event.altKey) {
					if (isInTable(view.state)) {
						if (fitColumnWidths(view.state, view.dispatch, view)) {
							event.preventDefault();
							return true;
						}
					}
					return false;
				}

				// ── Ctrl+Shift+Delete → delete column ──
				if (event.key === "Delete" && event.shiftKey && (event.ctrlKey || event.metaKey) && !event.altKey) {
					if (isInTable(view.state)) {
						if (deleteColumn(view.state, view.dispatch)) {
							event.preventDefault();
							return true;
						}
					}
					return false;
				}

				// Plain Delete/Backspace → structural delete for NodeSelection/CellSelection
				if ((event.key === "Backspace" || event.key === "Delete") && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
					// NodeSelection on a table node → delete entire table
					if (view.state.selection instanceof NodeSelection && view.state.selection.node.type.name === "table") {
						view.dispatch(view.state.tr.deleteSelection().scrollIntoView());
						event.preventDefault();
						return true;
					}
					// CellSelection → structural delete for full row/col selections
					if (view.state.selection instanceof CellSelection) {
						const sel = view.state.selection as CellSelection;
						const isRow = sel.isRowSelection();
						const isCol = sel.isColSelection();
						if (isRow && isCol) {
							if (deleteTable(view.state, view.dispatch)) {
								event.preventDefault();
								return true;
							}
						}
						if (isRow) {
							if (deleteRow(view.state, view.dispatch)) {
								event.preventDefault();
								return true;
							}
						}
						if (isCol) {
							if (deleteColumn(view.state, view.dispatch)) {
								event.preventDefault();
								return true;
							}
						}
					}
				}
				return false;
			},
		},
	}));

	plugins.push(tableEditing({ allowTableNodeSelection: true }));

	// Table selection indicator — adds outline class when whole table is selected
	plugins.push(new Plugin({
		key: new PluginKey("tableSelectionIndicator"),
		props: {
			decorations(state) {
				const decos: Decoration[] = [];

				// ── Alignment decorations for tables ──
				// columnResizing's TableView nodeView renders the <table>/<tr>, so
				// schema toDOM attrs aren't reflected live. We mirror table alignment via Decoration.node().
				state.doc.descendants((node, pos) => {
					if (node.type.name === "table" && node.attrs.textAlign) {
						decos.push(
							Decoration.node(pos, pos + node.nodeSize, {
								"data-align": node.attrs.textAlign,
							}),
						);
					}
					// Don't descend past tables — row/cell attrs are handled elsewhere
					return node.type.name !== "table";
				});

				// ── Selection indicator decorations ──
				const { selection } = state;

				// NodeSelection on a table node (from Ctrl+A L3)
				if (selection instanceof NodeSelection && selection.node.type.name === "table") {
					decos.push(Decoration.node(selection.from, selection.to, {
						class: "pm-table-all-selected",
					}));
				}

				// CellSelection covering all rows+columns (from mouse selection)
				if (selection instanceof CellSelection) {
					const sel = selection as CellSelection;
					if (sel.isRowSelection() && sel.isColSelection()) {
						const $anchor = sel.$anchorCell;
						for (let d = $anchor.depth; d > 0; d--) {
							if ($anchor.node(d).type.name === "table") {
								const pos = $anchor.before(d);
								decos.push(Decoration.node(pos, pos + $anchor.node(d).nodeSize, {
									class: "pm-table-all-selected",
								}));
								break;
							}
						}
					}
				}

				return decos.length ? DecorationSet.create(state.doc, decos) : DecorationSet.empty;
			},
		},
	}));

	// Active line highlight (subtle background on the line containing cursor)
	plugins.push(activeLinePlugin());

	// Tight selection (VS Code / Notion style - only highlights actual text)
	plugins.push(tightSelectionPlugin());

	// Custom cursor (VS Code style - configurable width, color, animation)
	plugins.push(customCursorPlugin());

	// Auto-link URLs as you type + Ctrl+Click to open links
	plugins.push(...autolinkPlugin(options.schema));

	// Search plugin for Ctrl+F find in note
	plugins.push(searchPlugin());

	// Autocorrect (text replacement as you type, e.g. \infty → ∞)
	plugins.push(autocorrectPlugin());

	// Custom keybindings - all user-overridable via [editor] TOML section
	const customKeybindings: { [key: string]: any } = {};

	// Text formatting marks
	if (options.schema.marks.strong) {
		customKeybindings[kb.bold.key] = toggleMark(options.schema.marks.strong);
	}
	if (options.schema.marks.em) {
		customKeybindings[kb.italic.key] = toggleMark(options.schema.marks.em);
	}
	if (options.schema.marks.code) {
		customKeybindings[kb.code.key] = toggleMark(options.schema.marks.code);
	}
	if (options.schema.marks.underline) {
		customKeybindings[kb.underline.key] = toggleMark(options.schema.marks.underline);
	}
	if (options.schema.marks.strikethrough) {
		customKeybindings[kb.strikethrough.key] = toggleMark(options.schema.marks.strikethrough);
	}
	customKeybindings[kb.linkify.key] = linkifySelection(options.schema);

	// Block formatting
	if (nodes.paragraph) {
		customKeybindings[kb.paragraph.key] = setBlockType(nodes.paragraph);
	}
	if (nodes.ordered_list && nodes.list_item) {
		customKeybindings[kb.orderedList.key] = toggleList(nodes.ordered_list, nodes.list_item);
	}
	if (nodes.bullet_list && nodes.list_item) {
		customKeybindings[kb.bulletList.key] = toggleList(nodes.bullet_list, nodes.list_item);
	}

	// History (undo/redo) — also always bind Mod-Shift-z as secondary redo
	customKeybindings[kb.undo.key] = undo;
	customKeybindings[kb.redo.key] = redo;
	if (kb.redo.key !== "Mod-Shift-z") {
		customKeybindings["Mod-Shift-z"] = redo;
	}

	// List indent/outdent: user-configurable Mod key shortcuts + structural Tab/Shift-Tab
	if (nodes.list_item) {
		customKeybindings[kb.indent.key] = sinkListItem(nodes.list_item);
		customKeybindings[kb.outdent.key] = liftListItem(nodes.list_item);
		
		// Tab in list = indent, Shift+Tab = outdent
		// For non-list context with selection: indent/outdent all lines
		// For non-list context without selection: insert/remove spaces
		const tabInList = sinkListItem(nodes.list_item);
		const shiftTabInList = liftListItem(nodes.list_item);
		
		customKeybindings["Tab"] = (state: EditorState, dispatch?: (tr: Transaction) => void) => {
			// Try table cell navigation first
			if (goToNextCell(1)(state, dispatch)) {
				return true;
			}
			// Try to indent list item first
			if (tabInList(state, dispatch)) {
				return true;
			}
			
			if (dispatch) {
				const { from, to, empty } = state.selection;
				
				if (empty) {
					// No selection - insert real tab character at cursor
					dispatch(state.tr.insertText("\t").scrollIntoView());
				} else {
					// Selection exists - indent all covered lines with a real tab
					const tr = state.tr;
					const positions: number[] = [];
					state.doc.nodesBetween(from, to, (node, pos) => {
						if (node.isTextblock) positions.push(pos + 1);
					});
					let offset = 0;
					for (const pos of positions) {
						tr.insertText("\t", pos + offset);
						offset += 1;
					}
					dispatch(tr.scrollIntoView());
				}
			}
			return true;
		};
		
		customKeybindings["Shift-Tab"] = (state: EditorState, dispatch?: (tr: Transaction) => void) => {
			// Try table cell navigation first
			if (goToNextCell(-1)(state, dispatch)) {
				return true;
			}
			// Try to outdent list item first
			if (shiftTabInList(state, dispatch)) {
				return true;
			}
			
			if (dispatch) {
				const { from, to, empty } = state.selection;
				
				if (empty) {
					// Remove leading tab or up to 2 spaces from current line
					const { $from } = state.selection;
					const lineStart = $from.start();
					const lineText = $from.parent.textContent;
					const match = lineText.match(/^(\t| {1,2})/);
					if (match?.[1]) {
						dispatch(state.tr.delete(lineStart, lineStart + match[1].length).scrollIntoView());
					}
				} else {
					// Outdent all covered lines — remove leading tab or up to 2 spaces
					const tr = state.tr;
					const edits: { pos: number; remove: number }[] = [];
					state.doc.nodesBetween(from, to, (node, pos) => {
						if (node.isTextblock && node.textContent) {
							const match = node.textContent.match(/^(\t| {1,2})/);
							if (match?.[1]) edits.push({ pos: pos + 1, remove: match[1].length });
						}
					});
					for (let i = edits.length - 1; i >= 0; i--) {
						const e = edits[i];
						if (e) tr.delete(e.pos, e.pos + e.remove);
					}
					if (edits.length > 0) dispatch(tr.scrollIntoView());
				}
			}
			return true; // consume event — prevent DOM focus shift
		};
	} else {
		// No list support, just handle tab characters
		customKeybindings["Tab"] = (state: EditorState, dispatch?: (tr: Transaction) => void) => {
			if (goToNextCell(1)(state, dispatch)) return true;
			if (dispatch) {
				const { from, to, empty } = state.selection;
				if (empty) {
					dispatch(state.tr.insertText("\t").scrollIntoView());
				} else {
					const tr = state.tr;
					const positions: number[] = [];
					state.doc.nodesBetween(from, to, (node, pos) => {
						if (node.isTextblock) positions.push(pos + 1);
					});
					let offset = 0;
					for (const pos of positions) {
						tr.insertText("\t", pos + offset);
						offset += 1;
					}
					dispatch(tr.scrollIntoView());
				}
			}
			return true;
		};
		customKeybindings["Shift-Tab"] = (state: EditorState, dispatch?: (tr: Transaction) => void) => {
			if (goToNextCell(-1)(state, dispatch)) return true;
			if (dispatch) {
				const { from, to, empty } = state.selection;
				if (empty) {
					const { $from } = state.selection;
					const lineStart = $from.start();
					const match = $from.parent.textContent.match(/^(\t| {1,2})/);
					if (match?.[1]) dispatch(state.tr.delete(lineStart, lineStart + match[1].length).scrollIntoView());
				} else {
					const tr = state.tr;
					const edits: { pos: number; remove: number }[] = [];
					state.doc.nodesBetween(from, to, (node, pos) => {
						if (node.isTextblock && node.textContent) {
							const match = node.textContent.match(/^(\t| {1,2})/);
							if (match?.[1]) edits.push({ pos: pos + 1, remove: match[1].length });
						}
					});
					for (let i = edits.length - 1; i >= 0; i--) {
						const e = edits[i];
						if (e) tr.delete(e.pos, e.pos + e.remove);
					}
					if (edits.length > 0) dispatch(tr.scrollIntoView());
				}
			}
			return true;
		};
	}

	// Escape: two-stage like VS Code
	// Stage 1 (selection active): collapse to cursor, reset Ctrl+A cycle
	// Stage 2 (cursor only): exit editor focus to toolbar
	customKeybindings["Escape"] = (state: EditorState, dispatch?: (tr: Transaction) => void, view?: any) => {
		// If there's an active selection, collapse it to a cursor — don't jump away
		if (!state.selection.empty) {
			if (dispatch) {
				const { anchor } = state.selection;
				dispatch(state.tr.setSelection(TextSelection.create(state.doc, anchor)));
			}
			// Reset the smart-select cycle so next Ctrl+A starts fresh from line
			resetSmartSelectLevel();
			return true;
		}

		// No selection — exit editor focus to toolbar (or just blur)
		const toolbar = document.querySelector('[data-editor-toolbar]');
		if (toolbar) {
			const firstFocusable = toolbar.querySelector('button, input, [tabindex="0"]') as HTMLElement | null;
			if (firstFocusable) {
				firstFocusable.focus();
				return true;
			}
		}
		if (view) {
			(view.dom as HTMLElement).blur();
		}
		return true;
	};

	// Blockquote - toggleable
	if (nodes.blockquote) {
		customKeybindings[kb.blockquote.key] = toggleBlockquote(nodes.blockquote);
	}

	// Code block
	if (nodes.code_block) {
		customKeybindings[kb.codeBlock.key] = setBlockType(nodes.code_block);
	}

	// ── Clear All Formatting (Ctrl+\ — no digit-key issues) ──
	customKeybindings[kb.clearFormatting.key] = clearAllFormatting(options.schema);

	// ── Inline font size step (Ctrl+Alt+↑/↓) ──
	if (options.schema.marks.fontSize) {
		customKeybindings["Mod-Alt-ArrowUp"] = increaseFontSizeMark(options.schema);
		customKeybindings["Mod-Alt-ArrowDown"] = decreaseFontSizeMark(options.schema);
	}

	// ── Alignment (Ctrl+Shift+E/R) — table position when in table, text otherwise ──
	customKeybindings["Mod-Shift-e"] = chainCommands(setTableAlign("center"), setTextAlign("center"));
	customKeybindings["Mod-Shift-r"] = chainCommands(setTableAlign("right"), setTextAlign("right"));

	// ── Alt+X: convert character before cursor to/from Unicode hex code ──
	customKeybindings["Alt-x"] = reverseUnicodeLookup;

	// NOTE: Format pickers (Ctrl+Shift+1-4), direct colors (Alt+0-6),
	// and direct highlights (Shift+Alt+0-6) are handled via DOM keydown
	// handlers in prosemirror-editor.tsx because ProseMirror's keymap
	// uses event.key which gives shifted characters for Shift+digit
	// (e.g. Shift+2 → '@'), making Mod-Shift-2 unreliable.

	plugins.push(keymap(customKeybindings));

	return plugins;
}

/**
 * Insert a 3×3 table at the current cursor position.
 */
export function insertTable(schema: Schema): Command {
	return insertTableWithSize(schema, 3, 3);
}

/**
 * Insert a table with the given number of rows and columns.
 * All cells are regular table_cell (no header row).
 */
export function insertTableWithSize(schema: Schema, rows: number, cols: number): Command {
	return (state, dispatch) => {
		const { table, table_row, table_cell } = schema.nodes;
		if (!table || !table_row || !table_cell) return false;

		const tableRows = [];
		for (let r = 0; r < rows; r++) {
			const cells = [];
			for (let c = 0; c < cols; c++) {
				cells.push(table_cell.createAndFill()!);
			}
			tableRows.push(table_row.create(null, cells));
		}

		const tableNode = table.create(null, tableRows);

		if (dispatch) {
			dispatch(state.tr.replaceSelectionWith(tableNode).scrollIntoView());
		}
		return true;
	};
}

/**
 * Insert or wrap a collapsible details block.
 *
 * - If there is no selection (or a cursor): inserts a new empty details
 *   block with a "Summary" placeholder.
 * - If there is a selection: wraps the selected blocks inside a details
 *   block, using the first block's text as the summary.
 */
export function insertDetails(schema: Schema): Command {
	return (state, dispatch) => {
		const { details, details_summary, paragraph } = schema.nodes;
		if (!details || !details_summary || !paragraph) return false;

		if (state.selection.empty) {
			// No selection — insert a fresh details block
			const summaryNode = details_summary.create(null, schema.text("Summary"));
			const bodyNode = paragraph.create();
			const detailsNode = details.create({ open: true }, [summaryNode, bodyNode]);
			if (dispatch) {
				dispatch(state.tr.replaceSelectionWith(detailsNode).scrollIntoView());
			}
			return true;
		}

		// Selection exists — wrap selected blocks
		if (dispatch) {
			const { from, to } = state.selection;
			const tr = state.tr;

			// Collect the selected block nodes
			const blocks: PMNode[] = [];
			state.doc.nodesBetween(from, to, (node) => {
				// Only grab top-level blocks that overlap the selection
				if (node.isBlock && node !== state.doc) {
					blocks.push(node);
					return false; // don't descend
				}
				return true;
			});

			if (blocks.length === 0) return false;

			const firstBlock = blocks[0];
			if (!firstBlock) return false;

			// Use the first block's text content as the summary
			const summaryText = firstBlock.textContent || "Summary";
			const summaryNode = details_summary.create(null, schema.text(summaryText));

			// Remaining blocks become the body; if the first block was used for
			// the summary we still need at least one body block.
			const bodyNodes: PMNode[] = blocks.slice(1);
			if (bodyNodes.length === 0) {
				bodyNodes.push(paragraph.create());
			}

			const detailsNode = details.create({ open: true }, [summaryNode, ...bodyNodes]);

			// Find the range covering all the selected blocks in the document
			const $from = state.doc.resolve(from);
			const $to = state.doc.resolve(to);
			const range = $from.blockRange($to);
			if (!range) return false;

			tr.replaceRange(range.start, range.end, new Slice(Fragment.from(detailsNode), 0, 0));
			dispatch(tr.scrollIntoView());
		}
		return true;
	};
}
