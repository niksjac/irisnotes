import { useState } from 'react';
import { useConfig } from '../../../hooks/use-config';

export type PaneId = 'left' | 'right';

export const useLayout = () => {
  const { config, updateConfig } = useConfig();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [activityBarVisible, setActivityBarVisible] = useState(true);
  const [configViewActive, setConfigViewActive] = useState(false);
  const [hotkeysViewActive, setHotkeysViewActive] = useState(false);
  const [databaseStatusVisible, setDatabaseStatusVisible] = useState(false);
  const [isDualPaneMode, setIsDualPaneMode] = useState(false);
  const [activePaneId, setActivePaneId] = useState<PaneId>('left');

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  const handleSidebarCollapsedChange = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  };

  const toggleActivityBar = () => {
    setActivityBarVisible(prev => !prev);
  };

  const toggleConfigView = () => {
    setConfigViewActive(prev => {
      const newState = !prev;
      if (newState) {
        // Deactivate other views when activating config
        setHotkeysViewActive(false);
      }
      return newState;
    });
  };

  const toggleHotkeysView = () => {
    setHotkeysViewActive(prev => {
      const newState = !prev;
      if (newState) {
        // Deactivate other views when activating hotkeys
        setConfigViewActive(false);
      }
      return newState;
    });
  };

  const toggleDatabaseStatus = () => {
    setDatabaseStatusVisible(prev => !prev);
  };

  const toggleDualPaneMode = () => {
    setIsDualPaneMode(prev => !prev);
  };

  const setActivePane = (paneId: PaneId) => {
    setActivePaneId(paneId);
  };

  const toggleToolbar = () => {
    const newVisibility = !config.editor.toolbarVisible;
    updateConfig({
      editor: {
        ...config.editor,
        toolbarVisible: newVisibility,
      },
    });
  };

  return {
    sidebarCollapsed,
    activityBarVisible,
    configViewActive,
    hotkeysViewActive,
    databaseStatusVisible,
    isDualPaneMode,
    activePaneId,
    toolbarVisible: config.editor.toolbarVisible,
    toggleSidebar,
    handleSidebarCollapsedChange,
    toggleActivityBar,
    toggleConfigView,
    toggleHotkeysView,
    toggleDatabaseStatus,
    toggleDualPaneMode,
    setActivePane,
    toggleToolbar,
  };
};
