/**
 * Custom Cursor Plugin
 *
 * Replaces the native browser caret with a customizable cursor element.
 * Uses absolute positioning to avoid affecting document layout.
 * Reads styling from CSS custom properties for dynamic updates.
 *
 * Supports:
 * - Custom width (via --pm-cursor-width CSS variable)
 * - Custom color (via --pm-caret-color CSS variable)
 * - Blink animations (via CSS classes on :root)
 * - Block cursor mode (via .pm-cursor-block-mode class on :root)
 */

import { Plugin, PluginKey } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";

export const customCursorPluginKey = new PluginKey("customCursor");

/**
 * Creates a plugin that renders a custom cursor instead of the native caret.
 * The cursor is absolutely positioned and doesn't affect document flow.
 * All styling is controlled via CSS custom properties and classes on :root.
 */
export function customCursorPlugin(): Plugin {
	let cursorElement: HTMLElement | null = null;
	let currentView: EditorView | null = null;

	function createCursor(): HTMLElement {
		const cursor = document.createElement("div");
		cursor.className = "pm-custom-cursor";
		return cursor;
	}

	function updateCursorPosition(view: EditorView): void {
		if (!cursorElement) return;

		const { selection } = view.state;
		const { empty, head } = selection;

		// Hide cursor if there's a selection range
		if (!empty) {
			cursorElement.style.display = "none";
			return;
		}

		// Hide if editor is not focused
		if (!view.hasFocus()) {
			cursorElement.style.display = "none";
			return;
		}

		// Get coordinates at cursor position
		const coords = view.coordsAtPos(head);
		const editorRect = view.dom.getBoundingClientRect();

		// Position cursor relative to editor
		const left = coords.left - editorRect.left;
		const top = coords.top - editorRect.top;
		const height = coords.bottom - coords.top;

		cursorElement.style.display = "block";
		cursorElement.style.left = `${left}px`;
		cursorElement.style.top = `${top}px`;
		cursorElement.style.height = `${height}px`;
	}

	function handleFocus(): void {
		if (currentView) {
			updateCursorPosition(currentView);
		}
	}

	function handleBlur(): void {
		if (cursorElement) {
			cursorElement.style.display = "none";
		}
	}

	return new Plugin({
		key: customCursorPluginKey,

		props: {
			attributes: {
				class: "custom-cursor-enabled",
			},
			handleDOMEvents: {
				focus: (view) => {
					// Small delay to ensure focus state is updated
					setTimeout(() => updateCursorPosition(view), 0);
					return false;
				},
				blur: () => {
					if (cursorElement) {
						cursorElement.style.display = "none";
					}
					return false;
				},
			},
		},

		view(editorView) {
			currentView = editorView;

			// Create cursor element
			cursorElement = createCursor();

			// Append to editor's DOM parent (so it's positioned relative to editor)
			const wrapper = editorView.dom.parentElement;
			if (wrapper) {
				// Ensure wrapper has relative positioning for absolute cursor
				wrapper.style.position = "relative";
				wrapper.appendChild(cursorElement);
			}

			// Listen for focus events on the editor
			editorView.dom.addEventListener("focus", handleFocus);
			editorView.dom.addEventListener("blur", handleBlur);

			// Initial position (if already focused)
			if (editorView.hasFocus()) {
				updateCursorPosition(editorView);
			}

			return {
				update(view) {
					currentView = view;
					updateCursorPosition(view);
				},
				destroy() {
					editorView.dom.removeEventListener("focus", handleFocus);
					editorView.dom.removeEventListener("blur", handleBlur);
					cursorElement?.remove();
					cursorElement = null;
					currentView = null;
				},
			};
		},
	});
}
