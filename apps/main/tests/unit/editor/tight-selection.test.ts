import { describe, expect, it } from "vitest";
import { EditorState, TextSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import type { Node as PMNode } from "prosemirror-model";
import { editorSchema } from "@/components/editor/schema";
import { tightSelectionPlugin } from "@/components/editor/plugins/tight-selection";

function createOrderedListDoc(text: string): PMNode {
	const { doc, ordered_list, list_item, paragraph } = editorSchema.nodes;

	return doc.create(null, ordered_list.create(null,
		list_item.create(null,
			paragraph.create(null, editorSchema.text(text)),
		),
	));
}

function findTextStart(doc: PMNode): number {
	let textStart: number | null = null;
	doc.descendants((node, pos) => {
		if (node.isText) {
			textStart = pos;
			return false;
		}

		return true;
	});

	if (textStart === null) {
		throw new Error("Expected test document to contain text");
	}

	return textStart;
}

function createEditorView(text: string, fromOffset: number, toOffset: number): EditorView {
	const doc = createOrderedListDoc(text);
	const textStart = findTextStart(doc);
	const state = EditorState.create({
		doc,
		selection: TextSelection.create(doc, textStart + fromOffset, textStart + toOffset),
		plugins: [tightSelectionPlugin()],
	});

	return new EditorView(document.createElement("div"), { state });
}

describe("tightSelectionPlugin", () => {
	it("does not extend list marker highlight for a mid-line selection", () => {
		const text = "FAS prod (serviceplatformen)";
		const fromOffset = text.indexOf("(");
		const view = createEditorView(text, fromOffset, text.length);

		try {
			expect(view.dom.querySelector(".pm-tight-selection")?.textContent).toBe("(serviceplatformen)");
			expect(view.dom.querySelector(".pm-tight-selection-list-start")).toBeNull();
			expect(view.dom.querySelector("li.pm-tight-selection-list-item")).toBeNull();
		} finally {
			view.destroy();
		}
	});

	it("extends list marker highlight when selection starts at list text start", () => {
		const text = "FAS prod (serviceplatformen)";
		const view = createEditorView(text, 0, 3);

		try {
			expect(view.dom.querySelector(".pm-tight-selection-list-start")?.textContent).toBe("FAS");
			expect(view.dom.querySelector("li.pm-tight-selection-list-item")).not.toBeNull();
		} finally {
			view.destroy();
		}
	});
});