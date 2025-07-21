import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TreeHeader } from './tree-header';
import type { TreeNode } from '../types';

describe('TreeHeader', () => {
  let mockProps: any;
  let mockHoistedFolder: TreeNode | null;

  beforeEach(() => {
    mockHoistedFolder = null;

    mockProps = {
      hoistedFolder: mockHoistedFolder,
      handleExitHoist: vi.fn(),
      selectedItemType: null,
      handleHoistFolder: vi.fn(),
      allExpanded: false,
      handleToggleExpandAll: vi.fn(),
      sortAlphabetically: false,
      handleToggleSort: vi.fn(),
      handleDeleteSelected: vi.fn(),
      selectedItemId: null,
      onCreateNote: vi.fn(),
      onCreateFolder: vi.fn(),
    };
  });

  describe('Basic Rendering', () => {
    it('should render header with title', () => {
      render(<TreeHeader {...mockProps} />);

      expect(screen.getByText('Notes')).toBeInTheDocument();
    });

    it('should render all action buttons when not in hoist mode', () => {
      render(<TreeHeader {...mockProps} />);

      expect(screen.getByTitle('Expand All')).toBeInTheDocument();
      expect(screen.getByTitle('Sort Alphabetically')).toBeInTheDocument();
      expect(screen.getByTitle('Create Note')).toBeInTheDocument();
      expect(screen.getByTitle('Create Folder')).toBeInTheDocument();
    });

    it('should render action buttons section', () => {
      render(<TreeHeader {...mockProps} />);

      const buttonSection = screen.getByTitle('Expand All').closest('.flex');
      expect(buttonSection).toBeInTheDocument();
    });
  });

  describe('Hoist Mode Display', () => {
    beforeEach(() => {
      mockHoistedFolder = {
        id: 'hoist-1',
        name: 'Hoisted Folder',
        type: 'category',
        children: [],
      };
    });

    it('should show hoisted folder name in header', () => {
      render(<TreeHeader {...mockProps} hoistedFolder={mockHoistedFolder} />);

      expect(screen.getByText('Notes')).toBeInTheDocument();
      expect(screen.getByText('Hoisted Folder')).toBeInTheDocument();
    });

    it('should show chevron indicator in hoist mode', () => {
      render(<TreeHeader {...mockProps} hoistedFolder={mockHoistedFolder} />);

      const chevronIcon = screen.getByRole('banner')?.querySelector('.lucide-chevron-right');
      expect(chevronIcon).toBeInTheDocument();
    });

    it('should show exit hoist button in hoist mode', () => {
      render(<TreeHeader {...mockProps} hoistedFolder={mockHoistedFolder} />);

      expect(screen.getByTitle('Exit Hoist')).toBeInTheDocument();
    });

    it('should not show exit hoist button when not in hoist mode', () => {
      render(<TreeHeader {...mockProps} />);

      expect(screen.queryByTitle('Exit Hoist')).not.toBeInTheDocument();
    });
  });

  describe('Expand/Collapse Functionality', () => {
    it('should show expand all button when not all expanded', () => {
      render(<TreeHeader {...mockProps} allExpanded={false} />);

      const expandButton = screen.getByTitle('Expand All');
      expect(expandButton).toBeInTheDocument();
      expect(expandButton.querySelector('.lucide-expand')).toBeInTheDocument();
    });

    it('should show collapse all button when all expanded', () => {
      render(<TreeHeader {...mockProps} allExpanded={true} />);

      const collapseButton = screen.getByTitle('Collapse All');
      expect(collapseButton).toBeInTheDocument();
      expect(collapseButton.querySelector('.lucide-minimize-2')).toBeInTheDocument();
    });

    it('should call handleToggleExpandAll when expand/collapse button is clicked', async () => {
      const user = userEvent.setup();
      render(<TreeHeader {...mockProps} />);

      const expandButton = screen.getByTitle('Expand All');
      await user.click(expandButton);

      expect(mockProps.handleToggleExpandAll).toHaveBeenCalled();
    });

    it('should have proper button state for collapse mode', () => {
      render(<TreeHeader {...mockProps} allExpanded={true} />);

      const collapseButton = screen.getByTitle('Collapse All');
      expect(collapseButton).toHaveClass('text-blue-600');
    });
  });

  describe('Sorting Functionality', () => {
    it('should show sort button in normal state', () => {
      render(<TreeHeader {...mockProps} sortAlphabetically={false} />);

      const sortButton = screen.getByTitle('Sort Alphabetically');
      expect(sortButton).toBeInTheDocument();
      expect(sortButton.querySelector('.lucide-arrow-up-down')).toBeInTheDocument();
    });

    it('should show sort button in active state when sorting enabled', () => {
      render(<TreeHeader {...mockProps} sortAlphabetically={true} />);

      const sortButton = screen.getByTitle('Sort Alphabetically');
      expect(sortButton).toHaveClass('text-blue-600');
    });

    it('should call handleToggleSort when sort button is clicked', async () => {
      const user = userEvent.setup();
      render(<TreeHeader {...mockProps} />);

      const sortButton = screen.getByTitle('Sort Alphabetically');
      await user.click(sortButton);

      expect(mockProps.handleToggleSort).toHaveBeenCalled();
    });
  });

  describe('Creation Actions', () => {
    it('should render create note button', () => {
      render(<TreeHeader {...mockProps} />);

      const createNoteButton = screen.getByTitle('Create Note');
      expect(createNoteButton).toBeInTheDocument();
      expect(createNoteButton.querySelector('.lucide-file-text')).toBeInTheDocument();
    });

    it('should render create folder button', () => {
      render(<TreeHeader {...mockProps} />);

      const createFolderButton = screen.getByTitle('Create Folder');
      expect(createFolderButton).toBeInTheDocument();
      expect(createFolderButton.querySelector('.lucide-folder')).toBeInTheDocument();
    });

    it('should call onCreateNote when create note button is clicked', async () => {
      const user = userEvent.setup();
      render(<TreeHeader {...mockProps} />);

      const createNoteButton = screen.getByTitle('Create Note');
      await user.click(createNoteButton);

      expect(mockProps.onCreateNote).toHaveBeenCalled();
    });

    it('should call onCreateFolder when create folder button is clicked', async () => {
      const user = userEvent.setup();
      render(<TreeHeader {...mockProps} />);

      const createFolderButton = screen.getByTitle('Create Folder');
      await user.click(createFolderButton);

      expect(mockProps.onCreateFolder).toHaveBeenCalled();
    });
  });

  describe('Hoist Actions', () => {
    it('should show hoist button when category is selected', () => {
      render(<TreeHeader {...mockProps} selectedItemType='category' selectedItemId='cat-1' />);

      expect(screen.getByTitle('Hoist Folder')).toBeInTheDocument();
    });

    it('should not show hoist button when note is selected', () => {
      render(<TreeHeader {...mockProps} selectedItemType='note' selectedItemId='note-1' />);

      expect(screen.queryByTitle('Hoist Folder')).not.toBeInTheDocument();
    });

    it('should not show hoist button when nothing is selected', () => {
      render(<TreeHeader {...mockProps} />);

      expect(screen.queryByTitle('Hoist Folder')).not.toBeInTheDocument();
    });

    it('should call handleHoistFolder when hoist button is clicked', async () => {
      const user = userEvent.setup();
      render(<TreeHeader {...mockProps} selectedItemType='category' selectedItemId='cat-1' />);

      const hoistButton = screen.getByTitle('Hoist Folder');
      await user.click(hoistButton);

      expect(mockProps.handleHoistFolder).toHaveBeenCalled();
    });

    it('should call handleExitHoist when exit hoist button is clicked', async () => {
      const user = userEvent.setup();
      render(<TreeHeader {...mockProps} hoistedFolder={mockHoistedFolder} />);

      const exitHoistButton = screen.getByTitle('Exit Hoist');
      await user.click(exitHoistButton);

      expect(mockProps.handleExitHoist).toHaveBeenCalled();
    });
  });

  describe('Delete Actions', () => {
    it('should show delete button when item is selected', () => {
      render(<TreeHeader {...mockProps} selectedItemId='item-1' selectedItemType='note' />);

      expect(screen.getByTitle('Delete Selected')).toBeInTheDocument();
    });

    it('should not show delete button when nothing is selected', () => {
      render(<TreeHeader {...mockProps} />);

      expect(screen.queryByTitle('Delete Selected')).not.toBeInTheDocument();
    });

    it('should call handleDeleteSelected when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<TreeHeader {...mockProps} selectedItemId='item-1' selectedItemType='note' />);

      const deleteButton = screen.getByTitle('Delete Selected');
      await user.click(deleteButton);

      expect(mockProps.handleDeleteSelected).toHaveBeenCalled();
    });

    it('should show delete button for categories', () => {
      render(<TreeHeader {...mockProps} selectedItemId='cat-1' selectedItemType='category' />);

      const deleteButton = screen.getByTitle('Delete Selected');
      expect(deleteButton).toBeInTheDocument();
      expect(deleteButton.querySelector('.lucide-trash-2')).toBeInTheDocument();
    });

    it('should show delete button for notes', () => {
      render(<TreeHeader {...mockProps} selectedItemId='note-1' selectedItemType='note' />);

      const deleteButton = screen.getByTitle('Delete Selected');
      expect(deleteButton).toBeInTheDocument();
      expect(deleteButton.querySelector('.lucide-trash-2')).toBeInTheDocument();
    });
  });

  describe('Button States and Styling', () => {
    it('should apply active styling to sort button when sorting is enabled', () => {
      render(<TreeHeader {...mockProps} sortAlphabetically={true} />);

      const sortButton = screen.getByTitle('Sort Alphabetically');
      expect(sortButton).toHaveClass('text-blue-600');
    });

    it('should apply active styling to collapse button when all expanded', () => {
      render(<TreeHeader {...mockProps} allExpanded={true} />);

      const collapseButton = screen.getByTitle('Collapse All');
      expect(collapseButton).toHaveClass('text-blue-600');
    });

    it('should have consistent button sizing', () => {
      render(<TreeHeader {...mockProps} selectedItemId='item-1' selectedItemType='note' />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('w-8', 'h-8');
      });
    });

    it('should have proper hover states', () => {
      render(<TreeHeader {...mockProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('hover:bg-gray-200');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for all buttons', () => {
      render(<TreeHeader {...mockProps} selectedItemId='item-1' selectedItemType='category' />);

      expect(screen.getByTitle('Expand All')).toHaveAttribute('aria-label');
      expect(screen.getByTitle('Sort Alphabetically')).toHaveAttribute('aria-label');
      expect(screen.getByTitle('Create Note')).toHaveAttribute('aria-label');
      expect(screen.getByTitle('Create Folder')).toHaveAttribute('aria-label');
      expect(screen.getByTitle('Hoist Folder')).toHaveAttribute('aria-label');
      expect(screen.getByTitle('Delete Selected')).toHaveAttribute('aria-label');
    });

    it('should have proper button roles', () => {
      render(<TreeHeader {...mockProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<TreeHeader {...mockProps} />);

      const firstButton = screen.getByTitle('Expand All');
      await user.tab();

      expect(firstButton).toHaveFocus();
    });

    it('should support keyboard activation', async () => {
      const user = userEvent.setup();
      render(<TreeHeader {...mockProps} />);

      const expandButton = screen.getByTitle('Expand All');
      expandButton.focus();
      await user.keyboard('{Enter}');

      expect(mockProps.handleToggleExpandAll).toHaveBeenCalled();
    });
  });

  describe('Complex Scenarios', () => {
    it('should show all relevant buttons when category is selected', () => {
      render(<TreeHeader {...mockProps} selectedItemId='cat-1' selectedItemType='category' />);

      expect(screen.getByTitle('Expand All')).toBeInTheDocument();
      expect(screen.getByTitle('Sort Alphabetically')).toBeInTheDocument();
      expect(screen.getByTitle('Create Note')).toBeInTheDocument();
      expect(screen.getByTitle('Create Folder')).toBeInTheDocument();
      expect(screen.getByTitle('Hoist Folder')).toBeInTheDocument();
      expect(screen.getByTitle('Delete Selected')).toBeInTheDocument();
    });

    it('should show correct buttons when note is selected', () => {
      render(<TreeHeader {...mockProps} selectedItemId='note-1' selectedItemType='note' />);

      expect(screen.getByTitle('Expand All')).toBeInTheDocument();
      expect(screen.getByTitle('Sort Alphabetically')).toBeInTheDocument();
      expect(screen.getByTitle('Create Note')).toBeInTheDocument();
      expect(screen.getByTitle('Create Folder')).toBeInTheDocument();
      expect(screen.queryByTitle('Hoist Folder')).not.toBeInTheDocument();
      expect(screen.getByTitle('Delete Selected')).toBeInTheDocument();
    });

    it('should handle hoist mode with all other features', () => {
      render(
        <TreeHeader
          {...mockProps}
          hoistedFolder={mockHoistedFolder}
          selectedItemId='cat-1'
          selectedItemType='category'
          allExpanded={true}
          sortAlphabetically={true}
        />
      );

      expect(screen.getByText('Hoisted Folder')).toBeInTheDocument();
      expect(screen.getByTitle('Exit Hoist')).toBeInTheDocument();
      expect(screen.getByTitle('Collapse All')).toBeInTheDocument();
      expect(screen.getByTitle('Sort Alphabetically')).toHaveClass('text-blue-600');
      expect(screen.getByTitle('Hoist Folder')).toBeInTheDocument();
      expect(screen.getByTitle('Delete Selected')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null hoisted folder gracefully', () => {
      render(<TreeHeader {...mockProps} hoistedFolder={null} />);

      expect(screen.getByText('Notes')).toBeInTheDocument();
      expect(screen.queryByTitle('Exit Hoist')).not.toBeInTheDocument();
    });

    it('should handle empty hoisted folder name', () => {
      const emptyNameFolder = {
        id: 'empty',
        name: '',
        type: 'category' as const,
        children: [],
      };

      render(<TreeHeader {...mockProps} hoistedFolder={emptyNameFolder} />);

      expect(screen.getByText('Notes')).toBeInTheDocument();
    });

    it('should handle missing selectedItemType', () => {
      render(<TreeHeader {...mockProps} selectedItemId='item-1' selectedItemType={null} />);

      expect(screen.queryByTitle('Hoist Folder')).not.toBeInTheDocument();
      expect(screen.getByTitle('Delete Selected')).toBeInTheDocument();
    });

    it('should handle missing selectedItemId', () => {
      render(<TreeHeader {...mockProps} selectedItemId={null} selectedItemType='category' />);

      expect(screen.queryByTitle('Hoist Folder')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Delete Selected')).not.toBeInTheDocument();
    });
  });

  describe('Event Handling', () => {
    it('should not propagate click events from buttons', async () => {
      const headerClickSpy = vi.fn();
      const user = userEvent.setup();

      render(
        <div onClick={headerClickSpy}>
          <TreeHeader {...mockProps} />
        </div>
      );

      const expandButton = screen.getByTitle('Expand All');
      await user.click(expandButton);

      expect(mockProps.handleToggleExpandAll).toHaveBeenCalled();
      expect(headerClickSpy).not.toHaveBeenCalled();
    });

    it('should handle rapid button clicks gracefully', async () => {
      const user = userEvent.setup();
      render(<TreeHeader {...mockProps} />);

      const expandButton = screen.getByTitle('Expand All');

      // Simulate rapid clicks
      await user.click(expandButton);
      await user.click(expandButton);
      await user.click(expandButton);

      expect(mockProps.handleToggleExpandAll).toHaveBeenCalledTimes(3);
    });
  });

  describe('Visual Consistency', () => {
    it('should maintain consistent icon sizes', () => {
      render(<TreeHeader {...mockProps} selectedItemId='cat-1' selectedItemType='category' />);

      const icons = document.querySelectorAll('svg');
      icons.forEach(icon => {
        // Icons should be size 16 (size={16} prop)
        expect(icon).toHaveAttribute('width', '16');
        expect(icon).toHaveAttribute('height', '16');
      });
    });

    it('should use consistent button styling', () => {
      render(<TreeHeader {...mockProps} selectedItemId='item-1' selectedItemType='note' />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('p-1', 'rounded', 'transition-colors');
      });
    });
  });
});
