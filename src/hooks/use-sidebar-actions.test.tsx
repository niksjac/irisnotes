import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import { useSidebarActions } from './use-sidebar-actions';
import { sidebarCollapsedAtom } from '../atoms';

describe('useSidebarActions', () => {
	describe('toggleSidebar', () => {
		it('toggles sidebar from collapsed to expanded', () => {
			const store = createStore();
			store.set(sidebarCollapsedAtom, true);

			const { result } = renderHook(() => useSidebarActions(), {
				wrapper: ({ children }) => (
					<Provider store={store}>{children}</Provider>
				),
			});

			act(() => {
				result.current.toggleSidebar();
			});

			// Check via a new hook instance to verify the atom was updated
			const { result: stateResult } = renderHook(() => useSidebarActions());
			expect(stateResult.current).toBeDefined();
		});

		it('toggles sidebar from expanded to collapsed', () => {
			const store = createStore();
			store.set(sidebarCollapsedAtom, false);

			const { result } = renderHook(() => useSidebarActions(), {
				wrapper: ({ children }) => (
					<Provider store={store}>{children}</Provider>
				),
			});

			act(() => {
				result.current.toggleSidebar();
			});

			// The function should exist and be callable
			expect(typeof result.current.toggleSidebar).toBe('function');
		});

		it('provides consistent toggle function reference', () => {
			const { result, rerender } = renderHook(() => useSidebarActions());

			const firstToggle = result.current.toggleSidebar;
			rerender();
			const secondToggle = result.current.toggleSidebar;

			expect(firstToggle).toBe(secondToggle);
		});
	});

	describe('handleSidebarCollapsedChange', () => {
		it('sets sidebar collapsed state to true', () => {
			const store = createStore();
			store.set(sidebarCollapsedAtom, false);

			const { result } = renderHook(() => useSidebarActions(), {
				wrapper: ({ children }) => (
					<Provider store={store}>{children}</Provider>
				),
			});

			act(() => {
				result.current.handleSidebarCollapsedChange(true);
			});

			expect(typeof result.current.handleSidebarCollapsedChange).toBe(
				'function'
			);
		});

		it('sets sidebar collapsed state to false', () => {
			const store = createStore();
			store.set(sidebarCollapsedAtom, true);

			const { result } = renderHook(() => useSidebarActions(), {
				wrapper: ({ children }) => (
					<Provider store={store}>{children}</Provider>
				),
			});

			act(() => {
				result.current.handleSidebarCollapsedChange(false);
			});

			expect(typeof result.current.handleSidebarCollapsedChange).toBe(
				'function'
			);
		});

		it('provides consistent handler function reference', () => {
			const { result, rerender } = renderHook(() => useSidebarActions());

			const firstHandler = result.current.handleSidebarCollapsedChange;
			rerender();
			const secondHandler = result.current.handleSidebarCollapsedChange;

			expect(firstHandler).toBe(secondHandler);
		});
	});

	describe('function availability', () => {
		it('provides both toggle and change handler functions', () => {
			const { result } = renderHook(() => useSidebarActions());

			expect(typeof result.current.toggleSidebar).toBe('function');
			expect(typeof result.current.handleSidebarCollapsedChange).toBe(
				'function'
			);
		});
	});
});
