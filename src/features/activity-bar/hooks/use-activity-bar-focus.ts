import { useFocusManagement } from '../../layout/hooks';
import { LAYOUT_CONFIG } from '../../../shared/constants/layout';

export const useActivityBarFocus = () => {
  const focusManagement = useFocusManagement({
    onFocusChange: () => {
      // Focus change callback for activity bar
    },
    onToggleSidebar: () => {
      // ActivityBar handles sidebar toggle directly via its own hooks
    },
    onToggleActivityBar: () => {
      // Activity bar toggle if needed
    },
    sidebarCollapsed: false, // ActivityBar manages this state internally
    activityBarVisible: true // ActivityBar manages visibility internally
  });

  return {
    focusClasses: focusManagement.getFocusClasses(LAYOUT_CONFIG.FOCUS.ACTIVITY_BAR_ID),
    registerElement: (ref: HTMLElement | null) =>
      focusManagement.registerElement(LAYOUT_CONFIG.FOCUS.ACTIVITY_BAR_ID, ref),
    setFocusFromClick: () =>
      focusManagement.setFocusFromClick(LAYOUT_CONFIG.FOCUS.ACTIVITY_BAR_ID)
  };
};