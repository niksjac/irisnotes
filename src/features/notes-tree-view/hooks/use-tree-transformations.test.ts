import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTreeTransformations } from './use-tree-transformations';
import type { TreeNode } from '../types';

describe('useTreeTransformations', () => {
  let mockTreeData: TreeNode[];

  beforeEach(() => {
    mockTreeData = [
      {
        id: 'cat-1',
        name: 'Work',
        type: 'category',
        children: [
          {
            id: 'note-1',
            name: 'Meeting Notes',
            type: 'note',
            children: [],
          },
          {
            id: 'cat-2',
            name: 'Projects',
            type: 'category',
            children: [
              {
                id: 'note-2',
                name: 'Project Alpha Documentation',
                type: 'note',
                children: [],
              },
            ],
          },
        ],
      },
      {
        id: 'cat-3',
        name: 'Personal',
        type: 'category',
        children: [
          {
            id: 'note-3',
            name: 'Research Notes',
            type: 'note',
            children: [],
          },
        ],
      },
      {
        id: 'note-4',
        name: 'Orphaned Note',
        type: 'note',
        children: [],
      },
    ];
  });

  describe('Basic Functionality', () => {
    it('should return original data when no transformations applied', () => {
      const { result } = renderHook(() => useTreeTransformations(mockTreeData, null, '', false));

      expect(result.current).toEqual(mockTreeData);
    });

    it('should handle empty tree data', () => {
      const { result } = renderHook(() => useTreeTransformations([], null, '', false));

      expect(result.current).toEqual([]);
    });
  });

  describe('Search Functionality', () => {
    it('should filter tree based on search query', () => {
      const { result } = renderHook(() => useTreeTransformations(mockTreeData, null, 'meeting', false));

      const transformedData = result.current;

      // Should contain Work category because it has Meeting Notes
      const workCategory = transformedData.find(node => node.name === 'Work');
      expect(workCategory).toBeDefined();

      // Meeting Notes should be present
      const meetingNote = workCategory?.children?.find(node => node.name === 'Meeting Notes');
      expect(meetingNote).toBeDefined();

      // Projects category should not be present (no matching notes)
      const projectsCategory = workCategory?.children?.find(node => node.name === 'Projects');
      expect(projectsCategory).toBeUndefined();

      // Personal category should not be present (no matching notes)
      const personalCategory = transformedData.find(node => node.name === 'Personal');
      expect(personalCategory).toBeUndefined();
    });

    it('should filter categories based on category name search', () => {
      const { result } = renderHook(() => useTreeTransformations(mockTreeData, null, 'personal', false));

      const transformedData = result.current;

      // Should contain Personal category
      const personalCategory = transformedData.find(node => node.name === 'Personal');
      expect(personalCategory).toBeDefined();

      // Should include all children of matched category
      expect(personalCategory?.children).toHaveLength(1);
      expect(personalCategory?.children?.[0]?.name).toBe('Research Notes');

      // Work category should not be present
      const workCategory = transformedData.find(node => node.name === 'Work');
      expect(workCategory).toBeUndefined();
    });

    it('should handle case-insensitive search', () => {
      const { result } = renderHook(() => useTreeTransformations(mockTreeData, null, 'MEETING', false));

      const transformedData = result.current;

      // Should still find Meeting Notes despite case difference
      const workCategory = transformedData.find(node => node.name === 'Work');
      const meetingNote = workCategory?.children?.find(node => node.name === 'Meeting Notes');
      expect(meetingNote).toBeDefined();
    });

    it('should preserve parent categories when child notes match', () => {
      const { result } = renderHook(() => useTreeTransformations(mockTreeData, null, 'alpha', false));

      const transformedData = result.current;

      // Work category should be preserved
      const workCategory = transformedData.find(node => node.name === 'Work');
      expect(workCategory).toBeDefined();

      // Projects category should be preserved
      const projectsCategory = workCategory?.children?.find(node => node.name === 'Projects');
      expect(projectsCategory).toBeDefined();

      // Alpha document should be present
      const alphaNote = projectsCategory?.children?.find(node => node.name === 'Project Alpha Documentation');
      expect(alphaNote).toBeDefined();
    });

    it('should filter orphaned notes based on search', () => {
      const { result } = renderHook(() => useTreeTransformations(mockTreeData, null, 'orphaned', false));

      const transformedData = result.current;

      // Should only contain the orphaned note
      expect(transformedData).toHaveLength(1);
      expect(transformedData[0]?.name).toBe('Orphaned Note');
      expect(transformedData[0]?.type).toBe('note');
    });

    it('should return empty result when no matches found', () => {
      const { result } = renderHook(() => useTreeTransformations(mockTreeData, null, 'nonexistent', false));

      expect(result.current).toEqual([]);
    });
  });

  describe('Sorting Functionality', () => {
    it('should sort categories and notes alphabetically when enabled', () => {
      const { result } = renderHook(() => useTreeTransformations(mockTreeData, null, '', true));

      const transformedData = result.current;

      // Root level should be sorted: Orphaned Note, Personal, Work
      expect(transformedData).toHaveLength(3);
      expect(transformedData[0]?.name).toBe('Orphaned Note');
      expect(transformedData[1]?.name).toBe('Personal');
      expect(transformedData[2]?.name).toBe('Work');

      // Within Work category: Meeting Notes, Projects
      const workCategory = transformedData[2];
      expect(workCategory?.children?.[0]?.name).toBe('Meeting Notes');
      expect(workCategory?.children?.[1]?.name).toBe('Projects');
    });

    it('should maintain original order when sorting disabled', () => {
      const { result } = renderHook(() => useTreeTransformations(mockTreeData, null, '', false));

      const transformedData = result.current;

      // Should maintain original order
      expect(transformedData[0]?.name).toBe('Work');
      expect(transformedData[1]?.name).toBe('Personal');
      expect(transformedData[2]?.name).toBe('Orphaned Note');
    });

    it('should sort nested categories and notes recursively', () => {
      const { result } = renderHook(() => useTreeTransformations(mockTreeData, null, '', true));

      const transformedData = result.current;

      // Find Work category
      const workCategory = transformedData.find(node => node.name === 'Work');

      // Projects category should come after Meeting Notes (alphabetical)
      expect(workCategory?.children?.[0]?.name).toBe('Meeting Notes');
      expect(workCategory?.children?.[1]?.name).toBe('Projects');

      // Check nested sorting within Projects
      const projectsCategory = workCategory?.children?.[1];
      expect(projectsCategory?.children?.[0]?.name).toBe('Project Alpha Documentation');
    });
  });

  describe('Hoisting Functionality', () => {
    it('should show only hoisted folder contents when hoisted', () => {
      const { result } = renderHook(() => useTreeTransformations(mockTreeData, 'cat-1', '', false));

      const transformedData = result.current;

      // Should only show contents of Work category
      expect(transformedData).toHaveLength(2);
      expect(transformedData[0]?.name).toBe('Meeting Notes');
      expect(transformedData[1]?.name).toBe('Projects');

      // Projects should still have its children
      expect(transformedData[1]?.children?.[0]?.name).toBe('Project Alpha Documentation');
    });

    it('should handle hoisting of nested categories', () => {
      const { result } = renderHook(() => useTreeTransformations(mockTreeData, 'cat-2', '', false));

      const transformedData = result.current;

      // Should only show contents of Projects category
      expect(transformedData).toHaveLength(1);
      expect(transformedData[0]?.name).toBe('Project Alpha Documentation');
      expect(transformedData[0]?.type).toBe('note');
    });

    it('should return empty array when hoisting non-existent folder', () => {
      const { result } = renderHook(() => useTreeTransformations(mockTreeData, 'non-existent', '', false));

      expect(result.current).toEqual([]);
    });

    it('should return empty array when hoisting folder with no children', () => {
      // Create tree with empty category
      const emptyTreeData: TreeNode[] = [
        {
          id: 'empty-cat',
          name: 'Empty Category',
          type: 'category',
          children: [],
        },
      ];

      const { result } = renderHook(() => useTreeTransformations(emptyTreeData, 'empty-cat', '', false));

      expect(result.current).toEqual([]);
    });

    it('should handle hoisting note (should return empty)', () => {
      const { result } = renderHook(() => useTreeTransformations(mockTreeData, 'note-1', '', false));

      // Notes don't have children, so hoisting should return empty
      expect(result.current).toEqual([]);
    });
  });

  describe('Combined Transformations', () => {
    it('should apply search and sorting together', () => {
      const { result } = renderHook(() => useTreeTransformations(mockTreeData, null, 'project', true));

      const transformedData = result.current;

      // Should find Work category (containing Projects)
      const workCategory = transformedData.find(node => node.name === 'Work');
      expect(workCategory).toBeDefined();

      // Projects category should be present and sorted
      const projectsCategory = workCategory?.children?.find(node => node.name === 'Projects');
      expect(projectsCategory).toBeDefined();
    });

    it('should apply search on hoisted content', () => {
      const { result } = renderHook(() => useTreeTransformations(mockTreeData, 'cat-1', 'meeting', false));

      const transformedData = result.current;

      // Should only show Meeting Notes from hoisted Work category
      expect(transformedData).toHaveLength(1);
      expect(transformedData[0]?.name).toBe('Meeting Notes');
      expect(transformedData[0]?.type).toBe('note');
    });

    it('should apply sorting on hoisted content', () => {
      const { result } = renderHook(() => useTreeTransformations(mockTreeData, 'cat-1', '', true));

      const transformedData = result.current;

      // Hoisted Work category contents should be sorted: Meeting Notes, Projects
      expect(transformedData).toHaveLength(2);
      expect(transformedData[0]?.name).toBe('Meeting Notes');
      expect(transformedData[1]?.name).toBe('Projects');
    });

    it('should apply all transformations together', () => {
      const { result } = renderHook(() => useTreeTransformations(mockTreeData, 'cat-1', 'notes', true));

      const transformedData = result.current;

      // Should find Meeting Notes in hoisted Work category, sorted
      expect(transformedData).toHaveLength(1);
      expect(transformedData[0]?.name).toBe('Meeting Notes');
    });
  });

  describe('Deep Tree Structure', () => {
    it('should handle deep nesting with all transformations', () => {
      const deepTreeData: TreeNode[] = [
        {
          id: 'level-1',
          name: 'Level 1',
          type: 'category',
          children: [
            {
              id: 'level-2',
              name: 'Level 2',
              type: 'category',
              children: [
                {
                  id: 'level-3',
                  name: 'Level 3',
                  type: 'category',
                  children: [
                    {
                      id: 'deep-note',
                      name: 'Deep Note',
                      type: 'note',
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];

      const { result } = renderHook(() => useTreeTransformations(deepTreeData, null, 'deep', true));

      const transformedData = result.current;

      // Should preserve the full path to the matching note
      expect(transformedData).toHaveLength(1);
      expect(transformedData[0]?.name).toBe('Level 1');

      const level2 = transformedData[0]?.children?.[0];
      expect(level2?.name).toBe('Level 2');

      const level3 = level2?.children?.[0];
      expect(level3?.name).toBe('Level 3');

      const deepNote = level3?.children?.[0];
      expect(deepNote?.name).toBe('Deep Note');
    });
  });

  describe('Data Updates', () => {
    it('should recompute when tree data changes', () => {
      const { result, rerender } = renderHook(({ treeData }) => useTreeTransformations(treeData, null, '', false), {
        initialProps: { treeData: mockTreeData.slice(0, 1) },
      });

      expect(result.current).toHaveLength(1);

      // Add more data
      rerender({ treeData: mockTreeData });

      expect(result.current).toHaveLength(3);
    });

    it('should recompute when hoisted folder changes', () => {
      const { result, rerender } = renderHook(
        ({ hoistedFolderId }: { hoistedFolderId: string | null }) =>
          useTreeTransformations(mockTreeData, hoistedFolderId, '', false),
        { initialProps: { hoistedFolderId: null as string | null } }
      );

      expect(result.current).toHaveLength(3);

      // Hoist a folder
      rerender({ hoistedFolderId: 'cat-1' });

      expect(result.current).toHaveLength(2); // Contents of Work category
    });

    it('should recompute when search query changes', () => {
      const { result, rerender } = renderHook(
        ({ searchQuery }) => useTreeTransformations(mockTreeData, null, searchQuery, false),
        { initialProps: { searchQuery: '' } }
      );

      expect(result.current).toHaveLength(3);

      // Apply search
      rerender({ searchQuery: 'meeting' });

      expect(result.current).toHaveLength(1); // Only Work category with Meeting Notes
    });

    it('should recompute when sort option changes', () => {
      const { result, rerender } = renderHook(
        ({ sortAlphabetically }) => useTreeTransformations(mockTreeData, null, '', sortAlphabetically),
        { initialProps: { sortAlphabetically: false } }
      );

      // Original order
      expect(result.current[0]?.name).toBe('Work');
      expect(result.current[1]?.name).toBe('Personal');

      // Enable sorting
      rerender({ sortAlphabetically: true });

      // Alphabetical order
      expect(result.current[1]?.name).toBe('Personal');
      expect(result.current[2]?.name).toBe('Work');
    });
  });
});
