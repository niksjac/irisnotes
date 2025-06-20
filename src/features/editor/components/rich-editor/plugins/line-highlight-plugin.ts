import { Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

// Current line highlight plugin
export const currentLineHighlightPlugin = new Plugin({
  state: {
    init() {
      return DecorationSet.empty;
    },
    apply(tr, _decorationSet) {
      // Always update decorations to ensure proper clearing and re-application
      const { selection } = tr;
      const { $from } = selection;

      // Find the current block position
      let blockStart = $from.start($from.depth);
      let blockEnd = $from.end($from.depth);

      // For block-level nodes, use their full range
      if ($from.parent.isBlock) {
        blockStart = $from.before($from.depth);
        blockEnd = $from.after($from.depth);
      }

      // Create decoration for the current block
      const decoration = Decoration.node(blockStart, blockEnd, {
        class: 'editor-current-line-highlight'
      });

      return DecorationSet.create(tr.doc, [decoration]);
    }
  },
  props: {
    decorations(state) {
      return this.getState(state);
    }
  }
});