import { EditorView as CodeMirrorView, lineNumbers, highlightActiveLine, highlightActiveLineGutter, keymap } from "@codemirror/view";
import { EditorState as CodeMirrorState } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from "@codemirror/language";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import type { Node as ProseMirrorNode } from "prosemirror-model";
import type { EditorView, NodeView } from "prosemirror-view";
import type { Decoration } from "prosemirror-view";

// Basic setup without importing from 'codemirror' package
const basicExtensions = [
	lineNumbers(),
	highlightActiveLine(),
	highlightActiveLineGutter(),
	history(),
	bracketMatching(),
	syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
	keymap.of([...defaultKeymap, ...historyKeymap]),
];

const languageExtensions: Record<string, any> = {
	javascript: javascript(),
	typescript: javascript({ typescript: true }),
	python: python(),
	html: html(),
	css: css(),
	json: json(),
	markdown: markdown(),
};

export class CodeBlockView implements NodeView {
	dom: HTMLElement;
	codeMirror: CodeMirrorView;
	node: ProseMirrorNode;
	view: EditorView;
	getPos: () => number | undefined;
	updating: boolean = false;

	constructor(
		node: ProseMirrorNode,
		view: EditorView,
		getPos: () => number | undefined
	) {
		this.node = node;
		this.view = view;
		this.getPos = getPos;

		// Check dark mode once for all styling
		const isDark = document.documentElement.classList.contains("dark");

		// Create outer container
		this.dom = document.createElement("div");
		this.dom.className = "code-block-container relative my-2 rounded border";
		this.dom.style.borderColor = isDark ? "#374151" : "#d1d5db";
		this.dom.style.backgroundColor = isDark ? "#111827" : "#f9fafb";

		// Create language selector
		const langSelector = document.createElement("select");
		langSelector.className =
			"absolute top-2 right-2 z-10 text-xs rounded px-2 py-1 border";
		// Apply styles directly since Tailwind dark: classes don't work in vanilla JS DOM creation
		langSelector.style.backgroundColor = isDark ? "#1f2937" : "#f3f4f6";
		langSelector.style.borderColor = isDark ? "#374151" : "#d1d5db";
		langSelector.style.color = isDark ? "#e5e7eb" : "#374151";
		const languages = [
			"javascript",
			"typescript",
			"python",
			"html",
			"css",
			"json",
			"markdown",
			"text",
		];
		languages.forEach((lang) => {
			const option = document.createElement("option");
			option.value = lang;
			option.textContent = lang;
			option.selected = lang === (node.attrs.language || "javascript");
			langSelector.appendChild(option);
		});

		langSelector.addEventListener("change", (e) => {
			const newLang = (e.target as HTMLSelectElement).value;
			this.updateLanguage(newLang);
		});

		this.dom.appendChild(langSelector);

		// Create CodeMirror container
		const cmContainer = document.createElement("div");
		cmContainer.className = "codemirror-wrapper";
		this.dom.appendChild(cmContainer);

		// Get language extension
		const language = node.attrs.language || "javascript";
		const langExtension = languageExtensions[language] || [];

		// Create CodeMirror instance (reuse isDark from above)

		// Create CodeMirror instance
		const startState = CodeMirrorState.create({
			doc: node.textContent,
			extensions: [
				...basicExtensions,
				langExtension,
				...(isDark ? [oneDark] : []),
				CodeMirrorView.updateListener.of((update) => {
					if (!this.updating && update.docChanged) {
						this.valueChanged();
					}
				}),
				CodeMirrorView.domEventHandlers({
					blur: () => {
						this.view.focus();
					},
				}),
			],
		});

		this.codeMirror = new CodeMirrorView({
			state: startState,
			parent: cmContainer,
		});

		// Style the CodeMirror editor - use CSS variables for consistency
		const cmElement = this.codeMirror.dom;
		cmElement.style.fontSize = "var(--pm-font-size)";
		cmElement.style.fontFamily = "var(--pm-font-family)";
	}

	valueChanged() {
		const pos = this.getPos();
		if (pos === undefined) return;

		const newText = this.codeMirror.state.doc.toString();
		const { node } = this;

		if (newText === node.textContent) return;

		this.updating = true;
		const codeBlockType = this.view.state.schema.nodes.code_block;
		if (!codeBlockType) {
			this.updating = false;
			return;
		}
		const tr = this.view.state.tr.replaceWith(
			pos,
			pos + node.nodeSize,
			codeBlockType.create(
				node.attrs,
				newText ? this.view.state.schema.text(newText) : undefined
			)
		);
		this.view.dispatch(tr);
		this.updating = false;
	}

	updateLanguage(newLang: string) {
		const pos = this.getPos();
		if (pos === undefined) return;

		const tr = this.view.state.tr.setNodeMarkup(pos, undefined, {
			...this.node.attrs,
			language: newLang,
		});
		this.view.dispatch(tr);
	}

	update(node: ProseMirrorNode, _decorations: readonly Decoration[]) {
		if (node.type !== this.node.type) return false;

		this.node = node;

		if (this.updating) return true;

		const newText = node.textContent;
		const currentText = this.codeMirror.state.doc.toString();

		if (newText !== currentText) {
			this.updating = true;
			this.codeMirror.dispatch({
				changes: {
					from: 0,
					to: currentText.length,
					insert: newText,
				},
			});
			this.updating = false;
		}

		return true;
	}

	selectNode() {
		this.dom.classList.add("ProseMirror-selectednode");
	}

	deselectNode() {
		this.dom.classList.remove("ProseMirror-selectednode");
	}

	stopEvent() {
		return true;
	}

	destroy() {
		this.codeMirror.destroy();
	}

	ignoreMutation() {
		return true;
	}
}
