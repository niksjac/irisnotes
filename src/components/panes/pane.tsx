import type { FC } from "react";
import { useAtom } from "jotai";
import type { Tab } from "@/types";
import { focusAreaAtom } from "@/atoms";
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
	isDualPaneMode = false,
}) => {
	const activeTab = tabs.find((tab) => tab.id === activeTabId) || null;
	const [focusArea, setFocusArea] = useAtom(focusAreaAtom);

	// Pane shows as focused when: it's the active pane AND focus is on panes (not tree)
	const showFocused = isActive && focusArea === "pane";

	const handlePaneClick = () => {
		setFocusArea("pane");
		if (onPaneClick) {
			onPaneClick();
		}
	};

	return (
		<div
			className={`
				flex flex-col h-full bg-white dark:bg-gray-900 transition-all duration-200
				${isDualPaneMode && showFocused ? "ring-2 ring-blue-500 ring-inset" : ""}
				${isDualPaneMode && isActive && !showFocused ? "border-2 border-blue-400/50 dark:border-blue-500/50" : ""}
				${isDualPaneMode && !isActive ? "border border-gray-200 dark:border-gray-700" : ""}
			`}
			onClick={handlePaneClick}
			onFocus={() => setFocusArea("pane")}
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
