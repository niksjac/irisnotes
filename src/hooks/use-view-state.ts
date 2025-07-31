import { useAtom } from 'jotai';
import {
	activityBarVisibleAtom,
	configViewActiveAtom,
	databaseStatusVisibleAtom,
	hotkeysViewActiveAtom,
} from '@/atoms';

export const useViewState = () => {
	const [configViewActive, setConfigViewActive] = useAtom(configViewActiveAtom);
	const [hotkeysViewActive, setHotkeysViewActive] = useAtom(hotkeysViewActiveAtom);
	const [databaseStatusVisible, setDatabaseStatusVisible] = useAtom(databaseStatusVisibleAtom);
	const [activityBarVisible, setActivityBarVisible] = useAtom(activityBarVisibleAtom);

	return {
		configViewActive,
		setConfigViewActive,
		hotkeysViewActive,
		setHotkeysViewActive,
		databaseStatusVisible,
		setDatabaseStatusVisible,
		activityBarVisible,
		setActivityBarVisible,
	};
};
