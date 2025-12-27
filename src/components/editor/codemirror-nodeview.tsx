import { EditorView as CodeMirrorView, lineNumbers, highlightActiveLine, highlightActiveLineGutter, keymap } from "@codemirror/view";
import { EditorState as CodeMirrorState, Compartment } from "@codemirror/state";
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

		// Create outer container
		this.dom = document.createElement("div");
		this.dom.className =
			"code-block-container relative my-2 rounded border border-gray-300 dark:border-gray-700";

		// Create language selector
		const langSelector = document.createElement("select");
		langSelector.className =
			"absolute top-2 right-2 z-10 text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-2 py-1";
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

		// Detect dark mode
		const isDark = document.documentElement.classList.contains("dark");

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

		// Style the CodeMirror editor
		const cmElement = this.codeMirror.dom;
		cmElement.style.fontSize = "14px";
		cmElement.style.fontFamily = "'Monaco', 'Menlo', 'Consolas', monospace";
	}

	valueChanged() {
		const pos = this.getPos();
		if (pos === undefined) return;

		const newText = this.codeMirror.state.doc.toString();
		const { node } = this;

		if (newText === node.textContent) return;

		this.updating = true;
		const tr = this.view.state.tr.replaceWith(
			pos,
			pos + node.nodeSize,
			this.view.state.schema.nodes.code_block.create(
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

	update(node: ProseMirrorNode, decorations: readonly Decoration[]) {
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
