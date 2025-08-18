import { useItems } from '../../../hooks/use-items';
import { TreeFolder } from './tree-folder';
import { TreeItem } from './tree-item';
import { useState } from 'react';

export function NativeTreeView() {
  const { items, selectedItem, selectItem, moveItem } = useItems();
  const [isDragOver, setIsDragOver] = useState(false);

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));

      // Only allow books to be moved to root
      if (dragData.type === 'book') {
        await moveItem(dragData.id, null);
      }

    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  return (
    <div
      className={`w-full h-full overflow-auto p-2 select-none ${
        isDragOver ? 'bg-blue-50 dark:bg-blue-950' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
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