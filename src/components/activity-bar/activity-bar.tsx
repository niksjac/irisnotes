import clsx from "clsx";
import * as Icons from "lucide-react";
import { useEditorLayout, useSidebar, useView, useTheme, useKeyTipActions } from "@/hooks";
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

	// Define actions with their keyboard shortcuts (Alt+key)
	const keyTipActions = useMemo(() => [
		{ key: "1", action: toggleSidebar, label: "Toggle Sidebar" },
		{ key: "2", action: openSettingsTab, label: "Settings" },
		{ key: "3", action: openHotkeysTab, label: "Hotkeys" },
		{ key: "4", action: togglePaneMode, label: "Toggle Pane" },
		{ key: "5", action: toggleToolbar, label: "Toolbar" },
		{ key: "6", action: toggleLineWrapping, label: "Wrap" },
		{ key: "7", action: toggleDarkMode, label: "Theme" },
		{ key: "e", action: toggleActivityBarExpanded, label: "Expand/Collapse" },
	], [toggleSidebar, openSettingsTab, openHotkeysTab, togglePaneMode, toggleToolbar, toggleLineWrapping, toggleDarkMode, toggleActivityBarExpanded]);

	// Use the KeyTip system for Alt+key shortcuts
	const { altKeyHeld } = useKeyTipActions(keyTipActions);

	// Legacy keyboard handler when activity bar is focused (without Alt)
	const actions = keyTipActions;

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
			<div className={clsx("hidden md:flex md:w-full", activityBarExpanded ? "md:justify-end md:mb-1" : "md:justify-center md:mb-2")}>
				<button
					className={clsx(
						"relative flex items-center justify-center border-none bg-transparent cursor-pointer transition-all duration-200",
						"text-gray-400 hover:text-gray-600 dark:hover:text-gray-200",
						activityBarExpanded
							? "w-6 h-5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
							: "w-6 h-6 hover:scale-110"
					)}
					onClick={toggleActivityBarExpanded}
					title={activityBarExpanded ? "Collapse activity bar (Alt+E)" : "Expand activity bar (Alt+E)"}
					tabIndex={-1}
				>
					{activityBarExpanded ? (
						<Icons.PanelLeftClose size={14} />
					) : (
						<Icons.PanelLeftOpen size={18} />
					)}
					{altKeyHeld && (
						<span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 flex items-center justify-center bg-amber-400 text-[9px] font-bold text-amber-900 rounded shadow-sm">
							E
						</span>
					)}
				</button>
			</div>

			{/* Main action buttons */}
			<div className={clsx("flex gap-2", activityBarExpanded ? "md:flex-col md:gap-1 md:w-full" : "md:flex-col md:gap-2")}>
				<ActivityBarButton
					icon={Icons.FileText}
					isActive={!sidebarCollapsed}
					onClick={toggleSidebar}
					title="Toggle Notes Sidebar (Alt+1)"
					label="Notes"
					expanded={activityBarExpanded}
					keyTip="1"
					showKeyTip={altKeyHeld}
				/>

				<ActivityBarButton
					icon={Icons.Settings}
					isActive={isSettingsActive}
					onClick={openSettingsTab}
					title="Settings (Alt+2)"
					label="Settings"
					expanded={activityBarExpanded}
					keyTip="2"
					showKeyTip={altKeyHeld}
				/>

				<ActivityBarButton
					icon={Icons.Keyboard}
					isActive={isHotkeysActive}
					onClick={openHotkeysTab}
					title="Keyboard Shortcuts (Alt+3)"
					label="Hotkeys"
					expanded={activityBarExpanded}
					keyTip="3"
					showKeyTip={altKeyHeld}
				/>

				<div className="hidden md:block">
					<ActivityBarButton
						icon={paneState.count === 1 ? Icons.Columns2 : Icons.Minus}
						isActive={paneState.count === 2}
						onClick={togglePaneMode}
						title={
							paneState.count === 1
								? "Split into two panes (Alt+4)"
								: "Merge to single pane (Alt+4)"
						}
						label={paneState.count === 1 ? "Split Pane" : "Single Pane"}
						expanded={activityBarExpanded}
						keyTip="4"
						showKeyTip={altKeyHeld}
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
						"flex items-center justify-center cursor-default text-gray-700 dark:text-gray-300 font-medium tabular-nums",
						// Mobile: compact
						"text-xs h-6 w-8",
						// Desktop: depends on expanded state
						activityBarExpanded
							? "md:justify-start md:w-full md:px-2 md:h-7 md:text-xs"
							: "md:w-6 md:h-6 md:text-[11px]"
					)}
					title={`Base font size: ${fontSize}px (Ctrl+Alt+Up/Down to adjust)`}
				>
					<span>{fontSize}</span>
					{activityBarExpanded && <span className="hidden md:inline ml-1">px</span>}
				</div>

				<ActivityBarButton
					icon={toolbarVisible ? Icons.PanelTop : Icons.PanelTopDashed}
					isActive={toolbarVisible}
					onClick={toggleToolbar}
					title={`${toolbarVisible ? "Hide" : "Show"} editor toolbar (Alt+5)`}
					label="Toolbar"
					expanded={activityBarExpanded}
					keyTip="5"
					showKeyTip={altKeyHeld}
				/>

				<ActivityBarButton
					icon={isWrapping ? Icons.WrapText : Icons.ArrowRight}
					isActive={isWrapping}
					onClick={toggleLineWrapping}
					title={`${isWrapping ? "Disable" : "Enable"} line wrapping (Alt+6)`}
					label="Wrap Text"
					expanded={activityBarExpanded}
					keyTip="6"
					showKeyTip={altKeyHeld}
				/>

				<ActivityBarButton
					icon={darkMode ? Icons.Sun : Icons.Moon}
					isActive={false}
					onClick={toggleDarkMode}
					title={`Switch to ${darkMode ? "light" : "dark"} mode (Alt+7)`}
					label={darkMode ? "Light Mode" : "Dark Mode"}
					expanded={activityBarExpanded}
					keyTip="7"
					showKeyTip={altKeyHeld}
				/>
			</div>
		</div>
	);
}
