import type { FC } from "react";
import type { Tab } from "@/types";
import { TabComponent } from "./tab";

interface TabBarProps {
	tabs: Tab[];
	activeTabId: string | null;
	onTabSelect: (tabId: string) => void;
	onTabClose?: (tabId: string) => void;
	onNewTab?: () => void;
}

export const TabBar: FC<TabBarProps> = ({
	tabs,
	activeTabId,
	onTabSelect,
	onTabClose,
	onNewTab
}) => {
	return (
		<div className="flex items-center bg-gray-50 border-b border-gray-200 min-h-[40px]">
			{/* Tab list */}
			<div className="flex flex-1 overflow-x-auto">
				{tabs.map((tab) => (
					<TabComponent
						key={tab.id}
						tab={tab}
						isActive={tab.id === activeTabId}
						onSelect={onTabSelect}
						onClose={onTabClose}
					/>
				))}
			</div>

			{/* New tab button */}
			{onNewTab && (
				<button
					className="px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 border-l border-gray-200"
					onClick={onNewTab}
					title="New tab"
				>
					<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
						<path d="M8 3a1 1 0 011 1v3h3a1 1 0 110 2H9v3a1 1 0 11-2 0V9H4a1 1 0 110-2h3V4a1 1 0 011-1z"/>
					</svg>
				</button>
			)}
		</div>
	);
};
