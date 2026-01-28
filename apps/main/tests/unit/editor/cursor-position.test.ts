import { describe, it, expect } from "vitest";
import { EditorState, Selection, TextSelection } from "prosemirror-state";
import { Schema, DOMParser } from "prosemirror-model";
import { schema } from "prosemirror-schema-basic";
import { EditorState as CMEditorState, EditorSelection } from "@codemirror/state";

// Use basic ProseMirror schema for tests
const testSchema = new Schema({
	nodes: schema.spec.nodes,
	marks: schema.spec.marks,
});

describe("Cursor Position Logic", () => {
	describe("ProseMirror", () => {
		it("Selection.atEnd places cursor at valid end position", () => {
			// Create a document with content
			const div = document.createElement("div");
			div.innerHTML = "<p>Hello World</p>";
			const doc = DOMParser.fromSchema(testSchema).parse(div);

			// Create state with Selection.atEnd
			const state = EditorState.create({
				doc,
				selection: Selection.atEnd(doc),
			});

			// Selection.atEnd places cursor at the last valid text position
			// This is doc.content.size - 1 (before the closing </p> tag)
			// The cursor should be a valid position (not at doc boundary)
			expect(state.selection.from).toBe(doc.content.size - 1);
			expect(state.selection.to).toBe(doc.content.size - 1);
		});

		it("TextSelection.create with specific position works", () => {
			const div = document.createElement("div");
			div.innerHTML = "<p>Hello World</p>";
			const doc = DOMParser.fromSchema(testSchema).parse(div);

			// Position 5 is after "Hello" (accounting for <p> tag offset)
			const position = 6; // 1 for opening <p> + 5 for "Hello"
			const state = EditorState.create({
				doc,
				selection: TextSelection.create(doc, position),
			});

			expect(state.selection.from).toBe(position);
		});

		it("Empty document cursor is at position 1 (inside paragraph)", () => {
			const div = document.createElement("div");
			div.innerHTML = "<p></p>";
			const doc = DOMParser.fromSchema(testSchema).parse(div);

			const state = EditorState.create({
				doc,
				selection: Selection.atEnd(doc),
			});

			// Empty <p></p> has size 2 (open + close), cursor inside is at 1
			expect(state.selection.from).toBe(1);
		});
	});

	describe("CodeMirror", () => {
		it("EditorSelection.cursor places cursor at specified position", () => {
			const content = "Hello World";
			const state = CMEditorState.create({
				doc: content,
				selection: EditorSelection.cursor(content.length),
			});

			expect(state.selection.main.from).toBe(content.length);
			expect(state.selection.main.to).toBe(content.length);
		});

		it("Cursor at end of multiline document", () => {
			const content = "Line 1\nLine 2\nLine 3";
			const state = CMEditorState.create({
				doc: content,
				selection: EditorSelection.cursor(content.length),
			});

			expect(state.selection.main.from).toBe(content.length);
		});

		it("Empty document cursor is at position 0", () => {
			const content = "";
			const state = CMEditorState.create({
				doc: content,
				selection: EditorSelection.cursor(content.length),
			});

			expect(state.selection.main.from).toBe(0);
		});
	});
});

describe("Content Update Cursor Preservation", () => {
	describe("ProseMirror state recreation", () => {
		it("New state with Selection.atEnd preserves cursor at end", () => {
			// Simulate external content update
			const newDiv = document.createElement("div");
			newDiv.innerHTML = "<p>Updated content here</p>";
			const newDoc = DOMParser.fromSchema(testSchema).parse(newDiv);

			// Create new state with cursor at end (what our fix does)
			const newState = EditorState.create({
				doc: newDoc,
				selection: Selection.atEnd(newDoc),
			});

			// Selection.atEnd is content.size - 1 (inside the paragraph)
			expect(newState.selection.from).toBe(newDoc.content.size - 1);
		});
	});

	describe("CodeMirror content replacement", () => {
		it("Content replacement with cursor at end", () => {
			const oldContent = "Old";
			const newContent = "New content that is longer";

			const state = CMEditorState.create({
				doc: oldContent,
				selection: EditorSelection.cursor(oldContent.length),
			});

			// Simulate the dispatch we do for content update
			const transaction = state.update({
				changes: { from: 0, to: oldContent.length, insert: newContent },
				selection: EditorSelection.cursor(newContent.length),
			});

			expect(transaction.state.selection.main.from).toBe(newContent.length);
		});
	});
});
