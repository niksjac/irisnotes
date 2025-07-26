import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Provider, createStore } from 'jotai';
import { useSidebarState } from './use-sidebar-state';
import { sidebarCollapsedAtom } from '../atoms';

describe('useSidebarState', () => {
	it('provides sidebar collapsed state from atom', () => {
		const store = createStore();
		store.set(sidebarCollapsedAtom, false);

		const { result } = renderHook(() => useSidebarState(), {
			wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
		});

		expect(result.current.sidebarCollapsed).toBe(false);
	});

	it('can update sidebar collapsed state', () => {
		const store = createStore();
		store.set(sidebarCollapsedAtom, false);

		const { result } = renderHook(() => useSidebarState(), {
			wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
		});

		act(() => {
			result.current.setSidebarCollapsed(true);
		});

		expect(result.current.sidebarCollapsed).toBe(true);

		act(() => {
			result.current.setSidebarCollapsed(false);
		});

		expect(result.current.sidebarCollapsed).toBe(false);
	});

	it('initializes with default atom value', () => {
		const { result } = renderHook(() => useSidebarState());

		// The atom default is false
		expect(result.current.sidebarCollapsed).toBe(false);
	});

	it('provides setter function', () => {
		const { result } = renderHook(() => useSidebarState());

		expect(typeof result.current.setSidebarCollapsed).toBe('function');
	});
});
