import { useItems, useTabManagement } from '../../../hooks';
import { FileText, BookOpen, Folder, ChevronRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface TreeNodeProps {
  item: any;
  level: number;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  childNodes: any[];
}

function TreeNode({ item, level, isSelected, isExpanded, onSelect, onToggle, childNodes }: TreeNodeProps) {
  const hasChildren = childNodes.length > 0;
  const { openNoteInTab, openTreeViewInTab } = useTabManagement();
  const { items, moveItem } = useItems();
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const getIcon = () => {
    switch (item.type) {
      case 'book':
        return <BookOpen className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
      case 'section':
        return <Folder className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
      case 'note':
        return <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
      default:
        return null;
    }
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

      // Notes can't be drop targets, only books and sections
      if (item.type === 'note') return;

      // Move the item to this container
      await moveItem(dragData.id, item.id);

    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-2 py-1 cursor-pointer transition-colors duration-200 rounded select-none ${
          isDragging ? 'opacity-50' : ''
        } ${
          isDragOver ? 'bg-blue-200 dark:bg-blue-800' : ''
        }`}
        style={{
          paddingLeft: `${level * 16 + 8}px`,
          backgroundColor: isSelected ? 'var(--tree-selected-bg)' : undefined,
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = 'var(--tree-hover-bg)';
          } else {
            e.currentTarget.style.backgroundColor = 'var(--tree-selected-hover-bg)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = isSelected ? 'var(--tree-selected-bg)' : '';
        }}
        onClick={() => onSelect(item.id)}
        onDoubleClick={() => {
          if (item.type === 'note') {
            openNoteInTab(item);
          } else {
            openTreeViewInTab(item, items);
          }
        }}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(item.id);
            }}
            className="w-4 h-4 flex items-center justify-center"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-4 h-4" />}
        {getIcon()}
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.title}</span>
      </div>

      {isExpanded && childNodes.map((child) => (
        <ComplexTreeNodeRenderer
          key={child.item.id}
          item={child.item}
          level={level + 1}
          childNodes={child.children}
        />
      ))}
    </div>
  );
}

function ComplexTreeNodeRenderer({ item, level, childNodes }: { item: any; level: number; childNodes: any[] }) {
  const { selectedItem, selectItem } = useItems();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const isSelected = selectedItem?.id === item.id;
  const isExpanded = expandedItems.has(item.id);

  const handleToggle = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <TreeNode
      item={item}
      level={level}
      isSelected={isSelected}
      isExpanded={isExpanded}
      onSelect={selectItem}
      onToggle={handleToggle}
      childNodes={childNodes}
    />
  );
}

export function ComplexTreeView() {
  const { items } = useItems();

  // Build tree structure
  const buildTree = (parentId: string | null = null): any[] => {
    return items
      .filter(item => item.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(item => ({
        item,
        children: buildTree(item.id)
      }));
  };

  const treeData = buildTree();

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
      <div className="space-y-1">
        {treeData.map((node) => (
          <ComplexTreeNodeRenderer
            key={node.item.id}
            item={node.item}
            level={0}
            childNodes={node.children}
          />
        ))}
      </div>
    </div>
  );
}
