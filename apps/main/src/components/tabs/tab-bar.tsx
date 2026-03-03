import type { FC } from "react";
import { useState } from "react";
import type { Tab } from "@/types";
import { TabComponent, getDragSource } from "./tab";

interface TabBarProps {
	tabs: Tab[];
	activeTabId: string | null;
	onTabSelect: (tabId: string) => void;
	onTabClose?: (tabId: string) => void;
	onTabReorder?: (draggedTabId: string, targetTabId: string) => void;
	onCrossPaneDrop?: (draggedTabId: string, sourcePaneIndex: number, targetTabId?: string) => void;
	hasFocus?: boolean;
	paneIndex?: number;
}

export const TabBar: FC<TabBarProps> = ({
	tabs,
	activeTabId,
	onTabSelect,
	onTabClose,
	onTabReorder,
	onCrossPaneDrop,
	hasFocus = false,
	paneIndex,
}) => {
	const [draggedTabId, setDraggedTabId] = useState<string | null>(null);

	const handleDragStart = (tabId: string) => {
		setDraggedTabId(tabId);
	};

	const handleDrop = (draggedId: string, targetId: string, sourcePaneIndex?: number) => {
		setDraggedTabId(null);
		// Cross-pane drop: source pane differs from this pane
		if (sourcePaneIndex !== undefined && sourcePaneIndex !== paneIndex && onCrossPaneDrop) {
			onCrossPaneDrop(draggedId, sourcePaneIndex, targetId);
			return;
		}
		if (onTabReorder && draggedId !== targetId) {
			onTabReorder(draggedId, targetId);
		}
	};

	const handleBarDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
	};

	const handleBarDrop = (e: React.DragEvent) => {
		e.preventDefault();
		const source = getDragSource();
		const droppedTabId = e.dataTransfer.getData("text/plain") || source?.tabId;
		if (!droppedTabId) return;
		const sourcePaneIndex = source?.paneIndex;
		setDraggedTabId(null);
		// Cross-pane drop onto empty area of tab bar
		if (sourcePaneIndex !== undefined && sourcePaneIndex !== paneIndex && onCrossPaneDrop) {
			onCrossPaneDrop(droppedTabId, sourcePaneIndex);
		}
	};

	return (
		<div
			data-tab-bar
			className={`flex items-center border-b border-gray-300 dark:border-gray-600 min-h-[32px] ${hasFocus ? "bg-blue-100 dark:bg-[#132247]" : "bg-gray-50 dark:bg-gray-800"}`}
			onDragOver={handleBarDragOver}
			onDrop={handleBarDrop}
		>
			{/* Tab list */}
			<div className="flex flex-1 h-full overflow-x-auto gap-px">
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
						paneIndex={paneIndex}
					/>
				))}
			</div>
		</div>
	);
};
