import { useAtomValue } from "jotai";
import { useEffect, useRef } from "react";
import { sidebarWidth, activityBarVisible, sidebarCollapsed } from "@/atoms";

interface LayoutState {
	sidebarWidth: number;
	activityBarVisible: boolean;
	sidebarCollapsed: boolean;
}

const LAYOUT_STORAGE_KEY = "irisnotes-layout-state";
const DEFAULT_LAYOUT: LayoutState = {
	sidebarWidth: 300,
	activityBarVisible: true,
	sidebarCollapsed: false,
};

/**
 * Saves layout state to localStorage
 */
const saveLayoutState = (state: Partial<LayoutState>) => {
	try {
		const current = loadLayoutState();
		const updated = { ...current, ...state };
		localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(updated));
	} catch (error) {
		console.warn("Failed to save layout state:", error);
	}
};

/**
 * Loads layout state from localStorage
 */
export const loadLayoutState = (): LayoutState => {
	try {
		const stored = localStorage.getItem(LAYOUT_STORAGE_KEY);
		if (stored) {
			return { ...DEFAULT_LAYOUT, ...JSON.parse(stored) };
		}
	} catch (error) {
		console.warn("Failed to load layout state:", error);
	}
	return DEFAULT_LAYOUT;
};

/**
 * Hook to persist layout state to localStorage with debouncing
 * - Sidebar width: debounced (500ms after last change)
 * - Activity bar & collapsed: immediate save
 */
export const useLayoutPersistence = () => {
	const sidebarWidthValue = useAtomValue(sidebarWidth);
	const activityBarVisibleValue = useAtomValue(activityBarVisible);
	const sidebarCollapsedValue = useAtomValue(sidebarCollapsed);

	const debounceTimerRef = useRef<number | null>(null);
	const previousWidthRef = useRef<number>(sidebarWidthValue);

	// Debounced save for sidebar width (during drag operations)
	useEffect(() => {
		// Skip if width hasn't changed
		if (previousWidthRef.current === sidebarWidthValue) return;

		previousWidthRef.current = sidebarWidthValue;

		// Clear existing timer
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}

		// Set new timer to save after 500ms of no changes
		debounceTimerRef.current = setTimeout(() => {
			saveLayoutState({ sidebarWidth: sidebarWidthValue });
		}, 500);

		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}
		};
	}, [sidebarWidthValue]);

	// Immediate save for activity bar visibility
	useEffect(() => {
		saveLayoutState({ activityBarVisible: activityBarVisibleValue });
	}, [activityBarVisibleValue]);

	// Immediate save for sidebar collapsed state
	useEffect(() => {
		saveLayoutState({ sidebarCollapsed: sidebarCollapsedValue });
	}, [sidebarCollapsedValue]);
};
