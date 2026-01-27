import { EditorView as CodeMirrorView, lineNumbers, highlightActiveLine, highlightActiveLineGutter, keymap } from "@codemirror/view";
import { EditorState as CodeMirrorState, Prec, Compartment } from "@codemirror/state";
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
import { Selection, TextSelection } from "prosemirror-state";
import { isAppHotkey } from "@/utils/app-hotkeys";

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
	jsx: javascript({ jsx: true }),
	tsx: javascript({ jsx: true, typescript: true }),
	python: python(),
	html: html(),
	css: css(),
	json: json(),
	markdown: markdown(),
	// Languages without specific extensions (use plain text)
	rust: null,
	sql: null,
	xml: null,
	java: null,
	cpp: null,
	c: null,
	php: null,
	shell: null,
	bash: null,
	text: null,
};

// Language display names for the modal
const LANGUAGE_OPTIONS = [
	{ value: "text", label: "Plain Text" },
	{ value: "javascript", label: "JavaScript" },
	{ value: "typescript", label: "TypeScript" },
	{ value: "jsx", label: "JSX" },
	{ value: "tsx", label: "TSX" },
	{ value: "python", label: "Python" },
	{ value: "rust", label: "Rust" },
	{ value: "java", label: "Java" },
	{ value: "cpp", label: "C++" },
	{ value: "c", label: "C" },
	{ value: "html", label: "HTML" },
	{ value: "css", label: "CSS" },
	{ value: "json", label: "JSON" },
	{ value: "sql", label: "SQL" },
	{ value: "xml", label: "XML" },
	{ value: "php", label: "PHP" },
	{ value: "markdown", label: "Markdown" },
	{ value: "shell", label: "Shell/Bash" },
];

// Simple language auto-detection based on content patterns
function detectLanguage(code: string): string {
	const trimmed = code.trim();
	if (!trimmed) return "text";
	
	// Check for common patterns
	if (/^#!/.test(trimmed) || /\b(echo|grep|awk|sed|cat|ls|cd|mkdir)\b/.test(trimmed)) return "shell";
	if (/^<\?php/.test(trimmed)) return "php";
	if (/^<!DOCTYPE|^<html/i.test(trimmed)) return "html";
	if (/^<\?xml/.test(trimmed)) return "xml";
	if (/^\s*{[\s\S]*}$/.test(trimmed) || /^\s*\[[\s\S]*\]$/.test(trimmed)) {
		try { JSON.parse(trimmed); return "json"; } catch {}
	}
	if (/\b(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\b/i.test(trimmed)) return "sql";
	if (/^(import|from)\s+\w+/.test(trimmed) && /def\s+\w+\s*\(/.test(trimmed)) return "python";
	if (/\bfn\s+\w+\s*\(/.test(trimmed) && /->/.test(trimmed)) return "rust";
	if (/\b(public|private|class)\s+\w+/.test(trimmed) && /\bvoid\b/.test(trimmed)) return "java";
	if (/^#include\s*</.test(trimmed) || /\bint\s+main\s*\(/.test(trimmed)) return "cpp";
	if (/\bfunction\s*\w*\s*\(/.test(trimmed) || /\bconst\s+\w+\s*=/.test(trimmed) || /=>\s*{/.test(trimmed)) {
		if (/<\w+/.test(trimmed)) return "jsx";
		return "javascript";
	}
	if (/:\s*(string|number|boolean|any)\b/.test(trimmed) || /interface\s+\w+/.test(trimmed)) {
		if (/<\w+/.test(trimmed)) return "tsx";
		return "typescript";
	}
	if (/^\s*\w+\s*{[^}]*}/.test(trimmed) && /:\s*[^;]+;/.test(trimmed)) return "css";
	
	return "text";
}

export class CodeBlockView implements NodeView {
	dom: HTMLElement;
	codeMirror: CodeMirrorView;
	node: ProseMirrorNode;
	view: EditorView;
	getPos: () => number | undefined;
	updating: boolean = false;
	langButton: HTMLButtonElement;
	modal: HTMLElement | null = null;
	languageCompartment: Compartment;

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

		// Create outer container with customizable styling
		this.dom = document.createElement("div");
		this.dom.className = "code-block-container relative my-3";
		this.dom.style.borderRadius = "8px";
		this.dom.style.border = `1px solid ${isDark ? "#374151" : "#d1d5db"}`;
		this.dom.style.backgroundColor = isDark ? "#0d1117" : "#f6f8fa";
		this.dom.style.overflow = "hidden";

		// Auto-detect language if not set
		let language = node.attrs.language;
		if (!language || language === "text") {
			const detected = detectLanguage(node.textContent);
			if (detected !== "text" && detected !== language) {
				language = detected;
				// Update the node attribute asynchronously
				setTimeout(() => this.updateLanguage(detected), 0);
			}
		}
		language = language || "text";

		// Create language button (clickable badge)
		this.langButton = document.createElement("button");
		this.langButton.className = "absolute top-2 right-2 z-10 text-xs rounded-md px-2 py-1 font-medium transition-colors";
		this.langButton.style.backgroundColor = isDark ? "#21262d" : "#eaeef2";
		this.langButton.style.border = `1px solid ${isDark ? "#30363d" : "#d0d7de"}`;
		this.langButton.style.color = isDark ? "#c9d1d9" : "#24292f";
		this.langButton.style.cursor = "pointer";
		this.langButton.textContent = this.getLanguageLabel(language);
		this.langButton.title = "Click to change language";
		
		this.langButton.addEventListener("mouseenter", () => {
			this.langButton.style.backgroundColor = isDark ? "#30363d" : "#d0d7de";
		});
		this.langButton.addEventListener("mouseleave", () => {
			this.langButton.style.backgroundColor = isDark ? "#21262d" : "#eaeef2";
		});
		this.langButton.addEventListener("click", (e) => {
			e.preventDefault();
			e.stopPropagation();
			this.showLanguageModal();
		});

		this.dom.appendChild(this.langButton);

		// Create CodeMirror container
		const cmContainer = document.createElement("div");
		cmContainer.className = "codemirror-wrapper";
		cmContainer.style.padding = "8px 0";
		this.dom.appendChild(cmContainer);

		// Get language extension
		const langExtension = languageExtensions[language] || [];

		// Create language compartment for dynamic reconfiguration
		this.languageCompartment = new Compartment();

		// Create CodeMirror instance
		const startState = CodeMirrorState.create({
			doc: node.textContent,
			extensions: [
				// FIRST: Highest priority handler to let app hotkeys bubble up
				Prec.highest(
					CodeMirrorView.domEventHandlers({
						keydown: (e: KeyboardEvent) => {
							// Allow app-level hotkeys to bubble up to react-hotkeys-hook
							if (isAppHotkey(e)) {
								return true; // Stop CodeMirror from processing, let it bubble to app
							}

							const doc = this.codeMirror.state.doc;
							const selection = this.codeMirror.state.selection.main;
							
							// Handle backspace - delete block if empty OR at start with nothing to delete
							if (e.key === "Backspace") {
								// If block is empty, delete it
								if (doc.length === 0) {
									return this.deleteCodeBlock(e);
								}
								// If at very start and nothing selected, delete the block
								if (selection.from === 0 && selection.to === 0) {
									return this.deleteCodeBlock(e);
								}
							}
							
							// Handle Delete key at end of empty block
							if (e.key === "Delete" && doc.length === 0) {
								return this.deleteCodeBlock(e);
							}
							
							// Handle Escape key - exit to ProseMirror (cursor after code block)
							if (e.key === "Escape") {
								e.preventDefault();
								return this.exitCodeBlock("after");
							}

							// Handle Ctrl+Enter or Mod+Enter - exit and create new paragraph below
							if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
								e.preventDefault();
								return this.exitCodeBlock("after", true);
							}

							// Handle Arrow Down at last line - exit to next block
							if (e.key === "ArrowDown") {
								const lastLine = doc.line(doc.lines);
								if (selection.from >= lastLine.from && selection.to <= lastLine.to) {
									e.preventDefault();
									return this.exitCodeBlock("after");
								}
							}

							// Handle Arrow Up at first line - exit to previous block
							if (e.key === "ArrowUp") {
								const firstLine = doc.line(1);
								if (selection.from >= firstLine.from && selection.to <= firstLine.to) {
									e.preventDefault();
									return this.exitCodeBlock("before");
								}
							}

							return false;
						},
					})
				),
				...basicExtensions,
				this.languageCompartment.of(langExtension ? [langExtension] : []),
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

		// Add capture-phase event listener to intercept app hotkeys BEFORE CodeMirror
		// This is necessary because CodeMirror may call stopPropagation() on events
		cmElement.addEventListener('keydown', (e: KeyboardEvent) => {
			if (isAppHotkey(e)) {
				e.stopPropagation();
				// Dispatch a new event to document so react-hotkeys-hook can catch it
				const clonedEvent = new KeyboardEvent('keydown', {
					key: e.key,
					code: e.code,
					ctrlKey: e.ctrlKey,
					shiftKey: e.shiftKey,
					altKey: e.altKey,
					metaKey: e.metaKey,
					bubbles: true,
					cancelable: true,
				});
				document.dispatchEvent(clonedEvent);
			}
		}, { capture: true });

		// Auto-focus the CodeMirror editor if the code block is empty (newly created)
		// and the ProseMirror editor has focus
		if (node.textContent.length === 0 && view.hasFocus()) {
			// Use setTimeout to ensure the DOM is ready
			setTimeout(() => {
				this.codeMirror.focus();
			}, 0);
		}
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

	deleteCodeBlock(e: KeyboardEvent): boolean {
		const pos = this.getPos();
		if (pos === undefined || !this.view) return false;
		
		e.preventDefault();
		// Delete the code block and replace with empty paragraph
		const paragraphNode = this.view.state.schema.nodes.paragraph;
		if (!paragraphNode) return false;
		const tr = this.view.state.tr.replaceWith(
			pos,
			pos + this.node.nodeSize,
			paragraphNode.create()
		);
		this.view.dispatch(tr);
		this.view.focus();
		return true;
	}

	/**
	 * Exit the code block and optionally create a new paragraph
	 * @param direction - "before" to exit above, "after" to exit below
	 * @param createParagraph - if true, insert a new paragraph at exit position
	 */
	exitCodeBlock(direction: "before" | "after", createParagraph: boolean = false): boolean {
		const pos = this.getPos();
		if (pos === undefined || !this.view) return false;

		const { state } = this.view;
		const endPos = pos + this.node.nodeSize;

		if (createParagraph) {
			// Insert a new paragraph after the code block
			const paragraphNode = state.schema.nodes.paragraph;
			if (!paragraphNode) return false;
			
			const insertPos = direction === "after" ? endPos : pos;
			const tr = state.tr.insert(insertPos, paragraphNode.create());
			// Set selection to the new paragraph
			const newPos = direction === "after" ? endPos + 1 : pos + 1;
			tr.setSelection(TextSelection.near(tr.doc.resolve(newPos)));
			this.view.dispatch(tr);
			this.view.focus();
		} else {
			// Just move focus to adjacent content
			const targetPos = direction === "after" ? endPos : pos;
			const resolvedPos = state.doc.resolve(targetPos);
			
			// Try to find a valid cursor position
			let selection;
			if (direction === "after") {
				// Try to place cursor at start of next node
				selection = Selection.findFrom(resolvedPos, 1, true);
			} else {
				// Try to place cursor at end of previous node
				selection = Selection.findFrom(resolvedPos, -1, true);
			}
			
			if (selection) {
				const tr = state.tr.setSelection(selection);
				this.view.dispatch(tr);
				this.view.focus();
			} else if (createParagraph === false) {
				// No adjacent content, create a paragraph
				return this.exitCodeBlock(direction, true);
			}
		}
		
		return true;
	}

	updateLanguage(newLang: string) {
		const pos = this.getPos();
		if (pos === undefined) return;

		// Update ProseMirror node attribute
		const tr = this.view.state.tr.setNodeMarkup(pos, undefined, {
			...this.node.attrs,
			language: newLang,
		});
		this.view.dispatch(tr);
		
		// Update CodeMirror syntax highlighting via compartment reconfiguration
		const newLangExtension = languageExtensions[newLang] || [];
		this.codeMirror.dispatch({
			effects: this.languageCompartment.reconfigure(newLangExtension ? [newLangExtension] : []),
		});
		
		// Update button label
		this.langButton.textContent = this.getLanguageLabel(newLang);
	}

	getLanguageLabel(lang: string): string {
		const option = LANGUAGE_OPTIONS.find(opt => opt.value === lang);
		return option ? option.label : lang;
	}

	showLanguageModal() {
		if (this.modal) return; // Already open
		
		const isDark = document.documentElement.classList.contains("dark");
		
		// Create modal backdrop
		this.modal = document.createElement("div");
		this.modal.style.cssText = `
			position: fixed;
			inset: 0;
			z-index: 9999;
			display: flex;
			align-items: center;
			justify-content: center;
			background: rgba(0, 0, 0, 0.5);
		`;
		
		// Create modal content
		const content = document.createElement("div");
		content.style.cssText = `
			background: ${isDark ? "#1f2937" : "#ffffff"};
			border-radius: 12px;
			padding: 16px;
			max-width: 320px;
			width: 90%;
			max-height: 400px;
			overflow-y: auto;
			box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
		`;
		
		// Title
		const title = document.createElement("div");
		title.textContent = "Select Language";
		title.style.cssText = `
			font-weight: 600;
			font-size: 14px;
			margin-bottom: 12px;
			color: ${isDark ? "#f3f4f6" : "#111827"};
		`;
		content.appendChild(title);
		
		// Language list
		const list = document.createElement("div");
		list.style.cssText = `
			display: grid;
			grid-template-columns: repeat(2, 1fr);
			gap: 6px;
		`;
		
		const currentLang = this.node.attrs.language || "text";
		
		LANGUAGE_OPTIONS.forEach(opt => {
			const btn = document.createElement("button");
			btn.textContent = opt.label;
			const isActive = opt.value === currentLang;
			btn.style.cssText = `
				padding: 8px 12px;
				border-radius: 6px;
				font-size: 13px;
				text-align: left;
				cursor: pointer;
				border: 1px solid ${isDark ? "#374151" : "#e5e7eb"};
				background: ${isActive ? (isDark ? "#3b82f6" : "#3b82f6") : (isDark ? "#111827" : "#f9fafb")};
				color: ${isActive ? "#ffffff" : (isDark ? "#e5e7eb" : "#374151")};
				transition: all 0.15s;
			`;
			btn.addEventListener("mouseenter", () => {
				if (!isActive) {
					btn.style.background = isDark ? "#374151" : "#e5e7eb";
				}
			});
			btn.addEventListener("mouseleave", () => {
				if (!isActive) {
					btn.style.background = isDark ? "#111827" : "#f9fafb";
				}
			});
			btn.addEventListener("click", () => {
				this.updateLanguage(opt.value);
				this.closeModal();
			});
			list.appendChild(btn);
		});
		
		content.appendChild(list);
		this.modal.appendChild(content);
		
		// Close on backdrop click
		this.modal.addEventListener("click", (e) => {
			if (e.target === this.modal) {
				this.closeModal();
			}
		});
		
		// Close on Escape
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				this.closeModal();
				document.removeEventListener("keydown", handleEscape);
			}
		};
		document.addEventListener("keydown", handleEscape);
		
		document.body.appendChild(this.modal);
	}

	closeModal() {
		if (this.modal) {
			this.modal.remove();
			this.modal = null;
		}
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
		// When selected as a node, add keyboard handler for deletion
		this.dom.addEventListener("keydown", this.handleNodeKeyDown);
	}

	deselectNode() {
		this.dom.classList.remove("ProseMirror-selectednode");
		this.dom.removeEventListener("keydown", this.handleNodeKeyDown);
	}

	handleNodeKeyDown = (e: KeyboardEvent) => {
		// Allow deleting the code block when it's selected as a node
		if (e.key === "Backspace" || e.key === "Delete") {
			const pos = this.getPos();
			if (pos === undefined || !this.view) return;
			
			e.preventDefault();
			e.stopPropagation();
			
			// Delete the code block and replace with empty paragraph
			const paragraphNode = this.view.state.schema.nodes.paragraph;
			if (!paragraphNode) return;
			const tr = this.view.state.tr.replaceWith(
				pos,
				pos + this.node.nodeSize,
				paragraphNode.create()
			);
			this.view.dispatch(tr);
			this.view.focus();
		}
	};

	stopEvent(event: Event) {
		// Allow keyboard events when the code block is selected (not editing inside)
		if (this.dom.classList.contains("ProseMirror-selectednode")) {
			// Let backspace/delete through for deletion
			if (event instanceof KeyboardEvent && (event.key === "Backspace" || event.key === "Delete")) {
				return false;
			}
		}
		
		// Let global hotkeys through (Ctrl+key, Alt+key, and function keys)
		if (event instanceof KeyboardEvent) {
			// Allow function keys (F1-F12)
			if (/^F\d+$/.test(event.key)) {
				return false;
			}
			// Allow Ctrl+key combinations (except those CodeMirror needs like Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z, Ctrl+Y)
			if (event.ctrlKey || event.metaKey) {
				const cmKeys = ["a", "c", "v", "x", "z", "y", "d", "f"];
				if (!cmKeys.includes(event.key.toLowerCase())) {
					return false;
				}
			}
		}
		
		// Block all other events (let CodeMirror handle them when editing)
		return true;
	}

	destroy() {
		this.closeModal();
		this.codeMirror.destroy();
	}

	ignoreMutation() {
		return true;
	}
}
