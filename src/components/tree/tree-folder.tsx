import { ChevronRight, ChevronDown, Folder, BookOpen } from 'lucide-react';
import { useState } from 'react';
import type { FlexibleItem } from '../../types/items';
import { TreeItem } from './tree-item';

interface TreeFolderProps {
  item: FlexibleItem;
  isSelected: boolean;
  onSelect: (itemId: string) => void;
  childItems: FlexibleItem[];
  allItems: FlexibleItem[];
}

export function TreeFolder({ item, isSelected, onSelect, childItems, allItems }: TreeFolderProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const isBook = item.type === 'book';

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleSelect = () => {
    onSelect(item.id);
  };

  const Icon = isBook ? BookOpen : Folder;

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
          isSelected ? 'bg-blue-100 dark:bg-blue-900' : ''
        }`}
        onClick={handleSelect}
      >
        <button
          onClick={handleToggle}
          className="w-4 h-4 flex items-center justify-center"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        <span className="text-sm font-medium">{item.title}</span>
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
