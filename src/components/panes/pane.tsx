import type { FC } from "react";
import type { Tab } from "@/types";
import { TabBar, TabContent } from "@/components/tabs";

interface PaneProps {
	tabs: Tab[];
	activeTabId: string | null;
	onTabSelect: (tabId: string) => void;
	onTabClose?: (tabId: string) => void;
	onNewTab?: () => void;
	onTabReorder?: (draggedTabId: string, targetTabId: string) => void;
	isActive?: boolean;
	onPaneClick?: () => void;
	isDualPaneMode?: boolean;
}

export const Pane: FC<PaneProps> = ({
	tabs,
	activeTabId,
	onTabSelect,
	onTabClose,
	onNewTab,
	onTabReorder,
	isActive = false,
	onPaneClick,
	isDualPaneMode = false
}) => {
	const activeTab = tabs.find(tab => tab.id === activeTabId) || null;

	const handlePaneClick = () => {
		if (onPaneClick) {
			onPaneClick();
		}
	};

		return (
		<div
			className={`
				flex flex-col h-full bg-white dark:bg-gray-900 transition-all duration-200
				${isDualPaneMode && isActive ? 'border-2 border-blue-400 dark:border-blue-500 shadow-lg shadow-blue-100 dark:shadow-blue-900/20' : ''}
				${isDualPaneMode && !isActive ? 'border border-gray-200 dark:border-gray-700' : ''}
			`}
			onClick={handlePaneClick}
		>
			<TabBar
				tabs={tabs}
				activeTabId={activeTabId}
				onTabSelect={onTabSelect}
				onTabClose={onTabClose}
				onNewTab={onNewTab}
				onTabReorder={onTabReorder}
			/>
			<TabContent tab={activeTab} />
		</div>
	);
};
