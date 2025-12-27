import { useAtomValue } from "jotai";
import { useEffect, useRef } from "react";
import {
	pane0TabsAtom,
	pane1TabsAtom,
	pane0ActiveTabAtom,
	pane1ActiveTabAtom,
	paneStateAtom,
} from "@/atoms/panes";
import type { Tab } from "@/types";
import { editorCursorPositionStore } from "./use-editor-view-toggle";

interface TabState {
	pane0Tabs: Tab[];
	pane1Tabs: Tab[];
	pane0ActiveTab: string | null;
	pane1ActiveTab: string | null;
}

const TAB_STORAGE_KEY = "irisnotes-tab-state";

/**
 * Loads tab state from localStorage
 */
export const loadTabState = (): TabState | null => {
	try {
		const stored = localStorage.getItem(TAB_STORAGE_KEY);
		if (stored) {
			return JSON.parse(stored);
		}
	} catch (error) {
		console.warn("Failed to load tab state:", error);
	}
	return null;
};

/**
 * Saves tab state to localStorage
 */
const saveTabState = (state: TabState) => {
	try {
		localStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(state));
	} catch (error) {
		console.warn("Failed to save tab state:", error);
	}
};

/**
 * Hook to persist tab state to localStorage with debouncing
 */
export const useTabPersistence = () => {
	const pane0Tabs = useAtomValue(pane0TabsAtom);
	const pane1Tabs = useAtomValue(pane1TabsAtom);
	const pane0ActiveTab = useAtomValue(pane0ActiveTabAtom);
	const pane1ActiveTab = useAtomValue(pane1ActiveTabAtom);
	const paneState = useAtomValue(paneStateAtom);

	const debounceTimerRef = useRef<number | null>(null);

	// Debounced save for tab state (500ms after last change)
	useEffect(() => {
		// Clear existing timer
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}

		// Set new timer to save after 500ms of no changes
		debounceTimerRef.current = setTimeout(() => {
			saveTabState({
				pane0Tabs,
				pane1Tabs,
				pane0ActiveTab,
				pane1ActiveTab,
			});
		}, 500);

		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}
		};
	}, [pane0Tabs, pane1Tabs, pane0ActiveTab, pane1ActiveTab]);

	// Save immediately on beforeunload (F5 refresh, close tab, etc.)
	useEffect(() => {
		const handleBeforeUnload = () => {
			const cursorPos = editorCursorPositionStore.getPosition();
			const activePane = paneState.activePane;
			const activeTabId = activePane === 0 ? pane0ActiveTab : pane1ActiveTab;

			// Build updated tabs with current cursor position
			let updatedPane0Tabs = pane0Tabs;
			let updatedPane1Tabs = pane1Tabs;

			if (cursorPos !== undefined && activeTabId) {
				if (activePane === 0) {
					updatedPane0Tabs = pane0Tabs.map((tab) =>
						tab.id === activeTabId
							? {
									...tab,
									viewData: { ...tab.viewData, cursorPosition: cursorPos },
								}
							: tab
					);
				} else {
					updatedPane1Tabs = pane1Tabs.map((tab) =>
						tab.id === activeTabId
							? {
									...tab,
									viewData: { ...tab.viewData, cursorPosition: cursorPos },
								}
							: tab
					);
				}
			}

			// Save immediately with updated cursor position
			saveTabState({
				pane0Tabs: updatedPane0Tabs,
				pane1Tabs: updatedPane1Tabs,
				pane0ActiveTab,
				pane1ActiveTab,
			});
		};

		window.addEventListener("beforeunload", handleBeforeUnload);

		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, [
		pane0Tabs,
		pane1Tabs,
		pane0ActiveTab,
		pane1ActiveTab,
		paneState.activePane,
	]);
};
