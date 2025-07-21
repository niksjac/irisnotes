import { useState } from 'react';
import { ChevronDown, ChevronRight, Folder, FileText } from 'lucide-react';
import type { Note, Category } from '../../../types/database';

interface SimpleNotesTreeProps {
  notes: Note[];
  categories: Category[];
  selectedNoteId?: string | null;
  onNoteSelect: (noteId: string) => void;
  onCreateNote: () => void;
  onCreateFolder: () => void;
  onDeleteNote: (noteId: string) => void;
  onDeleteCategory: (categoryId: string) => void;
  onRenameNote: (noteId: string, newTitle: string) => void;
  onRenameCategory: (categoryId: string, newName: string) => void;
  searchQuery?: string;
}

interface TreeNode {
  id: string;
  name: string;
  type: 'note' | 'category';
  children: TreeNode[];
  data: Note | Category;
}

export function SimpleNotesTree({
  notes,
  categories,
  selectedNoteId,
  onNoteSelect,
  onCreateNote,
  onCreateFolder,
  onDeleteNote,
  onDeleteCategory,
  onRenameNote,
  onRenameCategory,
  searchQuery = '',
}: SimpleNotesTreeProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Build simple tree structure
  const buildTree = (): TreeNode[] => {
    const tree: TreeNode[] = [];

    // Add categories first
    categories.forEach(category => {
      tree.push({
        id: category.id,
        name: category.name,
        type: 'category',
        children: [],
        data: category,
      });
    });

    // Add notes (simplified - just add them at root level)
    notes.forEach(note => {
      if (!searchQuery || note.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        tree.push({
          id: note.id,
          name: note.title,
          type: 'note',
          children: [],
          data: note,
        });
      }
    });

    return tree;
  };

  const treeData = buildTree();

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditValue(name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveEdit = (item: TreeNode) => {
    if (editValue.trim() && editValue !== item.name) {
      if (item.type === 'note') {
        onRenameNote(item.id, editValue.trim());
      } else {
        onRenameCategory(item.id, editValue.trim());
      }
    }
    cancelEdit();
  };

  const renderNode = (node: TreeNode, level = 0) => {
    const isExpanded = expandedCategories.has(node.id);
    const isSelected = node.type === 'note' && selectedNoteId === node.id;
    const isEditing = editingId === node.id;

    return (
      <div key={node.id} style={{ marginLeft: level * 20 }}>
        <div
          className={`flex items-center gap-2 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer ${
            isSelected ? 'bg-blue-100 dark:bg-blue-900' : ''
          }`}
          onClick={() => {
            if (node.type === 'note') {
              onNoteSelect(node.id);
            } else {
              toggleCategory(node.id);
            }
          }}
          onDoubleClick={() => startEdit(node.id, node.name)}
        >
          {node.type === 'category' && (
            <button
              onClick={e => {
                e.stopPropagation();
                toggleCategory(node.id);
              }}
              className='p-0 border-none bg-transparent'
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          )}

          {node.type === 'note' && <div className='w-4' />}

          <div className='flex items-center gap-1'>
            {node.type === 'category' ? (
              <Folder size={16} className='text-blue-500' />
            ) : (
              <FileText size={16} className='text-gray-500' />
            )}

            {isEditing ? (
              <input
                type='text'
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onBlur={() => saveEdit(node)}
                onKeyDown={e => {
                  if (e.key === 'Enter') saveEdit(node);
                  if (e.key === 'Escape') cancelEdit();
                }}
                onClick={e => e.stopPropagation()}
                autoFocus
                className='bg-white dark:bg-gray-800 border rounded px-1 text-sm'
              />
            ) : (
              <span className='text-sm'>{node.name}</span>
            )}
          </div>

          <div className='ml-auto flex gap-1'>
            {node.type === 'category' && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  onDeleteCategory(node.id);
                }}
                className='opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600'
                title='Delete folder'
              >
                ×
              </button>
            )}
            {node.type === 'note' && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  onDeleteNote(node.id);
                }}
                className='opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600'
                title='Delete note'
              >
                ×
              </button>
            )}
          </div>
        </div>

        {node.type === 'category' && isExpanded && node.children.map(child => renderNode(child, level + 1))}
      </div>
    );
  };

  return (
    <div className='flex flex-col h-full'>
      {/* Header */}
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

      {/* Tree content */}
      <div className='flex-1 overflow-auto p-2'>
        {treeData.length === 0 ? (
          <div className='text-center text-gray-500 mt-8'>
            <p>No notes found</p>
            <button onClick={onCreateNote} className='mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600'>
              Create your first note
            </button>
          </div>
        ) : (
          <div className='space-y-1'>{treeData.map(node => renderNode(node))}</div>
        )}
      </div>
    </div>
  );
}
