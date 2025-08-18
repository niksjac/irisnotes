import { useAtom } from 'jotai';
import { treeViewTypeAtom } from '../../atoms/tree';
import { NativeTreeView } from './native-tree';
import { ComplexTreeView } from './complex-tree';
import { MuiTreeView } from './mui-tree';

export function TreeView() {
  const [treeViewType] = useAtom(treeViewTypeAtom);

  switch (treeViewType) {
    case 'complex':
      return <ComplexTreeView />;
    case 'mui':
      return <MuiTreeView />;
    default:
      return <NativeTreeView />;
  }
}