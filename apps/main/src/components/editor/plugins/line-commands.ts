/**
 * Line-based commands for ProseMirror
 *
 * These commands operate on "lines" (block nodes like paragraphs) rather than
 * individual characters, providing CodeMirror-like editing experience in rich text.
 *
 * Commands:
 * - moveLineUp: Move current line(s)/block(s) up (Alt+ArrowUp)
 * - moveLineDown: Move current line(s)/block(s) down (Alt+ArrowDown)
 * - copyLineUp: Duplicate current line(s)/block(s) above (Alt+Shift+ArrowUp)
 * - copyLineDown: Duplicate current line(s)/block(s) below (Alt+Shift+ArrowDown)
 * - selectWord: Select word at cursor, then select next occurrence (Ctrl+D)
 * - selectPreviousOccurrence: Select previous occurrence of selected text (Ctrl+Shift+D)
 * - deleteLine: Delete the current line(s) (Shift+Delete)
 * - smartSelectAll: Progressive selection like OneNote (Ctrl+A)
 *
 * All move/copy commands support multi-line selections.
 */

import { type Command, TextSelection, AllSelection } from "prosemirror-state";
import { Fragment, type Node as PMNode } from "prosemirror-model";
import { DEFAULT_EDITOR_KEYBINDINGS, type EditorKeybindings } from "@/config/default-editor-keybindings";

/**
 * Get the range of top-level blocks that overlap with the current selection.
 * Returns the start position of the first block and end position of the last block.
 */
function getSelectedBlockRange(state: {
	selection: { $from: any; $to: any };
	doc: PMNode;
}): {
	startPos: number;
	endPos: number;
	blocks: PMNode[];
	firstBlockIndex: number;
	lastBlockIndex: number;
} | null {
	const { $from, $to } = state.selection;

	// Find the depth at which we have sibling blocks (usually depth 1 for paragraphs in doc)
	let blockDepth = $from.depth;
	while (blockDepth > 0 && !$from.node(blockDepth).isBlock) {
		blockDepth--;
	}
	if (blockDepth === 0) {
		// Selection is at doc level, work with top-level children
		blockDepth = 1;
	}

	// Get the parent that contains the blocks
	const parentDepth = blockDepth - 1;

	// Find first and last block indices
	const firstBlockIndex = $from.index(parentDepth);
	let lastBlockIndex = $to.index(parentDepth);

	// Edge case: if the selection ends at the very start of a block (offset 0),
	// we don't want to include that block - the user visually selected up to the
	// end of the previous line, not the start of the next line.
	// This happens when selecting with Shift+Down or triple-click selection.
	if ($to.parentOffset === 0 && lastBlockIndex > firstBlockIndex) {
		lastBlockIndex--;
	}

	// Calculate positions
	const startPos = $from.before(blockDepth);

	// Get end position - need to find the end of the last block
	let endPos = startPos;
	const blocks: PMNode[] = [];
	const parent = $from.node(parentDepth);

	for (
		let i = firstBlockIndex;
		i <= lastBlockIndex && i < parent.childCount;
		i++
	) {
		const block = parent.child(i);
		blocks.push(block);
		if (i === firstBlockIndex) {
			endPos = startPos + block.nodeSize;
		} else {
			endPos += block.nodeSize;
		}
	}

	if (blocks.length === 0) return null;

	return { startPos, endPos, blocks, firstBlockIndex, lastBlockIndex };
}

/**
 * Move the current line(s) (block(s)) up by swapping with the previous sibling
 */
export const moveLineUp: Command = (state, dispatch) => {
	const range = getSelectedBlockRange(state);
	if (!range) return false;

	const { startPos, endPos, blocks, firstBlockIndex } = range;
	const { $from, $to } = state.selection;

	// Can't move up if we're already at the first position
	if (firstBlockIndex === 0) return false;

	// Get the block before our range
	const blockDepth = $from.depth > 0 ? Math.min($from.depth, 1) : 1;
	const parentDepth = blockDepth - 1;
	const prevBlockPos = $from.posAtIndex(firstBlockIndex - 1, parentDepth);

	if (dispatch) {
		const tr = state.tr;

		// Calculate selection offsets relative to the block range
		const selectionStartOffset = $from.pos - startPos;
		const selectionEndOffset = $to.pos - startPos;

		// Create a fragment from all selected blocks
		const fragment = Fragment.from(blocks);

		// Delete the selected blocks
		tr.delete(startPos, endPos);

		// Insert them before the previous block
		tr.insert(prevBlockPos, fragment);

		// Restore selection relative to new position
		const newStartPos = prevBlockPos;
		const newSelStart = newStartPos + selectionStartOffset;
		const newSelEnd = newStartPos + selectionEndOffset;
		tr.setSelection(
			TextSelection.create(
				tr.doc,
				Math.min(newSelStart, tr.doc.content.size - 1),
				Math.min(newSelEnd, tr.doc.content.size - 1)
			)
		);

		dispatch(tr.scrollIntoView());
	}

	return true;
};

/**
 * Move the current line(s) (block(s)) down by swapping with the next sibling
 */
export const moveLineDown: Command = (state, dispatch) => {
	const range = getSelectedBlockRange(state);
	if (!range) return false;

	const { startPos, endPos, blocks, lastBlockIndex } = range;
	const { $from, $to } = state.selection;

	// Get parent info
	const blockDepth = $from.depth > 0 ? Math.min($from.depth, 1) : 1;
	const parentDepth = blockDepth - 1;
	const parent = $from.node(parentDepth);

	// Can't move down if we're already at the last position
	if (lastBlockIndex >= parent.childCount - 1) return false;

	// Get the block after our range
	const nextBlock = parent.child(lastBlockIndex + 1);

	if (dispatch) {
		const tr = state.tr;

		// Calculate selection offsets relative to the block range
		const selectionStartOffset = $from.pos - startPos;
		const selectionEndOffset = $to.pos - startPos;

		// Create a fragment from all selected blocks
		const fragment = Fragment.from(blocks);

		// Insert blocks after the next block
		const insertPos = endPos + nextBlock.nodeSize;
		tr.insert(insertPos, fragment);

		// Delete original blocks
		tr.delete(startPos, endPos);

		// Restore selection relative to new position
		const newStartPos = startPos + nextBlock.nodeSize;
		const newSelStart = newStartPos + selectionStartOffset;
		const newSelEnd = newStartPos + selectionEndOffset;
		tr.setSelection(
			TextSelection.create(
				tr.doc,
				Math.min(newSelStart, tr.doc.content.size - 1),
				Math.min(newSelEnd, tr.doc.content.size - 1)
			)
		);

		dispatch(tr.scrollIntoView());
	}

	return true;
};

/**
 * Duplicate the current line(s) (block(s)) and insert copy above
 */
export const copyLineUp: Command = (state, dispatch) => {
	const range = getSelectedBlockRange(state);
	if (!range) return false;

	const { startPos, blocks } = range;
	const { $from, $to } = state.selection;

	if (dispatch) {
		const tr = state.tr;

		// Calculate selection offsets relative to the block range
		const selectionStartOffset = $from.pos - startPos;
		const selectionEndOffset = $to.pos - startPos;

		// Create a deep copy of all selected blocks
		const copiedBlocks = blocks.map((block) => block.copy(block.content));
		const fragment = Fragment.from(copiedBlocks);

		// Insert copies before the current blocks
		tr.insert(startPos, fragment);

		// Keep cursor in the copied blocks (which are now at startPos)
		const newSelStart = startPos + selectionStartOffset;
		const newSelEnd = startPos + selectionEndOffset;
		tr.setSelection(
			TextSelection.create(
				tr.doc,
				Math.min(newSelStart, tr.doc.content.size - 1),
				Math.min(newSelEnd, tr.doc.content.size - 1)
			)
		);

		dispatch(tr.scrollIntoView());
	}

	return true;
};

/**
 * Duplicate the current line(s) (block(s)) and insert copy below
 */
export const copyLineDown: Command = (state, dispatch) => {
	const range = getSelectedBlockRange(state);
	if (!range) return false;

	const { startPos, endPos, blocks } = range;
	const { $from, $to } = state.selection;

	if (dispatch) {
		const tr = state.tr;

		// Calculate selection offsets relative to the block range
		const selectionStartOffset = $from.pos - startPos;
		const selectionEndOffset = $to.pos - startPos;

		// Create a deep copy of all selected blocks
		const copiedBlocks = blocks.map((block) => block.copy(block.content));
		const fragment = Fragment.from(copiedBlocks);

		// Insert copies after the current blocks
		tr.insert(endPos, fragment);

		// Move cursor to the duplicated blocks
		const newStartPos = endPos;
		const newSelStart = newStartPos + selectionStartOffset;
		const newSelEnd = newStartPos + selectionEndOffset;
		tr.setSelection(
			TextSelection.create(
				tr.doc,
				Math.min(newSelStart, tr.doc.content.size - 1),
				Math.min(newSelEnd, tr.doc.content.size - 1)
			)
		);

		dispatch(tr.scrollIntoView());
	}

	return true;
};

/**
 * Helper: Find word boundaries at a given position
 * Returns {from, to} of the word, or null if cursor is not on a word
 */
function getWordAt(
	doc: PMNode,
	pos: number
): { from: number; to: number } | null {
	const $pos = doc.resolve(pos);

	// Get text content around the position
	const parent = $pos.parent;
	if (!parent.isTextblock) return null;

	const parentOffset = $pos.parentOffset;
	const text = parent.textContent;

	// Find word boundaries using Unicode-aware regex
	// \p{L} matches any Unicode letter, \p{N} matches any Unicode number
	const wordRegex = /[\p{L}\p{N}_]/u;

	// Find start of word (scan backwards)
	let wordStart = parentOffset;
	while (wordStart > 0 && wordRegex.test(text[wordStart - 1] || "")) {
		wordStart--;
	}

	// Find end of word (scan forwards)
	let wordEnd = parentOffset;
	while (wordEnd < text.length && wordRegex.test(text[wordEnd] || "")) {
		wordEnd++;
	}

	// If we're not on a word character, return null
	if (wordStart === wordEnd) return null;

	// Convert parent-relative offsets to document positions
	const startOfParent = $pos.start();
	return {
		from: startOfParent + wordStart,
		to: startOfParent + wordEnd,
	};
}

/**
 * Helper: Find text occurrences in document
 * Returns array of {from, to} positions
 */
function findTextOccurrences(
	doc: PMNode,
	searchText: string
): Array<{ from: number; to: number }> {
	const results: Array<{ from: number; to: number }> = [];

	doc.descendants((node, pos) => {
		if (node.isText && node.text) {
			const text = node.text;
			let index = 0;
			while ((index = text.indexOf(searchText, index)) !== -1) {
				results.push({
					from: pos + index,
					to: pos + index + searchText.length,
				});
				index += 1; // Move past this match to find overlapping matches
			}
		}
		return true;
	});

	return results;
}

/**
 * Select the word at cursor. If a word is already selected, select the next occurrence.
 * Similar to Ctrl+D in VS Code / CodeMirror.
 */
export const selectWord: Command = (state, dispatch) => {
	const { selection, doc } = state;
	const { $from, $to, empty } = selection;

	if (empty) {
		// No selection: select the word at cursor
		const word = getWordAt(doc, $from.pos);
		if (!word) return false;

		if (dispatch) {
			const tr = state.tr.setSelection(
				TextSelection.create(doc, word.from, word.to)
			);
			dispatch(tr.scrollIntoView());
		}
		return true;
	} else {
		// Already have a selection: find and select next occurrence
		const selectedText = doc.textBetween($from.pos, $to.pos, "");
		if (!selectedText) return false;

		const occurrences = findTextOccurrences(doc, selectedText);
		if (occurrences.length === 0) return false;

		// Find the current selection in occurrences
		const currentFrom = $from.pos;
		const currentTo = $to.pos;

		// Find next occurrence after current selection
		let nextOccurrence = occurrences.find((occ) => occ.from > currentFrom);

		// If no occurrence after, wrap to first occurrence
		if (!nextOccurrence) {
			nextOccurrence = occurrences[0];
		}

		// Don't select if it's the same as current
		if (
			nextOccurrence &&
			(nextOccurrence.from !== currentFrom || nextOccurrence.to !== currentTo)
		) {
			if (dispatch) {
				const tr = state.tr.setSelection(
					TextSelection.create(doc, nextOccurrence.from, nextOccurrence.to)
				);
				dispatch(tr.scrollIntoView());
			}
			return true;
		}

		return false;
	}
};

/**
 * Select the previous occurrence of the selected text.
 * Similar to Ctrl+Shift+D behavior.
 */
export const selectPreviousOccurrence: Command = (state, dispatch) => {
	const { selection, doc } = state;
	const { $from, $to, empty } = selection;

	if (empty) {
		// No selection: select the word at cursor first
		const word = getWordAt(doc, $from.pos);
		if (!word) return false;

		if (dispatch) {
			const tr = state.tr.setSelection(
				TextSelection.create(doc, word.from, word.to)
			);
			dispatch(tr.scrollIntoView());
		}
		return true;
	} else {
		// Already have a selection: find and select previous occurrence
		const selectedText = doc.textBetween($from.pos, $to.pos, "");
		if (!selectedText) return false;

		const occurrences = findTextOccurrences(doc, selectedText);
		if (occurrences.length === 0) return false;

		// Find the current selection in occurrences
		const currentFrom = $from.pos;
		const currentTo = $to.pos;

		// Find previous occurrence before current selection
		let prevOccurrence: { from: number; to: number } | undefined;
		for (let i = occurrences.length - 1; i >= 0; i--) {
			const occ = occurrences[i];
			if (occ && occ.from < currentFrom) {
				prevOccurrence = occ;
				break;
			}
		}

		// If no occurrence before, wrap to last occurrence
		if (!prevOccurrence) {
			prevOccurrence = occurrences[occurrences.length - 1];
		}

		// Don't select if it's the same as current or undefined
		if (
			prevOccurrence !== undefined &&
			(prevOccurrence.from !== currentFrom || prevOccurrence.to !== currentTo)
		) {
			if (dispatch) {
				const tr = state.tr.setSelection(
					TextSelection.create(doc, prevOccurrence.from, prevOccurrence.to)
				);
				dispatch(tr.scrollIntoView());
			}
			return true;
		}

		return false;
	}
};

/**
 * Delete the current line(s) (block(s))
 * Shift+Delete to delete current line(s)
 */
export const deleteLine: Command = (state, dispatch) => {
	const range = getSelectedBlockRange(state);
	if (!range) return false;

	const { startPos, endPos } = range;

	if (dispatch) {
		const tr = state.tr;

		// Delete all selected blocks
		tr.delete(startPos, endPos);

		// Cursor will automatically be placed at the deletion point
		dispatch(tr.scrollIntoView());
	}

	return true;
};

/**
 * Track state for smart select all (OneNote-style progressive selection)
 * - Level 0: No special selection
 * - Level 1: Current line selected
 * - Level 2: Current paragraph (connected non-empty lines) selected
 * - Level 3: Entire document selected
 */
let smartSelectLevel = 0;
let lastSmartSelectTime = 0;
let lastSmartSelectRange: { from: number; to: number } | null = null;

/**
 * Check if a block is "empty" (only whitespace or truly empty)
 */
function isBlockEmpty(block: PMNode): boolean {
	const text = block.textContent;
	return text.trim().length === 0;
}

/**
 * Smart Select All - OneNote 2013 style progressive selection
 * Continuously rotates: line -> paragraph -> all -> line
 */
export const smartSelectAll: Command = (state, dispatch) => {
	const { doc, selection } = state;
	const { $from } = selection;
	const now = Date.now();

	// Reset level if too much time has passed or cursor moved to different position
	if (
		now - lastSmartSelectTime > 2000 ||
		(lastSmartSelectRange &&
			(selection.from !== lastSmartSelectRange.from ||
				selection.to !== lastSmartSelectRange.to))
	) {
		smartSelectLevel = 0;
	}

	// Find the block depth
	let blockDepth = $from.depth;
	while (blockDepth > 0 && !$from.node(blockDepth).isBlock) {
		blockDepth--;
	}
	if (blockDepth === 0) blockDepth = 1;

	const parentDepth = blockDepth - 1;
	const parent = $from.node(parentDepth);
	const currentBlockIndex = $from.index(parentDepth);

	// Increment level and wrap around (1 -> 2 -> 3 -> 1)
	smartSelectLevel = (smartSelectLevel % 3) + 1;
	lastSmartSelectTime = now;

	if (dispatch) {
		let newSelection: TextSelection | AllSelection;

		if (smartSelectLevel === 1) {
			// Level 1: Select current line (entire block including boundaries for visibility)
			const blockStart = $from.before(blockDepth);
			const block = $from.node(blockDepth);
			const blockEnd = blockStart + block.nodeSize;

			// For empty blocks, select the whole block to make selection visible
			// For non-empty blocks, select the content inside
			if (block.content.size === 0) {
				// Empty block - use block boundaries so selection is visible
				newSelection = TextSelection.create(doc, blockStart, blockEnd);
			} else {
				// Non-empty block - select content inside
				const contentStart = blockStart + 1;
				const contentEnd = blockEnd - 1;
				newSelection = TextSelection.create(
					doc,
					contentStart,
					Math.max(contentStart, contentEnd)
				);
			}
		} else if (smartSelectLevel === 2) {
			// Level 2: Select paragraph (connected non-empty lines)
			// Find the first non-empty line going backwards
			let paragraphStart = currentBlockIndex;
			for (let i = currentBlockIndex - 1; i >= 0; i--) {
				const block = parent.child(i);
				if (isBlockEmpty(block)) break;
				paragraphStart = i;
			}

			// Find the last non-empty line going forwards
			let paragraphEnd = currentBlockIndex;
			for (let i = currentBlockIndex + 1; i < parent.childCount; i++) {
				const block = parent.child(i);
				if (isBlockEmpty(block)) break;
				paragraphEnd = i;
			}

			// Calculate positions
			const startPos = $from.posAtIndex(paragraphStart, parentDepth);
			let endPos = startPos;
			for (let i = paragraphStart; i <= paragraphEnd; i++) {
				const block = parent.child(i);
				if (i === paragraphStart) {
					endPos = startPos + block.nodeSize;
				} else {
					endPos += block.nodeSize;
				}
			}

			// Select content inside the range
			newSelection = TextSelection.create(doc, startPos + 1, endPos - 1);
		} else {
			// Level 3: Select entire document
			newSelection = new AllSelection(doc);
		}

		const tr = state.tr.setSelection(newSelection);
		dispatch(tr.scrollIntoView());

		// Track the new selection range
		lastSmartSelectRange = { from: newSelection.from, to: newSelection.to };
	}

	return true;
};

/**
 * Keymap for line-based commands
 */
/**
 * Build a keymap for line-based commands, using keys from the given EditorKeybindings.
 * Falls back to DEFAULT_EDITOR_KEYBINDINGS if not provided.
 */
export function buildLineCommandsKeymap(kb?: EditorKeybindings): Record<string, Command> {
	const k = kb || DEFAULT_EDITOR_KEYBINDINGS;
	return {
		[k.moveLineUp.key]: moveLineUp,
		[k.moveLineDown.key]: moveLineDown,
		[k.copyLineUp.key]: copyLineUp,
		[k.copyLineDown.key]: copyLineDown,
		[k.selectWord.key]: selectWord,
		[k.selectPrevious.key]: selectPreviousOccurrence,
		[k.deleteLine.key]: deleteLine,
		[k.smartSelectAll.key]: smartSelectAll,
	};
}

/**
 * Static default keymap (for backward compatibility)
 */
export const lineCommandsKeymap = buildLineCommandsKeymap();
