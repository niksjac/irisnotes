import { useState, useCallback, useEffect, useRef } from "react";
import type { RightClickMenuData, RightClickMenuPosition } from "@/types/right-click-menu";

export function useRightClickMenu() {
	const [rightClickMenu, setRightClickMenu] = useState<RightClickMenuData | null>(null);
	const timeoutRef = useRef<number>();

	const showRightClickMenu = useCallback((data: RightClickMenuData) => {
		// Clear any existing timeout
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		setRightClickMenu(data);
	}, []);

	const hideRightClickMenu = useCallback(() => {
		setRightClickMenu(null);
	}, []);

	const handleRightClickMenu = useCallback(
		(event: React.MouseEvent, data: Omit<RightClickMenuData, "position">) => {
			event.preventDefault();
			event.stopPropagation();

			const position: RightClickMenuPosition = {
				x: event.clientX,
				y: event.clientY,
			};

			showRightClickMenu({ ...data, position });
		},
		[showRightClickMenu]
	);

	// Close menu on click outside, escape key, or scroll
	useEffect(() => {
		if (!rightClickMenu) return;

		const handleClickOutside = () => hideRightClickMenu();
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				hideRightClickMenu();
			}
		};
		const handleScroll = () => hideRightClickMenu();

		document.addEventListener("click", handleClickOutside);
		document.addEventListener("keydown", handleKeyDown);
		document.addEventListener("scroll", handleScroll, true);

		return () => {
			document.removeEventListener("click", handleClickOutside);
			document.removeEventListener("keydown", handleKeyDown);
			document.removeEventListener("scroll", handleScroll, true);
		};
	}, [rightClickMenu, hideRightClickMenu]);

	return {
		rightClickMenu,
		showRightClickMenu,
		hideRightClickMenu,
		handleRightClickMenu,
	};
}
