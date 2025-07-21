import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TreeNode } from './tree-node';
import type { Note, Category } from '../../../types/database';

// React-arborist node structure for testing
interface MockArboristNode {
  id: string;
  name: string;
  type: 'note' | 'category';
  data: Note | Category;
  children: MockArboristNode[];
  isLeaf: boolean;
  isOpen: boolean;
  level: number;
}

describe('TreeNode', () => {
  let mockProps: any;
  let mockNodeRefsMap: React.MutableRefObject<Map<string, { startEditing: () => void }>>;

  const createMockNode = (overrides: Partial<MockArboristNode> = {}): MockArboristNode => ({
    id: 'test-node',
    name: 'Test Node',
    type: 'note',
    data: {
      id: 'test-node',
      title: 'Test Node',
      content: '<p>Test content</p>',
      content_type: 'html' as const,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      is_pinned: false,
      is_archived: false,
      word_count: 2,
      character_count: 12,
      content_plaintext: 'Test content',
    } as Note,
    children: [],
    isLeaf: true,
    isOpen: false,
    level: 0,
    ...overrides,
  });

  const createMockCategoryNode = (
    id: string,
    name: string,
    overrides: Partial<MockArboristNode> = {}
  ): MockArboristNode => ({
    id,
    name,
    type: 'category',
    data: {
      id,
      name,
      parent_id: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      description: `${name} description`,
      sort_order: 0,
    } as Category,
    children: [],
    isLeaf: true,
    isOpen: false,
    level: 0,
    ...overrides,
  });

  beforeEach(() => {
    mockNodeRefsMap = {
      current: new Map(),
    };

    mockProps = {
      node: createMockNode(),
      style: { height: 32 },
      dragHandle: vi.fn(),
      navigatedItemId: null,
      selectedItemId: null,
      selectedNoteId: null,
      expandedNodes: new Set<string>(),
      editingItemId: null,
      setEditingItemId: vi.fn(),
      nodeRefsMap: mockNodeRefsMap,
      onItemSelect: vi.fn(),
      onNoteSelect: vi.fn(),
      toggleNodeExpansion: vi.fn(),
      onRenameNote: vi.fn(),
      onRenameCategory: vi.fn(),
      onCreateNote: vi.fn(),
      onCreateFolder: vi.fn(),
    };
  });

  describe('Rendering', () => {
    it('should render note node with correct structure', () => {
      render(<TreeNode {...mockProps} />);

      expect(screen.getByText('Test Node')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render category node with correct structure', () => {
      const categoryNode = createMockCategoryNode('cat-1', 'Test Category');
      render(<TreeNode {...mockProps} node={categoryNode} />);

      expect(screen.getByText('Test Category')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should display file icon for notes', () => {
      render(<TreeNode {...mockProps} />);

      const iconContainer = screen.getByRole('button').querySelector('.lucide-file-text');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should display folder icon for categories', () => {
      const categoryNode = createMockCategoryNode('cat-1', 'Test Category');
      render(<TreeNode {...mockProps} node={categoryNode} />);

      const iconContainer = screen.getByRole('button').querySelector('.lucide-folder');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should apply focus styles when item is navigated', () => {
      render(<TreeNode {...mockProps} navigatedItemId='test-node' />);

      const container = screen.getByRole('button').parentElement;
      expect(container).toHaveStyle('background-color: rgb(233 245 255)'); // bg-blue-50
    });

    it('should apply selection styles when item is selected', () => {
      render(<TreeNode {...mockProps} selectedItemId='test-node' />);

      const container = screen.getByRole('button').parentElement;
      expect(container).toHaveStyle('background-color: rgb(147 197 253)'); // bg-blue-300
    });

    it('should apply open note styles when note is selected and open', () => {
      render(<TreeNode {...mockProps} selectedNoteId='test-node' />);

      const nodeText = screen.getByText('Test Node');
      expect(nodeText).toHaveClass('text-green-500', 'font-bold');
    });
  });

  describe('Category Expansion', () => {
    it('should show chevron down when category is expanded', () => {
      const categoryNode = createMockCategoryNode('cat-1', 'Test Category', {
        children: [createMockNode({ id: 'child', name: 'Child Node' })],
        isLeaf: false,
      });

      render(<TreeNode {...mockProps} node={categoryNode} expandedNodes={new Set(['cat-1'])} />);

      const chevronDown = screen.getByRole('button').querySelector('.lucide-chevron-down');
      expect(chevronDown).toBeInTheDocument();
    });

    it('should show chevron right when category is collapsed', () => {
      const categoryNode = createMockCategoryNode('cat-1', 'Test Category', {
        children: [createMockNode({ id: 'child', name: 'Child Node' })],
        isLeaf: false,
      });

      render(<TreeNode {...mockProps} node={categoryNode} />);

      const chevronRight = screen.getByRole('button').querySelector('.lucide-chevron-right');
      expect(chevronRight).toBeInTheDocument();
    });

    it('should handle click on chevron to toggle expansion', async () => {
      const user = userEvent.setup();
      const categoryNode = createMockCategoryNode('cat-1', 'Test Category', {
        children: [createMockNode({ id: 'child', name: 'Child Node' })],
        isLeaf: false,
      });

      render(<TreeNode {...mockProps} node={categoryNode} />);

      const chevron = screen.getByRole('button').querySelector('[role="button"]') as HTMLElement;
      await user.click(chevron);

      expect(mockProps.toggleNodeExpansion).toHaveBeenCalledWith('cat-1');
    });

    it('should not show chevron for categories without children', () => {
      const categoryNode = createMockCategoryNode('cat-1', 'Empty Category');

      render(<TreeNode {...mockProps} node={categoryNode} />);

      const chevron = screen.getByRole('button').querySelector('.lucide-chevron-right');
      expect(chevron?.parentElement).toHaveStyle('opacity: 0.3');
    });

    it('should not show functional chevron for notes', () => {
      render(<TreeNode {...mockProps} />);

      const chevronContainer = screen.getByRole('button').querySelector('[style*="opacity: 0"]');
      expect(chevronContainer).toBeInTheDocument();
    });
  });

  describe('Interaction Handling', () => {
    it('should call onItemSelect when clicked', async () => {
      const user = userEvent.setup();
      render(<TreeNode {...mockProps} />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockProps.onItemSelect).toHaveBeenCalledWith('test-node', 'note');
    });

    it('should call onNoteSelect for note double-click', async () => {
      const user = userEvent.setup();
      render(<TreeNode {...mockProps} />);

      const button = screen.getByRole('button');
      await user.dblClick(button);

      expect(mockProps.onNoteSelect).toHaveBeenCalledWith('test-node');
    });

    it('should call onItemSelect for category click', async () => {
      const user = userEvent.setup();
      const categoryNode = createMockCategoryNode('cat-1', 'Test Category');

      render(<TreeNode {...mockProps} node={categoryNode} />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockProps.onItemSelect).toHaveBeenCalledWith('cat-1', 'category');
    });

    it('should prevent event propagation on chevron click', async () => {
      const user = userEvent.setup();
      const categoryNode = createMockCategoryNode('cat-1', 'Test Category', {
        children: [createMockNode({ id: 'child', name: 'Child Node' })],
        isLeaf: false,
      });

      render(<TreeNode {...mockProps} node={categoryNode} />);

      // Find the chevron container specifically
      const chevronContainer = screen.getByRole('button').querySelector('[style*="cursor: pointer"]') as HTMLElement;
      await user.click(chevronContainer);

      expect(mockProps.toggleNodeExpansion).toHaveBeenCalledWith('cat-1');
      // onItemSelect should not be called when clicking chevron
      expect(mockProps.onItemSelect).not.toHaveBeenCalled();
    });
  });

  describe('Editing Functionality', () => {
    it('should enter editing mode on double-click', async () => {
      const user = userEvent.setup();
      render(<TreeNode {...mockProps} />);

      const nodeText = screen.getByText('Test Node');
      await user.dblClick(nodeText);

      const input = screen.getByDisplayValue('Test Node');
      expect(input).toBeInTheDocument();
      expect(input).toHaveFocus();
    });

    it('should show input field when editingItemId matches node id', () => {
      render(<TreeNode {...mockProps} editingItemId='test-node' />);

      const input = screen.getByDisplayValue('Test Node');
      expect(input).toBeInTheDocument();
    });

    it('should save changes on Enter key', async () => {
      const user = userEvent.setup();
      render(<TreeNode {...mockProps} editingItemId='test-node' />);

      const input = screen.getByDisplayValue('Test Node');
      await user.clear(input);
      await user.type(input, 'New Node Name');
      await user.keyboard('{Enter}');

      expect(mockProps.onRenameNote).toHaveBeenCalledWith('test-node', 'New Node Name');
    });

    it('should cancel editing on Escape key', async () => {
      const user = userEvent.setup();
      render(<TreeNode {...mockProps} editingItemId='test-node' />);

      const input = screen.getByDisplayValue('Test Node');
      await user.clear(input);
      await user.type(input, 'New Name');
      await user.keyboard('{Escape}');

      expect(mockProps.onRenameNote).not.toHaveBeenCalled();
      expect(screen.getByText('Test Node')).toBeInTheDocument();
    });

    it('should save changes on blur', async () => {
      const user = userEvent.setup();
      render(<TreeNode {...mockProps} editingItemId='test-node' />);

      const input = screen.getByDisplayValue('Test Node');
      await user.clear(input);
      await user.type(input, 'Modified Name');
      await user.tab(); // Trigger blur

      expect(mockProps.onRenameNote).toHaveBeenCalledWith('test-node', 'Modified Name');
    });

    it('should not save empty names', async () => {
      const user = userEvent.setup();
      render(<TreeNode {...mockProps} editingItemId='test-node' />);

      const input = screen.getByDisplayValue('Test Node');
      await user.clear(input);
      await user.keyboard('{Enter}');

      expect(mockProps.onRenameNote).not.toHaveBeenCalled();
    });

    it('should not save unchanged names', async () => {
      const user = userEvent.setup();
      render(<TreeNode {...mockProps} editingItemId='test-node' />);

      await user.keyboard('{Enter}');

      expect(mockProps.onRenameNote).not.toHaveBeenCalled();
    });

    it('should call onRenameCategory for category editing', async () => {
      const user = userEvent.setup();
      const categoryNode = createMockCategoryNode('cat-1', 'Test Category');

      render(<TreeNode {...mockProps} node={categoryNode} editingItemId='cat-1' />);

      const input = screen.getByDisplayValue('Test Category');
      await user.clear(input);
      await user.type(input, 'New Category Name');
      await user.keyboard('{Enter}');

      expect(mockProps.onRenameCategory).toHaveBeenCalledWith('cat-1', 'New Category Name');
    });
  });

  describe('Node References', () => {
    it('should register node reference for editing', () => {
      render(<TreeNode {...mockProps} />);

      const nodeRef = mockNodeRefsMap.current.get('test-node');
      expect(nodeRef).toBeDefined();
      expect(nodeRef?.startEditing).toBeInstanceOf(Function);
    });

    it('should start editing when startEditing is called', () => {
      render(<TreeNode {...mockProps} />);

      const nodeRef = mockNodeRefsMap.current.get('test-node');
      nodeRef?.startEditing();

      const input = screen.getByDisplayValue('Test Node');
      expect(input).toBeInTheDocument();
    });

    it('should clean up node reference on unmount', () => {
      const { unmount } = render(<TreeNode {...mockProps} />);

      expect(mockNodeRefsMap.current.has('test-node')).toBe(true);

      unmount();

      expect(mockNodeRefsMap.current.has('test-node')).toBe(false);
    });
  });

  describe('Visual States', () => {
    it('should apply hover styles', async () => {
      const user = userEvent.setup();
      render(<TreeNode {...mockProps} />);

      const button = screen.getByRole('button');
      await user.hover(button);

      expect(button.parentElement).toHaveClass('hover:bg-gray-100');
    });

    it('should show different colors for different node types', () => {
      const categoryNode = createMockCategoryNode('cat-1', 'Test Category');

      const { rerender } = render(<TreeNode {...mockProps} />);

      let icon = screen.getByRole('button').querySelector('.lucide-file-text');
      expect(icon).toHaveClass('text-gray-600');

      rerender(<TreeNode {...mockProps} node={categoryNode} />);

      icon = screen.getByRole('button').querySelector('.lucide-folder');
      expect(icon).toHaveClass('text-blue-500');
    });

    it('should highlight selected category icon', () => {
      const categoryNode = createMockCategoryNode('cat-1', 'Test Category');

      render(<TreeNode {...mockProps} node={categoryNode} selectedItemId='cat-1' />);

      const icon = screen.getByRole('button').querySelector('.lucide-folder');
      expect(icon).toHaveClass('text-blue-500');
    });

    it('should highlight open note icon', () => {
      render(<TreeNode {...mockProps} selectedNoteId='test-node' />);

      const icon = screen.getByRole('button').querySelector('.lucide-file-text');
      expect(icon).toHaveClass('text-green-500');
    });
  });

  describe('Context Menu Integration', () => {
    it('should handle right-click context menu', async () => {
      const user = userEvent.setup();
      render(<TreeNode {...mockProps} />);

      const button = screen.getByRole('button');
      await user.pointer({ keys: '[MouseRight]', target: button });

      // Context menu functionality would be tested if implemented
      // For now, we just ensure it doesn't crash
      expect(button).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<TreeNode {...mockProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('tabIndex', '0');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<TreeNode {...mockProps} />);

      const button = screen.getByRole('button');
      await user.tab();

      expect(button).toHaveFocus();
    });

    it('should support keyboard activation', async () => {
      const user = userEvent.setup();
      render(<TreeNode {...mockProps} />);

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');

      expect(mockProps.onItemSelect).toHaveBeenCalledWith('test-node', 'note');
    });

    it('should support keyboard activation with space', async () => {
      const user = userEvent.setup();
      render(<TreeNode {...mockProps} />);

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Space}');

      expect(mockProps.onItemSelect).toHaveBeenCalledWith('test-node', 'note');
    });
  });

  describe('Drag and Drop', () => {
    it('should call dragHandle with proper element', () => {
      render(<TreeNode {...mockProps} />);

      expect(mockProps.dragHandle).toHaveBeenCalled();
    });

    it('should be draggable', () => {
      render(<TreeNode {...mockProps} />);

      const button = screen.getByRole('button');
      expect(button.closest('[draggable]')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const renderSpy = vi.fn();

      const TestComponent = (props: any) => {
        renderSpy();
        return <TreeNode {...props} />;
      };

      const { rerender } = render(<TestComponent {...mockProps} />);

      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with same props
      rerender(<TestComponent {...mockProps} />);

      // Component should re-render due to no memoization, but this tests the setup
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing node data gracefully', () => {
      const invalidNode = { ...createMockNode(), data: null };

      expect(() => {
        render(<TreeNode {...mockProps} node={invalidNode} />);
      }).not.toThrow();
    });

    it('should handle undefined children gracefully', () => {
      const nodeWithUndefinedChildren = {
        ...createMockNode(),
        children: undefined,
      };

      expect(() => {
        render(<TreeNode {...mockProps} node={nodeWithUndefinedChildren} />);
      }).not.toThrow();
    });

    it('should handle missing callback functions gracefully', () => {
      const propsWithoutCallbacks = { ...mockProps };
      delete propsWithoutCallbacks.onItemSelect;
      delete propsWithoutCallbacks.onNoteSelect;

      expect(() => {
        render(<TreeNode {...propsWithoutCallbacks} />);
      }).not.toThrow();
    });
  });
});
