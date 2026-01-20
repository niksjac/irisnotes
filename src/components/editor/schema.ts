/**
 * Line-Based ProseMirror Schema
 *
 * Custom schema designed for a line-based editor (like OneNote/Notepad++).
 * Key design decisions:
 * - No semantic heading tags (h1-h6) - use fontSize mark instead
 * - No hard_break - each Enter creates a new block
 * - All blocks are paragraphs with optional formatting marks
 *
 * Marks available:
 * - bold, italic, code (basic formatting)
 * - underline, strikethrough
 * - textColor, highlight (background color)
 * - fontSize, fontFamily (inline overrides)
 * - link
 */

import { Schema, type Mark, type Node as PMNode } from "prosemirror-model";
import OrderedMap from "orderedmap";
import { addListNodes } from "prosemirror-schema-list";

// ============ Node Specs ============

/**
 * Document node - the root
 */
const docSpec = {
	content: "block+",
};

/**
 * Paragraph - the primary block type
 * In our line-based model, everything is a paragraph
 */
const paragraphSpec = {
	content: "inline*",
	group: "block",
	parseDOM: [
		{ tag: "p" },
		// Parse headings as paragraphs (legacy content migration)
		{ tag: "h1" },
		{ tag: "h2" },
		{ tag: "h3" },
		{ tag: "h4" },
		{ tag: "h5" },
		{ tag: "h6" },
		{ tag: "div" },
	],
	toDOM: () => ["p", 0] as const,
};

/**
 * Blockquote
 */
const blockquoteSpec = {
	content: "block+",
	group: "block",
	defining: true,
	parseDOM: [{ tag: "blockquote" }],
	toDOM: () => ["blockquote", 0] as const,
};

/**
 * Horizontal rule
 */
const horizontalRuleSpec = {
	group: "block",
	parseDOM: [{ tag: "hr" }],
	toDOM: () => ["hr"] as const,
};

/**
 * Code block
 */
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

/**
 * Text node
 */
const textSpec = {
	group: "inline",
};

/**
 * Image node
 */
const imageSpec = {
	inline: true,
	attrs: {
		src: {},
		alt: { default: null },
		title: { default: null },
	},
	group: "inline",
	draggable: true,
	parseDOM: [
		{
			tag: "img[src]",
			getAttrs: (node: HTMLElement) => ({
				src: node.getAttribute("src"),
				alt: node.getAttribute("alt"),
				title: node.getAttribute("title"),
			}),
		},
	],
	toDOM: (node: PMNode) =>
		[
			"img",
			{
				src: node.attrs.src as string,
				alt: node.attrs.alt as string,
				title: node.attrs.title as string,
			},
		] as const,
};

// ============ Mark Specs ============

/**
 * Link mark
 */
const linkMarkSpec = {
	attrs: {
		href: {},
		title: { default: null },
	},
	inclusive: false,
	parseDOM: [
		{
			tag: "a[href]",
			getAttrs: (node: HTMLElement) => ({
				href: node.getAttribute("href"),
				title: node.getAttribute("title"),
			}),
		},
	],
	toDOM: (mark: Mark) =>
		[
			"a",
			{ href: mark.attrs.href as string, title: mark.attrs.title as string },
			0,
		] as const,
};

/**
 * Bold/Strong mark
 */
const boldMarkSpec = {
	parseDOM: [
		{ tag: "strong" },
		{ tag: "b" },
		{
			style: "font-weight",
			getAttrs: (value: string) =>
				/^(bold(er)?|[5-9]\d{2,})$/.test(value) ? {} : false,
		},
	],
	toDOM: () => ["strong", 0] as const,
};

/**
 * Italic/Emphasis mark
 */
const italicMarkSpec = {
	parseDOM: [
		{ tag: "em" },
		{ tag: "i" },
		{ style: "font-style=italic" },
	],
	toDOM: () => ["em", 0] as const,
};

/**
 * Inline code mark
 */
const codeMarkSpec = {
	parseDOM: [{ tag: "code" }],
	toDOM: () => ["code", 0] as const,
};

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
		color: { default: "#000000" },
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

// ============ Build Schema ============

// Base nodes as OrderedMap (required by addListNodes)
const baseNodes = OrderedMap.from({
	doc: docSpec,
	paragraph: paragraphSpec,
	blockquote: blockquoteSpec,
	horizontal_rule: horizontalRuleSpec,
	code_block: codeBlockSpec,
	text: textSpec,
	image: imageSpec,
});

// Add list nodes
const nodesWithLists = addListNodes(
	baseNodes,
	"paragraph block*",
	"block"
);

// All marks - order matters! Outer marks first.
const allMarks = {
	// Color marks first (outermost) - so decorations inherit the color
	textColor: textColorMarkSpec,
	highlight: highlightMarkSpec,
	// Font marks
	fontSize: fontSizeMarkSpec,
	fontFamily: fontFamilyMarkSpec,
	// Link
	link: linkMarkSpec,
	// Basic formatting
	strong: boldMarkSpec,
	em: italicMarkSpec,
	code: codeMarkSpec,
	// Decoration marks last (innermost)
	underline: underlineMarkSpec,
	strikethrough: strikethroughMarkSpec,
};

/**
 * Line-based schema - no headings, just paragraphs with marks
 */
export const editorSchema = new Schema({
	nodes: nodesWithLists,
	marks: allMarks,
});

// ============ Type Exports ============

export type EditorSchema = typeof editorSchema;

