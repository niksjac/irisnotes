import { useEffect, useRef } from "react";
import {
	EditorView,
	keymap,
	lineNumbers,
	highlightActiveLine,
	highlightActiveLineGutter,
} from "@codemirror/view";
import { EditorState, Compartment, EditorSelection, Prec, type Extension } from "@codemirror/state";
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
import { isAppHotkey } from "@/utils/app-hotkeys";

// Compartments for dynamic configuration (allows efficient partial reconfiguration)
const readOnlyCompartment = new Compartment();
const themeCompartment = new Compartment();
const lineWrappingCompartment = new Compartment();

// Smart select state - tracks progressive selection level
let smartSelectLevel = 0;
let lastSmartSelectTime = 0;
let lastSmartSelectRange: { from: number; to: number } | null = null;

/**
 * Smart Select All command for CodeMirror
 * Progressive selection: line → paragraph → all
 */
function smartSelectAll(view: EditorView): boolean {
	const state = view.state;
	const { from, to } = state.selection.main;
	const doc = state.doc;
	const now = Date.now();

	// Reset if too much time passed or selection changed externally
	if (
		now - lastSmartSelectTime > 2000 ||
		(lastSmartSelectRange &&
			(from !== lastSmartSelectRange.from || to !== lastSmartSelectRange.to))
	) {
		smartSelectLevel = 0;
	}

	// Increment level
	smartSelectLevel = Math.min(smartSelectLevel + 1, 3);
	lastSmartSelectTime = now;

	let newFrom: number;
	let newTo: number;

	if (smartSelectLevel === 1) {
		// Level 1: Select current line
		const line = doc.lineAt(from);
		newFrom = line.from;
		newTo = line.to;
	} else if (smartSelectLevel === 2) {
		// Level 2: Select paragraph (connected non-empty lines)
		const currentLine = doc.lineAt(from);

		// Find start of paragraph (first non-empty line going backwards)
		let startLine = currentLine.number;
		while (startLine > 1) {
			const prevLine = doc.line(startLine - 1);
			if (prevLine.text.trim() === "") break;
			startLine--;
		}

		// Find end of paragraph (last non-empty line going forwards)
		let endLine = currentLine.number;
		while (endLine < doc.lines) {
			const nextLine = doc.line(endLine + 1);
			if (nextLine.text.trim() === "") break;
			endLine++;
		}

		newFrom = doc.line(startLine).from;
		newTo = doc.line(endLine).to;
	} else {
		// Level 3: Select entire document
		newFrom = 0;
		newTo = doc.length;
	}

	// Update selection
	view.dispatch({
		selection: EditorSelection.single(newFrom, newTo),
		scrollIntoView: true,
	});

	// Track the new selection
	lastSmartSelectRange = { from: newFrom, to: newTo };

	return true;
}

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

	// Build static extensions (don't change during editor lifetime)
	const buildStaticExtensions = (): Extension[] => [
		// FIRST: Highest priority handler to let app hotkeys bubble up
		// This must come before any keymaps to intercept app-level shortcuts
		Prec.highest(
			EditorView.domEventHandlers({
				keydown: (e: KeyboardEvent) => {
					if (isAppHotkey(e)) {
						// Tell CodeMirror we handled this (stop its processing)
						// but don't preventDefault so the event bubbles to document
						// for react-hotkeys-hook
						return true;
					}
					return false;
				},
			})
		),
		lineNumbers(),
		highlightActiveLineGutter(),
		highlightActiveLine(),
		history(),
		bracketMatching(),
		closeBrackets(),
		autocompletion(),
		highlightSelectionMatches(),
		markdown(),
		// Smart select keymap - overrides default selectAll
		keymap.of([
			{ key: "Mod-a", run: smartSelectAll, preventDefault: true },
		]),
		keymap.of([
			...closeBracketsKeymap,
			...defaultKeymap,
			...searchKeymap,
			...historyKeymap,
			...completionKeymap,
		]),
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
				fontSize: "var(--pm-font-size)",
			},
			".cm-scroller": {
				overflow: "auto",
				fontFamily: "var(--pm-font-family)",
			},
			".cm-content": {
				padding: "16px",
			},
			// Hide cursor when editor is not focused
			"&:not(.cm-focused) .cm-cursor": {
				display: "none",
			},
		}),
		// Compartmentalized extensions for dynamic updates
		readOnlyCompartment.of(EditorView.editable.of(!readOnly)),
		themeCompartment.of(darkMode ? oneDark : []),
		lineWrappingCompartment.of(isWrapping ? EditorView.lineWrapping : []),
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
			extensions: buildStaticExtensions(),
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

	// Update readOnly state dynamically (uses compartment for efficiency)
	useEffect(() => {
		if (!viewRef.current) return;
		viewRef.current.dispatch({
			effects: readOnlyCompartment.reconfigure(EditorView.editable.of(!readOnly)),
		});
	}, [readOnly]);

	// Update theme dynamically (uses compartment for efficiency)
	useEffect(() => {
		if (!viewRef.current) return;
		viewRef.current.dispatch({
			effects: themeCompartment.reconfigure(darkMode ? oneDark : []),
		});
	}, [darkMode]);

	// Update line wrapping dynamically (uses compartment for efficiency)
	useEffect(() => {
		if (!viewRef.current) return;
		viewRef.current.dispatch({
			effects: lineWrappingCompartment.reconfigure(isWrapping ? EditorView.lineWrapping : []),
		});
	}, [isWrapping]);

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

	// Add capture-phase event listener to intercept app hotkeys BEFORE CodeMirror
	// This is necessary because CodeMirror may call stopPropagation() on events
	useEffect(() => {
		const container = editorRef.current;
		if (!container) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (isAppHotkey(e)) {
				// Let the event bubble up to document for react-hotkeys-hook
				// Don't stopPropagation or preventDefault here
				// But we need to prevent CodeMirror from handling it by stopping propagation
				// to CodeMirror and re-dispatching to document
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
		};

		// Use capture phase to intercept BEFORE CodeMirror
		container.addEventListener('keydown', handleKeyDown, { capture: true });
		return () => {
			container.removeEventListener('keydown', handleKeyDown, { capture: true });
		};
	}, []);

	// Note: Editor focus is controlled by user actions (click, Ctrl+Alt+1/2)
	// We intentionally don't auto-focus to prevent stealing focus from tree

	return (
		<div
			ref={editorRef}
			className="h-full w-full overflow-hidden bg-white dark:bg-gray-900 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-inset"
		/>
	);
}
