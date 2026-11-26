/**
 * Commands that rework a block of lines (editor right-click menu)
 *
 * They act on the lines the selection touches, or on the whole note when
 * nothing is selected. A line is a block node (ADR-0005), so lines keep their
 * formatting; code blocks, lists and tables count as one line each and are
 * never emptied or merged.
 *
 * Commands:
 * - removeEmptyLines: drop blank lines
 * - collapseEmptyLines: shrink runs of blank lines to one
 * - trimTrailingWhitespace: strip spaces and tabs at the end of each line
 * - sortLinesAscending / sortLinesDescending: sort by text (natural order, case-insensitive)
 * - reverseLines: reverse the order
 * - removeDuplicateLines: keep the first of lines with the same text
 * - joinLines: merge the lines into one, separated by a space
 *
 * Each returns false when it would change nothing, so a menu can disable it.
 */

import { type Command, type EditorState, type Transaction, TextSelection } from "prosemirror-state";
import { Fragment, type Node as PMNode } from "prosemirror-model";

interface LineRange {
	/** Position before the first line */
	from: number;
	/** Position after the last line */
	to: number;
	/** The node holding the lines (doc, list item, details, …) */
	container: PMNode;
	firstIndex: number;
	lines: PMNode[];
}

/** The sibling blocks the selection touches, or every top-level block if it's empty */
export function getLineRange(state: EditorState): LineRange | null {
	const { selection, doc } = state;
	if (selection.empty) {
		const lines: PMNode[] = [];
		doc.forEach((node) => lines.push(node));
		return { from: 0, to: doc.content.size, container: doc, firstIndex: 0, lines };
	}

	const { $from, $to } = selection;
	let depth = $from.sharedDepth($to.pos);
	if ($from.node(depth).inlineContent) depth--;
	if (depth < 0) return null;
	const container = $from.node(depth);

	const firstIndex = $from.index(depth);
	let lastIndex = Math.min($to.index(depth), container.childCount - 1);
	// A selection ending at the very start of a line (Shift+Down, triple-click)
	// doesn't include that line
	if (lastIndex > firstIndex && $to.pos <= $to.posAtIndex(lastIndex, depth) + 1) lastIndex--;

	const lines: PMNode[] = [];
	for (let i = firstIndex; i <= lastIndex; i++) lines.push(container.child(i));
	if (lines.length === 0) return null;

	const from = $from.posAtIndex(firstIndex, depth);
	const to = from + lines.reduce((size, line) => size + line.nodeSize, 0);
	return { from, to, container, firstIndex, lines };
}

/** A plain text line: a textblock that isn't a code block */
function isTextLine(node: PMNode): boolean {
	return node.isTextblock && node.type.name !== "code_block";
}

/** Empty or whitespace-only text line (an image counts as content) */
function isBlankLine(node: PMNode): boolean {
	if (!isTextLine(node)) return false;
	let blank = true;
	node.forEach((child) => {
		if (!child.isText || (child.text ?? "").trim() !== "") blank = false;
	});
	return blank;
}

/**
 * Replace the range's lines with `next`. Returns false when nothing changes or
 * the container wouldn't accept the result (e.g. a note must start with a line).
 */
function replaceLines(
	state: EditorState,
	dispatch: ((tr: Transaction) => void) | undefined,
	range: LineRange,
	next: PMNode[],
): boolean {
	if (next.length === range.lines.length && next.every((node, i) => node === range.lines[i])) return false;

	let content = Fragment.from(next);
	const lastIndex = range.firstIndex + range.lines.length;
	if (next.length === 0 && !range.container.canReplace(range.firstIndex, lastIndex, content)) {
		// Removing every line: leave one empty line behind
		content = Fragment.from(state.schema.nodes.paragraph!.create());
	}
	if (!range.container.canReplace(range.firstIndex, lastIndex, content)) return false;

	if (dispatch) {
		const tr = state.tr.replaceWith(range.from, range.to, content);
		if (!state.selection.empty) {
			// Keep the reworked lines selected so commands can be chained
			const end = range.from + content.size;
			tr.setSelection(TextSelection.between(tr.doc.resolve(range.from), tr.doc.resolve(end)));
		}
		dispatch(tr.scrollIntoView());
	}
	return true;
}

/** Wrap a pure function over the selected lines as a command */
function linesCommand(transform: (lines: PMNode[], state: EditorState) => PMNode[]): Command {
	return (state, dispatch) => {
		const range = getLineRange(state);
		if (!range) return false;
		return replaceLines(state, dispatch, range, transform(range.lines, state));
	};
}

export const removeEmptyLines = linesCommand((lines) => lines.filter((line) => !isBlankLine(line)));

export const collapseEmptyLines = linesCommand((lines) =>
	lines.filter((line, i) => !(isBlankLine(line) && i > 0 && isBlankLine(lines[i - 1]!))),
);

export const trimTrailingWhitespace = linesCommand((lines) =>
	lines.map((line) => {
		if (!isTextLine(line) || line.childCount === 0) return line;
		const last = line.lastChild!;
		if (!last.isText) return line;
		const trailing = (last.text ?? "").match(/[ \t\u00a0]+$/)?.[0].length ?? 0;
		if (trailing === 0) return line;
		return line.copy(line.content.cut(0, line.content.size - trailing));
	}),
);

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

function sortLines(direction: 1 | -1) {
	return linesCommand((lines) => {
		// Stable: already sorted lines come back unchanged, which disables the command
		return lines.slice().sort((a, b) => direction * collator.compare(a.textContent, b.textContent));
	});
}

export const sortLinesAscending = sortLines(1);
export const sortLinesDescending = sortLines(-1);

export const reverseLines = linesCommand((lines) => (lines.length < 2 ? lines : lines.slice().reverse()));

/** Blank lines are kept: they're spacing, not duplicates */
export const removeDuplicateLines = linesCommand((lines) => {
	const seen = new Set<string>();
	return lines.filter((line) => {
		if (isBlankLine(line)) return true;
		const key = line.textContent;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
});

/**
 * Join the selected text lines into the first one, separated by single spaces.
 * Blank lines are dropped; needs at least two text lines and nothing else.
 */
export const joinLines = linesCommand((lines, state) => {
	const text = lines.filter((line) => !isBlankLine(line));
	if (text.length < 2 || !text.every(isTextLine)) return lines;
	const parts: PMNode[] = [];
	text.forEach((line, i) => {
		const inline: PMNode[] = [];
		line.forEach((child) => inline.push(child));
		// Trim the seam so exactly one space joins the lines
		const first = inline[0];
		if (i > 0 && first?.isText) {
			const trimmed = (first.text ?? "").replace(/^\s+/, "");
			if (trimmed) inline[0] = state.schema.text(trimmed, first.marks);
			else inline.shift();
		}
		const last = inline[inline.length - 1];
		if (i < text.length - 1 && last?.isText) {
			const trimmed = (last.text ?? "").replace(/\s+$/, "");
			if (trimmed) inline[inline.length - 1] = state.schema.text(trimmed, last.marks);
			else inline.pop();
		}
		parts.push(...inline);
		if (i < text.length - 1) parts.push(state.schema.text(" "));
	});
	return [text[0]!.copy(Fragment.from(parts))];
});
