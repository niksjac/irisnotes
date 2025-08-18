import { useAtom } from 'jotai';
import { treeViewTypeAtom, type TreeViewType } from '../../atoms/tree';
import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const treeViewOptions: { value: TreeViewType; label: string }[] = [
  { value: 'native', label: 'Native' },
  { value: 'complex', label: 'Complex Tree' },
  { value: 'mui', label: 'MUI Tree' },
  { value: 'antd', label: 'Ant Design' },
];

export function TreeSwitcher() {
  const [treeViewType, setTreeViewType] = useAtom(treeViewTypeAtom);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = treeViewOptions.find(option => option.value === treeViewType);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (value: TreeViewType) => {
    setTreeViewType(value);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
      >
        <span>{currentOption?.label || 'Select Tree'}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg z-50">
          {treeViewOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`w-full px-3 py-2 text-xs text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                treeViewType === option.value
                  ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
