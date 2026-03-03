import type { FC } from "react";
import { useAtom, useAtomValue } from "jotai";
import type { Tab } from "@/types";
import { focusAreaAtom, type FocusArea, tabBarVisibleAtom } from "@/atoms";
import { TabBar, TabContent } from "@/components/tabs";

interface PaneProps {
	tabs: Tab[];
	activeTabId: string | null;
	onTabSelect: (tabId: string) => void;
	onTabClose?: (tabId: string) => void;
	onTabReorder?: (draggedTabId: string, targetTabId: string) => void;
	onCrossPaneDrop?: (draggedTabId: string, sourcePaneIndex: number, targetTabId?: string) => void;
	onTreeItemDrop?: (item: { id: string; type: string; title: string }) => void;
	onPaneClick?: () => void;
	isDualPaneMode?: boolean;
	paneIndex: 0 | 1;
}

export const Pane: FC<PaneProps> = ({
	tabs,
	activeTabId,
	onTabSelect,
	onTabClose,
	onTabReorder,
	onCrossPaneDrop,
	onTreeItemDrop,
	onPaneClick,
	isDualPaneMode = false,
	paneIndex,
}) => {
	const activeTab = tabs.find((tab) => tab.id === activeTabId) || null;
	const [focusArea, setFocusArea] = useAtom(focusAreaAtom);
	const tabBarVisible = useAtomValue(tabBarVisibleAtom);

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

	const handleDragOver = (e: React.DragEvent) => {
		// Accept tree item drops on the pane content area
		if (e.dataTransfer.types.includes("application/x-tree-item")) {
			e.preventDefault();
			e.dataTransfer.dropEffect = "copy";
		}
	};

	const handleDrop = (e: React.DragEvent) => {
		const treeItemData = e.dataTransfer.getData("application/x-tree-item");
		if (treeItemData && onTreeItemDrop) {
			e.preventDefault();
			e.stopPropagation();
			try {
				const item = JSON.parse(treeItemData);
				if (item.id) {
					onTreeItemDrop(item);
				}
			} catch {
				// Not valid JSON, ignore
			}
		}
	};

	return (
		<div
			className={`
				flex flex-col h-full bg-white dark:bg-gray-900 transition-all duration-200
				${isDualPaneMode && !hasFocus ? "ring-1 ring-inset ring-gray-300 dark:ring-gray-700" : ""}
			`}
			data-pane-index={paneIndex}
			onClick={handlePaneClick}
			onFocusCapture={() => setFocusArea(myFocusArea)}
			onDragOver={handleDragOver}
			onDrop={handleDrop}
		>
			{tabBarVisible && (
				<TabBar
					tabs={tabs}
					activeTabId={activeTabId}
					onTabSelect={onTabSelect}
					onTabClose={onTabClose}
					onTabReorder={onTabReorder}
					onCrossPaneDrop={onCrossPaneDrop}
					hasFocus={hasFocus}
					paneIndex={paneIndex}
				/>
			)}
			<TabContent tab={activeTab} />
		</div>
	);
};
