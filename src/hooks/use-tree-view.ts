import { useAtom } from 'jotai';
import { treeViewTypeAtom, type TreeViewType } from '../atoms/tree';

export const useTreeView = () => {
  const [treeViewType, setTreeViewType] = useAtom(treeViewTypeAtom);

  const switchTreeView = (type: TreeViewType) => {
    setTreeViewType(type);
  };

  return {
    treeViewType,
    setTreeViewType,
    switchTreeView,
  };
};
