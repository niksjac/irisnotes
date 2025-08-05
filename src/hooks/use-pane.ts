import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { activePaneIdAtom, isDualPaneModeAtom } from '@/atoms';

export type PaneId = 'left' | 'right';

export const usePane = () => {
	const [isDualPaneMode, setIsDualPaneMode] = useAtom(isDualPaneModeAtom);
	const [activePaneId, setActivePaneId] = useAtom(activePaneIdAtom);

	const toggleDualPaneMode = useCallback(() => {
		setIsDualPaneMode(!isDualPaneMode);
	}, [isDualPaneMode, setIsDualPaneMode]);

	const setActivePane = useCallback(
		(paneId: PaneId) => {
			setActivePaneId(paneId);
		},
		[setActivePaneId]
	);

	return {
		// State
		isDualPaneMode,
		setIsDualPaneMode,
		activePaneId,
		setActivePaneId,
		// Actions
		toggleDualPaneMode,
		setActivePane,
	};
};
