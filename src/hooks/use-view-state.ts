import { useAtom } from 'jotai';
import { activityBarVisible, configViewActive, databaseStatusVisible, hotkeysViewActive } from '@/atoms';

export const useViewState = () => {
	const [configViewActiveValue, setConfigViewActive] = useAtom(configViewActive);
	const [hotkeysViewActiveValue, setHotkeysViewActive] = useAtom(hotkeysViewActive);
	const [databaseStatusVisibleValue, setDatabaseStatusVisible] = useAtom(databaseStatusVisible);
	const [activityBarVisibleValue, setActivityBarVisible] = useAtom(activityBarVisible);

	return {
		configViewActive: configViewActiveValue,
		setConfigViewActive,
		hotkeysViewActive: hotkeysViewActiveValue,
		setHotkeysViewActive,
		databaseStatusVisible: databaseStatusVisibleValue,
		setDatabaseStatusVisible,
		activityBarVisible: activityBarVisibleValue,
		setActivityBarVisible,
	};
};
