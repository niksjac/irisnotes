import { useCallback } from 'react';
import { useSidebarState } from './use-sidebar-state';

export const useSidebarActions = () => {
  const { sidebarCollapsed, setSidebarCollapsed } = useSidebarState();

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(!sidebarCollapsed);
  }, [sidebarCollapsed, setSidebarCollapsed]);

  const handleSidebarCollapsedChange = useCallback((collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  }, [setSidebarCollapsed]);

  return {
    toggleSidebar,
    handleSidebarCollapsedChange,
  };
};