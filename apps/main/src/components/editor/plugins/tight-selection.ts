/**
 * Tight Selection Plugin
 *
 * Replaces native browser selection (which extends to viewport edge)
 * with custom decoration-based selection that only highlights actual text.
 * Also provides visual indicators for empty lines within a selection.
 *
 * This matches the behavior of VS Code, Notion, and other modern editors.
 */

import { Plugin, PluginKey } from "prosemirror-state";
import type { Node as PMNode, ResolvedPos } from "prosemirror-model";
import { Decoration, DecorationSet } from "prosemirror-view";

export const tightSelectionPluginKey = new PluginKey("tightSelection");

/**
 * Check if a node is an empty block (no text content)
 */
function isEmptyBlock(node: any): boolean {
	return node.isBlock && node.content.size === 0;
}

/**
 * Check if a node is a textblock (paragraph, heading, etc.)
 */
function isTextBlock(node: any): boolean {
	return node.isTextblock;
}

function getAncestor($pos: ResolvedPos, nodeTypeName: string): { node: PMNode; pos: number } | null {
	for (let depth = $pos.depth; depth > 0; depth--) {
		const node = $pos.node(depth);
		if (node.type.name === nodeTypeName) {
			return { node, pos: $pos.before(depth) };
		}
	}

	return null;
}

function getFirstTextPos(node: PMNode, absolutePos: number): number | null {
	let firstTextPos: number | null = null;
	node.descendants((child, relativePos) => {
		if (child.isText) {
			firstTextPos = absolutePos + 1 + relativePos;
			return false;
		}

		return true;
	});

	return firstTextPos;
}

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
				// Track list items whose selection starts at the first text position
				const listItemsWithStartSelection = new Set<number>();
				// Track textblocks with selected content and their selection bounds
				const selectedTextBlocks = new Map<number, { start: number; end: number; nodeEnd: number }>();

				// Walk through each node in the selection range
				state.doc.nodesBetween(from, to, (node, pos) => {
					// Track textblocks (paragraphs, headings) with selected content
					if (isTextBlock(node) && !isEmptyBlock(node)) {
						const nodeStart = pos;
						const nodeEnd = pos + node.nodeSize;
						if (from < nodeEnd && to > nodeStart) {
							// Calculate the text selection bounds within this block
							const textStart = Math.max(from, nodeStart + 1); // +1 to skip into the block
							const textEnd = Math.min(to, nodeEnd - 1); // -1 to stay within the block
							selectedTextBlocks.set(pos, { start: textStart, end: textEnd, nodeEnd });
						}
					}

					// Only decorate text nodes with inline markers (for positioning info)
					if (node.isText) {
						const start = Math.max(from, pos);
						const end = Math.min(to, pos + node.nodeSize);

						// Only create decoration if there's actual overlap
						if (start < end) {
							const $pos = state.doc.resolve(pos);
							const listItem = start === pos
								? getAncestor($pos, "list_item")
								: null;
							const listItemPos = listItem && getFirstTextPos(listItem.node, listItem.pos) === pos
								? listItem.pos
								: null;
							const className = listItemPos !== null
								? "pm-tight-selection pm-tight-selection-list-start"
								: "pm-tight-selection";

							if (listItemPos !== null) {
								listItemsWithStartSelection.add(listItemPos);
							}

							decorations.push(
								Decoration.inline(start, end, {
									class: className,
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

					// Handle empty blocks (paragraphs, headings, etc.) within selection
					// These need a node decoration since they have no text to decorate
					if (isEmptyBlock(node)) {
						const nodeStart = pos;
						const nodeEnd = pos + node.nodeSize;

						// Check if this empty block is within the selection
						// (either fully or partially - for empty blocks they're the same)
						if (from < nodeEnd && to > nodeStart) {
							decorations.push(
								Decoration.node(nodeStart, nodeEnd, {
									class: "pm-tight-selection-empty-line",
								})
							);
						}
					}

					return true; // Continue traversing
				});

				// Add decorations for selected list items whose selection starts at text start.
				for (const pos of listItemsWithStartSelection) {
					const node = state.doc.nodeAt(pos);
					if (node) {
						decorations.push(
							Decoration.node(pos, pos + node.nodeSize, {
								class: "pm-tight-selection-list-item",
							})
						);
					}
				}

				// Add node decorations for textblocks with selected content
				// This provides a full-height background for each line with selection
				for (const [pos] of selectedTextBlocks) {
					const node = state.doc.nodeAt(pos);
					if (node) {
						decorations.push(
							Decoration.node(pos, pos + node.nodeSize, {
								class: "pm-tight-selection-line",
							})
						);
					}
				}

				return DecorationSet.create(state.doc, decorations);
			},
		},
	});
}
