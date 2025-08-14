import type { FC } from "react";
import type { Tab } from "@/types";
import { TabBar, TabContent } from "@/components/tabs";

interface PaneProps {
	tabs: Tab[];
	activeTabId: string | null;
	onTabSelect: (tabId: string) => void;
	onTabClose?: (tabId: string) => void;
	onNewTab?: () => void;
	isActive?: boolean;
	onPaneClick?: () => void;
}

export const Pane: FC<PaneProps> = ({
	tabs,
	activeTabId,
	onTabSelect,
	onTabClose,
	onNewTab,
	isActive = false,
	onPaneClick
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
				flex flex-col h-full
				${isActive ? 'ring-2 ring-blue-500 ring-inset' : ''}
			`}
			onClick={handlePaneClick}
		>
			<TabBar
				tabs={tabs}
				activeTabId={activeTabId}
				onTabSelect={onTabSelect}
				onTabClose={onTabClose}
				onNewTab={onNewTab}
			/>
			<TabContent tab={activeTab} />
		</div>
	);
};
