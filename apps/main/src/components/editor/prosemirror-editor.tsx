import { useEffect, useRef, useState, useCallback } from "react";
import { EditorState, TextSelection, Selection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { DOMParser, DOMSerializer } from "prosemirror-model";
import { useSetAtom, useAtomValue } from "jotai";
import { invoke } from "@tauri-apps/api/core";
import { useLineWrapping } from "@/hooks";
import { editorCursorPositionStore } from "@/hooks/use-editor-view-toggle";
import { editorStatsAtom } from "@/atoms/editor-stats";
import { editorKeybindingsAtom } from "@/atoms/editor-keybindings";
import { customSetup } from "./prosemirror-setup";
import { EditorToolbar } from "./editor-toolbar";
import { SearchBar } from "./search-bar";
import { FormatPicker, type FormatPickerType } from "./format-picker";
import { CodeBlockView,  detectLanguage } from "./codemirror-nodeview";
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
	const setEditorStats = useSetAtom(editorStatsAtom);
	const setEditorStatsRef = useRef(setEditorStats);
	const editorKeybindings = useAtomValue(editorKeybindingsAtom);
	const [showSearch, setShowSearch] = useState(false);
	const [activePicker, setActivePicker] = useState<FormatPickerType | null>(null);
	const openPickerRef = useRef<(type: FormatPickerType) => void>(undefined);
	openPickerRef.current = (type) => setActivePicker(type);

	// Handle Ctrl+F to open search
	const handleSearchOpen = useCallback(() => {
		setShowSearch(true);
	}, []);

	const handleSearchClose = useCallback(() => {
		setShowSearch(false);
	}, []);

	// Keep refs up to date
	useEffect(() => {
		setEditorStatsRef.current = setEditorStats;
	}, [setEditorStats]);

	// Helper to calculate editor stats from state
	const calculateAndUpdateStats = (state: EditorState) => {
		const { doc, selection } = state;
		const pos = selection.from;
		
		// Calculate line and column
		let line = 1;
		let lastLineStart = 0;
		doc.nodesBetween(0, pos, (node, nodePos) => {
			if (node.isBlock && nodePos < pos) {
				line++;
				lastLineStart = nodePos + 1;
			}
			return true;
		});
		const column = pos - lastLineStart + 1;
		
		// Calculate word count and character count from full document
		let text = "";
		doc.descendants((node) => {
			if (node.isText) {
				text += node.text + " ";
			} else if (node.isBlock) {
				text += " ";
			}
		});
		const charCount = text.replace(/\s/g, "").length;
		const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
		
		setEditorStatsRef.current({ line, column, wordCount, charCount });
	};

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
			editorKeybindings,
			onOpenPicker: (type) => openPickerRef.current?.(type),
			appShortcuts: [
				"Mod-g", // Toggle sidebar
				"Mod-j", // Toggle activity bar
				"Mod-w", // Close tab
				"Mod-e", // Toggle editor view
				"Shift-Mod-,", // Open settings
				"Shift-Mod-.", // Open keyboard shortcuts
				"Mod-,", // Sidebar resize left
				"Mod-.", // Sidebar resize right
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

		// Ctrl+Alt+V: Paste as code block with VS Code language detection
		const handlePasteAsCodeBlock = async (e: KeyboardEvent) => {
			if ((e.key === "v" || e.key === "V") && (e.ctrlKey || e.metaKey) && e.altKey) {
				e.preventDefault();
				e.stopPropagation();

				try {
					// Read plain text from clipboard
					const text = await invoke<string>("read_clipboard_target", { target: "UTF8_STRING" });
					if (!text) return;

					// Try to get VS Code language from clipboard metadata
					let language = "text";
					try {
						const vscodeData = await invoke<string>("read_vscode_editor_data");
						console.log("vscode-editor-data:", vscodeData);
						const { mode } = JSON.parse(vscodeData);
						// Map VS Code mode to our language names
						const languageMap: Record<string, string> = {
							typescript: "typescript",
							typescriptreact: "tsx",
							javascript: "javascript",
							javascriptreact: "jsx",
							python: "python",
							rust: "rust",
							java: "java",
							cpp: "cpp",
							c: "c",
							html: "html",
							css: "css",
							json: "json",
							jsonc: "json",
							sql: "sql",
							xml: "xml",
							php: "php",
							markdown: "markdown",
							shellscript: "shell",
							bash: "shell",
						};
						language = languageMap[mode] || mode || "text";
					} catch {
						// Fall back to auto-detection
						language = detectLanguage(text);
					}

					// Create and insert code block
					const codeBlockType = mySchema.nodes.code_block;
					if (!codeBlockType || !viewRef.current) return;

					const codeBlock = codeBlockType.create(
						{ language },
						mySchema.text(text),
					);

					const tr = viewRef.current.state.tr.replaceSelectionWith(codeBlock);
					viewRef.current.dispatch(tr.scrollIntoView());
				} catch (err) {
					console.error("Paste as code block failed:", err);
				}
			}
		};
		document.addEventListener("keydown", handlePasteAsCodeBlock, true);

		const view = new EditorView(editorRef.current, {
			state,
			editable: () => !readOnly,
			nodeViews: {
				code_block: (node, view, getPos) => new CodeBlockView(node, view, getPos),
			},
			transformPastedHTML(html) {
				// Line-based model: convert <br> to paragraph breaks instead of
				// relying on ProseMirror's hard_break (which doesn't exist in our schema).
				// 1. Strip trailing <br> before </p> (prevents extra empty paragraphs)
				// 2. Convert remaining <br> to </p><p> (splits into separate lines)
				// 3. Normalize <p>&nbsp;</p> to <p></p> (nbsp is just a browser hack
				//    to keep empty paragraphs visible; ProseMirror handles empty <p> fine)
				// 4. Strip default-black color that browsers inject into clipboard HTML
				// 5. Clean up empty style attributes
				return html
					.replace(/<br\s*\/?>\s*<\/p>/gi, "</p>")
					.replace(/<br\s*\/?>/gi, "</p><p>")
					.replace(/<p>\s*&nbsp;\s*<\/p>/gi, "<p></p>")
					.replace(/\s*color:\s*rgb\(0,\s*0,\s*0\);?/gi, "")
					.replace(/\s*color:\s*#000000;?/gi, "")
					.replace(/\s*style="\s*"/g, "");
			},
			dispatchTransaction(transaction) {
				const newState = view.state.apply(transaction);
				view.updateState(newState);

				// Update cursor position in store on selection changes
				if (transaction.selectionSet) {
					editorCursorPositionStore.setPosition(newState.selection.from);
				}

				// Update stats on selection or content changes
				if (transaction.selectionSet || transaction.docChanged) {
					calculateAndUpdateStats(newState);
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

		// Calculate initial stats
		calculateAndUpdateStats(state);

		// Auto-focus if requested (e.g., when toggling editor view)
		if (autoFocus) {
			setTimeout(() => view.focus(), 0);
		}

		// Handle Ctrl+F for search
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "f") {
				e.preventDefault();
				e.stopPropagation();
				handleSearchOpen();
			}
		};
		view.dom.addEventListener("keydown", handleKeyDown);

		return () => {
			// Save cursor position before unmounting
			if (viewRef.current) {
				editorCursorPositionStore.setPosition(
					viewRef.current.state.selection.from
				);
			}
			document.removeEventListener("keydown", handlePasteAsCodeBlock, true);
			view.dom.removeEventListener("keydown", handleKeyDown);
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
			className="h-full w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col overflow-visible relative"
		>
			{showSearch && (
				<SearchBar view={viewRef.current} onClose={handleSearchClose} />
			)}
			{toolbarVisible && (
				<EditorToolbar editorView={viewRef.current} schema={mySchema} />
			)}
			<div
				ref={editorRef}
				className="editor-content-zoom flex-1 prose dark:prose-invert max-w-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-inset overflow-auto"

			/>
			{activePicker && viewRef.current && (
				<FormatPicker
					type={activePicker}
					editorView={viewRef.current}
					schema={mySchema}
					onClose={() => {
						setActivePicker(null);
						viewRef.current?.focus();
					}}
				/>
			)}
		</div>
	);
}
