import { useCallback } from "react";
import { useAtom } from "jotai";
import { sidebarCollapsed, activityBarVisible } from "@/atoms";
import { useAppPersistence } from "./use-app-persistence";

export const useLayout = () => {
	// Sidebar state
	const [sidebarCollapsedValue, setSidebarCollapsed] = useAtom(sidebarCollapsed);

	// View state
	const [activityBarVisibleValue, setActivityBarVisible] = useAtom(activityBarVisible);

	// App persistence (handled internally)
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
