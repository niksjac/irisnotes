import { EditorSelection, EditorState as CodeMirrorState, type TransactionSpec } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { describe, expect, it } from "vitest";
import { EditorState as ProseMirrorState, TextSelection } from "prosemirror-state";
import { editorSchema } from "@/components/editor/schema";
import {
	deleteChunkBackward,
	deleteChunkBackwardCodeMirror,
	deleteChunkForward,
	deleteChunkForwardCodeMirror,
	getDeleteChunkRange,
	jumpParagraphDown,
	jumpParagraphDownCodeMirror,
	jumpParagraphUp,
	jumpParagraphUpCodeMirror,
} from "@/components/editor/plugins/chunk-commands";

function createProseMirrorState(lines: string[], lineIndex: number, cursorOffset: number): ProseMirrorState {
	const paragraphs = lines.map((line) => editorSchema.nodes.paragraph.create(
		null,
		line ? editorSchema.text(line) : null,
	));
	const doc = editorSchema.nodes.doc.create(null, paragraphs);
	const lineStart = getProseMirrorLinePositions(doc)[lineIndex]?.from ?? 1;

	return ProseMirrorState.create({
		doc,
		selection: TextSelection.create(doc, lineStart + cursorOffset),
	});
}

function getProseMirrorLinePositions(doc: ProseMirrorState["doc"]): Array<{ from: number; to: number }> {
	const lines: Array<{ from: number; to: number }> = [];
	doc.descendants((node, pos) => {
		if (!node.isTextblock) return true;
		const from = pos + 1;
		lines.push({ from, to: from + node.content.size });
		return false;
	});
	return lines;
}

function runProseMirrorDelete(text: string, cursorOffset: number, direction: "backward" | "forward") {
	const state = createProseMirrorState([text], 0, cursorOffset);
	let nextState = state;
	const command = direction === "forward" ? deleteChunkForward : deleteChunkBackward;
	const handled = command(state, (transaction) => {
		nextState = state.apply(transaction);
	});

	return {
		handled,
		text: nextState.doc.textContent,
		cursor: nextState.selection.from,
	};
}

function createCodeMirrorView(text: string, cursorOffset: number): EditorView {
	let state = CodeMirrorState.create({
		doc: text,
		selection: EditorSelection.cursor(cursorOffset),
	});

	return {
		get state() {
			return state;
		},
		dispatch(transactionSpec: TransactionSpec) {
			state = state.update(transactionSpec).state;
		},
	} as unknown as EditorView;
}

function runCodeMirrorDelete(text: string, cursorOffset: number, direction: "backward" | "forward") {
	const view = createCodeMirrorView(text, cursorOffset);
	const handled = direction === "forward"
		? deleteChunkForwardCodeMirror(view)
		: deleteChunkBackwardCodeMirror(view);

	return {
		handled,
		text: view.state.doc.toString(),
		cursor: view.state.selection.main.from,
	};
}

describe("delete chunk commands", () => {
	it("treats URL schemes and separators as separate chunks", () => {
		expect(getDeleteChunkRange("http://", 0, "forward")).toEqual({ from: 0, to: 4 });
		expect(getDeleteChunkRange("http://", 4, "forward")).toEqual({ from: 4, to: 7 });
		expect(getDeleteChunkRange("http://", 4, "backward")).toEqual({ from: 0, to: 4 });
		expect(getDeleteChunkRange("http://", 7, "backward")).toEqual({ from: 4, to: 7 });
	});

	it("deletes only the scheme before a URL separator in ProseMirror", () => {
		const result = runProseMirrorDelete("http://example", 0, "forward");

		expect(result.handled).toBe(true);
		expect(result.text).toBe("://example");
		expect(result.cursor).toBe(1);
	});

	it("deletes only leading whitespace at the start of a ProseMirror line", () => {
		const result = runProseMirrorDelete("    hello", 0, "forward");

		expect(result.handled).toBe(true);
		expect(result.text).toBe("hello");
		expect(result.cursor).toBe(1);
	});

	it("deletes the previous alphanumeric chunk in ProseMirror", () => {
		const result = runProseMirrorDelete("alpha beta", 10, "backward");

		expect(result.handled).toBe(true);
		expect(result.text).toBe("alpha ");
		expect(result.cursor).toBe(7);
	});

	it("does not cross line boundaries in CodeMirror", () => {
		const result = runCodeMirrorDelete("abc\ndef", 3, "forward");

		expect(result.handled).toBe(true);
		expect(result.text).toBe("abc\ndef");
		expect(result.cursor).toBe(3);
	});

	it("deletes punctuation separators as their own CodeMirror chunk", () => {
		const result = runCodeMirrorDelete("http://example", 7, "backward");

		expect(result.handled).toBe(true);
		expect(result.text).toBe("httpexample");
		expect(result.cursor).toBe(4);
	});
});

describe("paragraph jump commands", () => {
	it("jumps down to the next paragraph in ProseMirror", () => {
		const state = createProseMirrorState(["alpha", "beta", "", "gamma"], 0, 2);
		let nextState = state;
		jumpParagraphDown(state, (transaction) => {
			nextState = state.apply(transaction);
		});
		const positions = getProseMirrorLinePositions(nextState.doc);

		expect(nextState.selection.from).toBe(positions[3]!.from);
	});

	it("jumps up to the start of the current paragraph in ProseMirror", () => {
		const state = createProseMirrorState(["alpha", "beta", "", "gamma"], 1, 2);
		let nextState = state;
		jumpParagraphUp(state, (transaction) => {
			nextState = state.apply(transaction);
		});
		const positions = getProseMirrorLinePositions(nextState.doc);

		expect(nextState.selection.from).toBe(positions[0]!.from);
	});

	it("jumps from empty line to empty line in CodeMirror", () => {
		const text = "alpha\n\nbeta\n\ngamma";
		const firstEmptyLineStart = "alpha\n".length;
		const secondEmptyLineStart = "alpha\n\nbeta\n".length;
		const view = createCodeMirrorView(text, firstEmptyLineStart);

		jumpParagraphDownCodeMirror(view);

		expect(view.state.selection.main.from).toBe(secondEmptyLineStart);
	});

	it("jumps up to the previous paragraph in CodeMirror", () => {
		const text = "alpha\n\nbeta\ngamma";
		const gammaStart = "alpha\n\nbeta\n".length;
		const betaStart = "alpha\n\n".length;
		const view = createCodeMirrorView(text, gammaStart + 2);

		jumpParagraphUpCodeMirror(view);

		expect(view.state.selection.main.from).toBe(betaStart);
	});
});
