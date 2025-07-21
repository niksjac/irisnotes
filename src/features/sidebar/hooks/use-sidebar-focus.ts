import { useFocusManagement } from '../../layout/hooks';

export const useSidebarFocus = () => {
  const focusManagement = useFocusManagement({
    onFocusChange: () => {
      // Focus change callback for sidebar
    },
    onToggleSidebar: () => {
      // Sidebar manages its own state via dedicated hooks
    },
    onToggleActivityBar: () => {
      // Activity bar toggle if needed
    },
    sidebarCollapsed: false, // Sidebar manages this state via hooks
    activityBarVisible: true,
  });

  return {
    registerElement: focusManagement.registerElement,
    getFocusClasses: focusManagement.getFocusClasses,
    focusElement: focusManagement.focusElement,
    setFocusFromClick: focusManagement.setFocusFromClick,
  };
};
