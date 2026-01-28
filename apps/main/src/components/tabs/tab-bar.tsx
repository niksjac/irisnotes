import type { FC } from "react";
import { useState } from "react";
import type { Tab } from "@/types";
import { TabComponent } from "./tab";

interface TabBarProps {
	tabs: Tab[];
	activeTabId: string | null;
	onTabSelect: (tabId: string) => void;
	onTabClose?: (tabId: string) => void;
	onTabReorder?: (draggedTabId: string, targetTabId: string) => void;
	hasFocus?: boolean;
}

export const TabBar: FC<TabBarProps> = ({
	tabs,
	activeTabId,
	onTabSelect,
	onTabClose,
	onTabReorder,
	hasFocus = false,
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
		<div
			data-tab-bar
			className={`flex items-center border-b border-gray-300 dark:border-gray-600 min-h-[40px] ${hasFocus ? "bg-blue-100 dark:bg-[#132247]" : "bg-gray-50 dark:bg-gray-800"}`}
		>
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
		</div>
	);
};
