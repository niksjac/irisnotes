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
    <div className="tree-header">
      <div className="tree-title">
        <h3>Notes</h3>
        {hoistedFolder && (
          <div className="hoist-breadcrumb">
            <ChevronRight size={12} />
            <span>{hoistedFolder.name}</span>
          </div>
        )}
      </div>
      <div className="tree-actions">
        {hoistedFolder && (
          <button
            className="tree-action-btn"
            onClick={handleExitHoist}
            title="Exit hoist mode"
          >
            <ChevronLeft size={16} />
          </button>
        )}
        {selectedItemType === 'category' && !hoistedFolder && (
          <button
            className="tree-action-btn"
            onClick={handleHoistFolder}
            title="Hoist selected folder (Ctrl+H)"
          >
            <Target size={16} />
          </button>
        )}
        <button
          className="tree-action-btn"
          onClick={handleToggleExpandAll}
          title={allExpanded ? "Collapse all folders" : "Expand all folders"}
        >
          {allExpanded ? <Minimize2 size={16} /> : <Expand size={16} />}
        </button>
        <button
          className="tree-action-btn"
          onClick={handleToggleSort}
          title={sortAlphabetically ? "Disable alphabetical sorting" : "Enable alphabetical sorting"}
        >
          <ArrowUpDown size={16} />
        </button>
        <button
          className="tree-action-btn"
          onClick={handleDeleteSelected}
          disabled={!selectedItemId}
          title="Delete selected note or category"
        >
          <Trash2 size={16} />
        </button>
        <button
          className="tree-action-btn"
          onClick={onCreateNote}
          title="New Note"
        >
          <FileText size={16} />
        </button>
        <button
          className="tree-action-btn"
          onClick={onCreateFolder}
          title="New Folder"
        >
          <Folder size={16} />
        </button>
      </div>
    </div>
  );
};