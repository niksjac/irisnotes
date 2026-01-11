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
 * - deleteLine: Delete the current line(s) (Ctrl+Shift+K)
 * - smartSelectAll: Progressive selection like OneNote (Ctrl+A)
 *
 * All move/copy commands support multi-line selections.
 */

import { type Command, TextSelection, AllSelection } from "prosemirror-state";
import { Fragment, type Node as PMNode } from "prosemirror-model";

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
 * Select the word at cursor. If a word is already selected, select the next occurrence.
 * Similar to Ctrl+D in VS Code / CodeMirror.
 */
export const selectWord: Command = (state, dispatch) => {
	const { selection, doc } = state;
	const { $from, $to, empty } = selection;

	if (empty) {
		// No selection: select the word at cursor
		const pos = $from.pos;
		const textBefore = doc.textBetween(Math.max(0, pos - 50), pos, "");
		const textAfter = doc.textBetween(
			pos,
			Math.min(doc.content.size, pos + 50),
			""
		);

		// Find word boundaries (letters, numbers, underscore)
		const wordRegex = /[\w]/;

		let wordStart = pos;
		for (let i = textBefore.length - 1; i >= 0; i--) {
			const char = textBefore[i];
			if (char && wordRegex.test(char)) {
				wordStart = pos - (textBefore.length - i);
			} else {
				break;
			}
		}

		let wordEnd = pos;
		for (let i = 0; i < textAfter.length; i++) {
			const char = textAfter[i];
			if (char && wordRegex.test(char)) {
				wordEnd = pos + i + 1;
			} else {
				break;
			}
		}

		if (wordStart < wordEnd && dispatch) {
			const tr = state.tr.setSelection(
				TextSelection.create(doc, wordStart, wordEnd)
			);
			dispatch(tr.scrollIntoView());
			return true;
		}

		return false;
	} else {
		// Already have a selection: find and select next occurrence
		const selectedText = doc.textBetween($from.pos, $to.pos, "");
		if (!selectedText) return false;

		// Search for next occurrence after current selection
		const docText = doc.textContent;
		const currentEnd = $to.pos;

		// Convert document position to text position (approximate)
		let textPos = 0;
		doc.descendants((node, pos) => {
			if (node.isText) {
				if (pos < currentEnd) {
					textPos += node.text?.length || 0;
				}
			}
			return true;
		});

		// Find next occurrence in document text
		const nextIndex = docText.indexOf(selectedText, textPos);

		if (nextIndex !== -1) {
			// Convert text position back to document position
			// This is a simplified approach - may need refinement for complex docs
			let targetDocPos = 0;
			let currentTextPos = 0;

			doc.descendants((node, pos) => {
				if (node.isText && currentTextPos <= nextIndex) {
					const nodeText = node.text || "";
					const localIndex = nextIndex - currentTextPos;

					if (localIndex >= 0 && localIndex < nodeText.length) {
						targetDocPos = pos + localIndex;
						return false;
					}
					currentTextPos += nodeText.length;
				}
				return true;
			});

			if (targetDocPos > 0 && dispatch) {
				const tr = state.tr.setSelection(
					TextSelection.create(
						doc,
						targetDocPos,
						targetDocPos + selectedText.length
					)
				);
				dispatch(tr.scrollIntoView());
				return true;
			}
		}

		return false;
	}
};

/**
 * Delete the current line(s) (block(s))
 * Similar to Ctrl+Shift+K in VS Code
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
 * First press: Select current line
 * Second press: Select connected lines (paragraph - no empty lines between)
 * Third press: Select entire document
 */
export const smartSelectAll: Command = (state, dispatch) => {
	const { doc, selection } = state;
	const { $from } = selection;
	const now = Date.now();

	// Reset level if too much time has passed or selection has changed
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

	// Increment level
	smartSelectLevel = Math.min(smartSelectLevel + 1, 3);
	lastSmartSelectTime = now;

	if (dispatch) {
		let newSelection: TextSelection | AllSelection;

		if (smartSelectLevel === 1) {
			// Level 1: Select current line
			const blockStart = $from.before(blockDepth);
			const block = $from.node(blockDepth);
			const blockEnd = blockStart + block.nodeSize;

			// Select the content inside the block (not the block boundaries)
			const contentStart = blockStart + 1;
			const contentEnd = blockEnd - 1;
			newSelection = TextSelection.create(
				doc,
				contentStart,
				Math.max(contentStart, contentEnd)
			);
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
export const lineCommandsKeymap = {
	"Alt-ArrowUp": moveLineUp,
	"Alt-ArrowDown": moveLineDown,
	"Shift-Alt-ArrowUp": copyLineUp,
	"Shift-Alt-ArrowDown": copyLineDown,
	"Mod-d": selectWord,
	"Mod-Shift-k": deleteLine,
	"Mod-a": smartSelectAll,
};
