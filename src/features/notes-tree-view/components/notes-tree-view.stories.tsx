import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { NotesTreeView } from './notes-tree-view';
import type { Note, Category } from '../../../types/database';

const meta = {
  title: 'Features/NotesTreeView/NotesTreeView',
  component: NotesTreeView,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Complete notes tree view component with hierarchical display of notes and categories. Supports navigation, editing, CRUD operations, keyboard shortcuts, search, sorting, hoisting, and advanced features for power users.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof NotesTreeView>;

export default meta;
type Story = StoryObj<typeof meta>;

// Enhanced mock data
const mockNotes: Note[] = [
  {
    id: 'note-1',
    title: 'Meeting Notes',
    content: '<p>Team standup discussion and action items</p>',
    content_type: 'html',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_pinned: false,
    is_archived: false,
    word_count: 6,
    character_count: 38,
    content_plaintext: 'Team standup discussion and action items',
  },
  {
    id: 'note-2',
    title: 'Project Alpha Documentation',
    content: '<p>Complete technical specifications and requirements</p>',
    content_type: 'html',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    is_pinned: true,
    is_archived: false,
    word_count: 5,
    character_count: 45,
    content_plaintext: 'Complete technical specifications and requirements',
  },
  {
    id: 'note-3',
    title: 'Research Notes',
    content: '<p>Market analysis and competitive research findings</p>',
    content_type: 'html',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
    is_pinned: false,
    is_archived: false,
    word_count: 6,
    character_count: 42,
    content_plaintext: 'Market analysis and competitive research findings',
  },
  {
    id: 'note-4',
    title: 'Personal Tasks',
    content: '<p>Daily todo list and personal reminders</p>',
    content_type: 'html',
    created_at: '2024-01-04T00:00:00Z',
    updated_at: '2024-01-04T00:00:00Z',
    is_pinned: false,
    is_archived: false,
    word_count: 6,
    character_count: 32,
    content_plaintext: 'Daily todo list and personal reminders',
  },
  {
    id: 'note-5',
    title: 'Orphaned Note',
    content: '<p>This note has no category assignment</p>',
    content_type: 'html',
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-05T00:00:00Z',
    is_pinned: false,
    is_archived: false,
    word_count: 6,
    character_count: 35,
    content_plaintext: 'This note has no category assignment',
  },
];

const mockCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Work',
    parent_id: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    description: 'Work-related notes and documents',
    sort_order: 0,
  },
  {
    id: 'cat-2',
    name: 'Projects',
    parent_id: 'cat-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    description: 'Active project documentation',
    sort_order: 1,
  },
  {
    id: 'cat-3',
    name: 'Research',
    parent_id: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    description: 'Research and analysis notes',
    sort_order: 2,
  },
  {
    id: 'cat-4',
    name: 'Personal',
    parent_id: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    description: 'Personal notes and tasks',
    sort_order: 3,
  },
];

const mockNoteCategories = [
  { noteId: 'note-1', categoryId: 'cat-1' },
  { noteId: 'note-2', categoryId: 'cat-2' },
  { noteId: 'note-3', categoryId: 'cat-3' },
  { noteId: 'note-4', categoryId: 'cat-4' },
];

// Default props
const defaultProps = {
  notes: mockNotes,
  categories: mockCategories,
  noteCategories: mockNoteCategories,
  onNoteSelect: (id: string) => console.log('Note selected:', id),
  onCreateNote: (parentId?: string) => console.log('Create note:', parentId),
  onCreateFolder: (parentId?: string) => console.log('Create folder:', parentId),
  onMoveNote: (noteId: string, categoryId: string | null) => console.log('Move note:', noteId, 'to', categoryId),
  onDeleteNote: (id: string) => console.log('Delete note:', id),
  onDeleteCategory: (id: string) => console.log('Delete category:', id),
  onRenameNote: (id: string, name: string) => console.log('Rename note:', id, 'to', name),
  onRenameCategory: (id: string, name: string) => console.log('Rename category:', id, 'to', name),
};

// Basic Examples
export const Default: Story = {
  args: defaultProps,
};

export const EmptyState: Story = {
  args: {
    ...defaultProps,
    notes: [],
    categories: [],
    noteCategories: [],
  },
};

export const OnlyNotes: Story = {
  args: {
    ...defaultProps,
    categories: [],
    noteCategories: [],
  },
};

export const OnlyCategories: Story = {
  args: {
    ...defaultProps,
    notes: [],
    noteCategories: [],
  },
};

// Selection States
export const WithNoteSelected: Story = {
  args: {
    ...defaultProps,
    selectedNoteId: 'note-2',
    selectedItemId: 'note-2',
    selectedItemType: 'note',
  },
};

export const WithCategorySelected: Story = {
  args: {
    ...defaultProps,
    selectedItemId: 'cat-1',
    selectedItemType: 'category',
  },
};

// Search Examples
export const WithSearch: Story = {
  args: {
    ...defaultProps,
    searchQuery: 'project',
  },
};

export const SearchNoResults: Story = {
  args: {
    ...defaultProps,
    searchQuery: 'nonexistent',
  },
};

// Interactive Examples
export const InteractiveTreeView: Story = {
  args: defaultProps,
  render: () => {
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [selectedItemType, setSelectedItemType] = useState<'note' | 'category' | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    return (
      <div className='h-96 w-80 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden'>
        <div className='p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'>
          <div className='space-y-2'>
            <input
              type='text'
              placeholder='Search notes and folders...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100'
            />
            <div className='text-xs text-gray-600 dark:text-gray-400'>
              Selected: {selectedItemId ? `${selectedItemType} (${selectedItemId})` : 'None'}
            </div>
          </div>
        </div>
        <NotesTreeView
          {...defaultProps}
          selectedNoteId={selectedNoteId}
          selectedItemId={selectedItemId}
          selectedItemType={selectedItemType}
          searchQuery={searchQuery}
          onNoteSelect={id => {
            setSelectedNoteId(id);
            setSelectedItemId(id);
            setSelectedItemType('note');
            console.log('Note selected:', id);
          }}
          onItemSelect={(id, type) => {
            setSelectedItemId(id);
            setSelectedItemType(type);
            if (type === 'note') {
              setSelectedNoteId(id);
            }
            console.log('Item selected:', id, type);
          }}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive tree view with search and selection. Try searching for terms like "project", "work", or "note".',
      },
    },
  },
};

// Large Dataset Example
export const LargeDataset: Story = {
  args: defaultProps,
  render: () => {
    // Generate large dataset
    const largeNotes: Note[] = Array.from({ length: 50 }, (_, i) => ({
      id: `note-${i}`,
      title: `Note ${i + 1}: ${['Meeting', 'Project', 'Research', 'Task', 'Idea'][i % 5]} ${Math.floor(i / 5) + 1}`,
      content: `<p>Content for note ${i + 1}</p>`,
      content_type: 'html' as const,
      created_at: new Date(2024, 0, (i % 30) + 1).toISOString(),
      updated_at: new Date(2024, 0, (i % 30) + 1).toISOString(),
      is_pinned: i % 10 === 0,
      is_archived: false,
      word_count: 4,
      character_count: 20,
      content_plaintext: `Content for note ${i + 1}`,
    }));

    const largeCategories: Category[] = Array.from({ length: 10 }, (_, i) => ({
      id: `cat-${i}`,
      name: `Category ${i + 1}`,
      parent_id: i > 4 ? `cat-${i - 5}` : null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      description: `Description for category ${i + 1}`,
      sort_order: i,
    }));

    const largeNoteCategories = largeNotes.map((note, i) => ({
      noteId: note.id,
      categoryId: `cat-${i % 10}`,
    }));

    return (
      <div className='h-96 w-80 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden'>
        <NotesTreeView
          {...defaultProps}
          notes={largeNotes}
          categories={largeCategories}
          noteCategories={largeNoteCategories}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Tree view with a large dataset (50 notes, 10 categories) to demonstrate performance and scrolling.',
      },
    },
  },
};

// Workflow Demonstrations
export const CompleteWorkflow: Story = {
  args: defaultProps,
  render: () => {
    const [notes, setNotes] = useState(mockNotes);
    const [categories, setCategories] = useState(mockCategories);
    const [noteCategories, setNoteCategories] = useState(mockNoteCategories);
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [selectedItemType, setSelectedItemType] = useState<'note' | 'category' | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionLog, setActionLog] = useState<string[]>([]);

    const addLog = (action: string) => {
      setActionLog(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${action}`]);
    };

    return (
      <div className='flex gap-4'>
        <div className='w-80 h-96 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden'>
          <div className='p-2 border-b border-gray-200 dark:border-gray-700'>
            <input
              type='text'
              placeholder='Search...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
            />
          </div>
          <NotesTreeView
            notes={notes}
            categories={categories}
            noteCategories={noteCategories}
            selectedNoteId={selectedNoteId}
            selectedItemId={selectedItemId}
            selectedItemType={selectedItemType}
            searchQuery={searchQuery}
            onNoteSelect={id => {
              setSelectedNoteId(id);
              setSelectedItemId(id);
              setSelectedItemType('note');
              addLog(`Opened note: ${notes.find(n => n.id === id)?.title}`);
            }}
            onItemSelect={(id, type) => {
              setSelectedItemId(id);
              setSelectedItemType(type);
              if (type === 'note') setSelectedNoteId(id);
              const item =
                type === 'note' ? notes.find(n => n.id === id)?.title : categories.find(c => c.id === id)?.name;
              addLog(`Selected ${type}: ${item}`);
            }}
            onCreateNote={parentId => {
              const newNote: Note = {
                id: `note-${Date.now()}`,
                title: 'New Note',
                content: '<p>New note content</p>',
                content_type: 'html',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                is_pinned: false,
                is_archived: false,
                word_count: 3,
                character_count: 16,
                content_plaintext: 'New note content',
              };
              setNotes(prev => [...prev, newNote]);
              if (parentId) {
                setNoteCategories(prev => [...prev, { noteId: newNote.id, categoryId: parentId }]);
              }
              addLog(`Created note: ${newNote.title}`);
            }}
            onCreateFolder={parentId => {
              const newCategory: Category = {
                id: `cat-${Date.now()}`,
                name: 'New Folder',
                parent_id: parentId || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                description: 'New folder description',
                sort_order: categories.length,
              };
              setCategories(prev => [...prev, newCategory]);
              addLog(`Created folder: ${newCategory.name}`);
            }}
            onDeleteNote={id => {
              setNotes(prev => prev.filter(n => n.id !== id));
              setNoteCategories(prev => prev.filter(nc => nc.noteId !== id));
              addLog(`Deleted note`);
            }}
            onDeleteCategory={id => {
              setCategories(prev => prev.filter(c => c.id !== id));
              setNoteCategories(prev => prev.filter(nc => nc.categoryId !== id));
              addLog(`Deleted category`);
            }}
            onRenameNote={(id, name) => {
              setNotes(prev => prev.map(n => (n.id === id ? { ...n, title: name } : n)));
              addLog(`Renamed note to: ${name}`);
            }}
            onRenameCategory={(id, name) => {
              setCategories(prev => prev.map(c => (c.id === id ? { ...c, name } : c)));
              addLog(`Renamed category to: ${name}`);
            }}
            onMoveNote={(noteId, categoryId) => {
              setNoteCategories(prev => [
                ...prev.filter(nc => nc.noteId !== noteId),
                ...(categoryId ? [{ noteId, categoryId }] : []),
              ]);
              addLog(`Moved note to ${categoryId ? 'category' : 'root'}`);
            }}
          />
        </div>

        <div className='flex-1 max-w-sm'>
          <div className='p-4 bg-gray-50 dark:bg-gray-800 rounded-lg'>
            <h4 className='text-sm font-semibold mb-3'>Activity Log</h4>
            <div className='space-y-1 text-xs font-mono max-h-80 overflow-y-auto'>
              {actionLog.length === 0 ? (
                <div className='text-gray-500'>Try interacting with the tree...</div>
              ) : (
                actionLog.map((log, index) => (
                  <div key={index} className='text-gray-700 dark:text-gray-300'>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className='mt-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg'>
            <h4 className='text-sm font-semibold mb-2'>Try These Features:</h4>
            <ul className='text-xs space-y-1'>
              <li>• Click to select items</li>
              <li>• Double-click to rename</li>
              <li>• Use create buttons</li>
              <li>• Try search functionality</li>
              <li>• Use expand/collapse</li>
              <li>• Test sorting</li>
            </ul>
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Complete workflow demonstration with all CRUD operations, search, and real-time activity logging.',
      },
    },
  },
};

// All State Comparison
export const AllStates: Story = {
  args: defaultProps,
  render: () => (
    <div className='grid grid-cols-2 gap-4'>
      <div>
        <h4 className='text-sm font-medium mb-2'>Default State</h4>
        <div className='h-64 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden'>
          <NotesTreeView {...defaultProps} />
        </div>
      </div>

      <div>
        <h4 className='text-sm font-medium mb-2'>With Selection</h4>
        <div className='h-64 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden'>
          <NotesTreeView {...defaultProps} selectedNoteId='note-1' selectedItemId='note-1' selectedItemType='note' />
        </div>
      </div>

      <div>
        <h4 className='text-sm font-medium mb-2'>With Search</h4>
        <div className='h-64 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden'>
          <NotesTreeView {...defaultProps} searchQuery='project' />
        </div>
      </div>

      <div>
        <h4 className='text-sm font-medium mb-2'>Empty State</h4>
        <div className='h-64 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden'>
          <NotesTreeView {...defaultProps} notes={[]} categories={[]} noteCategories={[]} />
        </div>
      </div>

      <div>
        <h4 className='text-sm font-medium mb-2'>Notes Only</h4>
        <div className='h-64 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden'>
          <NotesTreeView {...defaultProps} categories={[]} noteCategories={[]} />
        </div>
      </div>

      <div>
        <h4 className='text-sm font-medium mb-2'>Categories Only</h4>
        <div className='h-64 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden'>
          <NotesTreeView {...defaultProps} notes={[]} noteCategories={[]} />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side comparison of different tree view states and configurations.',
      },
    },
  },
};

// Focus Management Demo
export const FocusManagement: Story = {
  args: defaultProps,
  render: () => {
    const [focusClasses, setFocusClasses] = useState<Record<string, boolean>>({});
    const [focusState, setFocusState] = useState('unfocused');

    return (
      <div className='space-y-4'>
        <div className='p-4 bg-gray-50 dark:bg-gray-800 rounded-lg'>
          <h4 className='text-sm font-semibold mb-2'>Focus Management</h4>
          <div className='flex gap-2'>
            <button
              onClick={() => {
                setFocusClasses({ 'ring-2': true, 'ring-blue-500': true });
                setFocusState('focused');
              }}
              className='px-3 py-1 text-sm bg-blue-500 text-white rounded'
            >
              Focus Tree
            </button>
            <button
              onClick={() => {
                setFocusClasses({});
                setFocusState('unfocused');
              }}
              className='px-3 py-1 text-sm bg-gray-500 text-white rounded'
            >
              Unfocus
            </button>
          </div>
          <div className='mt-2 text-xs'>State: {focusState}</div>
        </div>

        <div className='h-64 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden'>
          <NotesTreeView
            {...defaultProps}
            focusClasses={focusClasses}
            onRegisterElement={_element => {
              console.log('Tree element registered for focus management');
            }}
            onSetFocusFromClick={() => {
              console.log('Focus set from click');
              setFocusState('click-focused');
            }}
          />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstration of focus management system with visual focus indicators.',
      },
    },
  },
};
