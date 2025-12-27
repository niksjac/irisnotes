import clsx from "clsx";
import * as Icons from "lucide-react";
import { useEditorLayout, useSidebar, useView } from "@/hooks";
import { useEditorState, useLineWrapping } from "@/hooks";
import { useAtom } from "jotai";
import { paneStateAtom } from "@/atoms";
import { ActivityBarButton } from "./activity-bar-button";
import { StorageAdapterButton } from "./storage-adapter-button";

export function ActivityBar() {
	// Component-level color constants
	const COLORS = {
		bg: "bg-gray-200 dark:bg-gray-700",
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
	const [paneState, setPaneState] = useAtom(paneStateAtom);

	const fontSizeIndicatorClasses = `flex flex-col items-center justify-center gap-0.5 cursor-default ${COLORS.textSecondary} text-xs font-medium p-0.5 md:h-8 h-6`;

	const togglePaneMode = () => {
		setPaneState((prev) => ({
			...prev,
			count: prev.count === 1 ? 2 : 1,
		}));
	};

	if (!activityBarVisible) return null;

	return (
		<div
			className={clsx(
				`${COLORS.bg} border ${COLORS.border} flex-shrink-0 flex items-center`,
				// Mobile: horizontal top bar
				"w-full h-12 flex-row justify-between px-4 py-2 gap-4 border-b border-l-0 border-r-0 border-t-0",
				// Desktop: vertical sidebar
				"md:w-9 md:h-auto md:flex-col md:justify-start md:py-2 md:gap-2 md:border-r md:border-b-0 md:border-t-0 md:border-l-0"
			)}
		>
			{/* Main action buttons */}
			<div className="flex gap-2 md:flex-col md:gap-2">
				<ActivityBarButton
					icon={Icons.FileText}
					isActive={!sidebarCollapsed}
					onClick={toggleSidebar}
					title="Toggle Notes Sidebar"
				/>

				<ActivityBarButton
					icon={Icons.Settings}
					isActive={configViewActive}
					onClick={toggleConfigView}
					title="Configuration"
				/>

				<ActivityBarButton
					icon={Icons.Keyboard}
					isActive={hotkeysViewActive}
					onClick={toggleHotkeysView}
					title="Hotkeys Reference"
				/>

				<ActivityBarButton
					icon={Icons.Database}
					isActive={databaseStatusVisible}
					onClick={toggleDatabaseStatus}
					title="Database Status"
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
					/>
				</div>
			</div>

			{/* Editor controls section */}
			<div
				className={clsx(
					"flex items-center gap-2",
					// Mobile: horizontal layout on the right
					"flex-row",
					// Desktop: vertical layout at bottom with border
					"md:flex-col md:mt-auto md:pt-2 md:border-t md:gap-2",
					`md:${COLORS.border}`
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
				/>

				<ActivityBarButton
					icon={isWrapping ? Icons.WrapText : Icons.ArrowRight}
					isActive={isWrapping}
					onClick={toggleLineWrapping}
					title={`${isWrapping ? "Disable" : "Enable"} line wrapping (Alt+Z)`}
				/>
			</div>
		</div>
	);
}
