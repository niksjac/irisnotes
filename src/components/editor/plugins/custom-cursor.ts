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
		
		const wrapper = view.dom.parentElement;
		if (!wrapper) return;
		const wrapperRect = wrapper.getBoundingClientRect();
		
		// Position cursor relative to wrapper
		const left = coords.left - wrapperRect.left;
		const top = coords.top - wrapperRect.top;
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
					// Delay to ensure focus state and selection are updated
					requestAnimationFrame(() => {
						if (view.hasFocus()) {
							updateCursorPosition(view);
						}
					});
					return false;
				},
				blur: () => {
					if (cursorElement) {
						cursorElement.style.display = "none";
					}
					return false;
				},
				// Update cursor on click to ensure it shows immediately when clicking to focus
				mouseup: (view) => {
					requestAnimationFrame(() => {
						if (view.hasFocus()) {
							updateCursorPosition(view);
						}
					});
					return false;
				},
			},
		},

		view(editorView) {
			currentView = editorView;

			// Create cursor element
			cursorElement = createCursor();

			// Append to editor's DOM parent wrapper (outside the zoomed .ProseMirror)
			// We'll handle zoom by scaling the cursor position/size from screen coords
			const wrapper = editorView.dom.parentElement;
			if (wrapper) {
				wrapper.style.position = "relative";
				wrapper.appendChild(cursorElement);
			}

			// Listen for focus events on the editor
			editorView.dom.addEventListener("focus", handleFocus);
			editorView.dom.addEventListener("blur", handleBlur);

			// Listen for editor settings changes (font size, etc.) to recalculate cursor
			function handleSettingsChange(): void {
				if (currentView) {
					// Use requestAnimationFrame to ensure CSS has been applied
					requestAnimationFrame(() => {
						if (currentView) {
							updateCursorPosition(currentView);
						}
					});
				}
			}
			window.addEventListener("editor-settings-changed", handleSettingsChange);

			// Initial position - use multiple frames to ensure layout is complete
			// This handles the case where editor has focus on app startup
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					if (currentView && currentView.hasFocus()) {
						updateCursorPosition(currentView);
					}
				});
			});

			return {
				update(view) {
					currentView = view;
					updateCursorPosition(view);
				},
				destroy() {
					editorView.dom.removeEventListener("focus", handleFocus);
					editorView.dom.removeEventListener("blur", handleBlur);
					window.removeEventListener("editor-settings-changed", handleSettingsChange);
					cursorElement?.remove();
					cursorElement = null;
					currentView = null;
				},
			};
		},
	});
}
