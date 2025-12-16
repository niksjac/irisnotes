import { useCallback, useEffect, useRef } from "react";
import { useAtom, useSetAtom } from "jotai";
import { sidebarCollapsed, activityBarVisible, sidebarWidth } from "@/atoms";
import { useAppPersistence } from "./use-app-persistence";
import { useLayoutPersistence, loadLayoutState } from "./use-layout-persistence";

export const useLayout = () => {
	// Sidebar state
	const [sidebarCollapsedValue, setSidebarCollapsed] = useAtom(sidebarCollapsed);
	const setSidebarWidth = useSetAtom(sidebarWidth);

	// View state
	const [activityBarVisibleValue, setActivityBarVisible] = useAtom(activityBarVisible);

	// Track if we've already loaded from localStorage to prevent loops
	const hasLoadedFromStorage = useRef(false);

	// Initialize layout from localStorage ONCE on mount
	useEffect(() => {
		if (!hasLoadedFromStorage.current) {
			const savedLayout = loadLayoutState();
			setSidebarWidth(savedLayout.sidebarWidth);
			setActivityBarVisible(savedLayout.activityBarVisible);
			setSidebarCollapsed(savedLayout.sidebarCollapsed);
			hasLoadedFromStorage.current = true;
		}
	}, []); // Empty deps - only run once on mount

	// Auto-save layout changes to localStorage (with debouncing)
	useLayoutPersistence();

	// App persistence for editor settings (handled internally)
	useAppPersistence();

	// Sidebar actions
	const toggleSidebar = useCallback(() => {
		setSidebarCollapsed(!sidebarCollapsedValue);
	}, [sidebarCollapsedValue, setSidebarCollapsed]);

	// View actions
	const toggleActivityBar = useCallback(() => {
		setActivityBarVisible(!activityBarVisibleValue);
	}, [activityBarVisibleValue, setActivityBarVisible]);

	return {
		sidebar: {
			collapsed: sidebarCollapsedValue,
			toggle: toggleSidebar,
			setCollapsed: setSidebarCollapsed,
		},
		views: {
			toggleActivityBar,
		},
	};
};
