import { useCallback } from 'react';
import { usePaneState } from './use-pane-state';
import type { PaneId } from './use-pane-state';

export const usePaneActions = () => {
  const { isDualPaneMode, setIsDualPaneMode, setActivePaneId } = usePaneState();

  const toggleDualPaneMode = useCallback(() => {
    setIsDualPaneMode(!isDualPaneMode);
  }, [isDualPaneMode, setIsDualPaneMode]);

  const setActivePane = useCallback((paneId: PaneId) => {
    setActivePaneId(paneId);
  }, [setActivePaneId]);

  return {
    toggleDualPaneMode,
    setActivePane,
  };
};