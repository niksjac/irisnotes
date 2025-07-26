import { useMemo } from 'react';
import { useViewState, usePaneState } from './index';

export type AppRoute =
	| { type: 'config' }
	| { type: 'hotkeys' }
	| { type: 'folder'; folderId: string }
	| { type: 'dual-pane' }
	| { type: 'single-pane' };

interface UseAppRoutingOptions {
	selectedFolderId?: string | null | undefined;
}

export function useAppRouting(options: UseAppRoutingOptions = {}) {
	const { configViewActive, hotkeysViewActive } = useViewState();
	const { isDualPaneMode } = usePaneState();
	const { selectedFolderId } = options;

	const currentRoute: AppRoute = useMemo(() => {
		if (configViewActive) {
			return { type: 'config' };
		}

		if (hotkeysViewActive) {
			return { type: 'hotkeys' };
		}

		if (selectedFolderId) {
			return { type: 'folder', folderId: selectedFolderId };
		}

		if (isDualPaneMode) {
			return { type: 'dual-pane' };
		}

		return { type: 'single-pane' };
	}, [configViewActive, hotkeysViewActive, selectedFolderId, isDualPaneMode]);

	return { currentRoute };
}
