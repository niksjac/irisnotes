import type { Schema, NodeType, Node } from "prosemirror-model";
import type { Plugin, Command, EditorState, Transaction } from "prosemirror-state";
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
import { buildInputRules } from "prosemirror-example-setup";
import { autolinkPlugin, linkifySelection } from "./plugins/autolink";
import { tightSelectionPlugin } from "./plugins/tight-selection";
import { customCursorPlugin } from "./plugins/custom-cursor";
import { activeLinePlugin } from "./plugins/active-line";
import { buildLineCommandsKeymap } from "./plugins/line-commands";
import { searchPlugin } from "./plugins/search";
import {
	applyTextColor,
	removeTextColor,
	applyHighlight,
	removeHighlight,
	clearAllFormatting,
} from "./format-commands";
import { DIRECT_TEXT_COLORS, DIRECT_HIGHLIGHT_COLORS } from "./format-constants";
import type { FormatPickerType } from "./format-picker";
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
	// Callback to open a format picker (textColor, highlight, fontSize, fontFamily)
	onOpenPicker?: (type: FormatPickerType) => void;
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

	// Input rules (markdown-style shortcuts)
	plugins.push(buildInputRules(options.schema));

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
	};
	plugins.push(keymap(enterKeymap));

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

	// Active line highlight (subtle background on the line containing cursor)
	plugins.push(activeLinePlugin());

	// Tight selection (VS Code / Notion style - only highlights actual text)
	plugins.push(tightSelectionPlugin());

	// Custom cursor (VS Code style - configurable width, color, animation)
	plugins.push(customCursorPlugin());

	// Auto-link URLs as you type + Ctrl+Click/Ctrl+Enter to open
	plugins.push(...autolinkPlugin(options.schema));

	// Search plugin for Ctrl+F find in note
	plugins.push(searchPlugin());

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
			// Try to indent list item first
			if (tabInList(state, dispatch)) {
				return true;
			}
			
			if (dispatch) {
				const { from, to, empty } = state.selection;
				
				if (empty) {
					// No selection - just insert spaces at cursor
					dispatch(state.tr.insertText("  ").scrollIntoView());
				} else {
					// Selection exists - indent all lines in selection
					const tr = state.tr;
					const doc = state.doc;
					
					// Find all block positions that overlap with selection
					const positions: number[] = [];
					doc.nodesBetween(from, to, (node: Node, pos: number) => {
						if (node.isTextblock) {
							positions.push(pos + 1); // +1 to get inside the block
						}
					});
					
					// Insert spaces at the start of each line (reverse order to maintain positions)
					let offset = 0;
					for (const pos of positions) {
						tr.insertText("  ", pos + offset);
						offset += 2;
					}
					
					dispatch(tr.scrollIntoView());
				}
			}
			return true;
		};
		
		customKeybindings["Shift-Tab"] = (state: EditorState, dispatch?: (tr: Transaction) => void) => {
			// Try to outdent list item first
			if (shiftTabInList(state, dispatch)) {
				return true;
			}
			
			if (dispatch) {
				const { from, to, empty } = state.selection;
				
				if (empty) {
					// No selection - remove leading spaces from current line
					const { $from } = state.selection;
					const lineStart = $from.start();
					const lineText = $from.parent.textContent;
					const match = lineText.match(/^( {1,2})/);
					if (match?.[1]) {
						const spacesToRemove = match[1].length;
						dispatch(state.tr.delete(lineStart, lineStart + spacesToRemove).scrollIntoView());
					}
				} else {
					// Selection exists - outdent all lines in selection
					const tr = state.tr;
					const doc = state.doc;
					
					// Collect blocks and their leading spaces
					const edits: { pos: number; remove: number }[] = [];
					doc.nodesBetween(from, to, (node: Node, pos: number) => {
						if (node.isTextblock && node.textContent) {
							const match = node.textContent.match(/^( {1,2})/);
							if (match?.[1]) {
								edits.push({ pos: pos + 1, remove: match[1].length });
							}
						}
					});
					
					// Remove spaces (reverse order to maintain positions)
					for (let i = edits.length - 1; i >= 0; i--) {
						const edit = edits[i];
						if (edit) {
							tr.delete(edit.pos, edit.pos + edit.remove);
						}
					}
					
					if (edits.length > 0) {
						dispatch(tr.scrollIntoView());
					}
				}
			}
			return true; // Still consume the event to prevent focus change
		};
	} else {
		// No list support, just handle tab characters
		customKeybindings["Tab"] = (state: EditorState, dispatch?: (tr: Transaction) => void) => {
			if (dispatch) {
				const { from, to, empty } = state.selection;
				
				if (empty) {
					dispatch(state.tr.insertText("  ").scrollIntoView());
				} else {
					const tr = state.tr;
					const doc = state.doc;
					const positions: number[] = [];
					doc.nodesBetween(from, to, (node: Node, pos: number) => {
						if (node.isTextblock) {
							positions.push(pos + 1);
						}
					});
					let offset = 0;
					for (const pos of positions) {
						tr.insertText("  ", pos + offset);
						offset += 2;
					}
					dispatch(tr.scrollIntoView());
				}
			}
			return true;
		};
		customKeybindings["Shift-Tab"] = (state: EditorState, dispatch?: (tr: Transaction) => void) => {
			if (dispatch) {
				const { from, to, empty } = state.selection;
				
				if (empty) {
					const { $from } = state.selection;
					const lineStart = $from.start();
					const lineText = $from.parent.textContent;
					const match = lineText.match(/^( {1,2})/);
					if (match?.[1]) {
						const spacesToRemove = match[1].length;
						dispatch(state.tr.delete(lineStart, lineStart + spacesToRemove).scrollIntoView());
					}
				} else {
					const tr = state.tr;
					const doc = state.doc;
					const edits: { pos: number; remove: number }[] = [];
					doc.nodesBetween(from, to, (node: Node, pos: number) => {
						if (node.isTextblock && node.textContent) {
							const match = node.textContent.match(/^( {1,2})/);
							if (match?.[1]) {
								edits.push({ pos: pos + 1, remove: match[1].length });
							}
						}
					});
					for (let i = edits.length - 1; i >= 0; i--) {
						const edit = edits[i];
						if (edit) {
							tr.delete(edit.pos, edit.pos + edit.remove);
						}
					}
					if (edits.length > 0) {
						dispatch(tr.scrollIntoView());
					}
				}
			}
			return true;
		};
	}

	// Escape: Exit editor focus and move to toolbar
	// This allows keyboard-only navigation back to UI elements
	customKeybindings["Escape"] = (_state: EditorState, _dispatch?: (tr: Transaction) => void, view?: any) => {
		// Find the toolbar in the DOM and focus its first focusable element
		const toolbar = document.querySelector('[data-editor-toolbar]');
		if (toolbar) {
			const firstFocusable = toolbar.querySelector('button, input, [tabindex="0"]') as HTMLElement | null;
			if (firstFocusable) {
				firstFocusable.focus();
				return true;
			}
		}
		// If no toolbar, just blur the editor
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

	// ── Format Pickers (open floating picker UI via callback) ──
	if (options.onOpenPicker) {
		const openPicker = options.onOpenPicker;
		customKeybindings[kb.textColorPicker.key] = () => { openPicker("textColor"); return true; };
		customKeybindings[kb.highlightPicker.key] = () => { openPicker("highlight"); return true; };
		customKeybindings[kb.fontSizePicker.key] = () => { openPicker("fontSize"); return true; };
		customKeybindings[kb.fontFamilyPicker.key] = () => { openPicker("fontFamily"); return true; };
	}

	// ── Clear All Formatting ──
	customKeybindings[kb.clearFormatting.key] = clearAllFormatting(options.schema);

	// ── Direct Text Colors (Alt+1-6, Alt+0) ──
	for (const [num, preset] of Object.entries(DIRECT_TEXT_COLORS)) {
		const bindingId = `textColor${["", "Red", "Orange", "Yellow", "Green", "Blue", "Purple"][Number(num)]}` as keyof typeof kb;
		if (kb[bindingId]) {
			customKeybindings[kb[bindingId].key] = applyTextColor(options.schema, preset.color);
		}
	}
	customKeybindings[kb.textColorReset.key] = removeTextColor(options.schema);

	// ── Direct Highlight Colors (Shift+Alt+1-6, Shift+Alt+0) ──
	for (const [num, preset] of Object.entries(DIRECT_HIGHLIGHT_COLORS)) {
		const bindingId = `highlight${["", "Yellow", "Orange", "Pink", "Purple", "Blue", "Green"][Number(num)]}` as keyof typeof kb;
		if (kb[bindingId]) {
			customKeybindings[kb[bindingId].key] = applyHighlight(options.schema, preset.color);
		}
	}
	customKeybindings[kb.highlightReset.key] = removeHighlight(options.schema);

	plugins.push(keymap(customKeybindings));

	return plugins;
}
