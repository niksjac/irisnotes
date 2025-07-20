import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTreeData } from './use-tree-data';
import type { Note, Category } from '../../../types/database';

describe('useTreeData', () => {
  let mockNotes: Note[];
  let mockCategories: Category[];
  let mockNoteCategories: { noteId: string; categoryId: string }[];

  beforeEach(() => {
    mockNotes = [
      {
        id: 'note-1',
        title: 'Meeting Notes',
        content: '<p>Meeting content</p>',
        content_type: 'html',
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
        content_type: 'html',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        is_pinned: false,
        is_archived: false,
        word_count: 2,
        character_count: 15,
        content_plaintext: 'Project details',
      },
      {
        id: 'note-3',
        title: 'Orphaned Note',
        content: '<p>Standalone note</p>',
        content_type: 'html',
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
        is_pinned: false,
        is_archived: false,
        word_count: 2,
        character_count: 15,
        content_plaintext: 'Standalone note',
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
      {
        id: 'cat-3',
        name: 'Personal',
        parent_id: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        description: 'Personal notes',
        sort_order: 2,
      },
    ];

    mockNoteCategories = [
      { noteId: 'note-1', categoryId: 'cat-1' },
      { noteId: 'note-2', categoryId: 'cat-2' },
    ];
  });

  describe('Tree Structure Generation', () => {
    it('should create a hierarchical tree structure from categories', () => {
      const { result } = renderHook(() =>
        useTreeData([], mockCategories, [])
      );

      const treeData = result.current;

      expect(treeData).toHaveLength(2); // Two root categories

      // Find Work category
      const workCategory = treeData.find(node => node.name === 'Work');
      expect(workCategory).toBeDefined();
      expect(workCategory?.type).toBe('category');
      expect(workCategory?.children).toHaveLength(1);

      // Verify nested Projects category
      const projectsCategory = workCategory?.children?.[0];
      expect(projectsCategory?.name).toBe('Projects');
      expect(projectsCategory?.type).toBe('category');
      expect(projectsCategory?.parent).toBe('cat-1');

      // Find Personal category
      const personalCategory = treeData.find(node => node.name === 'Personal');
      expect(personalCategory).toBeDefined();
      expect(personalCategory?.type).toBe('category');
      expect(personalCategory?.children).toHaveLength(0);
    });

    it('should place notes in their assigned categories', () => {
      const { result } = renderHook(() =>
        useTreeData(mockNotes, mockCategories, mockNoteCategories)
      );

      const treeData = result.current;

      // Find Work category and check it contains Meeting Notes
      const workCategory = treeData.find(node => node.name === 'Work');
      const meetingNote = workCategory?.children?.find(node => node.name === 'Meeting Notes');
      expect(meetingNote).toBeDefined();
      expect(meetingNote?.type).toBe('note');

      // Find Projects category and check it contains Project Documentation
      const projectsCategory = workCategory?.children?.find(node => node.name === 'Projects');
      const projectNote = projectsCategory?.children?.find(node => node.name === 'Project Documentation');
      expect(projectNote).toBeDefined();
      expect(projectNote?.type).toBe('note');
    });

    it('should place orphaned notes at root level', () => {
      const { result } = renderHook(() =>
        useTreeData(mockNotes, mockCategories, mockNoteCategories)
      );

      const treeData = result.current;

      // Find orphaned note at root level
      const orphanedNote = treeData.find(node => node.name === 'Orphaned Note');
      expect(orphanedNote).toBeDefined();
      expect(orphanedNote?.type).toBe('note');
      expect(orphanedNote?.children).toHaveLength(0);
    });

    it('should handle notes assigned to multiple categories', () => {
      const multiCategoryNotes = [
        { noteId: 'note-1', categoryId: 'cat-1' },
        { noteId: 'note-1', categoryId: 'cat-3' },
      ];

      const { result } = renderHook(() =>
        useTreeData(mockNotes.slice(0, 1), mockCategories, multiCategoryNotes)
      );

      const treeData = result.current;

      // Note should appear in both categories
      const workCategory = treeData.find(node => node.name === 'Work');
      const personalCategory = treeData.find(node => node.name === 'Personal');

      const noteInWork = workCategory?.children?.find(node => node.name === 'Meeting Notes');
      const noteInPersonal = personalCategory?.children?.find(node => node.name === 'Meeting Notes');

      expect(noteInWork).toBeDefined();
      expect(noteInPersonal).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data gracefully', () => {
      const { result } = renderHook(() =>
        useTreeData([], [], [])
      );

      expect(result.current).toHaveLength(0);
    });

    it('should handle categories without parent references', () => {
      const orphanedCategories = [
        {
          id: 'cat-orphan',
          name: 'Orphaned Category',
          parent_id: 'non-existent-parent',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          description: '',
          sort_order: 0,
        },
      ];

      const { result } = renderHook(() =>
        useTreeData([], orphanedCategories, [])
      );

      const treeData = result.current;

      // Category should be placed at root level when parent doesn't exist
      expect(treeData).toHaveLength(1);
      expect(treeData[0]?.name).toBe('Orphaned Category');
    });

    it('should handle notes assigned to non-existent categories', () => {
      const invalidNoteCategories = [
        { noteId: 'note-1', categoryId: 'non-existent-category' },
      ];

      const { result } = renderHook(() =>
        useTreeData(mockNotes.slice(0, 1), mockCategories, invalidNoteCategories)
      );

      const treeData = result.current;

      // Note should be treated as orphaned
      const orphanedNote = treeData.find(node => node.name === 'Meeting Notes');
      expect(orphanedNote).toBeDefined();
      expect(orphanedNote?.type).toBe('note');
    });

    it('should preserve node data references', () => {
      const { result } = renderHook(() =>
        useTreeData(mockNotes.slice(0, 1), mockCategories.slice(0, 1), [])
      );

      const treeData = result.current;

      // Check category data
      const categoryNode = treeData.find(node => node.type === 'category');
      expect(categoryNode?.data).toBe(mockCategories[0]);

      // Check note data
      const noteNode = treeData.find(node => node.type === 'note');
      expect(noteNode?.data).toBe(mockNotes[0]);
    });
  });

  describe('Data Updates', () => {
    it('should recompute tree when notes change', () => {
      const { result, rerender } = renderHook(
        ({ notes }) => useTreeData(notes, mockCategories, mockNoteCategories),
        { initialProps: { notes: mockNotes.slice(0, 1) } }
      );

      expect(result.current.filter(node => node.type === 'note' ||
        node.children?.some(child => child.type === 'note'))).toHaveLength(1);

      // Add more notes
      rerender({ notes: mockNotes });

      const totalNotesInTree = result.current.reduce((count, node) => {
        const noteCount = node.type === 'note' ? 1 : 0;
        const childNoteCount = node.children?.filter(child => child.type === 'note').length || 0;
        const grandChildNoteCount = node.children?.reduce((acc, child) =>
          acc + (child.children?.filter(grandChild => grandChild.type === 'note').length || 0), 0) || 0;
        return count + noteCount + childNoteCount + grandChildNoteCount;
      }, 0);

      expect(totalNotesInTree).toBe(3);
    });

    it('should recompute tree when categories change', () => {
      const { result, rerender } = renderHook(
        ({ categories }) => useTreeData(mockNotes, categories, mockNoteCategories),
        { initialProps: { categories: mockCategories.slice(0, 1) } }
      );

      expect(result.current.filter(node => node.type === 'category')).toHaveLength(1);

      // Add more categories
      rerender({ categories: mockCategories });

      expect(result.current.filter(node => node.type === 'category')).toHaveLength(2);
    });

    it('should recompute tree when note-category relationships change', () => {
      const { result, rerender } = renderHook(
        ({ noteCategories }: { noteCategories: { noteId: string; categoryId: string }[] }) =>
          useTreeData(mockNotes, mockCategories, noteCategories),
        { initialProps: { noteCategories: [] as { noteId: string; categoryId: string }[] } }
      );

      // Initially all notes should be orphaned
      const orphanedNotes = result.current.filter(node => node.type === 'note');
      expect(orphanedNotes).toHaveLength(3);

      // Add relationships
      rerender({ noteCategories: mockNoteCategories });

      // Now some notes should be in categories
      const remainingOrphanedNotes = result.current.filter(node => node.type === 'note');
      expect(remainingOrphanedNotes).toHaveLength(1); // Only note-3 should remain orphaned
    });
  });
});