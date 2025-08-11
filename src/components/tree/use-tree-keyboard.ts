import { useEffect } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import type { UseTreeKeyboardProps } from "./types";

export function useTreeKeyboard({ treeRef }: UseTreeKeyboardProps) {
	// Handle F2 key for renaming
	useHotkeys(
		"f2",
		() => {
			const tree = treeRef.current;
			if (tree) {
				// Use focusedNode to get the item with blue highlight (arrow key navigation)
				const focusedNode = tree.focusedNode;
				if (focusedNode) {
					focusedNode.edit();
				}
			}
		},
		{
			preventDefault: true,
			enableOnContentEditable: false,
			enableOnFormTags: false,
		}
	);

	// Simple resize shortcuts - directly manipulate sidebar width when tree is focused
	useHotkeys(
		"ctrl+shift+left",
		() => {
			// Check if tree has focus
			const activeElement = document.activeElement;
			const isTreeFocused =
				activeElement?.closest('[role="tree"]') ||
				activeElement?.closest("[data-react-arborist]") ||
				document.querySelector('[role="tree"]:focus-within');

			if (isTreeFocused) {
				// Find the sidebar resizer button and trigger resize
				const resizeButton = document.querySelector('[aria-label="Resize sidebar"]') as HTMLButtonElement;
				if (resizeButton) {
					// Simulate arrow left key press on the resize button
					const event = new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true });
					resizeButton.dispatchEvent(event);
				}
			}
		},
		{
			preventDefault: true,
			enableOnContentEditable: false,
			enableOnFormTags: false,
		}
	);

	useHotkeys(
		"ctrl+shift+right",
		() => {
			// Check if tree has focus
			const activeElement = document.activeElement;
			const isTreeFocused =
				activeElement?.closest('[role="tree"]') ||
				activeElement?.closest("[data-react-arborist]") ||
				document.querySelector('[role="tree"]:focus-within');

			if (isTreeFocused) {
				// Find the sidebar resizer button and trigger resize
				const resizeButton = document.querySelector('[aria-label="Resize sidebar"]') as HTMLButtonElement;
				if (resizeButton) {
					// Simulate arrow right key press on the resize button
					const event = new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true });
					resizeButton.dispatchEvent(event);
				}
			}
		},
		{
			preventDefault: true,
			enableOnContentEditable: false,
			enableOnFormTags: false,
		}
	);

	// Tab key to switch focus from tree to resizer
	useHotkeys(
		"tab",
		(e) => {
			const activeElement = document.activeElement;
			const isTreeFocused =
				activeElement?.closest('[role="tree"]') ||
				activeElement?.closest("[data-react-arborist]") ||
				document.querySelector('[role="tree"]:focus-within');

			if (isTreeFocused) {
				e.preventDefault();
				const resizeHandle = document.querySelector('[aria-label="Resize sidebar"]') as HTMLElement;
				if (resizeHandle) {
					resizeHandle.focus();
				}
			}
		},
		{
			preventDefault: false,
			enableOnContentEditable: false,
			enableOnFormTags: false,
		}
	);

	// Make Enter key behave like Space key
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Enter") {
				const activeElement = document.activeElement;
				// Only handle if we're not in an input field
				if (!activeElement || (activeElement.tagName !== "INPUT" && activeElement.tagName !== "TEXTAREA")) {
					// Check if the tree has focus by looking for React Arborist elements
					const isTreeFocused =
						activeElement?.closest('[role="tree"]') ||
						activeElement?.closest("[data-react-arborist]") ||
						document.querySelector('[role="tree"]:focus-within');

					if (isTreeFocused) {
						e.preventDefault();
						e.stopPropagation();

						// Get the focused node from the tree
						const tree = treeRef.current;
						if (tree?.focusedNode) {
							const focusedNode = tree.focusedNode;

							// Mimic Space key behavior:
							// 1. Always select the node (creates blue highlight)
							// 2. For internal nodes: also toggle open/closed
							// 3. For leaf nodes: also activate

							// First, select the node to get the blue highlight
							focusedNode.select();

							if (focusedNode.isInternal) {
								// Internal node - also toggle like Space does
								focusedNode.toggle();
							} else {
								// Leaf node - also activate like Space does
								focusedNode.activate();
							}
						}
					}
				}
			}
		};

		// Add capture: true to intercept before React Arborist processes the key
		document.addEventListener("keydown", handleKeyDown, { capture: true });
		return () => {
			document.removeEventListener("keydown", handleKeyDown, { capture: true });
		};
	}, [treeRef]);
}
