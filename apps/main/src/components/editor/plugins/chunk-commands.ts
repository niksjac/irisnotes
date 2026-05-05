import { EditorSelection } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import type { Node as PMNode } from "prosemirror-model";
import { TextSelection } from "prosemirror-state";
import type { Command as ProseMirrorCommand } from "prosemirror-state";

type Direction = "backward" | "forward";
type TargetBoundary = "end" | "start";

interface ChunkRange {
	from: number;
	to: number;
}

interface TextLine {
	from: number;
	to: number;
	text: string;
}

interface ParagraphJumpTarget {
	lineIndex: number;
	boundary: TargetBoundary;
}

const FORWARD_WHITESPACE = /^[^\S\r\n]+/u;
const FORWARD_ALPHANUMERIC = /^[\p{L}\p{N}]+/u;
const FORWARD_PUNCTUATION = /^[^\s\p{L}\p{N}]+/u;
const BACKWARD_WHITESPACE = /[^\S\r\n]+$/u;
const BACKWARD_ALPHANUMERIC = /[\p{L}\p{N}]+$/u;
const BACKWARD_PUNCTUATION = /[^\s\p{L}\p{N}]+$/u;

export function getDeleteChunkRange(text: string, offset: number, direction: Direction): ChunkRange | null {
	const boundedOffset = Math.max(0, Math.min(offset, text.length));

	if (direction === "forward") {
		if (boundedOffset >= text.length) return null;

		const textAfter = text.slice(boundedOffset);
		const match = FORWARD_WHITESPACE.exec(textAfter)
			?? FORWARD_ALPHANUMERIC.exec(textAfter)
			?? FORWARD_PUNCTUATION.exec(textAfter);

		return match ? { from: boundedOffset, to: boundedOffset + match[0].length } : null;
	}

	if (boundedOffset <= 0) return null;

	const textBefore = text.slice(0, boundedOffset);
	const match = BACKWARD_WHITESPACE.exec(textBefore)
		?? BACKWARD_ALPHANUMERIC.exec(textBefore)
		?? BACKWARD_PUNCTUATION.exec(textBefore);

	return match ? { from: boundedOffset - match[0].length, to: boundedOffset } : null;
}

function deleteSelectionOrChunkProseMirror(direction: Direction): ProseMirrorCommand {
	return (state, dispatch) => {
		const { selection } = state;

		if (!selection.empty) {
			if (dispatch) {
				dispatch(state.tr.deleteSelection().scrollIntoView());
			}
			return true;
		}

		const { $from } = selection;
		if (!$from.parent.isTextblock) return false;

		const contentText = textblockContentForChunking($from.parent);
		const range = getDeleteChunkRange(contentText, $from.parentOffset, direction);

		if (range && dispatch) {
			const lineStart = $from.start();
			dispatch(state.tr.delete(lineStart + range.from, lineStart + range.to).scrollIntoView());
		}

		return true;
	};
}

function textblockContentForChunking(textblock: PMNode): string {
	let contentText = "";

	textblock.forEach((childNode) => {
		contentText += childNode.isText ? childNode.text ?? "" : "\n";
	});

	return contentText;
}

function deleteSelectionOrChunkCodeMirror(view: EditorView, direction: Direction): boolean {
	const { state } = view;
	const selection = state.selection.main;

	if (!selection.empty) {
		view.dispatch({
			changes: { from: selection.from, to: selection.to },
			scrollIntoView: true,
		});
		return true;
	}

	const line = state.doc.lineAt(selection.from);
	const range = getDeleteChunkRange(line.text, selection.from - line.from, direction);

	if (range) {
		const from = line.from + range.from;
		view.dispatch({
			changes: { from, to: line.from + range.to },
			selection: EditorSelection.cursor(from),
			scrollIntoView: true,
		});
	}

	return true;
}

function isEmptyLine(line: TextLine): boolean {
	return line.text.trim().length === 0;
}

export function getParagraphJumpTarget(
	lines: readonly TextLine[],
	currentLineIndex: number,
	cursorPosition: number,
	direction: "down" | "up",
): ParagraphJumpTarget | null {
	if (lines.length === 0) return null;

	const currentLine = lines[currentLineIndex];
	if (!currentLine) return null;

	if (direction === "down") {
		if (isEmptyLine(currentLine)) {
			for (let lineIndex = currentLineIndex + 1; lineIndex < lines.length; lineIndex++) {
				if (isEmptyLine(lines[lineIndex]!)) return { lineIndex, boundary: "start" };
			}
			return { lineIndex: lines.length - 1, boundary: "end" };
		}

		let lineIndex = currentLineIndex + 1;
		while (lineIndex < lines.length && !isEmptyLine(lines[lineIndex]!)) lineIndex++;
		while (lineIndex < lines.length && isEmptyLine(lines[lineIndex]!)) lineIndex++;

		return lineIndex < lines.length
			? { lineIndex, boundary: "start" }
			: { lineIndex: lines.length - 1, boundary: "end" };
	}

	if (isEmptyLine(currentLine)) {
		for (let lineIndex = currentLineIndex - 1; lineIndex >= 0; lineIndex--) {
			if (isEmptyLine(lines[lineIndex]!)) return { lineIndex, boundary: "start" };
		}
		return { lineIndex: 0, boundary: "start" };
	}

	let paragraphStartIndex = currentLineIndex;
	while (paragraphStartIndex > 0 && !isEmptyLine(lines[paragraphStartIndex - 1]!)) {
		paragraphStartIndex--;
	}

	const paragraphStart = lines[paragraphStartIndex]!;
	if (currentLineIndex !== paragraphStartIndex || cursorPosition > paragraphStart.from) {
		return { lineIndex: paragraphStartIndex, boundary: "start" };
	}

	let lineIndex = paragraphStartIndex - 1;
	while (lineIndex >= 0 && isEmptyLine(lines[lineIndex]!)) lineIndex--;
	while (lineIndex > 0 && !isEmptyLine(lines[lineIndex - 1]!)) lineIndex--;

	return { lineIndex: Math.max(0, lineIndex), boundary: "start" };
}

function getTargetPosition(lines: readonly TextLine[], target: ParagraphJumpTarget): number | null {
	const line = lines[target.lineIndex];
	if (!line) return null;
	return target.boundary === "start" ? line.from : line.to;
}

function collectProseMirrorTextLines(doc: PMNode): TextLine[] {
	const lines: TextLine[] = [];

	doc.descendants((node, pos) => {
		if (!node.isTextblock) return true;

		const from = pos + 1;
		lines.push({
			from,
			to: from + node.content.size,
			text: node.textContent,
		});
		return false;
	});

	return lines;
}

function findCurrentLineIndex(lines: readonly TextLine[], cursorPosition: number): number {
	const exactIndex = lines.findIndex((line) => cursorPosition >= line.from && cursorPosition <= line.to);
	if (exactIndex >= 0) return exactIndex;

	const nextIndex = lines.findIndex((line) => cursorPosition < line.from);
	return nextIndex >= 0 ? nextIndex : lines.length - 1;
}

function jumpParagraphProseMirror(direction: "down" | "up"): ProseMirrorCommand {
	return (state, dispatch) => {
		const lines = collectProseMirrorTextLines(state.doc);
		if (lines.length === 0) return false;

		const cursorPosition = state.selection.head;
		const currentLineIndex = findCurrentLineIndex(lines, cursorPosition);
		const target = getParagraphJumpTarget(lines, currentLineIndex, cursorPosition, direction);
		const targetPosition = target ? getTargetPosition(lines, target) : null;
		if (targetPosition === null || targetPosition === cursorPosition) return true;

		if (dispatch) {
			dispatch(state.tr.setSelection(TextSelection.create(state.doc, targetPosition)).scrollIntoView());
		}

		return true;
	};
}

function collectCodeMirrorTextLines(view: EditorView): TextLine[] {
	const lines: TextLine[] = [];
	const { doc } = view.state;

	for (let lineNumber = 1; lineNumber <= doc.lines; lineNumber++) {
		const line = doc.line(lineNumber);
		lines.push({ from: line.from, to: line.to, text: line.text });
	}

	return lines;
}

function jumpParagraphCodeMirror(view: EditorView, direction: "down" | "up"): boolean {
	const selection = view.state.selection.main;
	const lines = collectCodeMirrorTextLines(view);
	const currentLine = view.state.doc.lineAt(selection.head);
	const currentLineIndex = currentLine.number - 1;
	const target = getParagraphJumpTarget(lines, currentLineIndex, selection.head, direction);
	const targetPosition = target ? getTargetPosition(lines, target) : null;
	if (targetPosition === null) return true;

	view.dispatch({
		selection: EditorSelection.cursor(targetPosition),
		scrollIntoView: true,
	});

	return true;
}

export const deleteChunkBackward: ProseMirrorCommand = deleteSelectionOrChunkProseMirror("backward");
export const deleteChunkForward: ProseMirrorCommand = deleteSelectionOrChunkProseMirror("forward");
export const jumpParagraphDown: ProseMirrorCommand = jumpParagraphProseMirror("down");
export const jumpParagraphUp: ProseMirrorCommand = jumpParagraphProseMirror("up");

export function deleteChunkBackwardCodeMirror(view: EditorView): boolean {
	return deleteSelectionOrChunkCodeMirror(view, "backward");
}

export function deleteChunkForwardCodeMirror(view: EditorView): boolean {
	return deleteSelectionOrChunkCodeMirror(view, "forward");
}

export function jumpParagraphDownCodeMirror(view: EditorView): boolean {
	return jumpParagraphCodeMirror(view, "down");
}

export function jumpParagraphUpCodeMirror(view: EditorView): boolean {
	return jumpParagraphCodeMirror(view, "up");
}
