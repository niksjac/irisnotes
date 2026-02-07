import { useCallback } from "react";
import { useAtom } from "jotai";
import { sidebarCollapsed, activityBarVisible } from "@/atoms";
import { useAppPersistence } from "./use-app-persistence";
import { useLayoutPersistence } from "./use-layout-persistence";

export const useLayout = () => {
	// Sidebar state (atoms are initialized from localStorage at definition time)
	const [sidebarCollapsedValue, setSidebarCollapsed] =
		useAtom(sidebarCollapsed);

	// View state
	const [activityBarVisibleValue, setActivityBarVisible] =
		useAtom(activityBarVisible);

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
