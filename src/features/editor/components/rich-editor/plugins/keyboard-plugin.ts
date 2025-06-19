import { toggleMark, setBlockType, wrapIn, splitBlock } from 'prosemirror-commands';
import { wrapInList, splitListItem, liftListItem, sinkListItem } from 'prosemirror-schema-list';
import { undo, redo } from 'prosemirror-history';
import { openUrl } from '@tauri-apps/plugin-opener';

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

    let t = tr
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
    let t = tr
      .delete(lastBlockPos, nextBlockEnd) // Remove next block
      .insert(firstBlockPos, nextBlock.copy(nextBlock.content)); // Insert it before selected range

    dispatch(t.scrollIntoView());
  }
  return true;
};

// Open hyperlink at cursor position
export const openLinkAtCursor = (state: any, _dispatch: any) => {
  const { selection } = state;
  const { $from } = selection;

  // Check if cursor is inside a link mark
  const linkMark = $from.marks().find((mark: any) => mark.type.name === 'link');

  if (linkMark && linkMark.attrs.href) {
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

  // Open hyperlink at cursor
  'Mod-Enter': openLinkAtCursor,

  // Toggle source view
  'Mod-Shift-s': () => {
    toggleSourceView();
    return true;
  },
});