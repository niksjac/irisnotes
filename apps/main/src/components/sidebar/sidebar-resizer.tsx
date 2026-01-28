import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { sidebarWidth, sidebarHeight, focusAreaAtom } from "@/atoms";
import { useIsMobile } from "@/hooks/use-media-query";

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

	// Modern responsive detection using matchMedia API
	const isMobile = useIsMobile();

	const [width, setWidth] = useAtom(sidebarWidth);
	const [height, setHeight] = useAtom(sidebarHeight);
	const [focusArea] = useAtom(focusAreaAtom);
	const treeHasFocus = focusArea === "tree";

	// Mobile constraints: min 150px, max 50% of viewport height
	const minHeight = 150;
	const [maxHeight, setMaxHeight] = useState(() =>
		typeof window !== "undefined" ? Math.floor(window.innerHeight * 0.5) : 300
	);
	const defaultHeight = 200;

	// Update max height on window resize (mobile only)
	useEffect(() => {
		if (!isMobile) return;

		const handleResize = () => {
			const newMaxHeight = Math.floor(window.innerHeight * 0.5);
			setMaxHeight(newMaxHeight);

			// Ensure current height doesn't exceed new max
			if (height > newMaxHeight) {
				setHeight(newMaxHeight);
			}
		};

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [isMobile, height, setHeight]);

	// Initialize dimensions if not set
	useEffect(() => {
		if (width === 300 && defaultWidth !== 300) {
			setWidth(defaultWidth);
		}
		if (height === 200 && defaultHeight !== 200) {
			setHeight(defaultHeight);
		}
	}, [width, defaultWidth, setWidth, height, setHeight]);

	// State declarations
	const [isDragging, setIsDragging] = useState(false);
	const [isHotkeyResizing, setIsHotkeyResizing] = useState(false);
	const startX = useRef(0);
	const startY = useRef(0);
	const startWidth = useRef(0);
	const startHeight = useRef(0);
	const resizerRef = useRef<HTMLButtonElement | null>(null);
	const [isFocused, setIsFocused] = useState(false);
	const hotkeyResizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null
	);

	// Track external dimension changes (hotkey resizing) to disable transitions
	const prevWidthRef = useRef(width);
	const prevHeightRef = useRef(height);
	useEffect(() => {
		const dimensionChanged =
			(!isDragging && prevWidthRef.current !== width) ||
			(!isDragging && prevHeightRef.current !== height);

		if (dimensionChanged) {
			// Dimension changed externally (hotkey), disable transitions temporarily
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
		prevHeightRef.current = height;
	}, [width, height, isDragging]);

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

			if (isMobile) {
				startY.current = e.clientY;
				startHeight.current = height;
				document.body.style.cursor = "row-resize";
			} else {
				startX.current = e.clientX;
				startWidth.current = width;
				document.body.style.cursor = "col-resize";
			}

			document.body.style.userSelect = "none";
			// Also prevent selection on the document element
			document.documentElement.style.userSelect = "none";
		},
		[width, height, isCollapsed, isMobile]
	);

	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			if (!isDragging) return;

			if (isMobile) {
				// Handle vertical resizing for mobile
				const deltaY = e.clientY - startY.current;
				const newHeight = startHeight.current + deltaY;

				// Apply min/max constraints for mobile
				const constrainedHeight = Math.max(
					minHeight,
					Math.min(maxHeight, newHeight)
				);
				setHeight(constrainedHeight);

				// Auto-collapse if dragged very small (only if enabled)
				if (autoCollapseOnResize && newHeight < minHeight / 2) {
					onCollapsedChange?.(true);
				}
			} else {
				// Handle horizontal resizing for desktop
				const deltaX = e.clientX - startX.current;
				const newWidth = startWidth.current + deltaX;

				// Apply min/max constraints
				const constrainedWidth = Math.max(
					minWidth,
					Math.min(maxWidth, newWidth)
				);
				setWidth(constrainedWidth);

				// Auto-collapse if dragged very small (only if enabled)
				if (autoCollapseOnResize && newWidth < minWidth / 2) {
					onCollapsedChange?.(true);
				}
			}
		},
		[
			isDragging,
			minWidth,
			maxWidth,
			maxHeight,
			autoCollapseOnResize,
			onCollapsedChange,
			isMobile,
			setHeight,
			setWidth,
		]
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

			if (isMobile) {
				let newHeight = height;

				switch (e.key) {
					case "ArrowUp":
						e.preventDefault();
						newHeight = Math.max(minHeight, height - step);
						break;
					case "ArrowDown":
						e.preventDefault();
						newHeight = Math.min(maxHeight, height + step);
						break;
					case "Home":
						e.preventDefault();
						newHeight = minHeight;
						break;
					case "End":
						e.preventDefault();
						newHeight = maxHeight;
						break;
					case "Enter":
					case " ":
						e.preventDefault();
						// Reset to default height
						newHeight = defaultHeight;
						break;
					default:
						return;
				}

				setHeight(newHeight);
			} else {
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
			}
		},
		[
			width,
			height,
			minWidth,
			maxWidth,
			maxHeight,
			defaultWidth,
			isCollapsed,
			isMobile,
			setWidth,
			setHeight,
		]
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

	return isMobile ? (
		<MobileLayout
			height={height}
			isCollapsed={isCollapsed}
			isDragging={isDragging}
			isHotkeyResizing={isHotkeyResizing}
			isFocused={isFocused}
			treeHasFocus={treeHasFocus}
			resizerRef={resizerRef}
			handleMouseDown={handleMouseDown}
			handleKeyDown={handleKeyDown}
			handleFocus={handleFocus}
			handleBlur={handleBlur}
		>
			{children}
		</MobileLayout>
	) : (
		<DesktopLayout
			width={width}
			isCollapsed={isCollapsed}
			isDragging={isDragging}
			isHotkeyResizing={isHotkeyResizing}
			isFocused={isFocused}
			treeHasFocus={treeHasFocus}
			resizerRef={resizerRef}
			handleMouseDown={handleMouseDown}
			handleKeyDown={handleKeyDown}
			handleFocus={handleFocus}
			handleBlur={handleBlur}
		>
			{children}
		</DesktopLayout>
	);
}

// ==================== MOBILE LAYOUT COMPONENT ====================

interface MobileLayoutProps {
	height: number;
	isCollapsed: boolean;
	isDragging: boolean;
	isHotkeyResizing: boolean;
	isFocused: boolean;
	treeHasFocus: boolean;
	resizerRef: React.RefObject<HTMLButtonElement | null>;
	children: React.ReactNode;
	handleMouseDown: (e: React.MouseEvent) => void;
	handleKeyDown: (e: React.KeyboardEvent) => void;
	handleFocus: () => void;
	handleBlur: () => void;
}

function MobileLayout({
	height,
	isCollapsed,
	isDragging,
	isHotkeyResizing,
	isFocused,
	treeHasFocus,
	resizerRef,
	children,
	handleMouseDown,
	handleKeyDown,
	handleFocus,
	handleBlur,
}: MobileLayoutProps) {
	const effectiveHeight = isCollapsed ? 0 : height;

	return (
		<div
			className={clsx(
				"w-full relative bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600 flex-shrink-0",
				!isDragging &&
					!isHotkeyResizing &&
					"transition-all duration-200 ease-in-out",
				!isCollapsed && "hover:border-b-blue-500",
				(isDragging || isFocused || treeHasFocus) && !isCollapsed && "border-b-blue-500 border-b-2",
				isCollapsed && "border-b-transparent"
			)}
			style={{
				height: effectiveHeight,
				overflow: "hidden",
			}}
		>
			<div
				className={clsx(
					"w-full flex flex-col",
					!isDragging &&
						!isHotkeyResizing &&
						"transition-opacity duration-200 ease-in-out",
					isCollapsed ? "opacity-0" : "opacity-100"
				)}
				style={{ height: height }}
			>
				{children}
			</div>

			{!isCollapsed && (
				<button
					ref={resizerRef as React.RefObject<HTMLButtonElement>}
					type="button"
					aria-label="Resize sidebar"
					title="Use up/down arrow keys to resize, Enter/Space to reset, Home/End for min/max."
					className={clsx(
						"absolute bottom-0 left-0 h-1 w-full cursor-row-resize border-0 bg-transparent",
						"hover:bg-blue-500 hover:bg-opacity-50 transition-colors",
						(isDragging || isFocused) && "bg-blue-500 bg-opacity-50",
						"focus:outline-none focus:bg-blue-500 focus:bg-opacity-50"
					)}
					onMouseDown={handleMouseDown}
					onKeyDown={handleKeyDown}
					onFocus={handleFocus}
					onBlur={handleBlur}
					tabIndex={-1}
				/>
			)}
		</div>
	);
}

// ==================== DESKTOP LAYOUT COMPONENT ====================

interface DesktopLayoutProps {
	width: number;
	isCollapsed: boolean;
	isDragging: boolean;
	isHotkeyResizing: boolean;
	isFocused: boolean;
	treeHasFocus: boolean;
	resizerRef: React.RefObject<HTMLButtonElement | null>;
	children: React.ReactNode;
	handleMouseDown: (e: React.MouseEvent) => void;
	handleKeyDown: (e: React.KeyboardEvent) => void;
	handleFocus: () => void;
	handleBlur: () => void;
}

function DesktopLayout({
	width,
	isCollapsed,
	isDragging,
	isHotkeyResizing,
	isFocused,
	treeHasFocus,
	resizerRef,
	children,
	handleMouseDown,
	handleKeyDown,
	handleFocus,
	handleBlur,
}: DesktopLayoutProps) {
	const effectiveWidth = isCollapsed ? 0 : width;

	return (
		<div
			className={clsx(
				"h-full relative bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-600 flex-shrink-0",
				!isDragging &&
					!isHotkeyResizing &&
					"transition-all duration-200 ease-in-out",
				!isCollapsed && "hover:border-r-blue-500",
				(isDragging || isFocused || treeHasFocus) && !isCollapsed && "border-r-blue-500 border-r-2",
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
					!isDragging &&
						!isHotkeyResizing &&
						"transition-opacity duration-200 ease-in-out",
					isCollapsed ? "opacity-0" : "opacity-100"
				)}
				style={{ width: width }}
			>
				{children}
			</div>

			{!isCollapsed && (
				<button
					ref={resizerRef as React.RefObject<HTMLButtonElement>}
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
					tabIndex={-1}
				/>
			)}
		</div>
	);
}
