import { useEffect, useRef, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { EditorState, TextSelection, Selection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { DOMParser, DOMSerializer } from "prosemirror-model";
import { useSetAtom, useAtomValue } from "jotai";
import { invoke } from "@tauri-apps/api/core";
import { useLineWrapping } from "@/hooks";
import { editorCursorPositionStore } from "@/hooks/use-editor-view-toggle";
import { activeEditorViewStore } from "./active-editor-view-store";
import { editorStatsAtom } from "@/atoms/editor-stats";
import { editorKeybindingsAtom } from "@/atoms/editor-keybindings";
import { customSetup } from "./prosemirror-setup";
import { EditorToolbar } from "./editor-toolbar";
import { SearchBar } from "./search-bar";
import { FormatPicker, type FormatPickerType } from "./format-picker";
import {
	applyTextColor,
	applyHighlight,
	removeHighlight,
	clearAllFormatting,
} from "./format-commands";
import { openLinkAtCursor } from "./plugins/autolink";
import { DIRECT_TEXT_COLORS, DIRECT_HIGHLIGHT_COLORS } from "./format-constants";
import { CodeBlockView,  detectLanguage } from "./codemirror-nodeview";
import { editorSchema } from "./schema";
import { DetailsNodeView } from "./plugins/details-nodeview";
import { ImageNodeView } from "./plugins/image-nodeview";
import { insertTableWithSize, insertDetails } from "./prosemirror-setup";
import { TableInsertDialog } from "./table-insert-dialog";
import { saveAndInsertImage, extensionFromMime, extensionFromFilename } from "./image-utils";
import type { EditorKeybindings } from "@/config/default-editor-keybindings";
import { open } from "@tauri-apps/plugin-dialog";
import "prosemirror-view/style/prosemirror.css";
import "@/styles/prosemirror.css";

// Use the extended schema from schema.ts
const mySchema = editorSchema;

/**
 * Match a DOM KeyboardEvent against a ProseMirror key notation string.
 * Uses event.code for digit keys to handle Shift+digit correctly
 * (e.g. Shift+2 reports event.key="@" but event.code="Digit2").
 */
function matchesPmKey(event: KeyboardEvent, pmKey: string): boolean {
	const parts = pmKey.split(/-(?!$)/);
	const key = parts[parts.length - 1] || "";
	const mods = new Set(parts.slice(0, -1));

	const needCtrl = mods.has("Mod") || mods.has("Ctrl");
	const needShift = mods.has("Shift");
	const needAlt = mods.has("Alt");

	if ((event.ctrlKey || event.metaKey) !== needCtrl) return false;
	if (event.shiftKey !== needShift) return false;
	if (event.altKey !== needAlt) return false;

	// For digit keys, use event.code (layout-independent)
	if (/^[0-9]$/.test(key)) {
		return event.code === `Digit${key}`;
	}
	// For letter keys, compare case-insensitively
	if (/^[a-zA-Z]$/.test(key)) {
		return event.key.toLowerCase() === key.toLowerCase();
	}
	// Special characters
	if (key === "\\") return event.key === "\\" || event.code === "Backslash";

	return event.key === key;
}

interface ProseMirrorEditorProps {
	content: string;
	onChange?: (content: string) => void;
	readOnly?: boolean;
	toolbarVisible?: boolean;
	initialCursorPosition?: number;
	autoFocus?: boolean;
	titleBar?: ReactNode;
}

export function ProseMirrorEditor({
	content,
	onChange,
	readOnly = false,
	toolbarVisible = false,
	initialCursorPosition,
	autoFocus = false,
	titleBar,
}: ProseMirrorEditorProps) {
	const editorRef = useRef<HTMLDivElement>(null);
	const viewRef = useRef<EditorView | null>(null);
	const onChangeRef = useRef(onChange);
	const initialContentRef = useRef(content);
	const { isWrapping } = useLineWrapping();
	const setEditorStats = useSetAtom(editorStatsAtom);
	const setEditorStatsRef = useRef(setEditorStats);
	const editorKeybindings = useAtomValue(editorKeybindingsAtom);
	const editorKeybindingsRef = useRef<EditorKeybindings>(editorKeybindings);
	const [showSearch, setShowSearch] = useState(false);
	const [activePicker, setActivePicker] = useState<FormatPickerType | null>(null);
	const [errorToast, setErrorToast] = useState<string | null>(null);
	const [showTableDialog, setShowTableDialog] = useState(false);
	const openPickerRef = useRef<(type: FormatPickerType) => void>(undefined);
	openPickerRef.current = (type) => setActivePicker(type);

	// Handle Ctrl+F to open search
	const handleSearchOpen = useCallback(() => {
		setShowSearch(true);
	}, []);

	const handleSearchClose = useCallback(() => {
		setShowSearch(false);
	}, []);

	const showError = useCallback((message: string) => {
		setErrorToast(message);
		setTimeout(() => setErrorToast(null), 4000);
	}, []);

	// Keep refs up to date
	useEffect(() => {
		setEditorStatsRef.current = setEditorStats;
	}, [setEditorStats]);

	// Keep keybindings ref current for DOM handler
	useEffect(() => {
		editorKeybindingsRef.current = editorKeybindings;
	}, [editorKeybindings]);

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
		const doc = DOMParser.fromSchema(mySchema).parse(contentDiv, {
			preserveWhitespace: true,
		});

		const plugins = customSetup({
			schema: mySchema,
			history: true,
			editorKeybindings,
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
				details: (node, view, getPos) => new DetailsNodeView(node, view, getPos),
				image: (node, view, getPos) => new ImageNodeView(node, view, getPos),
			},
			// Custom plain text serialization for clipboard - fixes two issues:
			// 1. Removes extra blank lines between paragraphs (single newline instead)
			// 2. Includes list markers (bullets, numbers) that were being lost
			clipboardTextSerializer(slice) {
				const lines: string[] = [];

				function serializeNode(
					node: import("prosemirror-model").Node,
					depth: number,
					listType: "bullet" | "ordered" | null,
					listIndex: number,
				): number {
					const indent = "  ".repeat(depth);

					if (node.isText) {
						return listIndex;
					}

					if (node.type.name === "bullet_list") {
						node.forEach((child) => {
							serializeNode(child, depth, "bullet", 1);
						});
						return listIndex;
					}

					if (node.type.name === "ordered_list") {
						let idx = 1;
						node.forEach((child) => {
							idx = serializeNode(child, depth, "ordered", idx);
						});
						return listIndex;
					}

					if (node.type.name === "list_item") {
						// Collect the text content of immediate paragraph children
						const itemLines: string[] = [];
						node.forEach((child, _offset, index) => {
							if (child.type.name === "paragraph") {
								const text = child.textContent;
								if (index === 0) {
									// First paragraph gets the marker
									const marker = listType === "ordered" ? `${listIndex}. ` : "- ";
									itemLines.push(`${indent}${marker}${text}`);
								} else {
									// Subsequent paragraphs are indented without marker
									const extraIndent = listType === "ordered" ? "   " : "  ";
									itemLines.push(`${indent}${extraIndent}${text}`);
								}
							} else if (child.type.name === "bullet_list" || child.type.name === "ordered_list") {
								// Nested list
								serializeNode(child, depth + 1, null, 1);
							}
						});
						lines.push(...itemLines);
						return listIndex + 1;
					}

					if (node.type.name === "paragraph") {
						lines.push(node.textContent);
						return listIndex;
					}

					if (node.type.name === "blockquote") {
						node.forEach((child) => {
							if (child.type.name === "paragraph") {
								lines.push(`> ${child.textContent}`);
							} else {
								serializeNode(child, depth, null, 1);
							}
						});
						return listIndex;
					}

					if (node.type.name === "code_block") {
						lines.push(node.textContent);
						return listIndex;
					}

					if (node.type.name === "horizontal_rule") {
						lines.push("---");
						return listIndex;
					}

					// For other block nodes, recurse into children
					if (node.isBlock) {
						node.forEach((child) => {
							serializeNode(child, depth, listType, listIndex);
						});
					}

					return listIndex;
				}

				slice.content.forEach((node) => {
					serializeNode(node, 0, null, 1);
				});

				return lines.join("\n");
			},
			// Custom scroll handling: allow vertical scrolling but prevent automatic
			// horizontal scrolling in no-wrap mode (which would hide left content)
			handleScrollToSelection(view) {
				// Get the scroll container
				const scrollEl = view.dom.parentElement;
				if (!scrollEl) return false; // Let default handle it
				
				// Get cursor coordinates
				const { head } = view.state.selection;
				const coords = view.coordsAtPos(head);
				const containerRect = scrollEl.getBoundingClientRect();
				
				// Only handle vertical scrolling - keep cursor vertically visible
				const margin = 50; // pixels from top/bottom edge
				if (coords.top < containerRect.top + margin) {
					// Cursor above visible area - scroll up
					scrollEl.scrollTop -= (containerRect.top + margin - coords.top);
				} else if (coords.bottom > containerRect.bottom - margin) {
					// Cursor below visible area - scroll down
					scrollEl.scrollTop += (coords.bottom - containerRect.bottom + margin);
				}
				
				// Return true to prevent default horizontal scrolling behavior
				// This keeps the left side of content visible while typing long lines
				return true;
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
			// Image paste: intercept clipboard image data or file paths
			handlePaste(pasteView, event) {
				const items = event.clipboardData?.items;
				if (!items) return false;

				// 1. Direct image MIME in clipboard (e.g. screenshot)
				for (const item of items) {
					if (item.type.startsWith("image/")) {
						const ext = extensionFromMime(item.type);
						if (!ext) continue;

						const blob = item.getAsFile();
						if (!blob) continue;

						event.preventDefault();
						blob.arrayBuffer().then((buf) => {
							saveAndInsertImage(
								pasteView,
								mySchema,
								new Uint8Array(buf),
								ext,
							);
						});
						return true;
					}
				}

				// 2. File path in clipboard (e.g. copied from file manager)
				// Try text/uri-list first (Thunar, Nautilus), then text/plain
				const uriList = event.clipboardData?.getData("text/uri-list")?.trim();
				const text = uriList || event.clipboardData?.getData("text/plain")?.trim();
				if (text) {
					// Handle multiple URIs (one per line), take the first image
					const lines = text.split(/\r?\n/).filter((l: string) => l && !l.startsWith("#"));
					for (const line of lines) {
						const trimmedLine = line.trim();
						const filePath = trimmedLine.startsWith("file://")
							? decodeURIComponent(trimmedLine.replace(/^file:\/\//, ""))
							: trimmedLine;
						const ext = extensionFromFilename(filePath);
						if (ext && filePath.startsWith("/")) {
							event.preventDefault();
							invoke<number[]>("read_image_file", { path: filePath }).then((bytes) => {
								saveAndInsertImage(pasteView, mySchema, new Uint8Array(bytes), ext);
							}).catch((err) => {
								console.error("Failed to read image from path:", err);
								showError(`Failed to read image: ${err}`);
							});
							return true;
						}
					}
				}

				return false;
			},
			// Image drop: intercept dropped image files from external sources
			handleDrop(dropView, event) {
				// Skip internal drags (ProseMirror moving nodes within the editor)
				if (dropView.dragging) return false;

				const files = event.dataTransfer?.files;
				if (!files || files.length === 0) {
					// No File objects — try text/uri-list (Thunar, some file managers)
					const uriList = event.dataTransfer?.getData("text/uri-list")?.trim();
					if (uriList) {
						const lines = uriList.split(/\r?\n/).filter((l: string) => l && !l.startsWith("#"));
						for (const line of lines) {
							const trimmedLine = line.trim();
							if (!trimmedLine.startsWith("file://")) continue;
							const filePath = decodeURIComponent(trimmedLine.replace(/^file:\/\//, ""));
							const ext = extensionFromFilename(filePath);
							if (!ext) continue;

							event.preventDefault();
							const pos = dropView.posAtCoords({
								left: event.clientX,
								top: event.clientY,
							});
							if (pos) {
								const tr = dropView.state.tr.setSelection(
									TextSelection.create(dropView.state.doc, pos.pos),
								);
								dropView.dispatch(tr);
							}

							invoke<number[]>("read_image_file", { path: filePath }).then((bytes) => {
								saveAndInsertImage(dropView, mySchema, new Uint8Array(bytes), ext);
							}).catch((err) => {
								console.error("Failed to read dropped image from path:", err);
							});
							return true;
						}
					}
					return false;
				}

				for (const file of files) {
					// Check MIME type first, fall back to extension (file managers like Thunar may not set MIME)
					const ext = file.type.startsWith("image/")
						? extensionFromMime(file.type)
						: extensionFromFilename(file.name);
					if (!ext) continue;

					event.preventDefault();
					// Move cursor to drop position
					const pos = dropView.posAtCoords({
						left: event.clientX,
						top: event.clientY,
					});
					if (pos) {
						const tr = dropView.state.tr.setSelection(
							TextSelection.create(dropView.state.doc, pos.pos),
						);
						dropView.dispatch(tr);
					}

					file.arrayBuffer().then((buf) => {
						saveAndInsertImage(
							dropView,
							mySchema,
							new Uint8Array(buf),
							ext,
						);
					});
					return true;
				}
				return false;
			},
			dispatchTransaction(transaction) {
				const newState = view.state.apply(transaction);
				view.updateState(newState);

				// When cursor moves to the start of a line (Home key, etc.) in
				// no-wrap mode, ProseMirror's scroll-into-view aligns the cursor
				// flush with the container's left edge, hiding the editor padding.
				// Snap scrollLeft to 0 so the left padding becomes visible again.
				const $head = newState.selection.$head;
				if (transaction.selectionSet && $head.parentOffset === 0) {
					const scrollEl = view.dom.parentElement;
					if (scrollEl) requestAnimationFrame(() => { scrollEl.scrollLeft = 0; });
				}

				// Fix for End key: when cursor is at the end of a line and
				// past the visible area, scroll just enough to make it visible.
				// Only apply on selection-only changes (navigation), not when typing.
				if (transaction.selectionSet && !transaction.docChanged && $head.parentOffset === $head.parent.content.size) {
					const scrollEl = view.dom.parentElement;
					if (scrollEl) {
						requestAnimationFrame(() => {
							// Get cursor coordinates and check if it's past the visible right edge
							const coords = view.coordsAtPos(newState.selection.head);
							const containerRect = scrollEl.getBoundingClientRect();
							const margin = 20; // pixels of breathing room
							
							if (coords.right > containerRect.right - margin) {
								// Scroll just enough to bring cursor into view
								const scrollNeeded = coords.right - containerRect.right + margin;
								scrollEl.scrollLeft += scrollNeeded;
							}
						});
					}
				}

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
		// Set initial overflow-x based on wrapping mode
		const scrollEl = view.dom.parentElement;
		if (scrollEl) {
			scrollEl.style.overflowX = isWrapping ? "hidden" : "auto";
		}

		viewRef.current = view;
		activeEditorViewStore.set(view);
		// Note: Don't auto-focus - let user click or use Ctrl+Alt+1/2 to focus pane
		// Initial cursor position is set in EditorState.create() above

		// Calculate initial stats
		calculateAndUpdateStats(state);

		// Auto-focus if requested (e.g., when toggling editor view)
		if (autoFocus) {
			setTimeout(() => view.focus(), 0);
		}

		// Handle Ctrl+F for search + all format shortcuts (digit-based)
		// DOM keydown handler is used instead of ProseMirror keymap for digit keys
		// because ProseMirror uses event.key which gives shifted characters
		// (e.g. Shift+2 → '@'), making Mod-Shift-2 unreliable across layouts.
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "f") {
				e.preventDefault();
				e.stopPropagation();
				handleSearchOpen();
				return;
			}

			// Alt+Enter: open link at cursor
			if (e.altKey && e.key === "Enter") {
				const v = viewRef.current;
				if (v && openLinkAtCursor(mySchema)(v.state, v.dispatch)) {
					e.preventDefault();
					e.stopPropagation();
					return;
				}
			}

			const kb = editorKeybindingsRef.current;
			const v = viewRef.current;
			if (!v) return;

			// Insert table (Ctrl+Shift+T)
			if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "t" || e.key === "T") && !e.altKey) {
				e.preventDefault(); e.stopPropagation();
				setShowTableDialog(true);
				return;
			}

			// Insert collapsible details block (Ctrl+Shift+D)
			if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "d" || e.key === "D") && !e.altKey) {
				e.preventDefault(); e.stopPropagation();
				insertDetails(mySchema)(v.state, v.dispatch);
				return;
			}

			// Insert image from file (Ctrl+Alt+I)
			if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === "i" || e.key === "I") && !e.shiftKey) {
				e.preventDefault(); e.stopPropagation();
				(async () => {
					try {
						const filePath = await open({
							multiple: false,
							filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"] }],
						});
						if (!filePath) return;

						const bytes = await invoke<number[]>("read_image_file", { path: filePath });
						const ext = filePath.split(".").pop()?.toLowerCase() || "png";
						await saveAndInsertImage(v, mySchema, new Uint8Array(bytes), ext);
					} catch (err) {
						console.error("Failed to insert image:", err);
						showError(`Failed to insert image: ${err}`);
					}
				})();
				return;
			}

			// Format pickers (Ctrl+Shift+1-4)
			if (matchesPmKey(e, kb.textColorPicker.key)) {
				e.preventDefault(); e.stopPropagation();
				openPickerRef.current?.("textColor");
				return;
			}
			if (matchesPmKey(e, kb.highlightPicker.key)) {
				e.preventDefault(); e.stopPropagation();
				openPickerRef.current?.("highlight");
				return;
			}
			if (matchesPmKey(e, kb.fontSizePicker.key)) {
				e.preventDefault(); e.stopPropagation();
				openPickerRef.current?.("fontSize");
				return;
			}
			if (matchesPmKey(e, kb.fontFamilyPicker.key)) {
				e.preventDefault(); e.stopPropagation();
				openPickerRef.current?.("fontFamily");
				return;
			}

			// Direct text colors (Alt+1-9, positional)
			for (const [num, preset] of Object.entries(DIRECT_TEXT_COLORS)) {
				const id = `textColor${num}` as keyof EditorKeybindings;
				if (kb[id] && matchesPmKey(e, kb[id].key)) {
					e.preventDefault(); e.stopPropagation();
					applyTextColor(mySchema, preset.color)(v.state, v.dispatch);
					return;
				}
			}
			// Alt+0: Clear ALL formatting (same as toolbar "Clear Custom Formatting" button)
			if (matchesPmKey(e, kb.textColorReset.key)) {
				e.preventDefault(); e.stopPropagation();
				clearAllFormatting(mySchema)(v.state, v.dispatch);
				return;
			}

			// Direct highlights (Shift+Alt+1-9, positional)
			for (const [num, preset] of Object.entries(DIRECT_HIGHLIGHT_COLORS)) {
				const id = `highlight${num}` as keyof EditorKeybindings;
				if (kb[id] && matchesPmKey(e, kb[id].key)) {
					e.preventDefault(); e.stopPropagation();
					applyHighlight(mySchema, preset.color)(v.state, v.dispatch);
					return;
				}
			}
			// Highlight reset (Shift+Alt+0)
			if (matchesPmKey(e, kb.highlightReset.key)) {
				e.preventDefault(); e.stopPropagation();
				removeHighlight(mySchema)(v.state, v.dispatch);
				return;
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
			activeEditorViewStore.set(null);
		};
	}, []);

	// Update line wrapping class dynamically (preserves cursor!)
	useEffect(() => {
		if (!viewRef.current) return;

		const dom = viewRef.current.dom;
		const scrollEl = dom.parentElement;
		if (isWrapping) {
			dom.classList.remove("wrap-disabled");
			dom.classList.add("wrap-enabled");
			if (scrollEl) {
				scrollEl.style.overflowX = "hidden";
				scrollEl.scrollLeft = 0;
			}
		} else {
			dom.classList.remove("wrap-enabled");
			dom.classList.add("wrap-disabled");
			if (scrollEl) {
				scrollEl.style.overflowX = "auto";
			}
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
			const doc = DOMParser.fromSchema(mySchema).parse(contentDiv, {
				preserveWhitespace: true,
			});

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
			className="h-full w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col overflow-hidden relative"
		>
			{showSearch && (
				<SearchBar view={viewRef.current} onClose={handleSearchClose} />
			)}
			{toolbarVisible && (
				<EditorToolbar editorView={viewRef.current} schema={mySchema} />
			)}
			{titleBar}
			<div
				ref={editorRef}
				className="editor-content-zoom flex-1 prose dark:prose-invert max-w-none overflow-auto"

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
			{errorToast && (
				<div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded shadow-lg text-sm z-50 max-w-md truncate">
					{errorToast}
				</div>
			)}
			{showTableDialog && (
				<TableInsertDialog
					onInsert={(rows, cols) => {
						setShowTableDialog(false);
						const v = viewRef.current;
						if (v) {
							insertTableWithSize(mySchema, rows, cols)(v.state, v.dispatch);
							v.focus();
						}
					}}
					onClose={() => {
						setShowTableDialog(false);
						viewRef.current?.focus();
					}}
				/>
			)}
		</div>
	);
}
