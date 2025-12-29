import { useEffect, useRef } from "react";
import { EditorState, TextSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema, DOMParser, DOMSerializer } from "prosemirror-model";
import { schema } from "prosemirror-schema-basic";
import { addListNodes } from "prosemirror-schema-list";
import { useLineWrapping } from "@/hooks";
import { editorCursorPositionStore } from "@/hooks/use-editor-view-toggle";
import { customSetup } from "./prosemirror-setup";
import { EditorToolbar } from "./editor-toolbar";
import { CodeBlockView } from "./codemirror-nodeview";
import "prosemirror-view/style/prosemirror.css";

// Extend basic schema with list nodes and code_block
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
	toDOM: (node: any): [string, Record<string, string>, [string, number]] => [
		"pre",
		{ "data-language": node.attrs.language },
		["code", 0],
	],
};

const mySchema = new Schema({
	nodes: addListNodes(
		schema.spec.nodes,
		"paragraph block*",
		"block"
	).append({ code_block: codeBlockSpec }),
	marks: schema.spec.marks,
});

interface ProseMirrorEditorProps {
	content: string;
	onChange?: (content: string) => void;
	readOnly?: boolean;
	toolbarVisible?: boolean;
	initialCursorPosition?: number;
}

export function ProseMirrorEditor({
	content,
	onChange,
	readOnly = false,
	toolbarVisible = false,
	initialCursorPosition,
}: ProseMirrorEditorProps) {
	const editorRef = useRef<HTMLDivElement>(null);
	const viewRef = useRef<EditorView | null>(null);
	const onChangeRef = useRef(onChange);
	const initialContentRef = useRef(content);
	const styleRef = useRef<HTMLStyleElement | null>(null);
	const { isWrapping } = useLineWrapping();

	// Keep refs up to date
	useEffect(() => {
		onChangeRef.current = onChange;
	}, [onChange]);

	// Create editor only once on mount
	useEffect(() => {
		if (!editorRef.current || viewRef.current) return;

		// Parse HTML content to ProseMirror document
		const contentDiv = document.createElement("div");
		const htmlContent =
			initialContentRef.current && initialContentRef.current.trim()
				? initialContentRef.current.includes("<")
					? initialContentRef.current
					: `<p>${initialContentRef.current}</p>`
				: "<p></p>";
		contentDiv.innerHTML = htmlContent;
		const doc = DOMParser.fromSchema(mySchema).parse(contentDiv);

		const plugins = customSetup({
			schema: mySchema,
			history: true,
			appShortcuts: [
				"Mod-b", // Toggle sidebar
				"Mod-j", // Toggle activity bar
				"Mod-w", // Close tab
				"Mod-t", // New tab
				"Mod-d", // Toggle dual pane
				"Mod-e", // Toggle editor view
			],
		});

		const state = EditorState.create({
			doc,
			plugins,
		});

		const view = new EditorView(editorRef.current, {
			state,
			editable: () => !readOnly,
			nodeViews: {
				code_block: (node, view, getPos) => new CodeBlockView(node, view, getPos),
			},
			dispatchTransaction(transaction) {
				const newState = view.state.apply(transaction);
				view.updateState(newState);

				// Update cursor position in store on selection changes
				if (transaction.selectionSet) {
					editorCursorPositionStore.setPosition(newState.selection.from);
				}

				// Call onChange when content changes (debounce with requestAnimationFrame)
				if (transaction.docChanged && onChangeRef.current) {
					requestAnimationFrame(() => {
						const div = document.createElement("div");
						const fragment = DOMSerializer.fromSchema(
							mySchema
						).serializeFragment(newState.doc.content);
						div.appendChild(fragment);

						// Format HTML with newlines for better readability in source view
						const html = div.innerHTML
							.replace(/<\/p>/g, "</p>\n")
							.replace(/<\/li>/g, "</li>\n")
							.replace(/<\/ul>/g, "</ul>\n")
							.replace(/<\/ol>/g, "</ol>\n")
							.replace(/<\/h[1-6]>/g, "$&\n")
							.replace(/<\/blockquote>/g, "</blockquote>\n")
							.trim();

						if (onChangeRef.current) {
							onChangeRef.current(html);
						}
					});
				}
			},
		});

		// Add CSS to make editor fill container
		const style = document.createElement("style");
		style.textContent = `
			.ProseMirror {
				height: 100%;
				min-height: 100%;
				padding: 1rem;
				outline: none;
				white-space: ${isWrapping ? "pre-wrap" : "pre"};
				word-wrap: break-word;
				overflow-x: ${isWrapping ? "hidden" : "auto"};
			}
			
			/* Heading styles */
			.ProseMirror h1 {
				font-size: 2em;
				font-weight: bold;
				margin: 0.67em 0;
				line-height: 1.2;
			}
			
			.ProseMirror h2 {
				font-size: 1.5em;
				font-weight: bold;
				margin: 0.75em 0;
				line-height: 1.3;
			}
			
			.ProseMirror h3 {
				font-size: 1.17em;
				font-weight: bold;
				margin: 0.83em 0;
				line-height: 1.4;
			}
			
			/* List styles */
			.ProseMirror ul {
				margin: 0.5em 0;
				padding-left: 1.5em;
				list-style-type: disc;
			}
			
			.ProseMirror ol {
				margin: 0.5em 0;
				padding-left: 1.5em;
				list-style-type: decimal;
			}
			
			.ProseMirror li {
				margin: 0.25em 0;
				display: list-item;
			}
			
			/* Blockquote styles */
			.ProseMirror blockquote {
				border-left: 3px solid #ccc;
				margin: 0.5em 0;
				padding: 0.25em 0 0.25em 1em;
				color: #666;
				font-style: italic;
			}
			
			/* Dark mode blockquote */
			.dark .ProseMirror blockquote {
				border-left-color: #555;
				color: #aaa;
			}
			
			/* Paragraph spacing */
			.ProseMirror p {
				margin: 0.5em 0;
			}
			
			/* Code mark */
			.ProseMirror code {
				background-color: rgba(175, 184, 193, 0.2);
				padding: 0.2em 0.4em;
				border-radius: 3px;
				font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
				font-size: 0.85em;
				color: #e01e5a;
			}
			
			.dark .ProseMirror code {
				background-color: rgba(110, 118, 129, 0.4);
				color: #ff6b9d;
			}
			
			/* Code block container */
			.ProseMirror .code-block-container {
				overflow: hidden;
			}
			
			.ProseMirror .code-block-container .cm-editor {
				background: transparent !important;
			}
			
			.ProseMirror .code-block-container .cm-gutters {
				background: rgba(0, 0, 0, 0.05);
			}
			
			.dark .ProseMirror .code-block-container .cm-gutters {
				background: rgba(255, 255, 255, 0.05);
			}
			
			.ProseMirror-selectednode .code-block-container {
				outline: 2px solid #3b82f6;
			}
		`;

		editorRef.current.appendChild(style);
		styleRef.current = style;

		viewRef.current = view;
		view.focus();

		// Restore cursor position if provided
		if (initialCursorPosition !== undefined && initialCursorPosition > 0) {
			const pos = Math.min(initialCursorPosition, view.state.doc.content.size);
			const tr = view.state.tr.setSelection(
				TextSelection.create(view.state.doc, pos)
			);
			view.dispatch(tr);
		}

		return () => {
			// Save cursor position before unmounting
			if (viewRef.current) {
				editorCursorPositionStore.setPosition(
					viewRef.current.state.selection.from
				);
			}
			view.destroy();
			viewRef.current = null;
			if (styleRef.current && styleRef.current.parentNode) {
				styleRef.current.parentNode.removeChild(styleRef.current);
			}
			styleRef.current = null;
		};
	}, []);

	// Update line wrapping styles dynamically (preserves cursor!)
	useEffect(() => {
		if (!styleRef.current) return;

		styleRef.current.textContent = `
			.ProseMirror {
				height: 100%;
				min-height: 100%;
				padding: 1rem;
				outline: none;
				white-space: ${isWrapping ? "pre-wrap" : "pre"};
				word-wrap: break-word;
				overflow-x: ${isWrapping ? "hidden" : "auto"};
			}
			
			/* Heading styles */
			.ProseMirror h1 {
				font-size: 2em;
				font-weight: bold;
				margin: 0.67em 0;
				line-height: 1.2;
			}
			
			.ProseMirror h2 {
				font-size: 1.5em;
				font-weight: bold;
				margin: 0.75em 0;
				line-height: 1.3;
			}
			
			.ProseMirror h3 {
				font-size: 1.17em;
				font-weight: bold;
				margin: 0.83em 0;
				line-height: 1.4;
			}
			
			/* List styles */
			.ProseMirror ul {
				margin: 0.5em 0;
				padding-left: 1.5em;
				list-style-type: disc;
			}
			
			.ProseMirror ol {
				margin: 0.5em 0;
				padding-left: 1.5em;
				list-style-type: decimal;
			}
			
			.ProseMirror li {
				margin: 0.25em 0;
				display: list-item;
			}
			
			/* Blockquote styles */
			.ProseMirror blockquote {
				border-left: 3px solid #ccc;
				margin: 0.5em 0;
				padding: 0.25em 0 0.25em 1em;
				color: #666;
				font-style: italic;
			}
			
			/* Dark mode blockquote */
			.dark .ProseMirror blockquote {
				border-left-color: #555;
				color: #aaa;
			}
			
			/* Paragraph spacing */
			.ProseMirror p {
				margin: 0.5em 0;
			}
			
			/* Code mark */
			.ProseMirror code {
				background-color: rgba(175, 184, 193, 0.2);
				padding: 0.2em 0.4em;
				border-radius: 3px;
				font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
				font-size: 0.85em;
				color: #e01e5a;
			}
			
			.dark .ProseMirror code {
				background-color: rgba(110, 118, 129, 0.4);
				color: #ff6b9d;
			}
			
			/* Code block container */
			.ProseMirror .code-block-container {
				overflow: hidden;
			}
			
			.ProseMirror .code-block-container .cm-editor {
				background: transparent !important;
			}
			
			.ProseMirror .code-block-container .cm-gutters {
				background: rgba(0, 0, 0, 0.05);
			}
			
			.dark .ProseMirror .code-block-container .cm-gutters {
				background: rgba(255, 255, 255, 0.05);
			}
			
			.ProseMirror-selectednode .code-block-container {
				outline: 2px solid #3b82f6;
			}
		`;
	}, [isWrapping]);

	// Update content when it changes externally
	useEffect(() => {
		const view = viewRef.current;
		if (!view) return;

		// Don't update if editor has focus (user is actively editing)
		if (view.hasFocus()) return;

		// Get current content as HTML
		const div = document.createElement("div");
		const fragment = DOMSerializer.fromSchema(mySchema).serializeFragment(
			view.state.doc.content
		);
		div.appendChild(fragment);

		// Normalize both current and incoming content by removing all whitespace between tags
		const normalizeHtml = (html: string) => html.replace(/>\s+</g, "><").trim();
		const currentContent = normalizeHtml(div.innerHTML);
		const incomingContent = normalizeHtml(content || "");

		// Only update if content actually changed
		if (currentContent !== incomingContent) {
			const contentDiv = document.createElement("div");
			const htmlContent =
				content && content.trim()
					? content.includes("<")
						? content
						: `<p>${content}</p>`
					: "<p></p>";
			contentDiv.innerHTML = htmlContent;
			const doc = DOMParser.fromSchema(mySchema).parse(contentDiv);

			const newState = EditorState.create({
				doc,
				plugins: view.state.plugins,
			});

			view.updateState(newState);
		}
	}, [content]);

	// Focus editor when it becomes visible (e.g., after view toggle)
	useEffect(() => {
		const view = viewRef.current;
		if (view && !readOnly) {
			// Small delay to ensure DOM is ready
			setTimeout(() => {
				view.focus();
			}, 10);
		}
	}, [readOnly]);

	return (
		<div
			className="h-full w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col"
		>
			{toolbarVisible && (
				<EditorToolbar editorView={viewRef.current} schema={mySchema} />
			)}
			<div
				ref={editorRef}
				className="flex-1 prose dark:prose-invert max-w-none"
				style={{
					fontSize: "16px",
					lineHeight: "1.6",
				}}
			/>
		</div>
	);
}
