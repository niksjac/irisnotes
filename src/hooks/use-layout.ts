import { useCallback } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import {
	sidebarCollapsed,
	isDualPaneModeAtom,
	activePaneIdAtom,
	activityBarVisible,
	leftPaneNoteAtom,
	rightPaneNoteAtom,
	selectedNoteAtom,
} from '@/atoms';
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

	// Pane note state
	const [selectedNote] = useAtom(selectedNoteAtom);
	const setLeftPaneNote = useSetAtom(leftPaneNoteAtom);
	const setRightPaneNote = useSetAtom(rightPaneNoteAtom);

	// App persistence (handled internally)
	useAppPersistence();

	// Sidebar actions
	const toggleSidebar = useCallback(() => {
		setSidebarCollapsed(!sidebarCollapsedValue);
	}, [sidebarCollapsedValue, setSidebarCollapsed]);

	// Pane actions
	const toggleDualPaneMode = useCallback(() => {
		const newDualMode = !isDualPaneMode;
		setIsDualPaneMode(newDualMode);

		if (newDualMode) {
			// When enabling dual mode, put current note in left pane and leave right empty
			setLeftPaneNote(selectedNote);
			setRightPaneNote(null);
			// Set left pane as active by default
			setActivePaneId('left');
		} else {
			// When disabling dual mode, clear pane notes
			setLeftPaneNote(null);
			setRightPaneNote(null);
			setActivePaneId(null);
		}
	}, [isDualPaneMode, setIsDualPaneMode, selectedNote, setLeftPaneNote, setRightPaneNote, setActivePaneId]);

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
