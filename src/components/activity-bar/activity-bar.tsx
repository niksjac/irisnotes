import clsx from "clsx";
import * as Icons from "lucide-react";
import { useEditorLayout, useSidebar, useView, useTheme } from "@/hooks";
import { useEditorState, useLineWrapping } from "@/hooks";
import { useAtom } from "jotai";
import { paneStateAtom, focusAreaAtom } from "@/atoms";
import { ActivityBarButton } from "./activity-bar-button";
import { StorageAdapterButton } from "./storage-adapter-button";
import { useEffect, useRef, useCallback } from "react";

export function ActivityBar() {
	const containerRef = useRef<HTMLDivElement>(null);
	const [focusArea, setFocusArea] = useAtom(focusAreaAtom);
	const hasFocus = focusArea === "activity-bar";

	// Component-level color constants
	// Activity bar needs darker focus color due to narrow width (visual perception)
	const COLORS = {
		bg: "bg-gray-50 dark:bg-gray-800",
		bgFocused: "bg-blue-200 dark:bg-blue-800/50",
		border: "border-gray-300 dark:border-gray-600",
		textSecondary: "text-gray-700 dark:text-gray-300",
	};

	// Direct hook access - no prop drilling
	const { sidebarCollapsed, toggleSidebar } = useSidebar();
	const {
		activityBarVisible,
		configViewActive,
		hotkeysViewActive,
		databaseStatusVisible,
		toggleConfigView,
		toggleHotkeysView,
		toggleDatabaseStatus,
	} = useView();

	const { toolbarVisible, toggleToolbar } = useEditorLayout();
	const { fontSize } = useEditorState();
	const { isWrapping, toggleLineWrapping } = useLineWrapping();
	const { darkMode, toggleDarkMode } = useTheme();
	const [paneState, setPaneState] = useAtom(paneStateAtom);

	const fontSizeIndicatorClasses = `flex flex-col items-center justify-center gap-0.5 cursor-default ${COLORS.textSecondary} text-xs font-medium p-0.5 md:h-8 h-6`;

	const togglePaneMode = useCallback(() => {
		setPaneState((prev) => ({
			...prev,
			count: prev.count === 1 ? 2 : 1,
		}));
	}, [setPaneState]);

	// Define actions with their keyboard shortcuts
	const actions = [
		{ key: "1", action: toggleSidebar, label: "Toggle Sidebar" },
		{ key: "2", action: toggleConfigView, label: "Configuration" },
		{ key: "3", action: toggleHotkeysView, label: "Hotkeys" },
		{ key: "4", action: toggleDatabaseStatus, label: "Database" },
		{ key: "5", action: togglePaneMode, label: "Toggle Pane" },
		{ key: "6", action: toggleToolbar, label: "Toolbar" },
		{ key: "7", action: toggleLineWrapping, label: "Wrap" },
		{ key: "8", action: toggleDarkMode, label: "Theme" },
	];

	// Keyboard handler when activity bar is focused
	useEffect(() => {
		if (!hasFocus) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			const action = actions.find((a) => a.key === e.key);
			if (action) {
				e.preventDefault();
				action.action();
			}
			// Escape to blur
			if (e.key === "Escape") {
				setFocusArea(null);
				containerRef.current?.blur();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [hasFocus, actions, setFocusArea]);

	if (!activityBarVisible) return null;

	// Focus colors: using solid dark:bg-[#132247] (pre-computed blue-900/30 over gray-900)
	// This avoids opacity blending issues
	return (
		<div
			ref={containerRef}
			tabIndex={0}
			onFocus={() => setFocusArea("activity-bar")}
			onBlur={() => setFocusArea(null)}
			className={clsx(
				"flex-shrink-0 flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
				hasFocus ? "bg-blue-100 dark:bg-[#132247]" : "bg-gray-50 dark:bg-gray-800",
				// Mobile: horizontal top bar with bottom border
				"w-full h-12 flex-row justify-between px-4 py-2 gap-4 border-b border-gray-300 dark:border-gray-600",
				// Desktop: vertical sidebar with right border
				"md:w-9 md:h-auto md:flex-col md:justify-start md:py-2 md:gap-2 md:border-r md:border-b-0"
			)}
		>
			{/* Main action buttons */}
			<div className="flex gap-2 md:flex-col md:gap-2">
				<ActivityBarButton
					icon={Icons.FileText}
					isActive={!sidebarCollapsed}
					onClick={toggleSidebar}
					title="Toggle Notes Sidebar"
					shortcutKey={hasFocus ? "1" : undefined}
				/>

				<ActivityBarButton
					icon={Icons.Settings}
					isActive={configViewActive}
					onClick={toggleConfigView}
					title="Configuration"
					shortcutKey={hasFocus ? "2" : undefined}
				/>

				<ActivityBarButton
					icon={Icons.Keyboard}
					isActive={hotkeysViewActive}
					onClick={toggleHotkeysView}
					title="Hotkeys Reference"
					shortcutKey={hasFocus ? "3" : undefined}
				/>

				<ActivityBarButton
					icon={Icons.Database}
					isActive={databaseStatusVisible}
					onClick={toggleDatabaseStatus}
					title="Database Status"
					shortcutKey={hasFocus ? "4" : undefined}
				/>

				<StorageAdapterButton />

				{/* Dual pane button - hidden on mobile */}
				<div className="hidden md:block">
					<ActivityBarButton
						icon={paneState.count === 1 ? Icons.Columns2 : Icons.Minus}
						isActive={paneState.count === 2}
						onClick={togglePaneMode}
						title={
							paneState.count === 1
								? "Split into two panes"
								: "Merge to single pane"
						}
						shortcutKey={hasFocus ? "5" : undefined}
					/>
				</div>
			</div>

			{/* Editor controls section */}
			<div
				className={clsx(
					"flex items-center gap-2",
					"flex-row",
					"md:flex-col md:mt-auto md:pt-2 md:border-t md:border-gray-300 dark:md:border-gray-600 md:gap-2"
				)}
			>
				{/* Font Size Indicator */}
				<div
					className={fontSizeIndicatorClasses}
					title={`Editor font size: ${fontSize}px (Ctrl+Plus/Minus to adjust)`}
				>
					<Icons.Type size={10} className="md:w-3 md:h-3" />
					<span className="hidden md:inline">{fontSize}px</span>
				</div>

				<ActivityBarButton
					icon={Icons.Wrench}
					isActive={toolbarVisible}
					onClick={toggleToolbar}
					title={`${toolbarVisible ? "Hide" : "Show"} editor toolbar`}
					shortcutKey={hasFocus ? "6" : undefined}
				/>

				<ActivityBarButton
					icon={isWrapping ? Icons.WrapText : Icons.ArrowRight}
					isActive={isWrapping}
					onClick={toggleLineWrapping}
					title={`${isWrapping ? "Disable" : "Enable"} line wrapping (Alt+Z)`}
					shortcutKey={hasFocus ? "7" : undefined}
				/>

				<ActivityBarButton
					icon={darkMode ? Icons.Sun : Icons.Moon}
					isActive={false}
					onClick={toggleDarkMode}
					title={`Switch to ${darkMode ? "light" : "dark"} mode`}
					shortcutKey={hasFocus ? "8" : undefined}
				/>
			</div>
		</div>
	);
}
