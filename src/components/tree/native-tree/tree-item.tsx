import { FileText } from 'lucide-react';
import type { FlexibleItem } from '../../../types/items';
import { useTabManagement } from '../../../hooks';
import { useState } from 'react';

interface TreeItemProps {
  item: FlexibleItem;
  isSelected: boolean;
  onSelect: (itemId: string) => void;
}

export function TreeItem({ item, isSelected, onSelect }: TreeItemProps) {
  const { openNoteInTab } = useTabManagement();
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDoubleClick = () => {
    openNoteInTab(item);
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

      // Notes can't be drop targets for other items
      return;

    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  return (
    <div
      className={`flex items-center gap-2 px-2 py-1 cursor-pointer select-none transition-colors ${
        isDragging ? 'opacity-50' : ''
      } ${
        isDragOver ? 'bg-blue-200 dark:bg-blue-800' :
        isSelected ? 'bg-blue-100 dark:bg-blue-900' :
        'hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
      draggable
      onClick={() => onSelect(item.id)}
      onDoubleClick={handleDoubleClick}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      <span className="text-sm text-gray-900 dark:text-gray-100">{item.title}</span>
    </div>
  );
}
