import { useState } from 'react';

export type PaneId = 'left' | 'right';

export const useLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [activityBarVisible, setActivityBarVisible] = useState(true);
  const [selectedView, setSelectedView] = useState("1");
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

  const handleViewChange = (view: string) => {
    setSelectedView(view);
    if (sidebarCollapsed) {
      setSidebarCollapsed(false);
    }
  };

  const toggleDualPaneMode = () => {
    setIsDualPaneMode(prev => !prev);
  };

  const setActivePane = (paneId: PaneId) => {
    setActivePaneId(paneId);
  };

  return {
    sidebarCollapsed,
    activityBarVisible,
    selectedView,
    isDualPaneMode,
    activePaneId,
    toggleSidebar,
    handleSidebarCollapsedChange,
    toggleActivityBar,
    handleViewChange,
    toggleDualPaneMode,
    setActivePane
  };
};