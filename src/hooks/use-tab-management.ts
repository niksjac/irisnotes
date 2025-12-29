import { useAtom, useSetAtom } from "jotai";
import {
	paneStateAtom,
	pane0TabsAtom,
	pane1TabsAtom,
	pane0ActiveTabAtom,
	pane1ActiveTabAtom,
} from "../atoms/panes";
import type { Tab, ViewType } from "../types";
import type { FlexibleItem } from "../types/items";

/** Minimal item info needed to open a tab */
interface OpenItemParams {
	id: string;
	title: string;
	type: "note" | "book" | "section";
	targetPane?: 0 | 1; // Optional: force opening in specific pane
}

/** Maps item type to view configuration */
const getViewConfig = (
	type: OpenItemParams["type"],
): { viewType: ViewType; dataKey: string; prefix: string } => {
	switch (type) {
		case "note":
			return { viewType: "editor-rich-view", dataKey: "noteId", prefix: "note" };
		case "section":
			return { viewType: "section-view", dataKey: "sectionId", prefix: "section" };
		case "book":
			return { viewType: "book-view", dataKey: "bookId", prefix: "book" };
	}
};

/** Check if a tab contains the given item ID */
const tabContainsItem = (tab: Tab, itemId: string): boolean => {
	if (!tab.viewData) return false;
	return (
		tab.viewData.noteId === itemId ||
		tab.viewData.sectionId === itemId ||
		tab.viewData.bookId === itemId
	);
};

export const useTabManagement = () => {
	const [paneState, setPaneState] = useAtom(paneStateAtom);
	const [pane0Tabs, setPane0Tabs] = useAtom(pane0TabsAtom);
	const [pane1Tabs, setPane1Tabs] = useAtom(pane1TabsAtom);
	const setPane0ActiveTab = useSetAtom(pane0ActiveTabAtom);
	const setPane1ActiveTab = useSetAtom(pane1ActiveTabAtom);

	/** Opens any item type in the appropriate view, with tab deduplication */
	const openItemInTab = (item: OpenItemParams) => {
		const { viewType, dataKey, prefix } = getViewConfig(item.type);

		// Check for existing tab in pane 0
		const existingInPane0 = pane0Tabs.find((tab) =>
			tabContainsItem(tab, item.id),
		);
		if (existingInPane0) {
			// Focus the existing tab in pane 0
			setPaneState((prev) => ({ ...prev, activePane: 0 }));
			setPane0ActiveTab(existingInPane0.id);
			return;
		}

		// Check for existing tab in pane 1
		const existingInPane1 = pane1Tabs.find((tab) =>
			tabContainsItem(tab, item.id),
		);
		if (existingInPane1) {
			// Focus the existing tab in pane 1
			setPaneState((prev) => ({ ...prev, activePane: 1 }));
			setPane1ActiveTab(existingInPane1.id);
			return;
		}

		// No existing tab found, create new one
		const targetPane = item.targetPane ?? paneState.activePane;

		// Enable dual-pane if targeting pane 1 but only 1 pane is active
		if (targetPane === 1 && paneState.count === 1) {
			setPaneState((prev) => ({ ...prev, count: 2, activePane: 1 }));
		}

		const newTab: Tab = {
			id: `${prefix}-${item.id}-${Date.now()}`,
			title: item.title,
			viewType,
			viewData: { [dataKey]: item.id },
		};

		if (targetPane === 0) {
			setPane0Tabs((prev) => [...prev, newTab]);
			setPane0ActiveTab(newTab.id);
		} else {
			setPane1Tabs((prev) => [...prev, newTab]);
			setPane1ActiveTab(newTab.id);
		}
	};

	/** @deprecated Use openItemInTab instead */
	const openNoteInTab = (item: FlexibleItem) => {
		openItemInTab({ id: item.id, title: item.title, type: "note" });
	};

	const openTreeViewInTab = (item: FlexibleItem, items: FlexibleItem[]) => {
		const activePane = paneState.activePane;

		// Build tree view content for the container
		const buildTreeText = (
			parentId: string | null = null,
			level = 0
		): string => {
			const children = items
				.filter((child) => child.parent_id === parentId)
				.sort((a, b) => (a.sort_order < b.sort_order ? -1 : a.sort_order > b.sort_order ? 1 : 0));

			return children
				.map((child) => {
					const indent = "  ".repeat(level);
					const icon =
						child.type === "book"
							? "📖"
							: child.type === "section"
								? "📁"
								: "📄";
					let result = `${indent}${icon} ${child.title}`;

					if (child.type !== "note") {
						const subtree = buildTreeText(child.id, level + 1);
						if (subtree) {
							result += `\n${subtree}`;
						}
					}

					return result;
				})
				.join("\n");
		};

		const treeContent = buildTreeText(item.id);
		const content = `# ${item.title}\n\nTree view of contents:\n\n${treeContent}`;

		const newTab: Tab = {
			id: `tree-${item.id}-${Date.now()}`,
			title: `📂 ${item.title}`,
			viewType: "editor-source-view",
			viewData: { content: content },
		};

		if (activePane === 0) {
			setPane0Tabs((prev) => [...prev, newTab]);
			setPane0ActiveTab(newTab.id);
		} else {
			setPane1Tabs((prev) => [...prev, newTab]);
			setPane1ActiveTab(newTab.id);
		}
	};

	return {
		openItemInTab,
		openNoteInTab,
		openTreeViewInTab,
	};
};
