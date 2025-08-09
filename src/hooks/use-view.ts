import { useAtom } from "jotai";
import { useCallback } from "react";
import { activityBarVisible, configViewActive, databaseStatusVisible, hotkeysViewActive } from "@/atoms";

export const useView = () => {
	const [configViewActiveValue, setConfigViewActive] = useAtom(configViewActive);
	const [hotkeysViewActiveValue, setHotkeysViewActive] = useAtom(hotkeysViewActive);
	const [databaseStatusVisibleValue, setDatabaseStatusVisible] = useAtom(databaseStatusVisible);
	const [activityBarVisibleValue, setActivityBarVisible] = useAtom(activityBarVisible);

	const toggleConfigView = useCallback(() => {
		const newState = !configViewActiveValue;
		setConfigViewActive(newState);
		if (newState) {
			// Deactivate other views when activating config
			setHotkeysViewActive(false);
		}
	}, [configViewActiveValue, setConfigViewActive, setHotkeysViewActive]);

	const toggleHotkeysView = useCallback(() => {
		const newState = !hotkeysViewActiveValue;
		setHotkeysViewActive(newState);
		if (newState) {
			// Deactivate other views when activating hotkeys
			setConfigViewActive(false);
		}
	}, [hotkeysViewActiveValue, setHotkeysViewActive, setConfigViewActive]);

	const toggleDatabaseStatus = useCallback(() => {
		setDatabaseStatusVisible(!databaseStatusVisibleValue);
	}, [databaseStatusVisibleValue, setDatabaseStatusVisible]);

	const toggleActivityBar = useCallback(() => {
		setActivityBarVisible(!activityBarVisibleValue);
	}, [activityBarVisibleValue, setActivityBarVisible]);

	return {
		// State
		configViewActive: configViewActiveValue,
		setConfigViewActive,
		hotkeysViewActive: hotkeysViewActiveValue,
		setHotkeysViewActive,
		databaseStatusVisible: databaseStatusVisibleValue,
		setDatabaseStatusVisible,
		activityBarVisible: activityBarVisibleValue,
		setActivityBarVisible,
		// Actions
		toggleConfigView,
		toggleHotkeysView,
		toggleDatabaseStatus,
		toggleActivityBar,
	};
};
