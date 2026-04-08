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
		
		// The cursor element is absolutely positioned inside the wrapper which
		// may have CSS zoom applied. coordsAtPos and getBoundingClientRect both
		// return screen-space (zoomed) values, but absolute positioning inside
		// a zoomed container uses the local (unzoomed) coordinate system.
		// Divide by zoom to convert screen-space offsets to local-space.
		const zoom = parseFloat(getComputedStyle(wrapper).zoom) || 1;
		const left = (coords.left - wrapperRect.left) / zoom + wrapper.scrollLeft;
		const top = (coords.top - wrapperRect.top) / zoom + wrapper.scrollTop;
		const height = (coords.bottom - coords.top) / zoom;

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

			// Append to editor's DOM parent wrapper (the zoomed scroll container)
			// Zoom is compensated in updateCursorPosition
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
					requestAnimationFrame(() => {
						if (currentView) {
							updateCursorPosition(currentView);
						}
					});
				}
			}
			window.addEventListener("editor-settings-changed", handleSettingsChange);

			// Recalculate cursor on window resize (layout reflow changes coords)
			function handleResize(): void {
				if (currentView?.hasFocus()) {
					updateCursorPosition(currentView);
				}
			}
			window.addEventListener("resize", handleResize);

			// Recalculate cursor when the scroll container scrolls
			function handleScroll(): void {
				if (currentView?.hasFocus()) {
					updateCursorPosition(currentView);
				}
			}
			wrapper?.addEventListener("scroll", handleScroll);

			// Recalculate cursor when wrapper is resized (e.g. pane resize)
			let resizeObserver: ResizeObserver | null = null;
			if (wrapper) {
				resizeObserver = new ResizeObserver(() => {
					if (currentView?.hasFocus()) {
						updateCursorPosition(currentView);
					}
				});
				resizeObserver.observe(wrapper);
			}

			// Initial position - use multiple frames to ensure layout is complete
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
					window.removeEventListener("resize", handleResize);
					wrapper?.removeEventListener("scroll", handleScroll);
					resizeObserver?.disconnect();
					cursorElement?.remove();
					cursorElement = null;
					currentView = null;
				},
			};
		},
	});
}
