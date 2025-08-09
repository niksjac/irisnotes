import { useState, useCallback, useEffect, useRef } from "react";
import type { ContextMenuData, ContextMenuPosition } from "@/types/context-menu";

export function useContextMenu() {
	const [contextMenu, setContextMenu] = useState<ContextMenuData | null>(null);
	const timeoutRef = useRef<NodeJS.Timeout>();

	const showContextMenu = useCallback((data: ContextMenuData) => {
		// Clear any existing timeout
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		setContextMenu(data);
	}, []);

	const hideContextMenu = useCallback(() => {
		setContextMenu(null);
	}, []);

	const handleContextMenu = useCallback(
		(event: React.MouseEvent, data: Omit<ContextMenuData, "position">) => {
			event.preventDefault();
			event.stopPropagation();

			const position: ContextMenuPosition = {
				x: event.clientX,
				y: event.clientY,
			};

			showContextMenu({ ...data, position });
		},
		[showContextMenu]
	);

	// Close menu on click outside, escape key, or scroll
	useEffect(() => {
		if (!contextMenu) return;

		const handleClickOutside = () => hideContextMenu();
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				hideContextMenu();
			}
		};
		const handleScroll = () => hideContextMenu();

		document.addEventListener("click", handleClickOutside);
		document.addEventListener("keydown", handleKeyDown);
		document.addEventListener("scroll", handleScroll, true);

		return () => {
			document.removeEventListener("click", handleClickOutside);
			document.removeEventListener("keydown", handleKeyDown);
			document.removeEventListener("scroll", handleScroll, true);
		};
	}, [contextMenu, hideContextMenu]);

	return {
		contextMenu,
		showContextMenu,
		hideContextMenu,
		handleContextMenu,
	};
}
