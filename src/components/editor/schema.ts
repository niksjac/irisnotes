/**
 * Extended ProseMirror Schema
 *
 * Extends prosemirror-schema-basic with additional marks for rich formatting:
 * - underline, strikethrough
 * - textColor, highlight (background color)
 * - fontSize (inline size override)
 */

import { Schema, type Mark, type Node as PMNode } from "prosemirror-model";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { addListNodes } from "prosemirror-schema-list";

// ============ Custom Mark Specs ============

/**
 * Underline mark
 */
const underlineMarkSpec = {
	parseDOM: [
		{ tag: "u" },
		{
			style: "text-decoration",
			getAttrs: (value: string) =>
				value.includes("underline") ? {} : false,
		},
	],
	toDOM: () => ["u", 0] as const,
};

/**
 * Strikethrough mark
 */
const strikethroughMarkSpec = {
	parseDOM: [
		{ tag: "s" },
		{ tag: "strike" },
		{ tag: "del" },
		{
			style: "text-decoration",
			getAttrs: (value: string) =>
				value.includes("line-through") ? {} : false,
		},
	],
	toDOM: () => ["s", 0] as const,
};

/**
 * Text color mark
 */
const textColorMarkSpec = {
	attrs: {
		color: {},
	},
	parseDOM: [
		{
			style: "color",
			getAttrs: (value: string) => ({ color: value }),
		},
	],
	toDOM: (mark: Mark) =>
		["span", { style: `color: ${mark.attrs.color}` }, 0] as const,
};

/**
 * Highlight (background color) mark
 */
const highlightMarkSpec = {
	attrs: {
		color: { default: "#ffff00" },
	},
	parseDOM: [
		{
			tag: "mark",
			getAttrs: (node: HTMLElement) => ({
				color: node.style.backgroundColor || "#ffff00",
			}),
		},
		{
			style: "background-color",
			getAttrs: (value: string) => ({ color: value }),
		},
	],
	toDOM: (mark: Mark) =>
		["mark", { style: `background-color: ${mark.attrs.color}` }, 0] as const,
};

/**
 * Font size mark (inline override)
 */
const fontSizeMarkSpec = {
	attrs: {
		size: {},
	},
	parseDOM: [
		{
			style: "font-size",
			getAttrs: (value: string) => ({ size: value }),
		},
	],
	toDOM: (mark: Mark) =>
		["span", { style: `font-size: ${mark.attrs.size}` }, 0] as const,
};

/**
 * Font family mark (inline font override)
 */
const fontFamilyMarkSpec = {
	attrs: {
		family: {},
	},
	parseDOM: [
		{
			style: "font-family",
			getAttrs: (value: string) => ({ family: value }),
		},
	],
	toDOM: (mark: Mark) =>
		["span", { style: `font-family: ${mark.attrs.family}` }, 0] as const,
};

// ============ Code Block Node Spec ============

const codeBlockSpec = {
	content: "text*",
	marks: "",
	group: "block",
	code: true,
	defining: true,
	attrs: {
		language: { default: "javascript" },
	},
	parseDOM: [
		{
			tag: "pre",
			preserveWhitespace: "full" as const,
			getAttrs: (node: HTMLElement) => ({
				language: node.getAttribute("data-language") || "javascript",
			}),
		},
	],
	toDOM: (node: PMNode) =>
		[
			"pre",
			{ "data-language": node.attrs.language as string },
			["code", 0],
		] as const,
};

// ============ Build Extended Schema ============

// Extend the basic marks with our custom marks
const extendedMarks = basicSchema.spec.marks.append({
	underline: underlineMarkSpec,
	strikethrough: strikethroughMarkSpec,
	textColor: textColorMarkSpec,
	highlight: highlightMarkSpec,
	fontSize: fontSizeMarkSpec,
	fontFamily: fontFamilyMarkSpec,
});

// Extend nodes with lists and code_block
// Remove hard_break to enforce line-based model (no soft line breaks within blocks)
const nodesWithoutHardBreak = basicSchema.spec.nodes.remove("hard_break");
const extendedNodes = addListNodes(
	nodesWithoutHardBreak,
	"paragraph block*",
	"block"
).append({
	code_block: codeBlockSpec,
});

/**
 * Extended schema with all custom marks and nodes
 */
export const editorSchema = new Schema({
	nodes: extendedNodes,
	marks: extendedMarks,
});

// ============ Type Exports ============

export type EditorSchema = typeof editorSchema;
