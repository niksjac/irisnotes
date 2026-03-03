import type { FC } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
	paneStateAtom,
	pane0TabsAtom,
	pane1TabsAtom,
	pane0ActiveTabAtom,
	pane1ActiveTabAtom,
	itemsAtom,
	focusAreaAtom,
} from "@/atoms";
import type { FocusArea } from "@/atoms";
import { Pane } from "./pane";
import { PaneResizer } from "./pane-resizer";
import { useEffect } from "react";
import type { Tab } from "@/types";
import { useTabManagement } from "@/hooks/use-tab-management";

/** Extract the item ID a tab is displaying */
const getItemIdFromTab = (tab: Tab): string | null =>
	tab.viewData?.noteId ?? tab.viewData?.sectionId ?? tab.viewData?.bookId ?? null;

export const PaneContainer: FC = () => {
	const [paneState, setPaneState] = useAtom(paneStateAtom);
	const [pane0Tabs, setPane0Tabs] = useAtom(pane0TabsAtom);
	const [pane1Tabs, setPane1Tabs] = useAtom(pane1TabsAtom);
	const [pane0ActiveTab, setPane0ActiveTab] = useAtom(pane0ActiveTabAtom);
	const [pane1ActiveTab, setPane1ActiveTab] = useAtom(pane1ActiveTabAtom);
	const { openItemInTab } = useTabManagement();
	const setFocusArea = useSetAtom(focusAreaAtom);

	// Keep tab titles in sync when items are renamed
	const items = useAtomValue(itemsAtom);

	useEffect(() => {
		if (items.length === 0) return;

		const syncTitles = (prev: Tab[]): Tab[] => {
			let changed = false;
			const updated = prev.map((tab) => {
				const itemId = getItemIdFromTab(tab);
				if (!itemId) return tab;
				const item = items.find((i) => i.id === itemId);
				if (item && item.title !== tab.title) {
					changed = true;
					return { ...tab, title: item.title };
				}
				return tab;
			});
			return changed ? updated : prev;
		};

		setPane0Tabs(syncTitles);
		setPane1Tabs(syncTitles);
	}, [items, setPane0Tabs, setPane1Tabs]);

	// Force single pane mode on mobile
	useEffect(() => {
		const handleResize = () => {
			const isMobile = window.innerWidth < 768; // md breakpoint
			if (isMobile && paneState.count === 2) {
				// Merge all tabs from pane1 to pane0 when switching to mobile
				if (pane1Tabs.length > 0) {
					setPane0Tabs((prev) => [...prev, ...pane1Tabs]);
					setPane1Tabs([]);
					// If pane1 had an active tab, make it active in pane0
					if (pane1ActiveTab) {
						setPane0ActiveTab(pane1ActiveTab);
						setPane1ActiveTab(null);
					}
				}
				setPaneState((prev) => ({ ...prev, count: 1, activePane: 0 }));
			}
		};

		// Check on mount
		handleResize();

		// Check on window resize
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [
		paneState.count,
		pane1Tabs,
		pane1ActiveTab,
		setPaneState,
		setPane0Tabs,
		setPane1Tabs,
		setPane0ActiveTab,
		setPane1ActiveTab,
	]);

	// No default tabs - start with empty panes

	// Set initial CSS custom properties for pane widths
	useEffect(() => {
		document.documentElement.style.setProperty("--pane-left-width", "50%");
		document.documentElement.style.setProperty("--pane-right-width", "50%");
	}, []);

	const handleTabSelect = (paneIndex: 0 | 1, tabId: string) => {
		if (paneIndex === 0) {
			setPane0ActiveTab(tabId);
		} else {
			setPane1ActiveTab(tabId);
		}

		// Set active pane
		setPaneState((prev) => ({ ...prev, activePane: paneIndex }));
	};

	const handleTabClose = (paneIndex: 0 | 1, tabId: string) => {
		const tabs = paneIndex === 0 ? pane0Tabs : pane1Tabs;
		const setTabs = paneIndex === 0 ? setPane0Tabs : setPane1Tabs;
		const activeTabId = paneIndex === 0 ? pane0ActiveTab : pane1ActiveTab;
		const setActiveTab =
			paneIndex === 0 ? setPane0ActiveTab : setPane1ActiveTab;

		// Find the index of the tab being closed
		const closingTabIndex = tabs.findIndex((tab) => tab.id === tabId);
		const newTabs = tabs.filter((tab) => tab.id !== tabId);
		setTabs(newTabs);

		// If we closed the active tab, select the next appropriate tab
		if (activeTabId === tabId && newTabs.length > 0) {
			// If there's a tab after the closed one, select it
			// Otherwise, select the previous tab (or the last one if closing the last tab)
			const nextTabIndex = Math.min(closingTabIndex, newTabs.length - 1);
			setActiveTab(newTabs[nextTabIndex]?.id || null);
		} else if (newTabs.length === 0) {
			setActiveTab(null);
		}
	};

	const handlePaneClick = (paneIndex: 0 | 1) => {
		setPaneState((prev) => ({ ...prev, activePane: paneIndex }));
	};

	const handleTabReorder = (
		paneIndex: 0 | 1,
		draggedTabId: string,
		targetTabId: string
	) => {
		const tabs = paneIndex === 0 ? pane0Tabs : pane1Tabs;
		const setTabs = paneIndex === 0 ? setPane0Tabs : setPane1Tabs;

		const draggedIndex = tabs.findIndex((tab) => tab.id === draggedTabId);
		const targetIndex = tabs.findIndex((tab) => tab.id === targetTabId);

		if (draggedIndex === -1 || targetIndex === -1) return;

		// Create new array with reordered tabs
		const newTabs = [...tabs];
		const [draggedTab] = newTabs.splice(draggedIndex, 1);
		if (draggedTab) {
			newTabs.splice(targetIndex, 0, draggedTab);
		}

		setTabs(newTabs);
	};

	const handleCrossPaneDrop = (
		targetPaneIndex: 0 | 1,
		draggedTabId: string,
		sourcePaneIndex: number,
		targetTabId?: string
	) => {
		const srcPane = sourcePaneIndex as 0 | 1;
		const srcTabs = srcPane === 0 ? pane0Tabs : pane1Tabs;
		const setSrcTabs = srcPane === 0 ? setPane0Tabs : setPane1Tabs;
		const srcActiveTab = srcPane === 0 ? pane0ActiveTab : pane1ActiveTab;
		const setSrcActiveTab = srcPane === 0 ? setPane0ActiveTab : setPane1ActiveTab;
		const dstTabs = targetPaneIndex === 0 ? pane0Tabs : pane1Tabs;
		const setDstTabs = targetPaneIndex === 0 ? setPane0Tabs : setPane1Tabs;
		const setDstActiveTab = targetPaneIndex === 0 ? setPane0ActiveTab : setPane1ActiveTab;

		const tab = srcTabs.find((t) => t.id === draggedTabId);
		if (!tab) return;

		// Remove from source pane
		const remainingSrc = srcTabs.filter((t) => t.id !== draggedTabId);
		setSrcTabs(remainingSrc);

		// Fix source pane active tab if needed
		if (srcActiveTab === draggedTabId) {
			const oldIdx = srcTabs.findIndex((t) => t.id === draggedTabId);
			const nextIdx = Math.min(oldIdx, remainingSrc.length - 1);
			setSrcActiveTab(remainingSrc[nextIdx]?.id ?? null);
		}

		// Insert into destination pane
		if (targetTabId) {
			const targetIdx = dstTabs.findIndex((t) => t.id === targetTabId);
			if (targetIdx >= 0) {
				const newDst = [...dstTabs];
				newDst.splice(targetIdx, 0, tab);
				setDstTabs(newDst);
			} else {
				setDstTabs([...dstTabs, tab]);
			}
		} else {
			setDstTabs([...dstTabs, tab]);
		}

		// Make the moved tab active in the destination pane and focus it
		setDstActiveTab(tab.id);
		setPaneState((prev) => ({ ...prev, activePane: targetPaneIndex }));
		setFocusArea(`pane-${targetPaneIndex}` as FocusArea);
	};

	const handleTreeItemDrop = (
		targetPaneIndex: 0 | 1,
		item: { id: string; type: string; title: string },
	) => {
		openItemInTab({
			id: item.id,
			title: item.title,
			type: item.type as "note" | "book" | "section",
			targetPane: targetPaneIndex,
		});
	};

	// No automatic tab creation when switching to dual pane mode

	if (paneState.count === 1) {
		return (
			<Pane
				paneIndex={0}
				tabs={pane0Tabs}
				activeTabId={pane0ActiveTab}
				onTabSelect={(tabId) => handleTabSelect(0, tabId)}
				onTabClose={(tabId) => handleTabClose(0, tabId)}
				onTabReorder={(draggedTabId, targetTabId) =>
					handleTabReorder(0, draggedTabId, targetTabId)
				}
				onCrossPaneDrop={(draggedTabId, sourcePaneIndex, targetTabId) =>
					handleCrossPaneDrop(0, draggedTabId, sourcePaneIndex, targetTabId)
				}
				onTreeItemDrop={(item) => handleTreeItemDrop(0, item)}
				onPaneClick={() => handlePaneClick(0)}
				isDualPaneMode={false}
			/>
		);
	}

	return (
		<div className="flex flex-1 overflow-hidden pane-container">
			<div
				className="flex-shrink-0 overflow-hidden"
				style={{ width: "var(--pane-left-width, 50%)" }}
			>
				<Pane
					paneIndex={0}
					tabs={pane0Tabs}
					activeTabId={pane0ActiveTab}
					onTabSelect={(tabId) => handleTabSelect(0, tabId)}
					onTabClose={(tabId) => handleTabClose(0, tabId)}
					onTabReorder={(draggedTabId, targetTabId) =>
						handleTabReorder(0, draggedTabId, targetTabId)
					}
					onCrossPaneDrop={(draggedTabId, sourcePaneIndex, targetTabId) =>
						handleCrossPaneDrop(0, draggedTabId, sourcePaneIndex, targetTabId)
					}
					onTreeItemDrop={(item) => handleTreeItemDrop(0, item)}
					onPaneClick={() => handlePaneClick(0)}
					isDualPaneMode={true}
				/>
			</div>

			<PaneResizer />

			<div
				className="flex-1 overflow-hidden"
				style={{ width: "var(--pane-right-width, 50%)" }}
			>
				<Pane
					paneIndex={1}
					tabs={pane1Tabs}
					activeTabId={pane1ActiveTab}
					onTabSelect={(tabId) => handleTabSelect(1, tabId)}
					onTabClose={(tabId) => handleTabClose(1, tabId)}
					onTabReorder={(draggedTabId, targetTabId) =>
						handleTabReorder(1, draggedTabId, targetTabId)
					}
					onCrossPaneDrop={(draggedTabId, sourcePaneIndex, targetTabId) =>
						handleCrossPaneDrop(1, draggedTabId, sourcePaneIndex, targetTabId)
					}
					onTreeItemDrop={(item) => handleTreeItemDrop(1, item)}
					onPaneClick={() => handlePaneClick(1)}
					isDualPaneMode={true}
				/>
			</div>
		</div>
	);
};
