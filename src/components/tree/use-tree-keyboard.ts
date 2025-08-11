import { useEffect } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import type { UseTreeKeyboardProps } from "./types";

export function useTreeKeyboard({ treeRef, setSelectedNoteId }: UseTreeKeyboardProps) {
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

	// Prevent Enter key from triggering edit (simplified approach)
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Enter") {
				const activeElement = document.activeElement;
				// Only prevent if we're not in an input field
				if (!activeElement || (activeElement.tagName !== "INPUT" && activeElement.tagName !== "TEXTAREA")) {
					// Check if the tree has focus by looking for React Arborist elements
					const isTreeFocused =
						activeElement?.closest('[role="tree"]') ||
						activeElement?.closest("[data-react-arborist]") ||
						document.querySelector('[role="tree"]:focus-within');

					if (isTreeFocused) {
						e.preventDefault();
						e.stopPropagation();
						e.stopImmediatePropagation();

						// Instead of edit, just trigger activate
						const tree = treeRef.current;
						if (tree?.focusedNode) {
							const focusedNode = tree.focusedNode;
							// Trigger activate instead of edit
							if (focusedNode.data.type === "note") {
								setSelectedNoteId(focusedNode.data.id);
							} else {
								focusedNode.toggle();
							}
						}
					}
				}
			}
		};

		// Add capture: true to intercept before React Arborist
		document.addEventListener("keydown", handleKeyDown, { capture: true });
		return () => {
			document.removeEventListener("keydown", handleKeyDown, { capture: true });
		};
	}, [setSelectedNoteId, treeRef]);
}
