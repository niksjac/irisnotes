import { useAtom } from "jotai";
import { useCallback } from "react";
import { activityBarVisible, activityBarExpanded } from "@/atoms";

/**
 * Hook for activity bar visibility and expansion state.
 * Note: View management (Settings, Hotkeys, etc.) is now handled
 * through the tab system via openSettingsTabAtom and openHotkeysTabAtom.
 */
export const useView = () => {
	const [activityBarVisibleValue, setActivityBarVisible] =
		useAtom(activityBarVisible);
	const [activityBarExpandedValue, setActivityBarExpanded] =
		useAtom(activityBarExpanded);

	const toggleActivityBar = useCallback(() => {
		setActivityBarVisible(!activityBarVisibleValue);
	}, [activityBarVisibleValue, setActivityBarVisible]);

	const toggleActivityBarExpanded = useCallback(() => {
		setActivityBarExpanded(!activityBarExpandedValue);
	}, [activityBarExpandedValue, setActivityBarExpanded]);

	return {
		// State
		activityBarVisible: activityBarVisibleValue,
		setActivityBarVisible,
		activityBarExpanded: activityBarExpandedValue,
		setActivityBarExpanded,
		// Actions
		toggleActivityBar,
		toggleActivityBarExpanded,
	};
};
