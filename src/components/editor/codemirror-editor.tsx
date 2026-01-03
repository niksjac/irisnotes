import { useEffect, useRef } from "react";
import {
	EditorView,
	keymap,
	lineNumbers,
	highlightActiveLine,
	highlightActiveLineGutter,
} from "@codemirror/view";
import { EditorState, StateEffect, EditorSelection, type Extension } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { bracketMatching } from "@codemirror/language";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import {
	closeBrackets,
	closeBracketsKeymap,
	autocompletion,
	completionKeymap,
} from "@codemirror/autocomplete";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import type { ViewUpdate } from "@codemirror/view";
import { useTheme, useLineWrapping } from "@/hooks";
import { editorCursorPositionStore } from "@/hooks/use-editor-view-toggle";

interface CodeMirrorEditorProps {
	content: string;
	onChange?: (content: string) => void;
	readOnly?: boolean;
	initialCursorPosition?: number;
	autoFocus?: boolean;
}

export function CodeMirrorEditor({
	content,
	onChange,
	readOnly = false,
	initialCursorPosition,
	autoFocus = false,
}: CodeMirrorEditorProps) {
	const editorRef = useRef<HTMLDivElement>(null);
	const viewRef = useRef<EditorView | null>(null);
	const onChangeRef = useRef(onChange);
	const { darkMode } = useTheme();
	const { isWrapping } = useLineWrapping();

	// Keep refs up to date
	useEffect(() => {
		onChangeRef.current = onChange;
	}, [onChange]);

	// Helper to build extensions
	const buildExtensions = (): Extension[] => [
		lineNumbers(),
		highlightActiveLineGutter(),
		highlightActiveLine(),
		history(),
		bracketMatching(),
		closeBrackets(),
		autocompletion(),
		highlightSelectionMatches(),
		markdown(),
		keymap.of([
			...closeBracketsKeymap,
			...defaultKeymap,
			...searchKeymap,
			...historyKeymap,
			...completionKeymap,
		]),
		EditorView.editable.of(!readOnly),
		EditorView.updateListener.of((update: ViewUpdate) => {
			if (update.docChanged && onChangeRef.current) {
				const newContent = update.state.doc.toString();
				onChangeRef.current(newContent);
			}
			// Update cursor position in store on selection changes
			if (update.selectionSet) {
				editorCursorPositionStore.setPosition(update.state.selection.main.from);
			}
		}),
		EditorView.theme({
			"&": {
				height: "100%",
				fontSize: "14px",
			},
			".cm-scroller": {
				overflow: "auto",
				fontFamily: "monospace",
			},
			".cm-content": {
				padding: "16px",
			},
			// Hide cursor when editor is not focused
			"&:not(.cm-focused) .cm-cursor": {
				display: "none",
			},
		}),
		darkMode ? oneDark : [],
		isWrapping ? EditorView.lineWrapping : [],
	];

	// Create editor only once on mount
	useEffect(() => {
		if (!editorRef.current || viewRef.current) return;

		// Determine initial cursor position:
		// - If initialCursorPosition is a number, restore that exact position
		// - If undefined (first time opening), place cursor at end of document
		const docLength = content.length;
		const targetPos = initialCursorPosition !== undefined
			? Math.min(initialCursorPosition, docLength)
			: docLength;

		const startState = EditorState.create({
			doc: content,
			extensions: buildExtensions(),
			selection: EditorSelection.cursor(targetPos),
		});

		const view = new EditorView({
			state: startState,
			parent: editorRef.current,
		});

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
					viewRef.current.state.selection.main.from
				);
			}
			view.destroy();
			viewRef.current = null;
		};
	}, []);

	// Update configuration dynamically when options change (preserves cursor!)
	useEffect(() => {
		if (!viewRef.current) return;

		viewRef.current.dispatch({
			effects: StateEffect.reconfigure.of(buildExtensions()),
		});
	}, [readOnly, darkMode, isWrapping]);

	// Update content when it changes externally
	useEffect(() => {
		const view = viewRef.current;
		if (!view) return;

		const currentContent = view.state.doc.toString();
		if (currentContent !== content) {
			// Replace content and put cursor at end
			const newLength = content.length;
			view.dispatch({
				changes: {
					from: 0,
					to: view.state.doc.length,
					insert: content,
				},
				selection: EditorSelection.cursor(newLength),
			});
		}
	}, [content]);

	// Note: Editor focus is controlled by user actions (click, Ctrl+Alt+1/2)
	// We intentionally don't auto-focus to prevent stealing focus from tree

	return (
		<div
			ref={editorRef}
			className="h-full w-full overflow-hidden bg-white dark:bg-gray-900 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-inset"
		/>
	);
}
