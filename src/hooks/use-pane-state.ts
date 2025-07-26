import { useAtom } from 'jotai';
import { isDualPaneModeAtom, activePaneIdAtom } from '@/atoms';

export type PaneId = 'left' | 'right';

export const usePaneState = () => {
	const [isDualPaneMode, setIsDualPaneMode] = useAtom(isDualPaneModeAtom);
	const [activePaneId, setActivePaneId] = useAtom(activePaneIdAtom);

	return {
		isDualPaneMode,
		setIsDualPaneMode,
		activePaneId,
		setActivePaneId,
	};
};
