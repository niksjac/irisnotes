import { useCallback } from 'react';
import { useAtom } from 'jotai';
import { sidebarCollapsed, isDualPaneModeAtom, activePaneIdAtom, activityBarVisible } from '@/atoms';
import { useAppPersistence } from './use-app-persistence';

export type PaneId = 'left' | 'right';

export const useLayout = () => {
	// Sidebar state
	const [sidebarCollapsedValue, setSidebarCollapsed] = useAtom(sidebarCollapsed);

	// Pane state
	const [isDualPaneMode, setIsDualPaneMode] = useAtom(isDualPaneModeAtom);
	const [activePaneId, setActivePaneId] = useAtom(activePaneIdAtom);

	// View state
	const [activityBarVisibleValue, setActivityBarVisible] = useAtom(activityBarVisible);

	// App persistence (handled internally)
	useAppPersistence();

	// Sidebar actions
	const toggleSidebar = useCallback(() => {
		setSidebarCollapsed(!sidebarCollapsedValue);
	}, [sidebarCollapsedValue, setSidebarCollapsed]);

	// Pane actions
	const toggleDualPaneMode = useCallback(() => {
		setIsDualPaneMode(!isDualPaneMode);
	}, [isDualPaneMode, setIsDualPaneMode]);

	const setActivePane = useCallback(
		(paneId: PaneId) => {
			setActivePaneId(paneId);
		},
		[setActivePaneId]
	);

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
		panes: {
			isDualMode: isDualPaneMode,
			toggleDualMode: toggleDualPaneMode,
			activePane: activePaneId,
			setActivePane,
		},
		views: {
			toggleActivityBar,
		},
	};
};
