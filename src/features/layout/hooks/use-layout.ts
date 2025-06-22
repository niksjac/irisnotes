import { useState } from 'react';

export const useLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [activityBarVisible, setActivityBarVisible] = useState(true);
  const [selectedView, setSelectedView] = useState("1");

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

  return {
    sidebarCollapsed,
    activityBarVisible,
    selectedView,
    toggleSidebar,
    handleSidebarCollapsedChange,
    toggleActivityBar,
    handleViewChange
  };
};