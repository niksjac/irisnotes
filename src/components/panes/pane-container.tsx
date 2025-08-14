import type { FC } from "react";
import { useAtom, useAtomValue } from "jotai";
import {
	paneStateAtom,
	pane0TabsAtom,
	pane1TabsAtom,
	pane0ActiveTabAtom,
	pane1ActiveTabAtom,
	currentViewAtom
} from "@/atoms";
import type { Tab } from "@/types";
import { Pane } from "./pane";
import { PaneResizer } from "./pane-resizer";
import { useEffect } from "react";

export const PaneContainer: FC = () => {
	const [paneState, setPaneState] = useAtom(paneStateAtom);
	const [pane0Tabs, setPane0Tabs] = useAtom(pane0TabsAtom);
	const [pane1Tabs, setPane1Tabs] = useAtom(pane1TabsAtom);
	const [pane0ActiveTab, setPane0ActiveTab] = useAtom(pane0ActiveTabAtom);
	const [pane1ActiveTab, setPane1ActiveTab] = useAtom(pane1ActiveTabAtom);
	const currentView = useAtomValue(currentViewAtom);

	// Initialize with a default tab if none exist
	useEffect(() => {
		if (pane0Tabs.length === 0) {
			const defaultTab: Tab = {
				id: 'default-welcome',
				title: 'Welcome',
				viewType: currentView,
				canClose: false,
			};
			setPane0Tabs([defaultTab]);
			setPane0ActiveTab(defaultTab.id);
		}
	}, [pane0Tabs.length, setPane0Tabs, setPane0ActiveTab, currentView]);

	// Set initial CSS custom properties for pane widths
	useEffect(() => {
		document.documentElement.style.setProperty('--pane-left-width', '50%');
		document.documentElement.style.setProperty('--pane-right-width', '50%');
	}, []);

	const handleTabSelect = (paneIndex: 0 | 1, tabId: string) => {
		if (paneIndex === 0) {
			setPane0ActiveTab(tabId);
		} else {
			setPane1ActiveTab(tabId);
		}

		// Set active pane
		setPaneState(prev => ({ ...prev, activePane: paneIndex }));
	};

	const handleTabClose = (paneIndex: 0 | 1, tabId: string) => {
		const tabs = paneIndex === 0 ? pane0Tabs : pane1Tabs;
		const setTabs = paneIndex === 0 ? setPane0Tabs : setPane1Tabs;
		const activeTabId = paneIndex === 0 ? pane0ActiveTab : pane1ActiveTab;
		const setActiveTab = paneIndex === 0 ? setPane0ActiveTab : setPane1ActiveTab;

		const newTabs = tabs.filter(tab => tab.id !== tabId);
		setTabs(newTabs);

		// If we closed the active tab, select another one
		if (activeTabId === tabId && newTabs.length > 0) {
			setActiveTab(newTabs[0]?.id || null);
		} else if (newTabs.length === 0) {
			setActiveTab(null);
		}
	};

	const handleNewTab = (paneIndex: 0 | 1) => {
		const newTab: Tab = {
			id: `tab-${Date.now()}`,
			title: 'New Tab',
			viewType: 'welcome-view',
			canClose: true,
		};

		if (paneIndex === 0) {
			setPane0Tabs(prev => [...prev, newTab]);
			setPane0ActiveTab(newTab.id);
		} else {
			setPane1Tabs(prev => [...prev, newTab]);
			setPane1ActiveTab(newTab.id);
		}

		// Set active pane
		setPaneState(prev => ({ ...prev, activePane: paneIndex }));
	};

	const handlePaneClick = (paneIndex: 0 | 1) => {
		setPaneState(prev => ({ ...prev, activePane: paneIndex }));
	};

	const handleSplitPane = () => {
		if (paneState.count === 1) {
			// Create a duplicate of the current active tab in the new pane
			const activeTab = pane0Tabs.find(tab => tab.id === pane0ActiveTab);
			if (activeTab) {
				const newTab: Tab = {
					...activeTab,
					id: `${activeTab.id}-split`,
					title: `${activeTab.title} (Split)`,
				};
				setPane1Tabs([newTab]);
				setPane1ActiveTab(newTab.id);
			}
			setPaneState(prev => ({ ...prev, count: 2, activePane: 1 }));
		}
	};

	if (paneState.count === 1) {
		return (
			<div className="flex flex-col h-full">
				{/* Single pane toolbar */}
				<div className="flex items-center justify-between px-2 py-1 bg-gray-100 border-b border-gray-200">
					<div className="text-xs text-gray-600">Single Pane Mode</div>
					<button
						onClick={handleSplitPane}
						className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
					>
						Split Pane
					</button>
				</div>

				<Pane
					tabs={pane0Tabs}
					activeTabId={pane0ActiveTab}
					onTabSelect={(tabId) => handleTabSelect(0, tabId)}
					onTabClose={(tabId) => handleTabClose(0, tabId)}
					onNewTab={() => handleNewTab(0)}
					isActive={paneState.activePane === 0}
					onPaneClick={() => handlePaneClick(0)}
				/>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full">
			{/* Two pane toolbar */}
			<div className="flex items-center justify-between px-2 py-1 bg-gray-100 border-b border-gray-200">
				<div className="text-xs text-gray-600">
					Two Pane Mode - Active: Pane {paneState.activePane + 1}
				</div>
				<button
					onClick={() => setPaneState(prev => ({ ...prev, count: 1 }))}
					className="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
				>
					Single Pane
				</button>
			</div>

			{/* Pane container */}
			<div className="flex flex-1 overflow-hidden pane-container">
				<div
					className="flex-shrink-0 overflow-hidden"
					style={{ width: 'var(--pane-left-width, 50%)' }}
				>
					<Pane
						tabs={pane0Tabs}
						activeTabId={pane0ActiveTab}
						onTabSelect={(tabId) => handleTabSelect(0, tabId)}
						onTabClose={(tabId) => handleTabClose(0, tabId)}
						onNewTab={() => handleNewTab(0)}
						isActive={paneState.activePane === 0}
						onPaneClick={() => handlePaneClick(0)}
					/>
				</div>

				<PaneResizer />

				<div
					className="flex-1 overflow-hidden"
					style={{ width: 'var(--pane-right-width, 50%)' }}
				>
					<Pane
						tabs={pane1Tabs}
						activeTabId={pane1ActiveTab}
						onTabSelect={(tabId) => handleTabSelect(1, tabId)}
						onTabClose={(tabId) => handleTabClose(1, tabId)}
						onNewTab={() => handleNewTab(1)}
						isActive={paneState.activePane === 1}
						onPaneClick={() => handlePaneClick(1)}
					/>
				</div>
			</div>
		</div>
	);
};
