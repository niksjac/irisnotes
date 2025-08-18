import { UncontrolledTreeEnvironment, Tree, StaticTreeDataProvider } from 'react-complex-tree';
import 'react-complex-tree/lib/style-modern.css';
import { useItems, useTabManagement } from '../../../hooks';
import { FileText, BookOpen, Folder } from 'lucide-react';
import { adaptFlexibleItemsToComplexTree } from './complex-tree-adapter';
import { useState, useEffect } from 'react';

export function ComplexTreeView() {
  const { items, selectItem, selectedItem, moveItem } = useItems();
  const { openNoteInTab, openTreeViewInTab } = useTabManagement();
  const [expandedItems, setExpandedItems] = useState<string[]>(['root']);

  // Convert items to tree format
  const { rootItem, items: treeItems } = adaptFlexibleItemsToComplexTree(items);

  // Create focused item state based on selected item
  const focusedItem = selectedItem?.id || undefined;

  // Auto-expand path to selected item
  useEffect(() => {
    if (selectedItem) {
      const pathToItem: string[] = ['root'];
      let currentId = selectedItem.parent_id;
      while (currentId && currentId !== 'root') {
        pathToItem.unshift(currentId);
        const parentItem = items.find(item => item.id === currentId);
        currentId = parentItem?.parent_id;
      }
      setExpandedItems(prev => [...new Set([...prev, ...pathToItem])]);
    }
  }, [selectedItem, items]);

  const getIcon = (type: 'book' | 'section' | 'note') => {
    switch (type) {
      case 'book':
        return <BookOpen className="w-3 h-3 text-current opacity-70" />;
      case 'section':
        return <Folder className="w-3 h-3 text-current opacity-70" />;
      case 'note':
        return <FileText className="w-3 h-3 text-current opacity-70" />;
      default:
        return null;
    }
  };

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
    <div className="w-full h-full overflow-auto rct-tree-root p-1" tabIndex={0}>
      <UncontrolledTreeEnvironment
        dataProvider={new StaticTreeDataProvider(treeItems)}
        getItemTitle={item => item.data.title}
        viewState={{
          'main-tree': {
            focusedItem,
            expandedItems,
            selectedItems: selectedItem ? [selectedItem.id] : [],
          },
        }}
        renderItem={({ title, item, context, arrow }) => (
          <div
            className={`flex items-center w-full h-full px-2 ${
              context.isSelected
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                : context.isFocused
                ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 ring-1 ring-yellow-400'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            {arrow}
            <div className="flex items-center gap-1.5 ml-1">
              {getIcon(item.data.type)}
              <span className="text-xs font-medium truncate">
                {title}
              </span>
            </div>
          </div>
        )}
        onFocusItem={(item) => {
          if (item.data.originalItem) {
            selectItem(item.data.originalItem.id);
          }
        }}
        onSelectItems={(itemIds) => {
          if (itemIds.length > 0) {
            const itemId = itemIds[0];
            if (typeof itemId === 'string' && treeItems[itemId]) {
              const item = treeItems[itemId];
              if (item?.data.originalItem) {
                selectItem(item.data.originalItem.id);
              }
            }
          }
        }}
        onPrimaryAction={(item) => {
          if (item.data.originalItem) {
            if (item.data.type === 'note') {
              openNoteInTab(item.data.originalItem);
            } else {
              openTreeViewInTab(item.data.originalItem, items);
            }
          }
        }}
        onDrop={async (itemIds, target) => {
          if (itemIds.length > 0 && target.targetType === 'item') {
            const draggedItemId = itemIds[0];
            const targetItemId = target.targetItem;

            // Ensure both IDs are strings
            if (typeof draggedItemId !== 'string' || typeof targetItemId !== 'string') return;

            // Don't drop on itself
            if (draggedItemId === targetItemId) return;

            // Notes can't be drop targets, only books and sections
            const targetItem = treeItems[targetItemId];
            if (targetItem?.data.type === 'note') return;

            try {
              await moveItem(draggedItemId, targetItemId);
            } catch (error) {
              console.error('Error moving item:', error);
            }
          }
        }}
        canDragAndDrop={true}
        canDropOnFolder={true}
        canReorderItems={true}
        onExpandItem={(item) => {
          setExpandedItems(prev => [...prev, item.index as string]);
        }}
        onCollapseItem={(item) => {
          setExpandedItems(prev => prev.filter(id => id !== item.index));
        }}
      >
        <Tree
          treeId="main-tree"
          rootItem={rootItem as string}
          treeLabel="Notes Tree"
        />
      </UncontrolledTreeEnvironment>
    </div>
  );
}
