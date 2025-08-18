import { atom } from 'jotai';

export type TreeViewType = 'native' | 'complex' | 'mui' | 'antd';

export const treeViewTypeAtom = atom<TreeViewType>('native');
