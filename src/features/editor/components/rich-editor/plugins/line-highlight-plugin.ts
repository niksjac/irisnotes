import { Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

interface LineHighlightState {
	decorations: DecorationSet;
	lastBlockStart: number;
	lastBlockEnd: number;
}

// Optimized current line highlight plugin with caching
export const currentLineHighlightPlugin = new Plugin<LineHighlightState>({
	state: {
		init() {
			return {
				decorations: DecorationSet.empty,
				lastBlockStart: -1,
				lastBlockEnd: -1,
			};
		},
		apply(tr, value) {
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

			// Check if we're in the same block as before
			const sameBlock = blockStart === value.lastBlockStart && blockEnd === value.lastBlockEnd;

			// If selection hasn't moved to a different block and no document changes,
			// just map existing decorations
			if (sameBlock && !tr.docChanged) {
				return value;
			}

			// If document changed but we're in the same block, try to map decorations
			if (sameBlock && tr.docChanged) {
				const mappedDecorations = value.decorations.map(tr.mapping, tr.doc);

				// Verify the mapped decoration is still valid
				if (mappedDecorations !== value.decorations) {
					return {
						decorations: mappedDecorations,
						lastBlockStart: blockStart,
						lastBlockEnd: blockEnd,
					};
				}
			}

			// Selection moved to a different block or mapping failed - create new decoration
			try {
				const decoration = Decoration.node(blockStart, blockEnd, {
					class: 'editor-current-line-highlight',
				});

				return {
					decorations: DecorationSet.create(tr.doc, [decoration]),
					lastBlockStart: blockStart,
					lastBlockEnd: blockEnd,
				};
			} catch (error) {
				// Fallback to empty decorations if decoration creation fails
				console.warn('Failed to create line highlight decoration:', error);
				return {
					decorations: DecorationSet.empty,
					lastBlockStart: blockStart,
					lastBlockEnd: blockEnd,
				};
			}
		},
	},
	props: {
		decorations(state) {
			return this.getState(state)?.decorations;
		},
	},
});
