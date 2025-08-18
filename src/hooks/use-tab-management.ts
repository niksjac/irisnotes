import { useAtom, useSetAtom } from 'jotai';
import { paneStateAtom, pane0TabsAtom, pane1TabsAtom, pane0ActiveTabAtom, pane1ActiveTabAtom } from '../atoms/panes';
import type { Tab } from '../types';
import type { FlexibleItem } from '../types/items';

export const useTabManagement = () => {
  const [paneState] = useAtom(paneStateAtom);
  const setPane0Tabs = useSetAtom(pane0TabsAtom);
  const setPane1Tabs = useSetAtom(pane1TabsAtom);
  const setPane0ActiveTab = useSetAtom(pane0ActiveTabAtom);
  const setPane1ActiveTab = useSetAtom(pane1ActiveTabAtom);

  const openNoteInTab = (item: FlexibleItem) => {
    const activePane = paneState.activePane;

    const newTab: Tab = {
      id: `note-${item.id}-${Date.now()}`,
      title: item.title,
      viewType: 'editor-rich-view',
      viewData: { noteId: item.id },
    };

    if (activePane === 0) {
      setPane0Tabs(prev => [...prev, newTab]);
      setPane0ActiveTab(newTab.id);
    } else {
      setPane1Tabs(prev => [...prev, newTab]);
      setPane1ActiveTab(newTab.id);
    }
  };

  const openTreeViewInTab = (item: FlexibleItem, items: FlexibleItem[]) => {
    const activePane = paneState.activePane;

    // Build tree view content for the container
    const buildTreeText = (parentId: string | null = null, level = 0): string => {
      const children = items
        .filter(child => child.parent_id === parentId)
        .sort((a, b) => a.sort_order - b.sort_order);

      return children
        .map(child => {
          const indent = '  '.repeat(level);
          const icon = child.type === 'book' ? '📖' : child.type === 'section' ? '📁' : '📄';
          let result = `${indent}${icon} ${child.title}`;

          if (child.type !== 'note') {
            const subtree = buildTreeText(child.id, level + 1);
            if (subtree) {
              result += `\n${subtree}`;
            }
          }

          return result;
        })
        .join('\n');
    };

    const treeContent = buildTreeText(item.id);
    const content = `# ${item.title}\n\nTree view of contents:\n\n${treeContent}`;

    const newTab: Tab = {
      id: `tree-${item.id}-${Date.now()}`,
      title: `📂 ${item.title}`,
      viewType: 'editor-source-view',
      viewData: { content: content },
    };

    if (activePane === 0) {
      setPane0Tabs(prev => [...prev, newTab]);
      setPane0ActiveTab(newTab.id);
    } else {
      setPane1Tabs(prev => [...prev, newTab]);
      setPane1ActiveTab(newTab.id);
    }
  };

  return {
    openNoteInTab,
    openTreeViewInTab,
  };
};
