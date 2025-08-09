import type React from "react";
import type { PaneId } from "@/types";
import { Content } from "@/content";

interface DualPaneViewProps {
	panes: {
		activePane: PaneId | null;
		setActivePane: (paneId: PaneId) => void;
	};
}

export const DualPaneView: React.FC<DualPaneViewProps> = ({ panes }) => {
	return (
		<div className="flex flex-col h-full">
			{/* Pane Tabs */}
			<div className="flex border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
				<button
					className={`flex-1 px-4 py-2 text-sm font-medium transition-colors duration-200 border-r border-gray-300 dark:border-gray-600 ${
						panes.activePane === "left"
							? "bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
							: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
					}`}
					onClick={() => panes.setActivePane("left")}
				>
					Left Pane
				</button>
				<button
					className={`flex-1 px-4 py-2 text-sm font-medium transition-colors duration-200 ${
						panes.activePane === "right"
							? "bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
							: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
					}`}
					onClick={() => panes.setActivePane("right")}
				>
					Right Pane
				</button>
			</div>

			{/* Pane Content */}
			<div className="flex h-full">
				{/* Left Pane */}
				<div
					className={`flex-1 border-r border-gray-300 dark:border-gray-600 ${
						panes.activePane === "left" ? "ring-1 ring-blue-500 ring-inset" : ""
					}`}
				>
					<Content paneId="left" />
				</div>

				{/* Right Pane */}
				<div className={`flex-1 ${panes.activePane === "right" ? "ring-1 ring-blue-500 ring-inset" : ""}`}>
					<Content paneId="right" />
				</div>
			</div>
		</div>
	);
};
