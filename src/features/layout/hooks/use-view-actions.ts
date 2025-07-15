import { useCallback } from 'react';
import { useViewState } from './use-view-state';

export const useViewActions = () => {
  const {
    configViewActive,
    setConfigViewActive,
    hotkeysViewActive,
    setHotkeysViewActive,
    databaseStatusVisible,
    setDatabaseStatusVisible,
    activityBarVisible,
    setActivityBarVisible
  } = useViewState();

  const toggleConfigView = useCallback(() => {
    const newState = !configViewActive;
    setConfigViewActive(newState);
    if (newState) {
      // Deactivate other views when activating config
      setHotkeysViewActive(false);
    }
  }, [configViewActive, setConfigViewActive, setHotkeysViewActive]);

  const toggleHotkeysView = useCallback(() => {
    const newState = !hotkeysViewActive;
    setHotkeysViewActive(newState);
    if (newState) {
      // Deactivate other views when activating hotkeys
      setConfigViewActive(false);
    }
  }, [hotkeysViewActive, setHotkeysViewActive, setConfigViewActive]);

  const toggleDatabaseStatus = useCallback(() => {
    setDatabaseStatusVisible(!databaseStatusVisible);
  }, [databaseStatusVisible, setDatabaseStatusVisible]);

  const toggleActivityBar = useCallback(() => {
    setActivityBarVisible(!activityBarVisible);
  }, [activityBarVisible, setActivityBarVisible]);

  return {
    toggleConfigView,
    toggleHotkeysView,
    toggleDatabaseStatus,
    toggleActivityBar,
  };
};