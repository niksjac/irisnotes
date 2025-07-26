import { useState, useRef, useMemo } from 'react';
import { Tree } from 'react-arborist';
import useResizeObserver from 'use-resize-observer';
import { ChevronDown, ChevronRight, Folder, FileText } from 'lucide-react';
import type { Note, Category } from '../../../types/database';

interface ArboristNotesTreeProps {
  notes: Note[];
  categories: Category[];
  selectedNoteId?: string | null;
  onNoteSelect: (noteId: string) => void;
  onCreateNote: () => void;
  onCreateFolder: () => void;
  onDeleteNote?: (noteId: string) => void;
  onDeleteCategory?: (categoryId: string) => void;
  onRenameNote?: (noteId: string, newTitle: string) => void;
  onRenameCategory?: (categoryId: string, newName: string) => void;
  onMoveNote?: (noteId: string, newCategoryId: string | null) => void;
  searchQuery?: string;
}

interface TreeNode {
  id: string;
  name: string;
  type: 'note' | 'category';
  children?: TreeNode[];
}

// Simple tree node component for react-arborist
function SimpleTreeNode({
  node,
  style,
  dragHandle,
  onNoteSelect,
  selectedNoteId,
  onRenameNote,
  onRenameCategory,
}: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.data.name);

  const isSelected = node.data.type === 'note' && selectedNoteId === node.data.id;

  const handleEdit = () => {
    if (editValue.trim() && editValue !== node.data.name) {
      if (node.data.type === 'note' && onRenameNote) {
        onRenameNote(node.data.id, editValue.trim());
      } else if (node.data.type === 'category' && onRenameCategory) {
        onRenameCategory(node.data.id, editValue.trim());
      }
    }
    setIsEditing(false);
  };

  return (
    <div
      ref={dragHandle}
      style={style}
      className={`flex items-center gap-2 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer ${
        isSelected ? 'bg-blue-100 dark:bg-blue-900' : ''
      }`}
      onClick={() => {
        if (node.data.type === 'note' && onNoteSelect) {
          onNoteSelect(node.data.id);
        }
      }}
      onDoubleClick={() => setIsEditing(true)}
    >
      {/* Chevron for categories */}
      {node.data.type === 'category' && (
        <div className='w-4 h-4 flex items-center justify-center'>
          {node.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      )}
      {node.data.type === 'note' && <div className='w-4' />}

      {/* Icon */}
      {node.data.type === 'category' ? (
        <Folder size={16} className='text-blue-500' />
      ) : (
        <FileText size={16} className='text-gray-500' />
      )}

      {/* Name or edit input */}
      {isEditing ? (
        <input
          type='text'
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onBlur={handleEdit}
          onKeyDown={e => {
            if (e.key === 'Enter') handleEdit();
            if (e.key === 'Escape') setIsEditing(false);
          }}
          onClick={e => e.stopPropagation()}
          autoFocus
          className='bg-white dark:bg-gray-800 border rounded px-1 text-sm'
        />
      ) : (
        <span className='text-sm'>{node.data.name}</span>
      )}
    </div>
  );
}

export function ArboristNotesTree({
  notes,
  categories,
  selectedNoteId,
  onNoteSelect,
  onCreateNote,
  onCreateFolder,
  onMoveNote,
  onRenameNote,
  onRenameCategory,
  searchQuery = '',
}: ArboristNotesTreeProps) {
  const treeRef = useRef<any>(null);

  // Official react-arborist responsive sizing approach
  const { ref: resizeRef, width = 300, height = 400 } = useResizeObserver();

  // Build tree data for react-arborist
  const treeData = useMemo(() => {
    const tree: TreeNode[] = [];

    // Add categories first
    categories.forEach(category => {
      tree.push({
        id: category.id,
        name: category.name,
        type: 'category',
        children: [],
      });
    });

    // Add notes (filtered by search)
    notes.forEach(note => {
      if (!searchQuery || note.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        tree.push({
          id: note.id,
          name: note.title,
          type: 'note',
        });
      }
    });

    return tree;
  }, [notes, categories, searchQuery]);

  const handleMove = (args: any) => {
    if (onMoveNote) {
      const { dragIds, parentId } = args;
      const dragId = dragIds[0];
      onMoveNote(dragId, parentId);
    }
  };

  return (
    <div className='flex flex-col h-full'>
      {/* Simple header */}
      <div className='flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700'>
        <h3 className='text-lg font-medium'>Notes</h3>
        <div className='flex gap-2'>
          <button
            onClick={onCreateNote}
            className='p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded'
            title='New note'
          >
            <FileText size={16} />
          </button>
          <button
            onClick={onCreateFolder}
            className='p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded'
            title='New folder'
          >
            <Folder size={16} />
          </button>
        </div>
      </div>

      {/* Responsive Tree Container - Official approach */}
      <div ref={resizeRef} className='flex-1 min-h-0 p-1'>
        <Tree
          ref={treeRef}
          data={treeData}
          openByDefault={false}
          width={width}
          height={height}
          indent={20}
          rowHeight={32}
          onMove={handleMove}
          disableEdit
          disableMultiSelection
        >
          {(props: any) => (
            <SimpleTreeNode
              {...props}
              onNoteSelect={onNoteSelect}
              selectedNoteId={selectedNoteId}
              onRenameNote={onRenameNote}
              onRenameCategory={onRenameCategory}
            />
          )}
        </Tree>
      </div>
    </div>
  );
}
