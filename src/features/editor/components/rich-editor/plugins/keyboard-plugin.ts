import { openUrl } from '@tauri-apps/plugin-opener';
import { setBlockType, splitBlock, toggleMark, wrapIn } from 'prosemirror-commands';
import { redo, undo } from 'prosemirror-history';
import { liftListItem, sinkListItem, splitListItem, wrapInList } from 'prosemirror-schema-list';
import { triggerLinkClickEffect } from './link-click-plugin';

// Move block(s) up - improved version supporting multi-block selection
export const moveLineUp = (state: any, dispatch: any) => {
	const { selection, tr } = state;
	const { $from, $to } = selection;

	// Find the range of blocks to move
	const fromDepth = $from.depth;
	const toDepth = $to.depth;

	// Get the parent and find block indices
	const parent = $from.node(fromDepth - 1);
	const startBlockIndex = $from.index(fromDepth - 1);
	const endBlockIndex = $to.index(toDepth - 1);

	// Can't move if first block is already at top
	if (startBlockIndex === 0) return false;

	// Calculate positions for the block range
	const firstBlockPos = $from.before(fromDepth);
	const lastBlockPos = $to.after(toDepth);

	// Get the block that will be swapped
	const prevBlock = parent.child(startBlockIndex - 1);
	const prevBlockStart = firstBlockPos - prevBlock.nodeSize;

	if (dispatch) {
		// Move the previous block to after the selected range
		const blocksToMove = [];
		for (let i = startBlockIndex; i <= endBlockIndex; i++) {
			blocksToMove.push(parent.child(i));
		}

		const t = tr
			.delete(prevBlockStart, firstBlockPos) // Remove previous block
			.insert(lastBlockPos - prevBlock.nodeSize, prevBlock.copy(prevBlock.content)); // Insert it after selected range

		dispatch(t.scrollIntoView());
	}
	return true;
};

// Move block(s) down - improved version supporting multi-block selection
export const moveLineDown = (state: any, dispatch: any) => {
	const { selection, tr } = state;
	const { $from, $to } = selection;

	// Find the range of blocks to move
	const fromDepth = $from.depth;
	const toDepth = $to.depth;

	// Get the parent and find block indices
	const parent = $from.node(fromDepth - 1);
	const endBlockIndex = $to.index(toDepth - 1);

	// Can't move if last block is already at bottom
	if (endBlockIndex >= parent.childCount - 1) return false;

	// Calculate positions for the block range
	const firstBlockPos = $from.before(fromDepth);
	const lastBlockPos = $to.after(toDepth);

	// Get the block that will be swapped
	const nextBlock = parent.child(endBlockIndex + 1);
	const nextBlockEnd = lastBlockPos + nextBlock.nodeSize;

	if (dispatch) {
		// Move the next block to before the selected range
		const t = tr
			.delete(lastBlockPos, nextBlockEnd) // Remove next block
			.insert(firstBlockPos, nextBlock.copy(nextBlock.content)); // Insert it before selected range

		dispatch(t.scrollIntoView());
	}
	return true;
};

// Copy selection up - duplicates the current selection or line above
export const copySelectionUp = (state: any, dispatch: any) => {
	const { selection, tr } = state;
	const { $from, empty } = selection;

	if (empty) {
		// If no selection, copy the current line/block up
		const blockRange = $from.blockRange();
		if (!blockRange) return false;

		const block = blockRange.parent.child(blockRange.startIndex);
		const blockStart = blockRange.start;
		const cursorOffset = selection.from - blockStart;

		if (dispatch) {
			const duplicatedBlock = block.copy(block.content);

			dispatch(
				tr
					.insert(blockStart, duplicatedBlock)
					.setSelection(
						selection.constructor.near(tr.doc.resolve(blockStart + duplicatedBlock.nodeSize + cursorOffset))
					)
					.scrollIntoView()
			);
		}
		return true;
	} else {
		// If there's a selection, copy it above the selection
		const content = tr.doc.slice(selection.from, selection.to);
		const originalFrom = selection.from;
		const originalTo = selection.to;

		if (dispatch) {
			const newTr = tr.insert(originalFrom, content.content);
			// Keep selection on the original content (now moved down)
			const adjustedFrom = originalFrom + content.size;
			const adjustedTo = originalTo + content.size;

			dispatch(newTr.setSelection(selection.constructor.create(newTr.doc, adjustedFrom, adjustedTo)).scrollIntoView());
		}
		return true;
	}
};

// Copy selection down - duplicates the current selection or line below
export const copySelectionDown = (state: any, dispatch: any) => {
	const { selection, tr } = state;
	const { $from, empty } = selection;

	if (empty) {
		// If no selection, copy the current line/block down
		const blockRange = $from.blockRange();
		if (!blockRange) return false;

		const block = blockRange.parent.child(blockRange.startIndex);
		const blockStart = blockRange.start;
		const blockEnd = blockRange.end;
		const cursorOffset = selection.from - blockStart;

		if (dispatch) {
			const duplicatedBlock = block.copy(block.content);

			dispatch(
				tr
					.insert(blockEnd, duplicatedBlock)
					.setSelection(selection.constructor.near(tr.doc.resolve(blockStart + cursorOffset)))
					.scrollIntoView()
			);
		}
		return true;
	} else {
		// If there's a selection, copy it below the selection
		const content = tr.doc.slice(selection.from, selection.to);
		const originalFrom = selection.from;
		const originalTo = selection.to;

		if (dispatch) {
			const newTr = tr.insert(originalTo, content.content);
			// Keep selection on the original content (position unchanged)
			dispatch(newTr.setSelection(selection.constructor.create(newTr.doc, originalFrom, originalTo)).scrollIntoView());
		}
		return true;
	}
};

// Open hyperlink at cursor position
export const openLinkAtCursor = (state: any, _dispatch: any, view?: any) => {
	const { selection } = state;
	const { $from } = selection;

	// Check if cursor is inside a link mark
	const linkMark = $from.marks().find((mark: any) => mark.type.name === 'link');

	if (linkMark && linkMark.attrs.href) {
		// Find the full extent of the link
		let linkStart = selection.from;
		let linkEnd = selection.from;

		// Find start of link
		while (linkStart > 0) {
			const prevPos = state.doc.resolve(linkStart - 1);
			const hasLinkMark = prevPos
				.marks()
				.find((mark: any) => mark.type.name === 'link' && mark.attrs.href === linkMark.attrs.href);
			if (!hasLinkMark) break;
			linkStart--;
		}

		// Find end of link
		while (linkEnd < state.doc.content.size) {
			const nextPos = state.doc.resolve(linkEnd);
			const hasLinkMark = nextPos
				.marks()
				.find((mark: any) => mark.type.name === 'link' && mark.attrs.href === linkMark.attrs.href);
			if (!hasLinkMark) break;
			linkEnd++;
		}

		// Trigger visual effect if view is available
		if (view) {
			triggerLinkClickEffect(view, linkStart, linkEnd);
		}

		// Open the URL in system browser
		openUrl(linkMark.attrs.href).catch(console.error);
		return true;
	}

	return false;
};

// Enhanced Enter key handler for natural behavior
export const handleEnter = (schema: any) => (state: any, dispatch: any) => {
	const { selection } = state;
	const { $from } = selection;

	// If we're in a list item, use list-specific behavior
	if ($from.parent.type === schema.nodes.list_item) {
		return splitListItem(schema.nodes.list_item)(state, dispatch);
	}

	// For regular content, create new paragraph (natural behavior)
	return splitBlock(state, dispatch);
};

// Create comprehensive keymap with natural Enter behavior
export const createBaseKeymap = (schema: any, colorKeymap: any, toggleSourceView: () => void) => ({
	// Natural Enter behavior
	'Enter': handleEnter(schema),

	// Shift+Enter for line breaks (like Word/OneNote)
	'Shift-Enter': (state: any, dispatch: any) => {
		if (dispatch) {
			dispatch(state.tr.replaceSelectionWith(schema.nodes.hard_break.create()).scrollIntoView());
		}
		return true;
	},

	// Formatting shortcuts
	'Mod-b': toggleMark(schema.marks.strong),
	'Mod-i': toggleMark(schema.marks.em),
	'Mod-`': toggleMark(schema.marks.code),

	// Color shortcuts (spread from color plugin)
	...colorKeymap,

	// Heading shortcuts
	'Mod-Shift-1': setBlockType(schema.nodes.heading, { level: 1 }),
	'Mod-Shift-2': setBlockType(schema.nodes.heading, { level: 2 }),
	'Mod-Shift-3': setBlockType(schema.nodes.heading, { level: 3 }),
	'Mod-Shift-4': setBlockType(schema.nodes.heading, { level: 4 }),
	'Mod-Shift-5': setBlockType(schema.nodes.heading, { level: 5 }),
	'Mod-Shift-6': setBlockType(schema.nodes.heading, { level: 6 }),
	'Mod-Shift-0': setBlockType(schema.nodes.paragraph),

	// List shortcuts
	'Mod-Shift-8': wrapInList(schema.nodes.bullet_list),
	'Mod-Shift-9': wrapInList(schema.nodes.ordered_list),
	'Mod-[': liftListItem(schema.nodes.list_item),
	'Mod-]': sinkListItem(schema.nodes.list_item),

	// Blockquote
	'Mod-Shift-.': wrapIn(schema.nodes.blockquote),

	// History
	'Mod-z': undo,
	'Mod-y': redo,
	'Mod-Shift-z': redo,

	// Move line/block up and down
	'Shift-Alt-ArrowUp': moveLineUp,
	'Shift-Alt-ArrowDown': moveLineDown,
	'Alt-Shift-ArrowUp': moveLineUp,
	'Alt-Shift-ArrowDown': moveLineDown,
	'Alt-ArrowUp': moveLineUp,
	'Alt-ArrowDown': moveLineDown,

	// Copy selection/line up and down (Ctrl+Shift+Alt+Up/Down)
	'Mod-Shift-Alt-ArrowUp': copySelectionUp,
	'Mod-Shift-Alt-ArrowDown': copySelectionDown,

	// Open hyperlink at cursor
	'Mod-Enter': openLinkAtCursor,

	// Toggle source view
	'Mod-Shift-s': () => {
		toggleSourceView();
		return true;
	},
});
