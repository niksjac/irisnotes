import type { FC } from "react";
import { useState } from "react";
import type { Tab } from "@/types";
import { TabComponent } from "./tab";

interface TabBarProps {
	tabs: Tab[];
	activeTabId: string | null;
	onTabSelect: (tabId: string) => void;
	onTabClose?: (tabId: string) => void;
	onNewTab?: () => void;
	onTabReorder?: (draggedTabId: string, targetTabId: string) => void;
}

export const TabBar: FC<TabBarProps> = ({
	tabs,
	activeTabId,
	onTabSelect,
	onTabClose,
	onNewTab,
	onTabReorder,
}) => {
	const [draggedTabId, setDraggedTabId] = useState<string | null>(null);

	const handleDragStart = (tabId: string) => {
		setDraggedTabId(tabId);
	};

	const handleDrop = (draggedId: string, targetId: string) => {
		setDraggedTabId(null);
		if (onTabReorder && draggedId !== targetId) {
			onTabReorder(draggedId, targetId);
		}
	};

	return (
		<div className="flex items-center bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600 min-h-[40px]">
			{/* Tab list */}
			<div className="flex flex-1 overflow-x-auto">
				{tabs.map((tab) => (
					<TabComponent
						key={tab.id}
						tab={tab}
						isActive={tab.id === activeTabId}
						onSelect={onTabSelect}
						onClose={onTabClose}
						onDragStart={handleDragStart}
						onDrop={handleDrop}
						isDragging={draggedTabId === tab.id}
					/>
				))}
			</div>

			{/* New tab button */}
			{onNewTab && (
				<button
					className="px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border-l border-gray-300 dark:border-gray-600 transition-all duration-200"
					onClick={onNewTab}
					title="New tab"
				>
					<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
						<path d="M8 3a1 1 0 011 1v3h3a1 1 0 110 2H9v3a1 1 0 11-2 0V9H4a1 1 0 110-2h3V4a1 1 0 011-1z" />
					</svg>
				</button>
			)}
		</div>
	);
};
