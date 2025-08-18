import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { useItems, useTabManagement } from '../../../hooks';
import { adaptFlexibleItemsToMuiTree, type MuiTreeItemData } from './mui-tree-adapter';
import { FileText, BookOpen, Folder } from 'lucide-react';

export function MuiTreeView() {
  const { items, selectedItem, selectItem, moveItem } = useItems();
  const { openNoteInTab, openTreeViewInTab } = useTabManagement();

  const treeData = adaptFlexibleItemsToMuiTree(items);

  const handleItemSelectionToggle = (_event: React.SyntheticEvent | null, itemId: string, _isSelected: boolean) => {
    selectItem(itemId);
  };

  const handleItemDoubleClick = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      if (item.type === 'note') {
        openNoteInTab(item);
      } else {
        openTreeViewInTab(item, items);
      }
    }
  };

  const getItemIcon = (type: 'book' | 'section' | 'note') => {
    switch (type) {
      case 'book':
        return <BookOpen className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
      case 'section':
        return <Folder className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
      case 'note':
        return <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const renderTreeItem = (item: MuiTreeItemData) => (
    <TreeItem
      key={item.id}
      itemId={item.id}
            label={
        <div
          className="flex items-center gap-2 py-1"
          onDoubleClick={() => handleItemDoubleClick(item.id)}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify({
              id: item.id,
              type: item.type,
              title: item.label
            }));
            e.dataTransfer.effectAllowed = 'move';
          }}
          onDragOver={(e) => {
            if (item.type !== 'note') {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }
          }}
          onDrop={async (e) => {
            if (item.type === 'note') return;

            e.preventDefault();
            try {
              const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
              if (dragData.id !== item.id) {
                await moveItem(dragData.id, item.id);
              }
            } catch (error) {
              console.error('Error handling drop:', error);
            }
          }}
        >
          {getItemIcon(item.type)}
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.label}</span>
        </div>
      }
              sx={{
          '& .MuiTreeItem-content': {
            padding: '4px 8px',
            borderRadius: '4px',
            color: 'inherit',
            userSelect: 'none',
            '&:hover': {
              backgroundColor: 'var(--tree-hover-bg)',
            },
            '&.Mui-selected': {
              backgroundColor: 'var(--tree-selected-bg)',
              '&:hover': {
                backgroundColor: 'var(--tree-selected-hover-bg)',
              },
            },
          },
          '& .MuiTreeItem-label': {
            fontSize: '14px',
            fontWeight: 500,
            color: 'rgb(17 24 39)',
            '@media (prefers-color-scheme: dark)': {
              color: 'rgb(243 244 246)',
            },
          },
          '& .MuiTreeItem-iconContainer': {
            color: 'inherit',
          },
        }}
    >
      {item.children?.map(renderTreeItem)}
    </TreeItem>
  );

  if (items.length === 0) {
    return (
      <div className="w-full h-full overflow-auto p-2">
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          <p>No items found</p>
          <p className="text-sm">Create a book to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto p-2 select-none">
      <SimpleTreeView
        selectedItems={selectedItem?.id || null}
        onItemSelectionToggle={handleItemSelectionToggle}
        expandedItems={treeData.filter(item => item.type !== 'note').map(item => item.id)}
        sx={{
          '& .MuiTreeView-root': {
            color: 'inherit',
            backgroundColor: 'transparent',
          },
          color: 'inherit',
          backgroundColor: 'transparent',
        }}
      >
        {treeData.map(renderTreeItem)}
      </SimpleTreeView>
    </div>
  );
}
