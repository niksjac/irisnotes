import { Plugin, PluginKey } from "prosemirror-state";
import type { EditorState, Transaction } from "prosemirror-state";
import type { Schema, MarkType, Node as ProseMirrorNode } from "prosemirror-model";
import { openUrl } from "@tauri-apps/plugin-opener";

/**
 * Regex to match URLs in text
 * Matches: http://, https://, www.
 */
const URL_REGEX = /(https?:\/\/|www\.)[^\s<>[\]{}|\\^`"']+/g;

/**
 * Simple URL validation - checks if string looks like a URL
 */
function isValidUrl(text: string): boolean {
	return /^(https?:\/\/|www\.)[^\s]+$/.test(text);
}

export const autolinkPluginKey = new PluginKey("autolink");

/**
 * Find all URLs in a text block
 */
function findUrlsInText(
	text: string,
	baseOffset: number
): Array<{ from: number; to: number; url: string }> {
	const urls: Array<{ from: number; to: number; url: string }> = [];
	URL_REGEX.lastIndex = 0;
	let match: RegExpExecArray | null;
	while ((match = URL_REGEX.exec(text)) !== null) {
		urls.push({
			from: baseOffset + match.index,
			to: baseOffset + match.index + match[0].length,
			url: match[0],
		});
	}
	return urls;
}

/**
 * Find URL at a position (cursor can be anywhere within the URL)
 */
function findUrlAtPosition(
	doc: ProseMirrorNode,
	pos: number
): { from: number; to: number; url: string } | null {
	const $pos = doc.resolve(pos);
	const parent = $pos.parent;

	if (!parent.isTextblock) return null;

	const parentStart = $pos.start();
	const text = parent.textContent;
	const cursorInParent = pos - parentStart;

	URL_REGEX.lastIndex = 0;
	let match: RegExpExecArray | null;
	while ((match = URL_REGEX.exec(text)) !== null) {
		const matchStart = match.index;
		const matchEnd = matchStart + match[0].length;

		if (cursorInParent >= matchStart && cursorInParent <= matchEnd) {
			return {
				from: parentStart + matchStart,
				to: parentStart + matchEnd,
				url: match[0],
			};
		}
	}

	return null;
}

/**
 * Find the range of a link mark at a given position
 * Fixed: Use > for nodeStart to properly handle backspace at end of link
 */
function findLinkMarkRange(
	doc: ProseMirrorNode,
	pos: number,
	linkMark: MarkType
): { from: number; to: number } | null {
	const result = findLinkAtPosition(doc, pos, linkMark);
	return result ? { from: result.from, to: result.to } : null;
}

/**
 * Find link mark at position, returning range and href
 * Robust version that traverses nodes instead of relying on $pos.marks()
 */
function findLinkAtPosition(
	doc: ProseMirrorNode,
	pos: number,
	linkMark: MarkType
): { from: number; to: number; href: string } | null {
	const $pos = doc.resolve(pos);
	const parent = $pos.parent;
	if (!parent.isTextblock) return null;

	const parentStart = $pos.start();
	const cursorOffset = pos - parentStart;

	let linkFrom = -1;
	let linkTo = -1;
	let foundLink = false;
	let linkHref = "";

	parent.forEach((node, offset) => {
		if (node.isText) {
			const linkMarkInstance = linkMark.isInSet(node.marks);
			const nodeStart = offset;
			const nodeEnd = offset + node.nodeSize;

			if (linkMarkInstance) {
				// If this is a continuation of the same link range
				if (linkFrom === -1 || nodeStart === linkTo) {
					if (linkFrom === -1) linkFrom = nodeStart;
					linkTo = nodeEnd;
					// Get href from the mark
					if (linkMarkInstance.attrs.href) {
						linkHref = linkMarkInstance.attrs.href as string;
					}
				}

				// Check if cursor is within this link (inclusive for open link, backspace uses separate check)
				if (cursorOffset >= nodeStart && cursorOffset <= nodeEnd) {
					foundLink = true;
				}
			} else {
				// Reset if we hit non-link text and haven't found our position yet
				if (!foundLink && cursorOffset > nodeEnd) {
					linkFrom = -1;
					linkTo = -1;
					linkHref = "";
				}
			}
		}
	});

	if (!foundLink || linkFrom === -1 || !linkHref) return null;

	return {
		from: parentStart + linkFrom,
		to: parentStart + linkTo,
		href: linkHref,
	};
}

/**
 * Command to open link at cursor position
 * Used for Alt+Enter keybinding
 * Uses same detection logic as Ctrl+Click which is known to work
 */
export function openLinkAtCursor(schema: Schema) {
	const linkMark = schema.marks.link;
	if (!linkMark) return () => false;

	return (
		state: EditorState,
		_dispatch?: (tr: Transaction) => void
	): boolean => {
		const { from } = state.selection;
		
		// Use the same approach as handleClick which works reliably
		const $pos = state.doc.resolve(from);
		const marks = $pos.marks();
		const linkMarkInstance = marks.find((m) => m.type === linkMark);

		if (linkMarkInstance?.attrs.href) {
			openUrl(linkMarkInstance.attrs.href as string).catch(() => {});
			return true;
		}
		return false;
	};
}

/**
 * Plugin that handles:
 * 1. Auto-linking URLs when you type space or enter after them (via appendTransaction)
 * 2. Removing link when you backspace at the end (first backspace removes link only)
 * 3. Making links clickable (Ctrl+Click)
 * 
 * Uses appendTransaction pattern (recommended by ProseMirror/Tiptap) instead of
 * setTimeout in handleTextInput which can cause race conditions with stale state.
 */
export function autolinkPlugin(schema: Schema): Plugin[] {
	const linkMark = schema.marks.link;
	if (!linkMark) {
		console.warn("Schema has no link mark, autolink plugin disabled");
		return [];
	}

	const autolinkHandler = new Plugin({
		key: autolinkPluginKey,

		/**
		 * appendTransaction is the recommended pattern for auto-linking.
		 * It runs after all transactions are applied and has access to the new state.
		 * This avoids the race conditions of setTimeout in handleTextInput.
		 */
		appendTransaction(
			transactions: readonly Transaction[],
			oldState: EditorState,
			newState: EditorState
		): Transaction | null {
			// Only process if document changed
			const docChanged = transactions.some((tr) => tr.docChanged);
			if (!docChanged || oldState.doc.eq(newState.doc)) {
				return null;
			}

			// Check if autolink should be prevented (e.g., when manually setting links)
			const preventAutolink = transactions.some((tr) =>
				tr.getMeta("preventAutolink")
			);
			if (preventAutolink) {
				return null;
			}

			const { tr } = newState;
			let modified = false;

			// Detect if Enter was pressed (paragraph split)
			// When Enter is pressed, selection moves to start of new block
			const { $from: newFrom } = newState.selection;
			const { $from: oldFrom } = oldState.selection;
			const enterPressed =
				newFrom.parentOffset === 0 &&
				oldFrom.parentOffset > 0 &&
				newFrom.pos !== oldFrom.pos;

			// If Enter was pressed, check the PREVIOUS block for URLs to linkify
			if (enterPressed) {
				// Get the position of the block before current selection
				const blockBefore = newFrom.before();
				if (blockBefore > 0) {
					// Resolve to find the previous text block
					const $blockBefore = newState.doc.resolve(blockBefore);
					const prevBlock = $blockBefore.nodeBefore;

					if (prevBlock?.isTextblock) {
						const prevText = prevBlock.textContent;
						const prevBlockStart = blockBefore - prevBlock.nodeSize + 1;

						const urls = findUrlsInText(prevText, prevBlockStart);
						for (const urlInfo of urls) {
							// Check if already has link mark
							const hasLink = newState.doc.rangeHasMark(
								urlInfo.from,
								urlInfo.to,
								linkMark
							);
							if (hasLink) continue;

							// Check if URL ends at end of the block
							const urlEndInBlock = urlInfo.to - prevBlockStart;
							if (urlEndInBlock === prevText.length) {
								const href = urlInfo.url.startsWith("www.")
									? `https://${urlInfo.url}`
									: urlInfo.url;

								tr.addMark(urlInfo.from, urlInfo.to, linkMark.create({ href }));
								modified = true;
							}
						}
					}
				}
			}

			// Also check all text blocks for URLs followed by whitespace (space typed)
			newState.doc.descendants((node, pos) => {
				if (!node.isTextblock) return;

				const text = node.textContent;
				if (!text) return;

				// Check if text has whitespace (space was typed after URL)
				const baseOffset = pos + 1;

				// Find URLs in the text
				const urls = findUrlsInText(text, baseOffset);

				for (const urlInfo of urls) {
					// Check if already has link mark
					const hasLink = newState.doc.rangeHasMark(
						urlInfo.from,
						urlInfo.to,
						linkMark
					);
					if (hasLink) continue;

					// Check if there's whitespace immediately after the URL
					const urlEndInBlock = urlInfo.to - baseOffset;
					const charAfterUrl = text[urlEndInBlock];

					if (charAfterUrl && /\s/.test(charAfterUrl)) {
						const href = urlInfo.url.startsWith("www.")
							? `https://${urlInfo.url}`
							: urlInfo.url;

						tr.addMark(urlInfo.from, urlInfo.to, linkMark.create({ href }));
						modified = true;
					}
				}
			});

			if (!modified) {
				return null;
			}

			// Preserve stored marks from the new state (important for mark preservation on Enter)
			if (newState.storedMarks) {
				tr.setStoredMarks(newState.storedMarks);
			}

			// Add scrollIntoView for better UX
			return tr.scrollIntoView();
		},

		props: {
			handleKeyDown(view, event) {
				const { from } = view.state.selection;

				// Backspace at end of link: remove the link mark ONLY (don't delete character)
				if (event.key === "Backspace" && !event.ctrlKey && !event.metaKey) {
					if (from > 1) {
						const linkRange = findLinkMarkRange(view.state.doc, from, linkMark);

						if (linkRange && linkRange.to === from) {
							// Remove the mark only, prevent character deletion
							const tr = view.state.tr
								.removeMark(linkRange.from, linkRange.to, linkMark)
								.setMeta("preventAutolink", true);
							view.dispatch(tr);
							// Return TRUE to prevent backspace from deleting character
							return true;
						}
					}
				}

				return false;
			},

			handleClick(view, pos, event) {
				// Ctrl+Click to open link
				if (!event.ctrlKey && !event.metaKey) return false;

				const $pos = view.state.doc.resolve(pos);
				const marks = $pos.marks();
				const linkMarkInstance = marks.find((m) => m.type === linkMark);

				if (linkMarkInstance?.attrs.href) {
					openUrl(linkMarkInstance.attrs.href as string).catch(() => {});
					return true;
				}

				return false;
			},
		},
	});

	return [autolinkHandler];
}

/**
 * Command to manually convert selected text or word at cursor to a link
 * if it looks like a URL
 */
export function linkifySelection(schema: Schema) {
	const linkMark = schema.marks.link;
	if (!linkMark) return () => false;

	return (
		state: import("prosemirror-state").EditorState,
		dispatch?: (tr: import("prosemirror-state").Transaction) => void
	) => {
		const { from, to, empty } = state.selection;

		if (empty) {
			// No selection: find URL at cursor position
			const urlInfo = findUrlAtPosition(state.doc, from);
			if (!urlInfo) return false;

			// Check if already has link mark
			const hasLink = state.doc.rangeHasMark(urlInfo.from, urlInfo.to, linkMark);
			if (hasLink) return false;

			if (dispatch) {
				const href = urlInfo.url.startsWith("www.")
					? `https://${urlInfo.url}`
					: urlInfo.url;
				const tr = state.tr.addMark(
					urlInfo.from,
					urlInfo.to,
					linkMark.create({ href })
				);
				dispatch(tr);
			}
			return true;
		}

		// Has selection: check if it's a URL
		const textToCheck = state.doc.textBetween(from, to);
		if (!isValidUrl(textToCheck)) return false;

		if (dispatch) {
			const href = textToCheck.startsWith("www.")
				? `https://${textToCheck}`
				: textToCheck;
			const tr = state.tr.addMark(from, to, linkMark.create({ href }));
			dispatch(tr);
		}

		return true;
	};
}

/**
 * Command to remove link mark from selection or link at cursor
 */
export function unlinkSelection(schema: Schema) {
	const linkMark = schema.marks.link;
	if (!linkMark) return () => false;

	return (
		state: import("prosemirror-state").EditorState,
		dispatch?: (tr: import("prosemirror-state").Transaction) => void
	) => {
		const { from, to, empty } = state.selection;

		if (empty) {
			// Find link at cursor
			const linkRange = findLinkMarkRange(state.doc, from, linkMark);
			if (!linkRange) return false;

			if (dispatch) {
				const tr = state.tr.removeMark(linkRange.from, linkRange.to, linkMark);
				dispatch(tr);
			}
			return true;
		}

		// Has selection: remove link from selection
		if (!state.doc.rangeHasMark(from, to, linkMark)) return false;

		if (dispatch) {
			const tr = state.tr.removeMark(from, to, linkMark);
			dispatch(tr);
		}
		return true;
	};
}
