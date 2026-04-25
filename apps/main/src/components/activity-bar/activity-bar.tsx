import clsx from "clsx";
import * as Icons from "lucide-react";
import { useEditorLayout, useSidebar, useView, useKeyTipActions } from "@/hooks";
import { useHotkeyLabel } from "@/hooks/use-hotkey-label";
import { useLineWrapping } from "@/hooks";
import { useAtom, useSetAtom, useAtomValue } from "jotai";
import {
	paneStateAtom,
	focusAreaAtom,
	openSettingsTabAtom,
	pane0TabsAtom,
	pane1TabsAtom,
	pane0ActiveTabAtom,
	pane1ActiveTabAtom,
	toggleZenModeAtom,
	statusBarVisibleAtom,
	toggleStatusBarAtom,
} from "@/atoms";
import { tabBarVisibleAtom, toggleTabBarAtom, openBrandingTabAtom } from "@/atoms/panes";
import { brandingSettingsAtom, LOGO_OPTIONS } from "@/atoms/settings";
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
	const openBrandingTab = useSetAtom(openBrandingTabAtom);

	// Branding settings for logo
	const branding = useAtomValue(brandingSettingsAtom);

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

	const isBrandingActive = useMemo(() => {
		const activeInPane0 = pane0Tabs.find((t) => t.id === pane0ActiveTab);
		const activeInPane1 = pane1Tabs.find((t) => t.id === pane1ActiveTab);
		return (
			activeInPane0?.viewType === "branding-view" ||
			activeInPane1?.viewType === "branding-view"
		);
	}, [pane0Tabs, pane1Tabs, pane0ActiveTab, pane1ActiveTab]);



	const { toolbarVisible, toggleToolbar, titleBarVisible, toggleTitleBar } = useEditorLayout();
	const { isWrapping, toggleLineWrapping } = useLineWrapping();
	const [paneState, setPaneState] = useAtom(paneStateAtom);
	const toggleZenMode = useSetAtom(toggleZenModeAtom);
	const tabBarVisible = useAtomValue(tabBarVisibleAtom);
	const toggleTabBar = useSetAtom(toggleTabBarAtom);
	const statusBarVisible = useAtomValue(statusBarVisibleAtom);
	const toggleStatusBar = useSetAtom(toggleStatusBarAtom);

	// Live hotkey labels (reflect user overrides from hotkeys.toml)
	const labelToggleSidebar = useHotkeyLabel("toggleSidebar");
	const labelOpenSettings = useHotkeyLabel("openSettings");
	const labelToggleDualPane = useHotkeyLabel("toggleDualPane");
	const labelToggleToolbar = useHotkeyLabel("toggleToolbar");
	const labelToggleTitleBar = useHotkeyLabel("toggleTitleBar");
	const labelToggleTabBar = useHotkeyLabel("toggleTabBar");
	const labelToggleLineWrapping = useHotkeyLabel("toggleLineWrapping");
	const labelExpandActivityBar = useHotkeyLabel("expandActivityBar");

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
		{ key: "4", action: togglePaneMode, label: "Toggle Pane" },
		{ key: "5", action: toggleToolbar, label: "Toolbar" },
		{ key: "6", action: toggleTitleBar, label: "Title Bar" },
		{ key: "0", action: toggleTabBar, label: "Tab Bar" },
		{ key: "s", action: toggleStatusBar, label: "Status Bar" },
		{ key: "7", action: toggleLineWrapping, label: "Wrap" },
		{ key: "9", action: toggleZenMode, label: "Zen Mode" },
		{ key: "e", action: toggleActivityBarExpanded, label: "Expand/Collapse" },
	], [toggleSidebar, openSettingsTab, togglePaneMode, toggleToolbar, toggleTitleBar, toggleTabBar, toggleStatusBar, toggleLineWrapping, toggleZenMode, toggleActivityBarExpanded]);

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

	return (
		<div
			ref={containerRef}
			tabIndex={0}
			onFocus={() => setFocusArea("activity-bar")}
			onBlur={() => setFocusArea(null)}
			className={clsx(
				"flex-shrink-0 flex items-center focus:outline-none bg-gray-50 dark:bg-gray-800",
				// Mobile: horizontal top bar with bottom border
				"w-full h-12 flex-row justify-between px-4 py-2 gap-4 border-b border-gray-300 dark:border-gray-600",
				// Desktop: vertical sidebar with right border
				activityBarExpanded
					? "md:w-40 md:h-auto md:flex-col md:justify-start md:px-1 md:py-2 md:gap-1 md:border-r md:border-b-0"
					: "md:w-9 md:h-auto md:flex-col md:justify-start md:px-0 md:py-2 md:gap-2 md:border-r md:border-b-0"
			)}
		>


			{/* Logo button */}
			<div className={clsx("hidden md:flex md:w-full", activityBarExpanded ? "md:justify-center md:mb-1" : "md:justify-center md:mb-2")}>
				<button
					className={clsx(
						"relative flex items-center justify-center border-none bg-transparent cursor-pointer transition-all duration-200 rounded p-0",
						isBrandingActive
							? "ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-800"
							: "hover:opacity-80",
						activityBarExpanded ? "w-8 h-8" : "w-6 h-6"
					)}
					onClick={openBrandingTab}
					title="IrisNotes — Branding & About"
					tabIndex={-1}
				>
					<img
						src={LOGO_OPTIONS.find((o) => o.id === branding.activityBarLogo)?.file ?? "/logo-purple.png"}
						alt="IrisNotes"
						style={{ width: activityBarExpanded ? 28 : 22, height: activityBarExpanded ? 28 : 22 }}
						className="object-contain"
					/>
					{import.meta.env.DEV && (
						<span
							className={clsx(
								"absolute bg-red-500 text-white font-bold leading-none rounded-sm",
								activityBarExpanded
									? "bottom-[-4px] right-[-6px] text-[6px] px-[3px] py-[1px]"
									: "bottom-[-3px] right-[-5px] text-[5px] px-[2px] py-[1px]"
							)}
						>
							DEV
						</span>
					)}
				</button>
			</div>

			{/* Expand/Collapse toggle - desktop only */}
			<div className={clsx("hidden md:flex md:w-full", activityBarExpanded ? "md:justify-end md:mb-1" : "md:justify-center md:mb-2")}>
				<button
					className={clsx(
						"relative flex items-center justify-center bg-transparent cursor-pointer transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset",
						"text-gray-400 hover:text-gray-600 dark:hover:text-gray-200",
						activityBarExpanded
							? "w-6 h-5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
							: "w-6 h-6 rounded hover:scale-110"
					)}
					onClick={toggleActivityBarExpanded}
				title={activityBarExpanded ? `Collapse activity bar (${labelExpandActivityBar})` : `Expand activity bar (${labelExpandActivityBar})`}
					tabIndex={-1}
				>
					{activityBarExpanded ? (
						<Icons.ChevronLeft size={14} />
					) : (
						<Icons.ChevronRight size={18} />
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
					icon={Icons.PanelLeft}
					isActive={!sidebarCollapsed}
					onClick={toggleSidebar}
					title={`Toggle Notes Sidebar (${labelToggleSidebar})`}
					label="Notes"
					expanded={activityBarExpanded}
					keyTip="1"
					showKeyTip={altKeyHeld}
				/>

				<ActivityBarButton
					icon={Icons.Settings}
					isActive={isSettingsActive}
					onClick={openSettingsTab}
					title={`Settings (${labelOpenSettings})`}
					label="Settings"
					expanded={activityBarExpanded}
					keyTip="2"
					showKeyTip={altKeyHeld}
				/>

			</div>

			{/* Separator - desktop only */}
			<div className={clsx(
				"hidden md:block border-t border-gray-200 dark:border-gray-600",
				activityBarExpanded ? "md:my-1 md:w-full" : "md:my-1 md:mx-1"
			)} />

			{/* Show/Hide toggles */}
			<div
				className={clsx(
					"flex items-center gap-2",
					"flex-row",
					activityBarExpanded
						? "md:flex-col md:gap-1 md:w-full"
						: "md:flex-col md:gap-2"
				)}
			>
				<ActivityBarButton
					icon={Icons.Brush}
					isActive={toolbarVisible}
					onClick={toggleToolbar}
					title={`${toolbarVisible ? "Hide" : "Show"} editor toolbar (${labelToggleToolbar})`}
					label="Toolbar"
					expanded={activityBarExpanded}
					keyTip="5"
					showKeyTip={altKeyHeld}
					iconSize={16}
					iconClassName="md:w-4 md:h-4"
				/>

				<ActivityBarButton
					icon={Icons.Heading}
					isActive={titleBarVisible}
					onClick={toggleTitleBar}
					title={`${titleBarVisible ? "Hide" : "Show"} title bar (${labelToggleTitleBar})`}
					label="Title Bar"
					expanded={activityBarExpanded}
					keyTip="6"
					showKeyTip={altKeyHeld}
					iconSize={16}
					iconClassName="md:w-4 md:h-4"
				/>

				<ActivityBarButton
					icon={Icons.PanelTop}
					isActive={tabBarVisible}
					onClick={toggleTabBar}
					title={`${tabBarVisible ? "Hide" : "Show"} tab bar (${labelToggleTabBar})`}
					label="Tab Bar"
					expanded={activityBarExpanded}
					keyTip="0"
					showKeyTip={altKeyHeld}
					iconSize={16}
					iconClassName="md:w-4 md:h-4"
				/>

				<ActivityBarButton
					icon={Icons.PanelBottom}
					isActive={statusBarVisible}
					onClick={toggleStatusBar}
					title={`${statusBarVisible ? "Hide" : "Show"} status bar`}
					label="Status Bar"
					expanded={activityBarExpanded}
					keyTip="s"
					showKeyTip={altKeyHeld}
					iconSize={16}
					iconClassName="md:w-4 md:h-4"
				/>
			</div>

			{/* Separator - desktop only */}
			<div className={clsx(
				"hidden md:block border-t border-gray-200 dark:border-gray-600",
				activityBarExpanded ? "md:my-1 md:w-full" : "md:my-1 md:mx-1"
			)} />

			{/* Mode switches */}
			<div
				className={clsx(
					"flex items-center gap-2",
					"flex-row",
					activityBarExpanded
						? "md:flex-col md:gap-1 md:w-full"
						: "md:flex-col md:gap-2"
				)}
			>
				<div className="hidden md:block md:w-full">
					<ActivityBarButton
						icon={Icons.Columns2}
						isActive={paneState.count === 2}
						onClick={togglePaneMode}
						title={
							paneState.count === 1
								? `Split into two panes (${labelToggleDualPane})`
								: `Merge to single pane (${labelToggleDualPane})`
						}
						label={paneState.count === 1 ? "Split Pane" : "Single Pane"}
						expanded={activityBarExpanded}
						keyTip="4"
						showKeyTip={altKeyHeld}
					/>
				</div>

				<ActivityBarButton
					icon={Icons.WrapText}
					isActive={isWrapping}
					onClick={toggleLineWrapping}
					title={`${isWrapping ? "Disable" : "Enable"} line wrapping (${labelToggleLineWrapping})`}
					label="Wrap Text"
					expanded={activityBarExpanded}
					keyTip="7"
					showKeyTip={altKeyHeld}
					iconSize={16}
					iconClassName="md:w-4 md:h-4"
				/>
			</div>
		</div>
	);
}
