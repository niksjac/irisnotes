import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider, createStore, WritableAtom } from 'jotai';
import { vi, expect } from 'vitest';

// Enhanced test wrapper that includes Jotai Provider with initial state support
interface AllTheProvidersProps {
  children: ReactNode;
  initialValues?: Array<[WritableAtom<any, any[], any>, any]>;
  store?: ReturnType<typeof createStore>;
}

const AllTheProviders = ({ children, initialValues, store }: AllTheProvidersProps) => {
  // Create a new store for each test to ensure isolation
  const testStore = store || createStore();

  // Set initial values if provided
  if (initialValues) {
    initialValues.forEach(([atom, value]) => {
      testStore.set(atom, value);
    });
  }

  return <Provider store={testStore}>{children}</Provider>;
};

// Enhanced custom render options with better typing
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  wrapper?: React.ComponentType<any>;
  initialValues?: Array<[WritableAtom<any, any[], any>, any]>;
  store?: ReturnType<typeof createStore>;
}

const customRender = (ui: ReactElement, options: CustomRenderOptions = {}) => {
  const { wrapper, initialValues, store, ...renderOptions } = options;

  const Wrapper =
    wrapper ||
    ((props: { children: React.ReactNode }) => {
      const providerProps: AllTheProvidersProps = {
        children: props.children,
        ...(initialValues && { initialValues }),
        ...(store && { store }),
      };
      return <AllTheProviders {...providerProps} />;
    });

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { customRender as render };

// Jotai testing utilities
export const createTestStore = () => createStore();

export const renderWithJotai = (
  ui: ReactElement,
  initialValues: Array<[WritableAtom<any, any[], any>, any]> = [],
  options: Omit<CustomRenderOptions, 'initialValues'> = {}
) => {
  return customRender(ui, { ...options, initialValues });
};

// Common test utilities for storage
export const createMockStorageAdapter = () => ({
  init: vi.fn().mockResolvedValue(undefined),
  getAllNotes: vi.fn().mockResolvedValue({ data: [], error: null }),
  getNote: vi.fn().mockResolvedValue({ data: null, error: null }),
  createNote: vi.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null }),
  updateNote: vi.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null }),
  deleteNote: vi.fn().mockResolvedValue({ data: true, error: null }),
  getAllCategories: vi.fn().mockResolvedValue({ data: [], error: null }),
  getCategory: vi.fn().mockResolvedValue({ data: null, error: null }),
  createCategory: vi.fn().mockResolvedValue({ data: { id: 'test-category-id' }, error: null }),
  updateCategory: vi.fn().mockResolvedValue({ data: { id: 'test-category-id' }, error: null }),
  deleteCategory: vi.fn().mockResolvedValue({ data: true, error: null }),
});

// Mock data factories
export const createMockNote = (overrides: Partial<any> = {}) => ({
  id: 'test-note-id',
  title: 'Test Note',
  content: '<p>Test content</p>',
  content_type: 'html',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_pinned: false,
  is_archived: false,
  word_count: 2,
  character_count: 12,
  content_plaintext: 'Test content',
  category_id: null,
  ...overrides,
});

export const createMockCategory = (overrides: Partial<any> = {}) => ({
  id: 'test-category-id',
  name: 'Test Category',
  color: '#3498db',
  parent_id: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

// Tauri API mocks - common patterns for testing
export const mockTauriAPIs = () => {
  // File system operations
  vi.mock('@tauri-apps/plugin-fs', () => ({
    exists: vi.fn().mockResolvedValue(true),
    readTextFile: vi.fn().mockResolvedValue(''),
    writeTextFile: vi.fn().mockResolvedValue(undefined),
    readDir: vi.fn().mockResolvedValue([]),
    createDir: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
  }));

  // Path operations
  vi.mock('@tauri-apps/api/path', () => ({
    appDataDir: vi.fn().mockResolvedValue('/mock/app/data'),
    appConfigDir: vi.fn().mockResolvedValue('/mock/app/config'),
    join: vi.fn().mockImplementation((...parts: string[]) => parts.join('/')),
    dirname: vi.fn().mockImplementation((path: string) => path.split('/').slice(0, -1).join('/')),
    basename: vi.fn().mockImplementation((path: string) => path.split('/').pop()),
  }));

  // Core Tauri invoke
  vi.mock('@tauri-apps/api/core', () => ({
    invoke: vi.fn().mockResolvedValue({}),
  }));

  // Event system
  vi.mock('@tauri-apps/api/event', () => ({
    listen: vi.fn().mockResolvedValue(() => {}),
    emit: vi.fn().mockResolvedValue(undefined),
  }));
};

// Test timing utilities
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

export const waitForNextTick = () => new Promise(resolve => process.nextTick(resolve));

// DOM testing helpers
export const expectElementToHaveClasses = (element: Element, classes: string[]) => {
  classes.forEach(className => {
    expect(element).toHaveClass(className);
  });
};

export const expectElementNotToHaveClasses = (element: Element, classes: string[]) => {
  classes.forEach(className => {
    expect(element).not.toHaveClass(className);
  });
};

// Error boundary testing
export const ErrorBoundary = ({ children, onError }: { children: ReactNode; onError?: (error: Error) => void }) => {
  try {
    return <>{children}</>;
  } catch (error) {
    onError?.(error as Error);
    return <div data-testid='error-boundary'>Error occurred</div>;
  }
};

// Performance testing helpers
export const measureRenderTime = async (renderFn: () => void) => {
  const start = performance.now();
  renderFn();
  await waitForAsync();
  const end = performance.now();
  return end - start;
};
