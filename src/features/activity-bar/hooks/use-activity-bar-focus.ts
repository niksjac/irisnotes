import { useFocusManagement } from '@/hooks';

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
		activityBarVisible: true, // ActivityBar manages visibility internally
	});

	return {
		focusClasses: focusManagement.getFocusClasses('activity-bar'),
		registerElement: (ref: HTMLElement | null) =>
			focusManagement.registerElement('activity-bar', ref),
		setFocusFromClick: () => focusManagement.setFocusFromClick('activity-bar'),
	};
};
