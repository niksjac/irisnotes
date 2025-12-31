import type { FC } from "react";
import { useAtom } from "jotai";
import type { Tab } from "@/types";
import { focusAreaAtom, type FocusArea } from "@/atoms";
import { TabBar, TabContent } from "@/components/tabs";

interface PaneProps {
	tabs: Tab[];
	activeTabId: string | null;
	onTabSelect: (tabId: string) => void;
	onTabClose?: (tabId: string) => void;
	onNewTab?: () => void;
	onTabReorder?: (draggedTabId: string, targetTabId: string) => void;
	onPaneClick?: () => void;
	isDualPaneMode?: boolean;
	paneIndex: 0 | 1;
}

export const Pane: FC<PaneProps> = ({
	tabs,
	activeTabId,
	onTabSelect,
	onTabClose,
	onNewTab,
	onTabReorder,
	onPaneClick,
	isDualPaneMode = false,
	paneIndex,
}) => {
	const activeTab = tabs.find((tab) => tab.id === activeTabId) || null;
	const [focusArea, setFocusArea] = useAtom(focusAreaAtom);

	// This pane's focus area identifier
	const myFocusArea: FocusArea = paneIndex === 0 ? "pane-0" : "pane-1";
	
	// This pane shows as focused when it specifically has focus
	const hasFocus = focusArea === myFocusArea;

	const handlePaneClick = () => {
		setFocusArea(myFocusArea);
		if (onPaneClick) {
			onPaneClick();
		}
	};

	return (
		<div
			className={`
				flex flex-col h-full bg-white dark:bg-gray-900 transition-all duration-200 focus:outline-none
				${isDualPaneMode && !hasFocus ? "ring-1 ring-inset ring-gray-300 dark:ring-gray-700" : ""}
			`}
			tabIndex={0}
			data-pane-index={paneIndex}
			onClick={handlePaneClick}
			onFocus={() => setFocusArea(myFocusArea)}
		>
			<TabBar
				tabs={tabs}
				activeTabId={activeTabId}
				onTabSelect={onTabSelect}
				onTabClose={onTabClose}
				onNewTab={onNewTab}
				onTabReorder={onTabReorder}
				hasFocus={hasFocus}
			/>
			<TabContent tab={activeTab} />
		</div>
	);
};
