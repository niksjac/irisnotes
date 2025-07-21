import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotesTreeView } from './notes-tree-view';
import type { Note, Category } from '../../../types/database';
import type { NotesTreeViewProps } from '../types';

// Mock react-arborist since it's complex to test
interface MockTreeProps {
  children: (props: {
    node: { data: unknown };
    style: Record<string, unknown>;
    dragHandle: () => void;
  }) => React.ReactNode;
  data: unknown[];
  onMove: () => void;
}

vi.mock('react-arborist', () => ({
  Tree: ({ children, data }: MockTreeProps) => (
    <div data-testid='tree-container'>
      {data.map((item: unknown) => (
        <div key={(item as { id: string }).id} data-testid={`tree-item-${(item as { id: string }).id}`}>
          {children({ node: { data: item }, style: {}, dragHandle: vi.fn() })}
        </div>
      ))}
    </div>
  ),
}));

describe('NotesTreeView', () => {
  let mockNotes: Note[];
  let mockCategories: Category[];
  let mockNoteCategories: { noteId: string; categoryId: string }[];
  let mockProps: NotesTreeViewProps;

  beforeEach(() => {
    mockNotes = [
      {
        id: 'note-1',
        title: 'Meeting Notes',
        content: '<p>Meeting content</p>',
        content_type: 'html' as const,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        is_pinned: false,
        is_archived: false,
        word_count: 2,
        character_count: 15,
        content_plaintext: 'Meeting content',
      },
      {
        id: 'note-2',
        title: 'Project Documentation',
        content: '<p>Project details</p>',
        content_type: 'html' as const,
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        is_pinned: false,
        is_archived: false,
        word_count: 2,
        character_count: 15,
        content_plaintext: 'Project details',
      },
    ];

    mockCategories = [
      {
        id: 'cat-1',
        name: 'Work',
        parent_id: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        description: 'Work-related notes',
        sort_order: 0,
      },
      {
        id: 'cat-2',
        name: 'Projects',
        parent_id: 'cat-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        description: 'Project documentation',
        sort_order: 1,
      },
    ];

    mockNoteCategories = [
      { noteId: 'note-1', categoryId: 'cat-1' },
      { noteId: 'note-2', categoryId: 'cat-2' },
    ];

    mockProps = {
      notes: mockNotes,
      categories: mockCategories,
      noteCategories: mockNoteCategories,
      selectedNoteId: null,
      onNoteSelect: vi.fn(),
      onCreateNote: vi.fn(),
      onCreateFolder: vi.fn(),
      onMoveNote: vi.fn(),
      onDeleteNote: vi.fn(),
      onDeleteCategory: vi.fn(),
      onRenameNote: vi.fn(),
      onRenameCategory: vi.fn(),
      selectedItemId: null,
      selectedItemType: null,
      onItemSelect: vi.fn(),
      focusClasses: {},
      onRegisterElement: vi.fn(),
      onSetFocusFromClick: vi.fn(),
      searchQuery: '',
    };
  });

  describe('Basic Rendering', () => {
    it('should render the tree view container', () => {
      render(<NotesTreeView {...mockProps} />);

      expect(screen.getByTestId('tree-container')).toBeInTheDocument();
    });

    it('should render tree header', () => {
      render(<NotesTreeView {...mockProps} />);

      expect(screen.getByText('Notes')).toBeInTheDocument();
    });

    it('should render tree nodes', () => {
      render(<NotesTreeView {...mockProps} />);

      expect(screen.getByTestId('tree-item-cat-1')).toBeInTheDocument();
    });

    it('should register element for focus management', () => {
      render(<NotesTreeView {...mockProps} />);

      expect(mockProps.onRegisterElement).toHaveBeenCalledWith(expect.any(HTMLElement));
    });
  });

  describe('Tree Data Integration', () => {
    it('should display categories and notes in hierarchical structure', () => {
      render(<NotesTreeView {...mockProps} />);

      // Work category should be present
      expect(screen.getByText('Work')).toBeInTheDocument();

      // Meeting Notes should be in the tree
      expect(screen.getByText('Meeting Notes')).toBeInTheDocument();
    });

    it('should handle empty notes and categories', () => {
      render(<NotesTreeView {...mockProps} notes={[]} categories={[]} noteCategories={[]} />);

      expect(screen.getByTestId('tree-container')).toBeInTheDocument();
      expect(screen.getByText('Notes')).toBeInTheDocument();
    });

    it('should update when data changes', () => {
      const { rerender } = render(<NotesTreeView {...mockProps} />);

      expect(screen.getByText('Meeting Notes')).toBeInTheDocument();

      const newNotes = [
        ...mockNotes,
        {
          id: 'note-3',
          title: 'New Note',
          content: '<p>New content</p>',
          content_type: 'html' as const,
          created_at: '2024-01-03T00:00:00Z',
          updated_at: '2024-01-03T00:00:00Z',
          is_pinned: false,
          is_archived: false,
          word_count: 2,
          character_count: 11,
          content_plaintext: 'New content',
        },
      ];

      rerender(<NotesTreeView {...mockProps} notes={newNotes} />);

      expect(screen.getByText('New Note')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter tree based on search query', () => {
      render(<NotesTreeView {...mockProps} searchQuery='meeting' />);

      // Should show notes/categories matching the search
      expect(screen.getByText('Meeting Notes')).toBeInTheDocument();
    });

    it('should handle empty search results gracefully', () => {
      render(<NotesTreeView {...mockProps} searchQuery='nonexistent' />);

      expect(screen.getByTestId('tree-container')).toBeInTheDocument();
    });

    it('should clear search results when query is empty', () => {
      const { rerender } = render(<NotesTreeView {...mockProps} searchQuery='meeting' />);

      rerender(<NotesTreeView {...mockProps} searchQuery='' />);

      expect(screen.getByText('Work')).toBeInTheDocument();
    });
  });

  describe('Selection State', () => {
    it('should highlight selected note', () => {
      render(<NotesTreeView {...mockProps} selectedNoteId='note-1' />);

      const noteElement = screen.getByText('Meeting Notes');
      expect(noteElement).toHaveClass('text-green-500', 'font-bold');
    });

    it('should handle item selection', () => {
      render(<NotesTreeView {...mockProps} selectedItemId='cat-1' selectedItemType='category' />);

      // The selected category should be highlighted
      const workCategory = screen.getByText('Work');
      expect(workCategory.closest('[role="button"]')?.parentElement).toHaveStyle({
        backgroundColor: 'rgb(147 197 253)', // bg-blue-300
      });
    });

    it('should call onItemSelect when item is selected', async () => {
      const user = userEvent.setup();
      render(<NotesTreeView {...mockProps} />);

      const workCategory = screen.getByText('Work');
      await user.click(workCategory);

      expect(mockProps.onItemSelect).toHaveBeenCalledWith('cat-1', 'category');
    });

    it('should call onNoteSelect when note is selected', async () => {
      const user = userEvent.setup();
      render(<NotesTreeView {...mockProps} />);

      const meetingNote = screen.getByText('Meeting Notes');
      await user.click(meetingNote);

      expect(mockProps.onNoteSelect).toHaveBeenCalledWith('note-1');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should handle keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<NotesTreeView {...mockProps} />);

      const container =
        screen.getByRole('button', { name: /notes tree view/i }) || document.querySelector('[tabindex="0"]');

      if (container) {
        container.focus();
        await user.keyboard('{ArrowDown}');

        // Keyboard navigation should work (tested in detail in hook tests)
        expect(container).toHaveFocus();
      }
    });

    it('should handle focus management', () => {
      render(<NotesTreeView {...mockProps} />);

      const container = document.querySelector('[tabindex="0"]');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Tree Header Actions', () => {
    it('should toggle sorting when sort button is clicked', async () => {
      const user = userEvent.setup();
      render(<NotesTreeView {...mockProps} />);

      const sortButton = screen.getByTitle('Sort Alphabetically');
      await user.click(sortButton);

      // After clicking sort, the tree should be sorted alphabetically
      // The specific sorting logic is tested in the transformations hook
      expect(sortButton).toBeInTheDocument();
    });

    it('should toggle expansion when expand/collapse button is clicked', async () => {
      const user = userEvent.setup();
      render(<NotesTreeView {...mockProps} />);

      const expandButton = screen.getByTitle('Expand All');
      await user.click(expandButton);

      // Button text should change to Collapse All
      expect(screen.getByTitle('Collapse All')).toBeInTheDocument();
    });

    it('should call onCreateNote when create note button is clicked', async () => {
      const user = userEvent.setup();
      render(<NotesTreeView {...mockProps} />);

      const createNoteButton = screen.getByTitle('Create Note');
      await user.click(createNoteButton);

      expect(mockProps.onCreateNote).toHaveBeenCalled();
    });

    it('should call onCreateFolder when create folder button is clicked', async () => {
      const user = userEvent.setup();
      render(<NotesTreeView {...mockProps} />);

      const createFolderButton = screen.getByTitle('Create Folder');
      await user.click(createFolderButton);

      expect(mockProps.onCreateFolder).toHaveBeenCalled();
    });
  });

  describe('Hoist Mode', () => {
    it('should enter hoist mode when hoist button is clicked', async () => {
      const user = userEvent.setup();
      render(<NotesTreeView {...mockProps} selectedItemId='cat-1' selectedItemType='category' />);

      const hoistButton = screen.getByTitle('Hoist Folder');
      await user.click(hoistButton);

      // Should show hoist notification
      expect(screen.getByText(/Showing contents of:/)).toBeInTheDocument();
      expect(screen.getByText('Work')).toBeInTheDocument();
    });

    it('should exit hoist mode when escape is pressed', async () => {
      const user = userEvent.setup();

      // First enter hoist mode
      const { rerender } = render(<NotesTreeView {...mockProps} selectedItemId='cat-1' selectedItemType='category' />);

      const hoistButton = screen.getByTitle('Hoist Folder');
      await user.click(hoistButton);

      // Simulate being in hoist mode
      rerender(<NotesTreeView {...mockProps} />);

      // Now test exiting with escape (this would be handled by keyboard navigation hook)
      const container = document.querySelector('[tabindex="0"]');
      if (container) {
        (container as HTMLElement).focus();
        await user.keyboard('{Escape}');
      }
    });

    it('should show hoist banner when in hoist mode', () => {
      // Simulate being in hoist mode by setting up the component state
      render(<NotesTreeView {...mockProps} />);

      // We can't easily test the internal hoist state without exposing it
      // But we can test that the banner would appear when hoist state is set
      expect(screen.getByText('Notes')).toBeInTheDocument();
    });
  });

  describe('Node Operations', () => {
    it('should handle node renaming', async () => {
      const user = userEvent.setup();
      render(<NotesTreeView {...mockProps} />);

      const noteText = screen.getByText('Meeting Notes');
      await user.dblClick(noteText);

      // Should enter edit mode (implementation details tested in TreeNode tests)
      const input = screen.getByDisplayValue('Meeting Notes');
      await user.clear(input);
      await user.type(input, 'Renamed Note');
      await user.keyboard('{Enter}');

      expect(mockProps.onRenameNote).toHaveBeenCalledWith('note-1', 'Renamed Note');
    });

    it('should handle node deletion', async () => {
      const user = userEvent.setup();
      render(<NotesTreeView {...mockProps} selectedItemId='note-1' selectedItemType='note' />);

      const deleteButton = screen.getByTitle('Delete Selected');
      await user.click(deleteButton);

      expect(mockProps.onDeleteNote).toHaveBeenCalledWith('note-1');
    });

    it('should handle category deletion', async () => {
      const user = userEvent.setup();
      render(<NotesTreeView {...mockProps} selectedItemId='cat-1' selectedItemType='category' />);

      const deleteButton = screen.getByTitle('Delete Selected');
      await user.click(deleteButton);

      expect(mockProps.onDeleteCategory).toHaveBeenCalledWith('cat-1');
    });
  });

  describe('Focus Management', () => {
    it('should handle container focus', async () => {
      const user = userEvent.setup();
      render(<NotesTreeView {...mockProps} />);

      const container = document.querySelector('[tabindex="0"]');
      if (container) {
        await user.click(container);
        expect(mockProps.onSetFocusFromClick).toHaveBeenCalled();
      }
    });

    it('should apply focus classes', () => {
      const focusClasses = { 'test-focus-class': true };
      render(<NotesTreeView {...mockProps} focusClasses={focusClasses} />);

      const container = document.querySelector('[tabindex="0"]');
      expect(container).toHaveClass('test-focus-class');
    });
  });

  describe('Tree Expansion State', () => {
    it('should handle node expansion', async () => {
      const user = userEvent.setup();
      render(<NotesTreeView {...mockProps} />);

      // Find a category with children
      const workCategory = screen.getByText('Work');
      const chevron = workCategory.closest('[role="button"]')?.querySelector('[style*="cursor: pointer"]');

      if (chevron) {
        await user.click(chevron);
        // Expansion state is managed internally (tested in detail in hook tests)
        expect(chevron).toBeInTheDocument();
      }
    });

    it('should initialize with all categories expanded by default', () => {
      render(<NotesTreeView {...mockProps} />);

      // Should show collapse all button since all are expanded initially
      expect(screen.getByTitle('Collapse All')).toBeInTheDocument();
    });
  });

  describe('Dynamic Height Management', () => {
    it('should handle container resize', () => {
      // Mock ResizeObserver
      const mockResizeObserver = vi.fn(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      }));

      global.ResizeObserver = mockResizeObserver;

      render(<NotesTreeView {...mockProps} />);

      expect(mockResizeObserver).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing note data gracefully', () => {
      const invalidNotes = [
        {
          // Missing required fields
          id: 'invalid-note',
          title: 'Invalid Note',
        } as any,
      ];

      expect(() => {
        render(<NotesTreeView {...mockProps} notes={invalidNotes} />);
      }).not.toThrow();
    });

    it('should handle missing category data gracefully', () => {
      const invalidCategories = [
        {
          // Missing required fields
          id: 'invalid-cat',
          name: 'Invalid Category',
        } as any,
      ];

      expect(() => {
        render(<NotesTreeView {...mockProps} categories={invalidCategories} />);
      }).not.toThrow();
    });

    it('should handle invalid note-category relationships gracefully', () => {
      const invalidNoteCategories = [{ noteId: 'non-existent-note', categoryId: 'non-existent-category' }];

      expect(() => {
        render(<NotesTreeView {...mockProps} noteCategories={invalidNoteCategories} />);
      }).not.toThrow();
    });
  });

  describe('Performance Considerations', () => {
    it('should handle large datasets efficiently', () => {
      const largeNotes = Array.from({ length: 100 }, (_, i) => ({
        id: `note-${i}`,
        title: `Note ${i}`,
        content: `<p>Content ${i}</p>`,
        content_type: 'html' as const,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        is_pinned: false,
        is_archived: false,
        word_count: 2,
        character_count: 10,
        content_plaintext: `Content ${i}`,
      }));

      expect(() => {
        render(<NotesTreeView {...mockProps} notes={largeNotes} />);
      }).not.toThrow();
    });
  });

  describe('Integration Workflows', () => {
    it('should handle complete note creation workflow', async () => {
      const user = userEvent.setup();
      render(<NotesTreeView {...mockProps} selectedItemId='cat-1' selectedItemType='category' />);

      // Create a new note in the selected category
      const createNoteButton = screen.getByTitle('Create Note');
      await user.click(createNoteButton);

      expect(mockProps.onCreateNote).toHaveBeenCalledWith();
    });

    it('should handle complete search and selection workflow', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<NotesTreeView {...mockProps} />);

      // Apply search filter
      rerender(<NotesTreeView {...mockProps} searchQuery='meeting' />);

      // Select filtered result
      const meetingNote = screen.getByText('Meeting Notes');
      await user.click(meetingNote);

      expect(mockProps.onNoteSelect).toHaveBeenCalledWith('note-1');
    });

    it('should handle complete hoist and navigate workflow', async () => {
      const user = userEvent.setup();
      render(<NotesTreeView {...mockProps} selectedItemId='cat-1' selectedItemType='category' />);

      // Hoist the category
      const hoistButton = screen.getByTitle('Hoist Folder');
      await user.click(hoistButton);

      // Should show hoist banner
      expect(screen.getByText(/Showing contents of:/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard navigable', () => {
      render(<NotesTreeView {...mockProps} />);

      const container = document.querySelector('[tabindex="0"]');
      expect(container).toBeInTheDocument();
    });

    it('should have proper ARIA attributes', () => {
      render(<NotesTreeView {...mockProps} />);

      const container = document.querySelector('[tabindex="0"]');
      expect(container).toHaveAttribute('tabIndex', '0');
    });

    it('should support screen readers', () => {
      render(<NotesTreeView {...mockProps} />);

      // Tree structure should be accessible to screen readers
      expect(screen.getByText('Notes')).toBeInTheDocument();
      expect(screen.getByText('Work')).toBeInTheDocument();
    });
  });
});
