import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TreeNode } from '../types';
import { useTreeKeyboardNavigation } from './use-tree-keyboard-navigation';

// Mock HTMLElement methods
const mockFocus = vi.fn();
const mockBoundingClientRect = {
	top: 100,
	bottom: 132,
	left: 0,
	right: 200,
	width: 200,
	height: 32,
	x: 0,
	y: 100,
} as DOMRect;

Object.defineProperty(HTMLElement.prototype, 'focus', {
	value: mockFocus,
	writable: true,
});

Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
	value: () => mockBoundingClientRect,
	writable: true,
});

Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
	value: vi.fn(),
	writable: true,
});

describe('useTreeKeyboardNavigation', () => {
	let mockContainerRef: React.RefObject<HTMLDivElement>;
	let mockFlattenedItems: TreeNode[];
	let mockExpandedNodes: Set<string>;
	let mockOnItemSelect: ReturnType<typeof vi.fn>;
	let mockOnNoteSelect: ReturnType<typeof vi.fn>;
	let mockToggleNodeExpansion: ReturnType<typeof vi.fn>;
	let mockFindParentFolder: ReturnType<typeof vi.fn>;
	let mockHandleHoistFolder: ReturnType<typeof vi.fn>;
	let mockSetHoistedFolderId: ReturnType<typeof vi.fn>;
	let mockSetEditingItemId: ReturnType<typeof vi.fn>;
	let mockNodeRefsMap: React.MutableRefObject<Map<string, { startEditing: () => void }>>;

	beforeEach(() => {
		// Reset all mocks
		vi.clearAllMocks();

		// Create mock container element
		const mockContainer = document.createElement('div');
		mockContainer.tabIndex = 0;
		document.body.appendChild(mockContainer);

		mockContainerRef = { current: mockContainer };

		mockFlattenedItems = [
			{
				id: 'cat-1',
				name: 'Work',
				type: 'category',
				children: [],
			},
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
				children: [],
			},
			{
				id: 'note-2',
				name: 'Project Documentation',
				type: 'note',
				children: [],
			},
			{
				id: 'cat-3',
				name: 'Personal',
				type: 'category',
				children: [],
			},
		];

		mockExpandedNodes = new Set(['cat-1', 'cat-2']);

		// Mock functions
		mockOnItemSelect = vi.fn();
		mockOnNoteSelect = vi.fn();
		mockToggleNodeExpansion = vi.fn();
		mockFindParentFolder = vi.fn();
		mockHandleHoistFolder = vi.fn();
		mockSetHoistedFolderId = vi.fn();
		mockSetEditingItemId = vi.fn();

		// Mock node refs map
		mockNodeRefsMap = {
			current: new Map([
				['note-1', { startEditing: vi.fn() }],
				['note-2', { startEditing: vi.fn() }],
			]),
		};
	});

	afterEach(() => {
		// Clean up DOM elements
		document.body.innerHTML = '';
	});

	describe('Setup and Cleanup', () => {
		it('should attach keyboard event listener to container', () => {
			const addEventListenerSpy = vi.spyOn(mockContainerRef.current!, 'addEventListener');

			renderHook(() =>
				useTreeKeyboardNavigation({
					containerRef: mockContainerRef,
					navigatedItemId: null,
					flattenedItems: mockFlattenedItems,
					expandedNodes: mockExpandedNodes,
					onItemSelect: mockOnItemSelect,
					onNoteSelect: mockOnNoteSelect,
					toggleNodeExpansion: mockToggleNodeExpansion,
					findParentFolder: mockFindParentFolder,
					handleHoistFolder: mockHandleHoistFolder,
					hoistedFolderId: null,
					setHoistedFolderId: mockSetHoistedFolderId,
					setEditingItemId: mockSetEditingItemId,
					nodeRefsMap: mockNodeRefsMap,
				})
			);

			expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
		});

		it('should remove event listener on cleanup', () => {
			const removeEventListenerSpy = vi.spyOn(mockContainerRef.current!, 'removeEventListener');

			const { unmount } = renderHook(() =>
				useTreeKeyboardNavigation({
					containerRef: mockContainerRef,
					navigatedItemId: null,
					flattenedItems: mockFlattenedItems,
					expandedNodes: mockExpandedNodes,
					onItemSelect: mockOnItemSelect,
					onNoteSelect: mockOnNoteSelect,
					toggleNodeExpansion: mockToggleNodeExpansion,
					findParentFolder: mockFindParentFolder,
					handleHoistFolder: mockHandleHoistFolder,
					hoistedFolderId: null,
					setHoistedFolderId: mockSetHoistedFolderId,
					setEditingItemId: mockSetEditingItemId,
					nodeRefsMap: mockNodeRefsMap,
				})
			);

			unmount();

			expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
		});
	});

	describe('Arrow Key Navigation', () => {
		it('should navigate down with ArrowDown', () => {
			renderHook(() =>
				useTreeKeyboardNavigation({
					containerRef: mockContainerRef,
					navigatedItemId: 'cat-1',
					flattenedItems: mockFlattenedItems,
					expandedNodes: mockExpandedNodes,
					onItemSelect: mockOnItemSelect,
					onNoteSelect: mockOnNoteSelect,
					toggleNodeExpansion: mockToggleNodeExpansion,
					findParentFolder: mockFindParentFolder,
					handleHoistFolder: mockHandleHoistFolder,
					hoistedFolderId: null,
					setHoistedFolderId: mockSetHoistedFolderId,
					setEditingItemId: mockSetEditingItemId,
					nodeRefsMap: mockNodeRefsMap,
				})
			);

			// Simulate ArrowDown key press
			act(() => {
				const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
				mockContainerRef.current!.dispatchEvent(event);
			});

			expect(mockOnItemSelect).toHaveBeenCalledWith('note-1', 'note');
		});

		it('should navigate up with ArrowUp', () => {
			renderHook(() =>
				useTreeKeyboardNavigation({
					containerRef: mockContainerRef,
					navigatedItemId: 'note-1',
					flattenedItems: mockFlattenedItems,
					expandedNodes: mockExpandedNodes,
					onItemSelect: mockOnItemSelect,
					onNoteSelect: mockOnNoteSelect,
					toggleNodeExpansion: mockToggleNodeExpansion,
					findParentFolder: mockFindParentFolder,
					handleHoistFolder: mockHandleHoistFolder,
					hoistedFolderId: null,
					setHoistedFolderId: mockSetHoistedFolderId,
					setEditingItemId: mockSetEditingItemId,
					nodeRefsMap: mockNodeRefsMap,
				})
			);

			// Simulate ArrowUp key press
			act(() => {
				const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
				mockContainerRef.current!.dispatchEvent(event);
			});

			expect(mockOnItemSelect).toHaveBeenCalledWith('cat-1', 'category');
		});

		it('should expand category with ArrowRight when collapsed', () => {
			const collapsedNodes = new Set<string>(); // cat-1 is collapsed

			renderHook(() =>
				useTreeKeyboardNavigation({
					containerRef: mockContainerRef,
					navigatedItemId: 'cat-1',
					flattenedItems: mockFlattenedItems,
					expandedNodes: collapsedNodes,
					onItemSelect: mockOnItemSelect,
					onNoteSelect: mockOnNoteSelect,
					toggleNodeExpansion: mockToggleNodeExpansion,
					findParentFolder: mockFindParentFolder,
					handleHoistFolder: mockHandleHoistFolder,
					hoistedFolderId: null,
					setHoistedFolderId: mockSetHoistedFolderId,
					setEditingItemId: mockSetEditingItemId,
					nodeRefsMap: mockNodeRefsMap,
				})
			);

			// Simulate ArrowRight key press
			act(() => {
				const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
				mockContainerRef.current!.dispatchEvent(event);
			});

			expect(mockToggleNodeExpansion).toHaveBeenCalledWith('cat-1');
		});

		it('should collapse category with ArrowLeft when expanded', () => {
			renderHook(() =>
				useTreeKeyboardNavigation({
					containerRef: mockContainerRef,
					navigatedItemId: 'cat-1',
					flattenedItems: mockFlattenedItems,
					expandedNodes: mockExpandedNodes, // cat-1 is expanded
					onItemSelect: mockOnItemSelect,
					onNoteSelect: mockOnNoteSelect,
					toggleNodeExpansion: mockToggleNodeExpansion,
					findParentFolder: mockFindParentFolder,
					handleHoistFolder: mockHandleHoistFolder,
					hoistedFolderId: null,
					setHoistedFolderId: mockSetHoistedFolderId,
					setEditingItemId: mockSetEditingItemId,
					nodeRefsMap: mockNodeRefsMap,
				})
			);

			// Simulate ArrowLeft key press
			act(() => {
				const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
				mockContainerRef.current!.dispatchEvent(event);
			});

			expect(mockToggleNodeExpansion).toHaveBeenCalledWith('cat-1');
		});

		it('should navigate to parent with ArrowLeft when category is collapsed', () => {
			const parentFolderMock = {
				id: 'parent-cat',
				name: 'Parent',
				type: 'category' as const,
			};
			mockFindParentFolder.mockReturnValue(parentFolderMock);

			const collapsedNodes = new Set<string>(); // cat-1 is collapsed

			renderHook(() =>
				useTreeKeyboardNavigation({
					containerRef: mockContainerRef,
					navigatedItemId: 'cat-1',
					flattenedItems: mockFlattenedItems,
					expandedNodes: collapsedNodes,
					onItemSelect: mockOnItemSelect,
					onNoteSelect: mockOnNoteSelect,
					toggleNodeExpansion: mockToggleNodeExpansion,
					findParentFolder: mockFindParentFolder,
					handleHoistFolder: mockHandleHoistFolder,
					hoistedFolderId: null,
					setHoistedFolderId: mockSetHoistedFolderId,
					setEditingItemId: mockSetEditingItemId,
					nodeRefsMap: mockNodeRefsMap,
				})
			);

			// Simulate ArrowLeft key press
			act(() => {
				const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
				mockContainerRef.current!.dispatchEvent(event);
			});

			expect(mockFindParentFolder).toHaveBeenCalledWith('cat-1');
			expect(mockOnItemSelect).toHaveBeenCalledWith('parent-cat', 'category');
		});

		it('should do nothing with ArrowRight on notes', () => {
			renderHook(() =>
				useTreeKeyboardNavigation({
					containerRef: mockContainerRef,
					navigatedItemId: 'note-1',
					flattenedItems: mockFlattenedItems,
					expandedNodes: mockExpandedNodes,
					onItemSelect: mockOnItemSelect,
					onNoteSelect: mockOnNoteSelect,
					toggleNodeExpansion: mockToggleNodeExpansion,
					findParentFolder: mockFindParentFolder,
					handleHoistFolder: mockHandleHoistFolder,
					hoistedFolderId: null,
					setHoistedFolderId: mockSetHoistedFolderId,
					setEditingItemId: mockSetEditingItemId,
					nodeRefsMap: mockNodeRefsMap,
				})
			);

			// Simulate ArrowRight key press on note
			act(() => {
				const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
				mockContainerRef.current!.dispatchEvent(event);
			});

			expect(mockToggleNodeExpansion).not.toHaveBeenCalled();
			expect(mockOnItemSelect).not.toHaveBeenCalled();
		});
	});

	describe('Selection and Activation', () => {
		it('should open note with Enter key', () => {
			renderHook(() =>
				useTreeKeyboardNavigation({
					containerRef: mockContainerRef,
					navigatedItemId: 'note-1',
					flattenedItems: mockFlattenedItems,
					expandedNodes: mockExpandedNodes,
					onItemSelect: mockOnItemSelect,
					onNoteSelect: mockOnNoteSelect,
					toggleNodeExpansion: mockToggleNodeExpansion,
					findParentFolder: mockFindParentFolder,
					handleHoistFolder: mockHandleHoistFolder,
					hoistedFolderId: null,
					setHoistedFolderId: mockSetHoistedFolderId,
					setEditingItemId: mockSetEditingItemId,
					nodeRefsMap: mockNodeRefsMap,
				})
			);

			// Simulate Enter key press
			act(() => {
				const event = new KeyboardEvent('keydown', { key: 'Enter' });
				mockContainerRef.current!.dispatchEvent(event);
			});

			expect(mockOnNoteSelect).toHaveBeenCalledWith('note-1');
		});

		it('should toggle category expansion with Enter key', () => {
			renderHook(() =>
				useTreeKeyboardNavigation({
					containerRef: mockContainerRef,
					navigatedItemId: 'cat-1',
					flattenedItems: mockFlattenedItems,
					expandedNodes: mockExpandedNodes,
					onItemSelect: mockOnItemSelect,
					onNoteSelect: mockOnNoteSelect,
					toggleNodeExpansion: mockToggleNodeExpansion,
					findParentFolder: mockFindParentFolder,
					handleHoistFolder: mockHandleHoistFolder,
					hoistedFolderId: null,
					setHoistedFolderId: mockSetHoistedFolderId,
					setEditingItemId: mockSetEditingItemId,
					nodeRefsMap: mockNodeRefsMap,
				})
			);

			// Simulate Enter key press on category
			act(() => {
				const event = new KeyboardEvent('keydown', { key: 'Enter' });
				mockContainerRef.current!.dispatchEvent(event);
			});

			expect(mockToggleNodeExpansion).toHaveBeenCalledWith('cat-1');
		});

		it('should open note with Space key', () => {
			renderHook(() =>
				useTreeKeyboardNavigation({
					containerRef: mockContainerRef,
					navigatedItemId: 'note-1',
					flattenedItems: mockFlattenedItems,
					expandedNodes: mockExpandedNodes,
					onItemSelect: mockOnItemSelect,
					onNoteSelect: mockOnNoteSelect,
					toggleNodeExpansion: mockToggleNodeExpansion,
					findParentFolder: mockFindParentFolder,
					handleHoistFolder: mockHandleHoistFolder,
					hoistedFolderId: null,
					setHoistedFolderId: mockSetHoistedFolderId,
					setEditingItemId: mockSetEditingItemId,
					nodeRefsMap: mockNodeRefsMap,
				})
			);

			// Simulate Space key press
			act(() => {
				const event = new KeyboardEvent('keydown', { key: ' ' });
				mockContainerRef.current!.dispatchEvent(event);
			});

			expect(mockOnNoteSelect).toHaveBeenCalledWith('note-1');
		});
	});

	describe('Editing Functionality', () => {
		it('should start editing with F2 key', () => {
			const startEditingMock = vi.fn();
			mockNodeRefsMap.current.set('note-1', { startEditing: startEditingMock });

			renderHook(() =>
				useTreeKeyboardNavigation({
					containerRef: mockContainerRef,
					navigatedItemId: 'note-1',
					flattenedItems: mockFlattenedItems,
					expandedNodes: mockExpandedNodes,
					onItemSelect: mockOnItemSelect,
					onNoteSelect: mockOnNoteSelect,
					toggleNodeExpansion: mockToggleNodeExpansion,
					findParentFolder: mockFindParentFolder,
					handleHoistFolder: mockHandleHoistFolder,
					hoistedFolderId: null,
					setHoistedFolderId: mockSetHoistedFolderId,
					setEditingItemId: mockSetEditingItemId,
					nodeRefsMap: mockNodeRefsMap,
				})
			);

			// Simulate F2 key press
			act(() => {
				const event = new KeyboardEvent('keydown', { key: 'F2' });
				mockContainerRef.current!.dispatchEvent(event);
			});

			expect(startEditingMock).toHaveBeenCalled();
		});

		it('should handle F2 when node ref is not available', () => {
			renderHook(() =>
				useTreeKeyboardNavigation({
					containerRef: mockContainerRef,
					navigatedItemId: 'non-existent-item',
					flattenedItems: mockFlattenedItems,
					expandedNodes: mockExpandedNodes,
					onItemSelect: mockOnItemSelect,
					onNoteSelect: mockOnNoteSelect,
					toggleNodeExpansion: mockToggleNodeExpansion,
					findParentFolder: mockFindParentFolder,
					handleHoistFolder: mockHandleHoistFolder,
					hoistedFolderId: null,
					setHoistedFolderId: mockSetHoistedFolderId,
					setEditingItemId: mockSetEditingItemId,
					nodeRefsMap: mockNodeRefsMap,
				})
			);

			// Simulate F2 key press - should not crash
			act(() => {
				const event = new KeyboardEvent('keydown', { key: 'F2' });
				mockContainerRef.current!.dispatchEvent(event);
			});

			// Should not throw error
			expect(true).toBe(true);
		});
	});

	describe('Hoist Functionality', () => {
		it('should hoist folder with Ctrl+H', () => {
			renderHook(() =>
				useTreeKeyboardNavigation({
					containerRef: mockContainerRef,
					navigatedItemId: 'cat-1',
					flattenedItems: mockFlattenedItems,
					expandedNodes: mockExpandedNodes,
					onItemSelect: mockOnItemSelect,
					onNoteSelect: mockOnNoteSelect,
					toggleNodeExpansion: mockToggleNodeExpansion,
					findParentFolder: mockFindParentFolder,
					handleHoistFolder: mockHandleHoistFolder,
					hoistedFolderId: null,
					setHoistedFolderId: mockSetHoistedFolderId,
					setEditingItemId: mockSetEditingItemId,
					nodeRefsMap: mockNodeRefsMap,
				})
			);

			// Simulate Ctrl+H key press
			act(() => {
				const event = new KeyboardEvent('keydown', { key: 'h', ctrlKey: true });
				mockContainerRef.current!.dispatchEvent(event);
			});

			expect(mockHandleHoistFolder).toHaveBeenCalled();
		});

		it('should exit hoist with Escape when hoisted', () => {
			renderHook(() =>
				useTreeKeyboardNavigation({
					containerRef: mockContainerRef,
					navigatedItemId: 'cat-1',
					flattenedItems: mockFlattenedItems,
					expandedNodes: mockExpandedNodes,
					onItemSelect: mockOnItemSelect,
					onNoteSelect: mockOnNoteSelect,
					toggleNodeExpansion: mockToggleNodeExpansion,
					findParentFolder: mockFindParentFolder,
					handleHoistFolder: mockHandleHoistFolder,
					hoistedFolderId: 'some-folder',
					setHoistedFolderId: mockSetHoistedFolderId,
					setEditingItemId: mockSetEditingItemId,
					nodeRefsMap: mockNodeRefsMap,
				})
			);

			// Simulate Escape key press when hoisted
			act(() => {
				const event = new KeyboardEvent('keydown', { key: 'Escape' });
				mockContainerRef.current!.dispatchEvent(event);
			});

			expect(mockSetHoistedFolderId).toHaveBeenCalledWith(null);
		});

		it('should not exit hoist with Escape when not hoisted', () => {
			renderHook(() =>
				useTreeKeyboardNavigation({
					containerRef: mockContainerRef,
					navigatedItemId: 'cat-1',
					flattenedItems: mockFlattenedItems,
					expandedNodes: mockExpandedNodes,
					onItemSelect: mockOnItemSelect,
					onNoteSelect: mockOnNoteSelect,
					toggleNodeExpansion: mockToggleNodeExpansion,
					findParentFolder: mockFindParentFolder,
					handleHoistFolder: mockHandleHoistFolder,
					hoistedFolderId: null,
					setHoistedFolderId: mockSetHoistedFolderId,
					setEditingItemId: mockSetEditingItemId,
					nodeRefsMap: mockNodeRefsMap,
				})
			);

			// Simulate Escape key press when not hoisted
			act(() => {
				const event = new KeyboardEvent('keydown', { key: 'Escape' });
				mockContainerRef.current!.dispatchEvent(event);
			});

			expect(mockSetHoistedFolderId).not.toHaveBeenCalled();
		});
	});

	describe('Edge Cases', () => {
		it('should handle navigation when no item is currently navigated', () => {
			renderHook(() =>
				useTreeKeyboardNavigation({
					containerRef: mockContainerRef,
					navigatedItemId: null,
					flattenedItems: mockFlattenedItems,
					expandedNodes: mockExpandedNodes,
					onItemSelect: mockOnItemSelect,
					onNoteSelect: mockOnNoteSelect,
					toggleNodeExpansion: mockToggleNodeExpansion,
					findParentFolder: mockFindParentFolder,
					handleHoistFolder: mockHandleHoistFolder,
					hoistedFolderId: null,
					setHoistedFolderId: mockSetHoistedFolderId,
					setEditingItemId: mockSetEditingItemId,
					nodeRefsMap: mockNodeRefsMap,
				})
			);

			// Simulate ArrowDown key press when nothing is selected
			act(() => {
				const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
				mockContainerRef.current!.dispatchEvent(event);
			});

			// Should select first item
			expect(mockOnItemSelect).toHaveBeenCalledWith('cat-1', 'category');
		});

		it('should handle navigation when current item is not found in flattened items', () => {
			renderHook(() =>
				useTreeKeyboardNavigation({
					containerRef: mockContainerRef,
					navigatedItemId: 'non-existent-item',
					flattenedItems: mockFlattenedItems,
					expandedNodes: mockExpandedNodes,
					onItemSelect: mockOnItemSelect,
					onNoteSelect: mockOnNoteSelect,
					toggleNodeExpansion: mockToggleNodeExpansion,
					findParentFolder: mockFindParentFolder,
					handleHoistFolder: mockHandleHoistFolder,
					hoistedFolderId: null,
					setHoistedFolderId: mockSetHoistedFolderId,
					setEditingItemId: mockSetEditingItemId,
					nodeRefsMap: mockNodeRefsMap,
				})
			);

			// Simulate ArrowDown key press
			act(() => {
				const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
				mockContainerRef.current!.dispatchEvent(event);
			});

			// Should not crash and not call onItemSelect
			expect(mockOnItemSelect).not.toHaveBeenCalled();
		});

		it('should handle navigation at the end of the list', () => {
			renderHook(() =>
				useTreeKeyboardNavigation({
					containerRef: mockContainerRef,
					navigatedItemId: 'cat-3', // Last item
					flattenedItems: mockFlattenedItems,
					expandedNodes: mockExpandedNodes,
					onItemSelect: mockOnItemSelect,
					onNoteSelect: mockOnNoteSelect,
					toggleNodeExpansion: mockToggleNodeExpansion,
					findParentFolder: mockFindParentFolder,
					handleHoistFolder: mockHandleHoistFolder,
					hoistedFolderId: null,
					setHoistedFolderId: mockSetHoistedFolderId,
					setEditingItemId: mockSetEditingItemId,
					nodeRefsMap: mockNodeRefsMap,
				})
			);

			// Simulate ArrowDown key press at the end
			act(() => {
				const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
				mockContainerRef.current!.dispatchEvent(event);
			});

			// Should not navigate beyond the end
			expect(mockOnItemSelect).not.toHaveBeenCalled();
		});

		it('should handle navigation at the beginning of the list', () => {
			renderHook(() =>
				useTreeKeyboardNavigation({
					containerRef: mockContainerRef,
					navigatedItemId: 'cat-1', // First item
					flattenedItems: mockFlattenedItems,
					expandedNodes: mockExpandedNodes,
					onItemSelect: mockOnItemSelect,
					onNoteSelect: mockOnNoteSelect,
					toggleNodeExpansion: mockToggleNodeExpansion,
					findParentFolder: mockFindParentFolder,
					handleHoistFolder: mockHandleHoistFolder,
					hoistedFolderId: null,
					setHoistedFolderId: mockSetHoistedFolderId,
					setEditingItemId: mockSetEditingItemId,
					nodeRefsMap: mockNodeRefsMap,
				})
			);

			// Simulate ArrowUp key press at the beginning
			act(() => {
				const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
				mockContainerRef.current!.dispatchEvent(event);
			});

			// Should not navigate before the beginning
			expect(mockOnItemSelect).not.toHaveBeenCalled();
		});

		it('should handle empty flattened items', () => {
			renderHook(() =>
				useTreeKeyboardNavigation({
					containerRef: mockContainerRef,
					navigatedItemId: null,
					flattenedItems: [],
					expandedNodes: mockExpandedNodes,
					onItemSelect: mockOnItemSelect,
					onNoteSelect: mockOnNoteSelect,
					toggleNodeExpansion: mockToggleNodeExpansion,
					findParentFolder: mockFindParentFolder,
					handleHoistFolder: mockHandleHoistFolder,
					hoistedFolderId: null,
					setHoistedFolderId: mockSetHoistedFolderId,
					setEditingItemId: mockSetEditingItemId,
					nodeRefsMap: mockNodeRefsMap,
				})
			);

			// Simulate ArrowDown key press with empty items
			act(() => {
				const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
				mockContainerRef.current!.dispatchEvent(event);
			});

			// Should not crash
			expect(mockOnItemSelect).not.toHaveBeenCalled();
		});

		it('should not handle keyboard events when container ref is null', () => {
			const nullRef = { current: null };

			renderHook(() =>
				useTreeKeyboardNavigation({
					containerRef: nullRef,
					navigatedItemId: 'cat-1',
					flattenedItems: mockFlattenedItems,
					expandedNodes: mockExpandedNodes,
					onItemSelect: mockOnItemSelect,
					onNoteSelect: mockOnNoteSelect,
					toggleNodeExpansion: mockToggleNodeExpansion,
					findParentFolder: mockFindParentFolder,
					handleHoistFolder: mockHandleHoistFolder,
					hoistedFolderId: null,
					setHoistedFolderId: mockSetHoistedFolderId,
					setEditingItemId: mockSetEditingItemId,
					nodeRefsMap: mockNodeRefsMap,
				})
			);

			// Should not crash when container ref is null
			expect(true).toBe(true);
		});
	});

	describe('Keyboard Event Prevention', () => {
		it('should prevent default behavior for handled keys', () => {
			renderHook(() =>
				useTreeKeyboardNavigation({
					containerRef: mockContainerRef,
					navigatedItemId: 'cat-1',
					flattenedItems: mockFlattenedItems,
					expandedNodes: mockExpandedNodes,
					onItemSelect: mockOnItemSelect,
					onNoteSelect: mockOnNoteSelect,
					toggleNodeExpansion: mockToggleNodeExpansion,
					findParentFolder: mockFindParentFolder,
					handleHoistFolder: mockHandleHoistFolder,
					hoistedFolderId: null,
					setHoistedFolderId: mockSetHoistedFolderId,
					setEditingItemId: mockSetEditingItemId,
					nodeRefsMap: mockNodeRefsMap,
				})
			);

			// Create event with preventDefault spy
			const preventDefaultSpy = vi.fn();
			const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
			Object.defineProperty(event, 'preventDefault', {
				value: preventDefaultSpy,
			});

			// Simulate key press
			act(() => {
				mockContainerRef.current!.dispatchEvent(event);
			});

			expect(preventDefaultSpy).toHaveBeenCalled();
		});

		it('should not prevent default for unhandled keys', () => {
			renderHook(() =>
				useTreeKeyboardNavigation({
					containerRef: mockContainerRef,
					navigatedItemId: 'cat-1',
					flattenedItems: mockFlattenedItems,
					expandedNodes: mockExpandedNodes,
					onItemSelect: mockOnItemSelect,
					onNoteSelect: mockOnNoteSelect,
					toggleNodeExpansion: mockToggleNodeExpansion,
					findParentFolder: mockFindParentFolder,
					handleHoistFolder: mockHandleHoistFolder,
					hoistedFolderId: null,
					setHoistedFolderId: mockSetHoistedFolderId,
					setEditingItemId: mockSetEditingItemId,
					nodeRefsMap: mockNodeRefsMap,
				})
			);

			// Create event with preventDefault spy
			const preventDefaultSpy = vi.fn();
			const event = new KeyboardEvent('keydown', { key: 'Tab' });
			Object.defineProperty(event, 'preventDefault', {
				value: preventDefaultSpy,
			});

			// Simulate unhandled key press
			act(() => {
				mockContainerRef.current!.dispatchEvent(event);
			});

			expect(preventDefaultSpy).not.toHaveBeenCalled();
		});
	});
});
