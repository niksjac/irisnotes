/**
 * Tight Selection Plugin
 *
 * Replaces native browser selection (which extends to viewport edge)
 * with custom decoration-based selection that only highlights actual text.
 *
 * This matches the behavior of VS Code, Notion, and other modern editors.
 */

import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

export const tightSelectionPluginKey = new PluginKey("tightSelection");

/**
 * Creates a plugin that renders selection as inline decorations
 * instead of using native browser selection.
 */
export function tightSelectionPlugin(): Plugin {
	return new Plugin({
		key: tightSelectionPluginKey,

		props: {
			// Add class to hide native selection
			attributes: {
				class: "tight-selection-enabled",
			},

			decorations(state) {
				const { selection } = state;
				const { from, to, empty } = selection;

				// No decorations for empty selection (just cursor)
				if (empty) {
					return DecorationSet.empty;
				}

				const decorations: Decoration[] = [];

				// Walk through each node in the selection range
				state.doc.nodesBetween(from, to, (node, pos) => {
					// Only decorate text nodes
					if (node.isText) {
						const start = Math.max(from, pos);
						const end = Math.min(to, pos + node.nodeSize);

						// Only create decoration if there's actual overlap
						if (start < end) {
							decorations.push(
								Decoration.inline(start, end, {
									class: "pm-tight-selection",
								})
							);
						}
					}

					// Also handle inline nodes (like images) that might be selected
					if (node.isInline && !node.isText) {
						const nodeStart = pos;
						const nodeEnd = pos + node.nodeSize;

						if (from <= nodeStart && to >= nodeEnd) {
							decorations.push(
								Decoration.inline(nodeStart, nodeEnd, {
									class: "pm-tight-selection pm-tight-selection-node",
								})
							);
						}
					}

					return true; // Continue traversing
				});

				return DecorationSet.create(state.doc, decorations);
			},
		},
	});
}
