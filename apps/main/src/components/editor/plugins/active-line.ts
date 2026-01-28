/**
 * Active Line Highlight Plugin
 *
 * Highlights the block (paragraph, heading, list item, etc.) that contains
 * the cursor, similar to the "highlight active line" feature in code editors.
 *
 * Uses a node decoration on the current block to apply a background highlight.
 * Styling is controlled via CSS custom properties.
 */

import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

export const activeLinePluginKey = new PluginKey("activeLine");

/**
 * Creates a plugin that highlights the block containing the cursor.
 */
export function activeLinePlugin(): Plugin {
	return new Plugin({
		key: activeLinePluginKey,

		props: {
			decorations(state) {
				const { selection, doc } = state;
				const { $from, empty } = selection;

				// Only show active line when cursor is collapsed (no selection range)
				// This prevents the highlight from appearing during text selection
				if (!empty) {
					return DecorationSet.empty;
				}

				// Find the block node that contains the cursor
				// Start from the deepest block and work up to find the "line" level
				let blockPos: number | null = null;
				let blockNode = null;

				// Walk up from cursor position to find the containing block
				for (let depth = $from.depth; depth > 0; depth--) {
					const node = $from.node(depth);
					if (node.isBlock) {
						// For list items, we want to highlight the list_item, not the paragraph inside
						// For other blocks (paragraphs, headings), highlight them directly
						blockPos = $from.before(depth);
						blockNode = node;
						
						// Stop at certain "line-level" nodes - don't go higher
						const nodeType = node.type.name;
						if (
							nodeType === "paragraph" ||
							nodeType === "heading" ||
							nodeType === "code_block" ||
							nodeType === "blockquote" ||
							nodeType === "list_item"
						) {
							break;
						}
					}
				}

				if (blockPos === null || !blockNode) {
					return DecorationSet.empty;
				}

				// Create a node decoration for the block
				const decoration = Decoration.node(
					blockPos,
					blockPos + blockNode.nodeSize,
					{
						class: "pm-active-line",
					}
				);

				return DecorationSet.create(doc, [decoration]);
			},
		},
	});
}
