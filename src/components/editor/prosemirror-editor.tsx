import { useEffect, useRef } from "react";
import { EditorState, TextSelection, Selection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { DOMParser, DOMSerializer } from "prosemirror-model";
import { useLineWrapping } from "@/hooks";
import { editorCursorPositionStore } from "@/hooks/use-editor-view-toggle";
import { customSetup } from "./prosemirror-setup";
import { EditorToolbar } from "./editor-toolbar";
import { CodeBlockView } from "./codemirror-nodeview";
import { editorSchema } from "./schema";
import "prosemirror-view/style/prosemirror.css";
import "@/styles/prosemirror.css";

// Use the extended schema from schema.ts
const mySchema = editorSchema;

interface ProseMirrorEditorProps {
	content: string;
	onChange?: (content: string) => void;
	readOnly?: boolean;
	toolbarVisible?: boolean;
	initialCursorPosition?: number;
	autoFocus?: boolean;
}

export function ProseMirrorEditor({
	content,
	onChange,
	readOnly = false,
	toolbarVisible = false,
	initialCursorPosition,
	autoFocus = false,
}: ProseMirrorEditorProps) {
	const editorRef = useRef<HTMLDivElement>(null);
	const viewRef = useRef<EditorView | null>(null);
	const onChangeRef = useRef(onChange);
	const initialContentRef = useRef(content);
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
				"Mod-g", // Toggle sidebar
				"Mod-j", // Toggle activity bar
				"Mod-w", // Close tab
				"Mod-t", // New tab
				"Mod-e", // Toggle editor view
			],
		});

		// Determine initial selection:
		// - If initialCursorPosition is a number, restore that exact position
		// - If undefined (first time opening), place cursor at end of document
		const initialSelection = initialCursorPosition !== undefined
			? TextSelection.create(doc, Math.min(initialCursorPosition, doc.content.size))
			: Selection.atEnd(doc);

		const state = EditorState.create({
			doc,
			plugins,
			selection: initialSelection,
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

		// Apply initial line-wrapping class
		view.dom.classList.add(isWrapping ? "wrap-enabled" : "wrap-disabled");

		viewRef.current = view;
		// Note: Don't auto-focus - let user click or use Ctrl+Alt+1/2 to focus pane
		// Initial cursor position is set in EditorState.create() above

		// Auto-focus if requested (e.g., when toggling editor view)
		if (autoFocus) {
			setTimeout(() => view.focus(), 0);
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
		};
	}, []);

	// Update line wrapping class dynamically (preserves cursor!)
	useEffect(() => {
		if (!viewRef.current) return;

		const dom = viewRef.current.dom;
		if (isWrapping) {
			dom.classList.remove("wrap-disabled");
			dom.classList.add("wrap-enabled");
		} else {
			dom.classList.remove("wrap-enabled");
			dom.classList.add("wrap-disabled");
		}
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

			// Preserve cursor at end of document when content updates externally
			const newState = EditorState.create({
				doc,
				plugins: view.state.plugins,
				selection: Selection.atEnd(doc),
			});

			view.updateState(newState);
		}
	}, [content]);

	// Note: Editor focus is controlled by user actions (click, Ctrl+Alt+1/2)
	// We intentionally don't auto-focus to prevent stealing focus from tree

	return (
		<div
			className="h-full w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col"
		>
			{toolbarVisible && (
				<EditorToolbar editorView={viewRef.current} schema={mySchema} />
			)}
			<div
				ref={editorRef}
				className="flex-1 prose dark:prose-invert max-w-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-inset"
				style={{
					fontSize: "16px",
					lineHeight: "1.6",
				}}
			/>
		</div>
	);
}
