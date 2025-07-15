import { useAtom } from 'jotai';
import { sidebarCollapsedAtom } from '../../../atoms';

export const useSidebarState = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useAtom(sidebarCollapsedAtom);

  return {
    sidebarCollapsed,
    setSidebarCollapsed,
  };
};