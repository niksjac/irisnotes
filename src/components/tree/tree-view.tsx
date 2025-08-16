import { useItems } from '../../hooks/use-items';
import { TreeFolder } from './tree-folder';
import { TreeItem } from './tree-item';

export function TreeView() {
  const { items, selectedItem, selectItem } = useItems();

  // Get root level items (books)
  const rootItems = items.filter(item => item.type === 'book' && !item.parent_id);

    const renderItem = (item: any) => {
    if (item.type === 'note') {
      return (
        <TreeItem
          key={item.id}
          item={item}
          isSelected={selectedItem?.id === item.id}
          onSelect={selectItem}
        />
      );
    } else {
      // For books and sections, find their children
      const children = items.filter(child => child.parent_id === item.id);
      return (
        <TreeFolder
          key={item.id}
          item={item}
          isSelected={selectedItem?.id === item.id}
          onSelect={selectItem}
          childItems={children}
          allItems={items}
        />
      );
    }
  };

  return (
    <div className="w-full h-full overflow-auto p-2">
      {rootItems.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          <p>No items found</p>
          <p className="text-sm">Create a book to get started</p>
        </div>
      ) : (
        <div className="space-y-1">
          {rootItems.map(renderItem)}
        </div>
      )}
    </div>
  );
}