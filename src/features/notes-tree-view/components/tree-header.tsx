import React from 'react';
import { ChevronRight, ChevronLeft, Target, Minimize2, Expand, ArrowUpDown, Trash2, FileText, Folder } from 'lucide-react';
import type { TreeNode } from '../types';

interface TreeHeaderProps {
  hoistedFolder: TreeNode | null;
  handleExitHoist: () => void;
  selectedItemType: 'note' | 'category' | null;
  handleHoistFolder: () => void;
  allExpanded: boolean;
  handleToggleExpandAll: () => void;
  sortAlphabetically: boolean;
  handleToggleSort: () => void;
  handleDeleteSelected: () => void;
  selectedItemId: string | null;
  onCreateNote: () => void;
  onCreateFolder: () => void;
}

export const TreeHeader: React.FC<TreeHeaderProps> = ({
  hoistedFolder,
  handleExitHoist,
  selectedItemType,
  handleHoistFolder,
  allExpanded,
  handleToggleExpandAll,
  sortAlphabetically,
  handleToggleSort,
  handleDeleteSelected,
  selectedItemId,
  onCreateNote,
  onCreateFolder,
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-4 border-b border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800">
      <div className="flex items-center gap-2">
        <h3 className="m-0 text-lg font-medium text-gray-900 dark:text-gray-100">Notes</h3>
        {hoistedFolder && (
          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
            <ChevronRight size={12} />
            <span className="font-medium text-gray-900 dark:text-gray-100">{hoistedFolder.name}</span>
          </div>
        )}
      </div>
      <div className="flex gap-1">
        {hoistedFolder && (
          <button
            className="flex items-center justify-center w-7 h-7 border-none rounded bg-transparent text-gray-600 dark:text-gray-400 cursor-pointer transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={handleExitHoist}
            title="Exit hoist mode"
          >
            <ChevronLeft size={16} />
          </button>
        )}
        {selectedItemType === 'category' && !hoistedFolder && (
          <button
            className="flex items-center justify-center w-7 h-7 border-none rounded bg-transparent text-gray-600 dark:text-gray-400 cursor-pointer transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={handleHoistFolder}
            title="Hoist selected folder (Ctrl+H)"
          >
            <Target size={16} />
          </button>
        )}
        <button
          className="flex items-center justify-center w-7 h-7 border-none rounded bg-transparent text-gray-600 dark:text-gray-400 cursor-pointer transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={handleToggleExpandAll}
          title={allExpanded ? "Collapse all folders" : "Expand all folders"}
        >
          {allExpanded ? <Minimize2 size={16} /> : <Expand size={16} />}
        </button>
        <button
          className="flex items-center justify-center w-7 h-7 border-none rounded bg-transparent text-gray-600 dark:text-gray-400 cursor-pointer transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={handleToggleSort}
          title={sortAlphabetically ? "Disable alphabetical sorting" : "Enable alphabetical sorting"}
        >
          <ArrowUpDown size={16} />
        </button>
        <button
          className="flex items-center justify-center w-7 h-7 border-none rounded bg-transparent text-gray-600 dark:text-gray-400 cursor-pointer transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-600 disabled:dark:hover:text-gray-400"
          onClick={handleDeleteSelected}
          disabled={!selectedItemId}
          title="Delete selected note or category"
        >
          <Trash2 size={16} />
        </button>
        <button
          className="flex items-center justify-center w-7 h-7 border-none rounded bg-transparent text-gray-600 dark:text-gray-400 cursor-pointer transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={onCreateNote}
          title="New Note"
        >
          <FileText size={16} />
        </button>
        <button
          className="flex items-center justify-center w-7 h-7 border-none rounded bg-transparent text-gray-600 dark:text-gray-400 cursor-pointer transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={onCreateFolder}
          title="New Folder"
        >
          <Folder size={16} />
        </button>
      </div>
    </div>
  );
};