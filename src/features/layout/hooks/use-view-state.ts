import { useAtom } from 'jotai';
import {
  configViewActiveAtom,
  hotkeysViewActiveAtom,
  databaseStatusVisibleAtom,
  activityBarVisibleAtom
} from '../../../atoms';

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