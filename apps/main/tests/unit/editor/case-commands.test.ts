import { describe, expect, it } from "vitest";
import { EditorState, TextSelection, type Transaction } from "prosemirror-state";
import { editorSchema } from "@/components/editor/schema";
import { cycleCase, nextCase } from "@/components/editor/plugins/case-commands";

function cycle(text: string, steps: number): string[] {
	const seen: string[] = [];
	let current = text;
	for (let i = 0; i < steps; i++) {
		const next = nextCase(current);
		if (next === null) break;
		seen.push(next);
		current = next;
	}
	return seen;
}

function stateWith(content: ReturnType<typeof editorSchema.text>[], from: number, to = from): EditorState {
	const doc = editorSchema.nodes.doc.create(null, [editorSchema.nodes.paragraph.create(null, content)]);
	return EditorState.create({ doc, selection: TextSelection.create(doc, from, to) });
}

function run(state: EditorState): EditorState {
	let result = state;
	const handled = cycleCase(state, (tr: Transaction) => {
		result = state.apply(tr);
	});
	expect(handled).toBe(true);
	return result;
}

describe("nextCase", () => {
	it("cycles multi-word text through every case and back", () => {
		expect(cycle("hello world", 6)).toEqual([
			"HELLO WORLD",
			"Hello World",
			"hello_world",
			"hello-world",
			"helloWorld",
			"hello world",
		]);
	});

	it("skips variants identical to the current text for a single word", () => {
		expect(cycle("hello", 3)).toEqual(["HELLO", "Hello", "hello"]);
	});

	it("continues from a detected case", () => {
		expect(nextCase("hello_world")).toBe("hello-world");
		expect(nextCase("helloWorld")).toBe("hello world");
		expect(nextCase("XMLParser")).toBe("xml parser");
	});

	it("starts mixed case at lower case", () => {
		expect(nextCase("hELLo wOrld")).toBe("hello world");
	});

	it("keeps punctuation and only cycles lower/UPPER/Title for prose", () => {
		expect(cycle("don't stop, now", 3)).toEqual(["DON'T STOP, NOW", "Don't Stop, Now", "don't stop, now"]);
	});

	it("handles non-ASCII letters", () => {
		expect(nextCase("ωmega øl")).toBe("ΩMEGA ØL");
	});

	it("returns null when there is nothing to change", () => {
		expect(nextCase("123")).toBeNull();
	});
});

describe("cycleCase command", () => {
	it("converts the word at the cursor and selects it", () => {
		const next = run(stateWith([editorSchema.text("say hello now")], 7));
		expect(next.doc.textContent).toBe("say HELLO now");
		expect(next.selection.from).toBe(5);
		expect(next.selection.to).toBe(10);
	});

	it("repeated presses keep cycling the selection even when its length changes", () => {
		let state = stateWith([editorSchema.text("hello world")], 1, 12);
		for (let i = 0; i < 4; i++) state = run(state);
		expect(state.doc.textContent).toBe("hello-world");
		state = run(state);
		expect(state.doc.textContent).toBe("helloWorld");
		expect(state.doc.textBetween(state.selection.from, state.selection.to)).toBe("helloWorld");
	});

	it("keeps mixed formatting when the length is unchanged", () => {
		const bold = editorSchema.marks.strong.create();
		const state = stateWith([editorSchema.text("hello ", [bold]), editorSchema.text("world")], 1, 12);
		const next = run(state);
		const first = next.doc.firstChild?.child(0);
		const second = next.doc.firstChild?.child(1);
		expect(first?.text).toBe("HELLO ");
		expect(first?.marks.map((m) => m.type.name)).toEqual(["strong"]);
		expect(second?.text).toBe("WORLD");
		expect(second?.marks).toEqual([]);
	});

	it("does nothing on whitespace", () => {
		const state = stateWith([editorSchema.text("a  b")], 3);
		expect(cycleCase(state, undefined)).toBe(false);
	});
});
