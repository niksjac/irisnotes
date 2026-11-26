import { describe, expect, it } from "vitest";
import { type Command, EditorState, TextSelection, type Transaction } from "prosemirror-state";
import { editorSchema } from "@/components/editor/schema";
import {
	collapseEmptyLines,
	joinLines,
	removeDuplicateLines,
	removeEmptyLines,
	reverseLines,
	sortLinesAscending,
	sortLinesDescending,
	trimTrailingWhitespace,
} from "@/components/editor/plugins/text-block-commands";

function para(text: string) {
	return editorSchema.nodes.paragraph.create(null, text ? editorSchema.text(text) : null);
}

/** One paragraph per line; selects lines [first, last] (inclusive), or nothing */
function stateWith(lines: string[], select?: [number, number]): EditorState {
	const doc = editorSchema.nodes.doc.create(null, lines.map(para));
	if (!select) return EditorState.create({ doc });
	const posOf = (index: number) => {
		let pos = 0;
		for (let i = 0; i < index; i++) pos += doc.child(i).nodeSize;
		return pos;
	};
	const from = posOf(select[0]) + 1;
	const to = posOf(select[1]) + doc.child(select[1]).nodeSize - 1;
	return EditorState.create({ doc, selection: TextSelection.create(doc, from, to) });
}

function lines(state: EditorState): string[] {
	const out: string[] = [];
	state.doc.forEach((node) => out.push(node.textContent));
	return out;
}

function run(command: Command, state: EditorState): EditorState | null {
	let result: EditorState | null = null;
	const handled = command(state, (tr: Transaction) => {
		result = state.apply(tr);
	});
	return handled ? result : null;
}

describe("text block commands", () => {
	it("removes empty and whitespace-only lines in the selection only", () => {
		const state = stateWith(["a", "", "b", "  ", "c", "", "d"], [0, 4]);
		expect(lines(run(removeEmptyLines, state)!)).toEqual(["a", "b", "c", "", "d"]);
	});

	it("works on the whole note without a selection", () => {
		const state = stateWith(["a", "", "", "b", "", "", "", "c"]);
		expect(lines(run(collapseEmptyLines, state)!)).toEqual(["a", "", "b", "", "c"]);
		expect(lines(run(removeEmptyLines, state)!)).toEqual(["a", "b", "c"]);
	});

	it("leaves one empty line when every line is removed", () => {
		const state = stateWith(["", " ", ""]);
		expect(lines(run(removeEmptyLines, state)!)).toEqual([""]);
	});

	it("is disabled when nothing would change", () => {
		const state = stateWith(["a", "b", "c"]);
		expect(removeEmptyLines(state)).toBe(false);
		expect(sortLinesAscending(state)).toBe(false);
		expect(removeDuplicateLines(state)).toBe(false);
		expect(trimTrailingWhitespace(state)).toBe(false);
	});

	it("sorts naturally and case-insensitively, both ways", () => {
		const state = stateWith(["item 10", "Banana", "item 2", "apple"]);
		expect(lines(run(sortLinesAscending, state)!)).toEqual(["apple", "Banana", "item 2", "item 10"]);
		expect(lines(run(sortLinesDescending, state)!)).toEqual(["item 10", "item 2", "Banana", "apple"]);
	});

	it("reverses, dedupes and trims", () => {
		expect(lines(run(reverseLines, stateWith(["1", "2", "3"]))!)).toEqual(["3", "2", "1"]);
		expect(lines(run(removeDuplicateLines, stateWith(["a", "", "b", "a", "", "b"]))!)).toEqual(["a", "", "b", ""]);
		expect(lines(run(trimTrailingWhitespace, stateWith(["a  ", "b\t", "c"]))!)).toEqual(["a", "b", "c"]);
	});

	it("joins lines with single spaces and keeps the result selected", () => {
		const state = stateWith(["x", "one ", "", "  two", "three", "y"], [1, 4]);
		const result = run(joinLines, state)!;
		expect(lines(result)).toEqual(["x", "one two three", "y"]);
		expect(result.selection.empty).toBe(false);
	});

	it("doesn't count a selection ending at the start of a line as including it", () => {
		const base = stateWith(["b", "a", "c"]);
		// From the start of line 0 to the start of line 2
		const sel = TextSelection.create(base.doc, 1, 7);
		const state = base.apply(base.tr.setSelection(sel));
		expect(lines(run(sortLinesAscending, state)!)).toEqual(["a", "b", "c"]);
	});
});
