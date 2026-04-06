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
import { tableNodes } from "prosemirror-tables";

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
	attrs: {
		textAlign: { default: null },
	},
	parseDOM: [
		{ tag: "p", getAttrs: (node: HTMLElement) => ({ textAlign: node.style.textAlign || null }) },
		// Parse headings as paragraphs (legacy content migration)
		{ tag: "h1", getAttrs: (node: HTMLElement) => ({ textAlign: node.style.textAlign || null }) },
		{ tag: "h2", getAttrs: (node: HTMLElement) => ({ textAlign: node.style.textAlign || null }) },
		{ tag: "h3", getAttrs: (node: HTMLElement) => ({ textAlign: node.style.textAlign || null }) },
		{ tag: "h4", getAttrs: (node: HTMLElement) => ({ textAlign: node.style.textAlign || null }) },
		{ tag: "h5", getAttrs: (node: HTMLElement) => ({ textAlign: node.style.textAlign || null }) },
		{ tag: "h6", getAttrs: (node: HTMLElement) => ({ textAlign: node.style.textAlign || null }) },
		{ tag: "div", getAttrs: (node: HTMLElement) => ({ textAlign: node.style.textAlign || null }) },
	],
	toDOM: (node: PMNode) => {
		const attrs: Record<string, string> = {};
		if (node.attrs.textAlign) {
			attrs.style = `text-align: ${node.attrs.textAlign}`;
		}
		return ["p", attrs, 0] as const;
	},
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
 * Code section - a wrapper block for multi-line code-styled content.
 * Unlike code_block (which uses CodeMirror), this preserves the paragraph
 * structure and formatting marks while applying a continuous code background.
 */
const codeSectionSpec = {
	content: "block+",
	group: "block",
	defining: true,
	parseDOM: [{ tag: "div.code-section" }],
	toDOM: () => ["div", { class: "code-section" }, 0] as const,
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
 * Details block (collapsible container)
 * Renders as <details> with a <summary> + content body.
 */
const detailsSpec = {
	content: "details_summary block+",
	group: "block",
	defining: true,
	attrs: {
		open: { default: true },
	},
	parseDOM: [
		{
			tag: "details",
			getAttrs: (node: HTMLElement) => ({
				open: node.hasAttribute("open"),
			}),
		},
	],
	toDOM: (node: PMNode) =>
		node.attrs.open
			? ["details", { open: "" }, 0] as const
			: ["details", 0] as const,
};

/**
 * Details summary line
 */
const detailsSummarySpec = {
	content: "inline*",
	defining: true,
	parseDOM: [{ tag: "summary" }],
	toDOM: () => ["summary", 0] as const,
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
		width: { default: null },
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
				width: node.getAttribute("width") || node.style.width || null,
			}),
		},
	],
	toDOM: (node: PMNode) => {
		const attrs: Record<string, string> = {
			src: node.attrs.src as string,
		};
		if (node.attrs.alt) attrs.alt = node.attrs.alt as string;
		if (node.attrs.title) attrs.title = node.attrs.title as string;
		if (node.attrs.width) attrs.style = `width: ${node.attrs.width}`;
		return ["img", attrs] as const;
	},
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
	code_section: codeSectionSpec,
	horizontal_rule: horizontalRuleSpec,
	code_block: codeBlockSpec,
	details: detailsSpec,
	details_summary: detailsSummarySpec,
	text: textSpec,
	image: imageSpec,
});

// Add list nodes
const nodesWithLists = addListNodes(
	baseNodes,
	"paragraph block*",
	"block"
);

// Add table nodes (with alignment support on the table node)
const rawTableNodes = tableNodes({
	tableGroup: "block",
	cellContent: "block+",
	cellAttributes: {
		background: {
			default: null,
			getFromDOM(dom: HTMLElement) {
				return dom.getAttribute("data-bg") || dom.style.backgroundColor || null;
			},
			setDOMAttr(value: unknown, attrs: Record<string, unknown>) {
				if (value && typeof value === "string") {
					attrs.style = ((attrs.style as string) || "") + `background-color: ${value};`;
					attrs["data-bg"] = value;
				}
			},
		},
		borderColor: {
			default: null,
			getFromDOM(dom: HTMLElement) {
				return dom.getAttribute("data-border-color") || null;
			},
			setDOMAttr(value: unknown, attrs: Record<string, unknown>) {
				if (value && typeof value === "string") {
					attrs.style = ((attrs.style as string) || "") +
						`border-style: solid; border-color: ${value};`;
					attrs["data-border-color"] = value;
				}
			},
		},
		borderWidth: {
			default: null,
			getFromDOM(dom: HTMLElement) {
				return dom.getAttribute("data-border-width") || null;
			},
			setDOMAttr(value: unknown, attrs: Record<string, unknown>) {
				if (value !== null && value !== undefined) {
					const w = Number(value);
					attrs.style = ((attrs.style as string) || "") +
						`border-width: ${w}px; border-style: ${w === 0 ? "none" : "solid"};`;
					attrs["data-border-width"] = String(value);
				}
			},
		},
		cellPadding: {
			default: null,
			getFromDOM(dom: HTMLElement) {
				return dom.getAttribute("data-cell-padding") || null;
			},
			setDOMAttr(value: unknown, attrs: Record<string, unknown>) {
				if (value !== null && value !== undefined) {
					attrs.style = ((attrs.style as string) || "") + `padding: ${value}px;`;
					attrs["data-cell-padding"] = String(value);
				}
			},
		},
	},
});

// Override the table spec to support text-align (left/center/right)
const tableSpecWithAlign = {
	...rawTableNodes.table,
	attrs: {
		...((rawTableNodes.table as any).attrs || {}),
		textAlign: { default: null },
	},
	parseDOM: [
		{
			tag: "table",
			getAttrs: (node: HTMLElement) => {
				const align = node.style.textAlign
					|| node.getAttribute("data-align")
					|| (node.parentElement as HTMLElement | null)?.style.textAlign
					|| null;
				return { textAlign: align || null };
			},
		},
	],
	toDOM: (node: PMNode) => {
		const attrs: Record<string, string> = {};
		if (node.attrs.textAlign) {
			attrs.style = `text-align: ${node.attrs.textAlign}`;
			attrs["data-align"] = node.attrs.textAlign;
		}
		return ["table", attrs, ["tbody", 0]] as const;
	},
};

const nodesWithTables = nodesWithLists.append({
	...rawTableNodes,
	table: tableSpecWithAlign,
});

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
	nodes: nodesWithTables,
	marks: allMarks,
});

// ============ Type Exports ============

export type EditorSchema = typeof editorSchema;

