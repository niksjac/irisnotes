import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { sidebarWidth } from "@/atoms";

// ==================== COMPONENT INTERFACE ====================

interface SidebarResizerProps {
	isCollapsed: boolean;
	onCollapsedChange?: (collapsed: boolean) => void;
	children: React.ReactNode;
	minWidth?: number;
	maxWidth?: number;
	defaultWidth?: number;
	autoCollapseOnResize?: boolean;
}

export function SidebarResizer({
	isCollapsed,
	onCollapsedChange,
	children,
	minWidth = 200,
	maxWidth = 600,
	defaultWidth = 300,
	autoCollapseOnResize = true,
}: SidebarResizerProps) {
	// ==================== STATE MANAGEMENT ====================

		const [width, setWidth] = useAtom(sidebarWidth);

	// Initialize width if not set
	useEffect(() => {
		if (width === 300 && defaultWidth !== 300) {
			setWidth(defaultWidth);
		}
	}, [width, defaultWidth, setWidth]);

	// State declarations
	const [isDragging, setIsDragging] = useState(false);
	const [isHotkeyResizing, setIsHotkeyResizing] = useState(false);
	const startX = useRef(0);
	const startWidth = useRef(0);
	const resizerRef = useRef<HTMLButtonElement>(null);
	const [isFocused, setIsFocused] = useState(false);
	const hotkeyResizeTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

	// Track external width changes (hotkey resizing) to disable transitions
	const prevWidthRef = useRef(width);
	useEffect(() => {
		if (!isDragging && prevWidthRef.current !== width) {
			// Width changed externally (hotkey), disable transitions temporarily
			setIsHotkeyResizing(true);

			// Clear existing timeout
			if (hotkeyResizeTimeoutRef.current) {
				clearTimeout(hotkeyResizeTimeoutRef.current);
			}

			// Re-enable transitions after a short delay
			hotkeyResizeTimeoutRef.current = setTimeout(() => {
				setIsHotkeyResizing(false);
			}, 50);
		}
		prevWidthRef.current = width;
	}, [width, isDragging]);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (hotkeyResizeTimeoutRef.current) {
				clearTimeout(hotkeyResizeTimeoutRef.current);
			}
		};
	}, []);

	// ==================== EVENT HANDLERS ====================

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			// Don't allow dragging when collapsed
			if (isCollapsed) return;

			e.preventDefault(); // Prevent text selection from starting
			setIsDragging(true);
			startX.current = e.clientX;
			startWidth.current = width;

			document.body.style.cursor = "col-resize";
			document.body.style.userSelect = "none";
			// Also prevent selection on the document element
			document.documentElement.style.userSelect = "none";
		},
		[width, isCollapsed]
	);

	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			if (!isDragging) return;

			const deltaX = e.clientX - startX.current;
			const newWidth = startWidth.current + deltaX;

			// Apply min/max constraints
			const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
			setWidth(constrainedWidth);

			// Auto-collapse if dragged very small (only if enabled)
			if (autoCollapseOnResize && newWidth < minWidth / 2) {
				onCollapsedChange?.(true);
			}
		},
		[isDragging, minWidth, maxWidth, autoCollapseOnResize, onCollapsedChange]
	);

	const handleMouseUp = useCallback(() => {
		setIsDragging(false);
		document.body.style.cursor = "";
		document.body.style.userSelect = "";
		document.documentElement.style.userSelect = "";
	}, []);

	// Keyboard resizing
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (isCollapsed) return;

			const step = 20; // pixels to resize per key press
			let newWidth = width;

			switch (e.key) {
				case "ArrowLeft":
					e.preventDefault();
					newWidth = Math.max(minWidth, width - step);
					break;
				case "ArrowRight":
					e.preventDefault();
					newWidth = Math.min(maxWidth, width + step);
					break;
				case "Home":
					e.preventDefault();
					newWidth = minWidth;
					break;
				case "End":
					e.preventDefault();
					newWidth = maxWidth;
					break;
				case "Enter":
				case " ":
					e.preventDefault();
					// Reset to default width
					newWidth = defaultWidth;
					break;
				default:
					return;
			}

			setWidth(newWidth);
		},
		[width, minWidth, maxWidth, defaultWidth, isCollapsed]
	);

	// Focus handlers
	const handleFocus = useCallback(() => {
		setIsFocused(true);
	}, []);

	const handleBlur = useCallback(() => {
		setIsFocused(false);
	}, []);

	// ==================== GLOBAL EVENT LISTENERS ====================

	// Add global mouse events when dragging
	useEffect(() => {
		if (isDragging) {
			document.addEventListener("mousemove", handleMouseMove);
			document.addEventListener("mouseup", handleMouseUp);

			return () => {
				document.removeEventListener("mousemove", handleMouseMove);
				document.removeEventListener("mouseup", handleMouseUp);
			};
		}
		return undefined;
	}, [isDragging, handleMouseMove, handleMouseUp]);

	// ==================== RENDERING ====================

	// Use smooth transitions instead of completely hiding the sidebar
	const effectiveWidth = isCollapsed ? 0 : width;

	return (
		<div
			className={clsx(
				"h-full relative bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-600 flex-shrink-0",
				!isDragging && !isHotkeyResizing && "transition-all duration-200 ease-in-out",
				!isCollapsed && "hover:border-r-blue-500",
				(isDragging || isFocused) && "border-r-blue-500",
				isCollapsed && "border-r-transparent"
			)}
			style={{
				width: effectiveWidth,
				overflow: "hidden",
			}}
		>
			<div
				className={clsx(
					"h-full flex flex-col",
					!isDragging && !isHotkeyResizing && "transition-opacity duration-200 ease-in-out",
					isCollapsed ? "opacity-0" : "opacity-100"
				)}
				style={{ width: width }} // Keep content at full width for smooth transition
			>
				{children}
			</div>

			{/* Draggable resize handle - only show when not collapsed */}
			{!isCollapsed && (
				<button
					ref={resizerRef}
					type="button"
					aria-label="Resize sidebar"
					title="Use arrow keys to resize, Enter/Space to reset, Home/End for min/max. Ctrl+Shift+Left/Right from tree also works."
					className={clsx(
						"absolute top-0 right-0 w-1 h-full cursor-col-resize border-0 bg-transparent",
						"hover:bg-blue-500 hover:bg-opacity-50 transition-colors",
						(isDragging || isFocused) && "bg-blue-500 bg-opacity-50",
						"focus:outline-none focus:bg-blue-500 focus:bg-opacity-50"
					)}
					onMouseDown={handleMouseDown}
					onKeyDown={handleKeyDown}
					onFocus={handleFocus}
					onBlur={handleBlur}
					tabIndex={0}
				/>
			)}
		</div>
	);
}
