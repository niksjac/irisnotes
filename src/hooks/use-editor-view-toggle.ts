import { useAtom } from "jotai";
import {
	paneStateAtom,
	pane0TabsAtom,
	pane1TabsAtom,
	pane0ActiveTabAtom,
	pane1ActiveTabAtom,
} from "@/atoms/panes";
import { useCallback } from "react";

// Store for getting cursor position from editors before they unmount
export const editorCursorPositionStore = {
	position: undefined as number | undefined,
	setPosition(pos: number | undefined) {
		this.position = pos;
	},
	getPosition() {
		return this.position;
	},
};

export const useEditorViewToggle = () => {
	const [paneState] = useAtom(paneStateAtom);
	const [pane0Tabs, setPane0Tabs] = useAtom(pane0TabsAtom);
	const [pane1Tabs, setPane1Tabs] = useAtom(pane1TabsAtom);
	const [pane0ActiveTab] = useAtom(pane0ActiveTabAtom);
	const [pane1ActiveTab] = useAtom(pane1ActiveTabAtom);

	const toggleEditorView = useCallback(() => {
		const activePane = paneState.activePane;
		const tabs = activePane === 0 ? pane0Tabs : pane1Tabs;
		const activeTabId = activePane === 0 ? pane0ActiveTab : pane1ActiveTab;
		const setTabs = activePane === 0 ? setPane0Tabs : setPane1Tabs;

		const activeTab = tabs.find((tab) => tab.id === activeTabId);

		if (!activeTab) return;

		// Only toggle for editor views
		if (
			activeTab.viewType !== "editor-rich-view" &&
			activeTab.viewType !== "editor-source-view"
		) {
			return;
		}

		// Get cursor position from the store (will be set by editor before unmount)
		const cursorPos = editorCursorPositionStore.getPosition();

		// Toggle between rich and source
		const newViewType =
			activeTab.viewType === "editor-rich-view"
				? "editor-source-view"
				: "editor-rich-view";

		const newEditorMode: "source" | "rich" =
			activeTab.viewType === "editor-rich-view" ? "source" : "rich";

		// Update the tab with new view type and store cursor position in viewData
		const updatedTabs = tabs.map((tab) =>
			tab.id === activeTabId
				? {
						...tab,
						viewType: newViewType as typeof tab.viewType,
						editorMode: newEditorMode,
						viewData: {
							...tab.viewData,
							cursorPosition: cursorPos,
						},
					}
				: tab
		);

		setTabs(updatedTabs);
	}, [
		paneState.activePane,
		pane0Tabs,
		pane1Tabs,
		pane0ActiveTab,
		pane1ActiveTab,
		setPane0Tabs,
		setPane1Tabs,
	]);

	return {
		toggleEditorView,
	};
};
