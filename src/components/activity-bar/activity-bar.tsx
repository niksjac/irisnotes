import clsx from "clsx";
import * as Icons from "lucide-react";
import { useEditorLayout, useSidebar, useView, useTheme } from "@/hooks";
import { useEditorState, useLineWrapping } from "@/hooks";
import { useAtom, useSetAtom, useAtomValue } from "jotai";
import {
	paneStateAtom,
	focusAreaAtom,
	openSettingsTabAtom,
	openHotkeysTabAtom,
	pane0TabsAtom,
	pane1TabsAtom,
	pane0ActiveTabAtom,
	pane1ActiveTabAtom,
} from "@/atoms";
import { ActivityBarButton } from "./activity-bar-button";
import { useEffect, useRef, useCallback, useMemo } from "react";

export function ActivityBar() {
	const containerRef = useRef<HTMLDivElement>(null);
	const [focusArea, setFocusArea] = useAtom(focusAreaAtom);
	const hasFocus = focusArea === "activity-bar";

	// Direct hook access - no prop drilling
	const { sidebarCollapsed, toggleSidebar } = useSidebar();
	const {
		activityBarVisible,
		activityBarExpanded,
		toggleActivityBarExpanded,
	} = useView();

	// Tab-based view openers
	const openSettingsTab = useSetAtom(openSettingsTabAtom);
	const openHotkeysTab = useSetAtom(openHotkeysTabAtom);

	// Check if settings/hotkeys tabs are currently active
	const pane0Tabs = useAtomValue(pane0TabsAtom);
	const pane1Tabs = useAtomValue(pane1TabsAtom);
	const pane0ActiveTab = useAtomValue(pane0ActiveTabAtom);
	const pane1ActiveTab = useAtomValue(pane1ActiveTabAtom);

	const isSettingsActive = useMemo(() => {
		const activeInPane0 = pane0Tabs.find((t) => t.id === pane0ActiveTab);
		const activeInPane1 = pane1Tabs.find((t) => t.id === pane1ActiveTab);
		return (
			activeInPane0?.viewType === "config-view" ||
			activeInPane1?.viewType === "config-view"
		);
	}, [pane0Tabs, pane1Tabs, pane0ActiveTab, pane1ActiveTab]);

	const isHotkeysActive = useMemo(() => {
		const activeInPane0 = pane0Tabs.find((t) => t.id === pane0ActiveTab);
		const activeInPane1 = pane1Tabs.find((t) => t.id === pane1ActiveTab);
		return (
			activeInPane0?.viewType === "hotkeys-view" ||
			activeInPane1?.viewType === "hotkeys-view"
		);
	}, [pane0Tabs, pane1Tabs, pane0ActiveTab, pane1ActiveTab]);

	const { toolbarVisible, toggleToolbar } = useEditorLayout();
	const { fontSize } = useEditorState();
	const { isWrapping, toggleLineWrapping } = useLineWrapping();
	const { darkMode, toggleDarkMode } = useTheme();
	const [paneState, setPaneState] = useAtom(paneStateAtom);

	const togglePaneMode = useCallback(() => {
		setPaneState((prev) => ({
			...prev,
			count: prev.count === 1 ? 2 : 1,
		}));
	}, [setPaneState]);

	// Define actions with their keyboard shortcuts
	const actions = [
		{ key: "1", action: toggleSidebar, label: "Toggle Sidebar" },
		{ key: "2", action: openSettingsTab, label: "Settings" },
		{ key: "3", action: openHotkeysTab, label: "Hotkeys" },
		{ key: "4", action: togglePaneMode, label: "Toggle Pane" },
		{ key: "5", action: toggleToolbar, label: "Toolbar" },
		{ key: "6", action: toggleLineWrapping, label: "Wrap" },
		{ key: "7", action: toggleDarkMode, label: "Theme" },
		{ key: "e", action: toggleActivityBarExpanded, label: "Expand" },
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
				activityBarExpanded
					? "md:w-40 md:h-auto md:flex-col md:justify-start md:py-2 md:gap-1 md:border-r md:border-b-0"
					: "md:w-9 md:h-auto md:flex-col md:justify-start md:py-2 md:gap-2 md:border-r md:border-b-0"
			)}
		>
			{/* Expand/Collapse toggle - desktop only */}
			<div className="hidden md:flex md:justify-end md:w-full md:mb-1">
				<button
					className={clsx(
						"flex items-center justify-center border-none rounded bg-transparent cursor-pointer transition-all duration-200",
						"w-6 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200",
						"hover:bg-gray-200 dark:hover:bg-gray-700"
					)}
					onClick={toggleActivityBarExpanded}
					title={activityBarExpanded ? "Collapse activity bar" : "Expand activity bar"}
					tabIndex={-1}
				>
					{activityBarExpanded ? (
						<Icons.PanelLeftClose size={14} />
					) : (
						<Icons.PanelLeftOpen size={14} />
					)}
				</button>
			</div>

			{/* Main action buttons */}
			<div className={clsx("flex gap-2", activityBarExpanded ? "md:flex-col md:gap-1 md:w-full" : "md:flex-col md:gap-2")}>
				<ActivityBarButton
					icon={Icons.FileText}
					isActive={!sidebarCollapsed}
					onClick={toggleSidebar}
					title="Toggle Notes Sidebar"
					label="Notes"
					expanded={activityBarExpanded}
					shortcutKey={hasFocus ? "1" : undefined}
				/>

				<ActivityBarButton
					icon={Icons.Settings}
					isActive={isSettingsActive}
					onClick={openSettingsTab}
					title="Settings"
					label="Settings"
					expanded={activityBarExpanded}
					shortcutKey={hasFocus ? "2" : undefined}
				/>

				<ActivityBarButton
					icon={Icons.Keyboard}
					isActive={isHotkeysActive}
					onClick={openHotkeysTab}
					title="Keyboard Shortcuts"
					label="Hotkeys"
					expanded={activityBarExpanded}
					shortcutKey={hasFocus ? "3" : undefined}
				/>

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
						label={paneState.count === 1 ? "Split Pane" : "Single Pane"}
						expanded={activityBarExpanded}
						shortcutKey={hasFocus ? "4" : undefined}
					/>
				</div>
			</div>

			{/* Editor controls section */}
			<div
				className={clsx(
					"flex items-center gap-2",
					"flex-row",
					activityBarExpanded
						? "md:flex-col md:mt-auto md:pt-2 md:border-t md:border-gray-300 dark:md:border-gray-600 md:gap-1 md:w-full"
						: "md:flex-col md:mt-auto md:pt-2 md:border-t md:border-gray-300 dark:md:border-gray-600 md:gap-2"
				)}
			>
				{/* Font Size Indicator */}
				<div
					className={clsx(
						"flex items-center gap-0.5 cursor-default text-gray-700 dark:text-gray-300 text-xs font-medium p-0.5",
						// Mobile: always compact
						"flex-col justify-center h-6",
						// Desktop: depends on expanded state
						activityBarExpanded
							? "md:justify-start md:w-full md:px-2 md:h-7 md:flex-row"
							: "md:flex-col md:justify-center md:h-8"
					)}
					title={`Editor font size: ${fontSize}px (Ctrl+Plus/Minus to adjust)`}
				>
					<Icons.Type size={10} className="md:w-3 md:h-3 flex-shrink-0" />
					{/* Font size text: hidden on mobile, shown on desktop */}
					<span className={clsx("hidden", activityBarExpanded ? "md:inline" : "md:inline")}>
						{fontSize}px
					</span>
				</div>

				<ActivityBarButton
					icon={Icons.Wrench}
					isActive={toolbarVisible}
					onClick={toggleToolbar}
					title={`${toolbarVisible ? "Hide" : "Show"} editor toolbar`}
					label="Toolbar"
					expanded={activityBarExpanded}
					shortcutKey={hasFocus ? "5" : undefined}
				/>

				<ActivityBarButton
					icon={isWrapping ? Icons.WrapText : Icons.ArrowRight}
					isActive={isWrapping}
					onClick={toggleLineWrapping}
					title={`${isWrapping ? "Disable" : "Enable"} line wrapping (Alt+Z)`}
					label="Wrap Text"
					expanded={activityBarExpanded}
					shortcutKey={hasFocus ? "6" : undefined}
				/>

				<ActivityBarButton
					icon={darkMode ? Icons.Sun : Icons.Moon}
					isActive={false}
					onClick={toggleDarkMode}
					title={`Switch to ${darkMode ? "light" : "dark"} mode`}
					label={darkMode ? "Light Mode" : "Dark Mode"}
					expanded={activityBarExpanded}
					shortcutKey={hasFocus ? "7" : undefined}
				/>
			</div>
		</div>
	);
}
