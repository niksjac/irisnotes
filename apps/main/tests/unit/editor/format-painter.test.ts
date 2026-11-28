import { describe, expect, it } from "vitest";
import { EditorState, TextSelection, type Transaction } from "prosemirror-state";
import { editorSchema } from "@/components/editor/schema";
import {
	applyFormatting,
	cancelFormatPainter,
	copyFormatting,
	formatPainterPlugin,
	getFormatPainterState,
} from "@/components/editor/plugins/format-painter";

const s = editorSchema;

/** "bold red" + " " + "plain words" + " " + "link" (link mark) */
function initial(): EditorState {
	const boldRed = [s.marks.strong.create(), s.marks.textColor.create({ color: "red" })];
	const doc = s.nodes.doc.create(null, [
		s.nodes.paragraph.create(null, [
			s.text("boldred", boldRed),
			s.text(" plain words "),
			s.text("site", [s.marks.link.create({ href: "https://example.com" })]),
		]),
	]);
	return EditorState.create({ doc, plugins: [formatPainterPlugin()] });
}

function run(state: EditorState, command: typeof copyFormatting): EditorState {
	let next = state;
	expect(command(state, (tr: Transaction) => (next = state.apply(tr)))).toBe(true);
	return next;
}

function select(state: EditorState, from: number, to = from): EditorState {
	return state.apply(state.tr.setSelection(TextSelection.create(state.doc, from, to)));
}

function marksAt(state: EditorState, pos: number): string[] {
	return state.doc.resolve(pos).marks().map((m) => m.type.name).sort();
}

describe("format painter", () => {
	it("copies the first selected character's formatting and arms", () => {
		const copied = run(select(initial(), 1, 4), copyFormatting);
		const painter = getFormatPainterState(copied)!;
		expect(painter.armed).toBe(true);
		expect(painter.marks!.map((m) => m.type.name).sort()).toEqual(["strong", "textColor"]);
	});

	it("applies to a selection and disarms", () => {
		let state = run(select(initial(), 1, 4), copyFormatting);
		// "plain" is at 9..14
		state = run(select(state, 9, 14), applyFormatting);
		expect(marksAt(state, 11)).toEqual(["strong", "textColor"]);
		expect(getFormatPainterState(state)!.armed).toBe(false);
		// Repeatable on another target without copying again
		state = run(select(state, 15, 20), applyFormatting);
		expect(marksAt(state, 17)).toEqual(["strong", "textColor"]);
	});

	it("applies to the word at the cursor", () => {
		let state = run(select(initial(), 2), copyFormatting);
		state = run(select(state, 17), applyFormatting);
		expect(marksAt(state, 17)).toEqual(["strong", "textColor"]);
		expect(marksAt(state, 12)).toEqual([]);
	});

	it("replaces the target's formatting and never copies or removes links", () => {
		// Copy plain formatting, paint it onto the bold text
		let state = run(select(initial(), 9, 14), copyFormatting);
		state = run(select(state, 1, 8), applyFormatting);
		expect(marksAt(state, 4)).toEqual([]);
		// Paint bold red onto the link: it gets the formatting and stays a link
		let linked = run(select(initial(), 1, 4), copyFormatting);
		linked = run(select(linked, 21, 25), applyFormatting);
		expect(marksAt(linked, 23)).toEqual(["link", "strong", "textColor"]);
	});

	it("can't apply before copying; Escape-style cancel disarms", () => {
		expect(applyFormatting(initial())).toBe(false);
		const armed = run(select(initial(), 1, 4), copyFormatting);
		const cancelled = run(armed, cancelFormatPainter);
		expect(getFormatPainterState(cancelled)!.armed).toBe(false);
		expect(cancelFormatPainter(cancelled)).toBe(false);
	});
});
