import { FileText } from 'lucide-react';
import type { FlexibleItem } from '../../types/items';

interface TreeItemProps {
  item: FlexibleItem;
  isSelected: boolean;
  onSelect: (itemId: string) => void;
}

export function TreeItem({ item, isSelected, onSelect }: TreeItemProps) {
  return (
    <div
      className={`flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
        isSelected ? 'bg-blue-100 dark:bg-blue-900' : ''
      }`}
      onClick={() => onSelect(item.id)}
    >
      <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      <span className="text-sm">{item.title}</span>
    </div>
  );
}
