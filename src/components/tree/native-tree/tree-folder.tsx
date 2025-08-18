import { ChevronRight, ChevronDown, Folder, BookOpen } from 'lucide-react';
import { useState } from 'react';
import type { FlexibleItem } from '../../../types/items';
import { TreeItem } from './tree-item';
import { useTabManagement, useItems } from '../../../hooks';

interface TreeFolderProps {
  item: FlexibleItem;
  isSelected: boolean;
  onSelect: (itemId: string) => void;
  childItems: FlexibleItem[];
  allItems: FlexibleItem[];
}

export function TreeFolder({ item, isSelected, onSelect, childItems, allItems }: TreeFolderProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { openTreeViewInTab } = useTabManagement();
  const { moveItem } = useItems();
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const isBook = item.type === 'book';

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleSelect = () => {
    onSelect(item.id);
  };

  const handleDoubleClick = () => {
    openTreeViewInTab(item, allItems);
  };

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', JSON.stringify({
      id: item.id,
      type: item.type,
      title: item.title
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
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

      // Don't drop on itself
      if (dragData.id === item.id) return;

      // Move the item to this folder
      await moveItem(dragData.id, item.id);

    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  const Icon = isBook ? BookOpen : Folder;

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-2 py-1 cursor-pointer select-none transition-colors ${
          isDragging ? 'opacity-50' : ''
        } ${
          isDragOver ? 'bg-blue-200 dark:bg-blue-800' :
          isSelected ? 'bg-blue-100 dark:bg-blue-900' :
          'hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        draggable
        onClick={handleSelect}
        onDoubleClick={handleDoubleClick}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <button
          onClick={handleToggle}
          className="w-4 h-4 flex items-center justify-center"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          )}
        </button>
        <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.title}</span>
      </div>

      {isExpanded && childItems.length > 0 && (
        <div className="ml-4">
          {childItems.map((child) => {
            if (child.type === 'note') {
              return (
                <TreeItem
                  key={child.id}
                  item={child}
                  isSelected={false}
                  onSelect={onSelect}
                />
              );
            } else {
              const childChildren = allItems.filter(c => c.parent_id === child.id);
              return (
                <TreeFolder
                  key={child.id}
                  item={child}
                  isSelected={false}
                  onSelect={onSelect}
                  childItems={childChildren}
                  allItems={allItems}
                />
              );
            }
          })}
        </div>
      )}
    </div>
  );
}
