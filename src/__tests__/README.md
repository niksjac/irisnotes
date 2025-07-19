# Test Utilities Guide

This guide explains how to use the enhanced test utilities for testing React components with Jotai state management and Tauri APIs.

## Table of Contents

1. [Basic Testing](#basic-testing)
2. [Jotai State Management Testing](#jotai-state-management-testing)
3. [Tauri API Mocking](#tauri-api-mocking)
4. [Mock Data Factories](#mock-data-factories)
5. [Testing Patterns](#testing-patterns)
6. [Performance Testing](#performance-testing)

## Basic Testing

### Standard Component Testing

```typescript
import { render, screen } from '../__tests__/test-utils'
import { Button } from './button'

test('should render button', () => {
  render(<Button>Click me</Button>)
  expect(screen.getByText('Click me')).toBeInTheDocument()
})
```

### User Interaction Testing

```typescript
import { render, screen } from '../__tests__/test-utils'
import userEvent from '@testing-library/user-event'

test('should handle click events', async () => {
  const user = userEvent.setup()
  const handleClick = vi.fn()

  render(<Button onClick={handleClick}>Click me</Button>)

  await user.click(screen.getByText('Click me'))
  expect(handleClick).toHaveBeenCalledTimes(1)
})
```

## Jotai State Management Testing

### Testing with Initial Atom Values

```typescript
import { renderWithJotai } from '../__tests__/test-utils'
import { atom } from 'jotai'

const countAtom = atom(0)
const themeAtom = atom('light')

test('should render with initial atom state', () => {
  const initialValues = [
    [countAtom, 5],
    [themeAtom, 'dark']
  ]

  renderWithJotai(<MyComponent />, initialValues)
  // Component now has access to atoms with initial values
})
```

### Using Custom Store for Test Isolation

```typescript
import { render, createTestStore } from '../__tests__/test-utils'

test('should use isolated store', () => {
  const store = createTestStore()
  store.set(countAtom, 10)

  render(<MyComponent />, { store })
  // Component uses isolated store instance
})
```

### Advanced Jotai Testing Pattern

```typescript
import { renderHook, act } from '@testing-library/react'
import { Provider } from 'jotai'
import { useAtom } from 'jotai'

test('should test hook with atom', () => {
  const TestProvider = ({ children }) => (
    <Provider>{children}</Provider>
  )

  const { result } = renderHook(() => useAtom(countAtom), {
    wrapper: TestProvider
  })

  expect(result.current[0]).toBe(0)

  act(() => {
    result.current[1](5) // Set count to 5
  })

  expect(result.current[0]).toBe(5)
})
```

## Tauri API Mocking

### Quick Setup for All Tauri APIs

```typescript
import { setupTauriMocks } from '../__tests__/mocks/tauri'

beforeEach(() => {
  setupTauriMocks()
})
```

### Custom Tauri Mock Overrides

```typescript
import { setupTauriMocks } from '../__tests__/mocks/tauri'

beforeEach(() => {
  setupTauriMocks({
    fs: {
      readTextFile: vi.fn().mockResolvedValue('custom content'),
      exists: vi.fn().mockResolvedValue(false)
    },
    path: {
      appDataDir: vi.fn().mockResolvedValue('/custom/path')
    }
  })
})
```

### Individual Mock Factories

```typescript
import { createFileSystemMock, createPathMock } from '../__tests__/mocks/tauri'

test('should mock specific APIs', () => {
  const fsMock = createFileSystemMock({
    readTextFile: vi.fn().mockResolvedValue('test content')
  })

  const pathMock = createPathMock({
    appDataDir: vi.fn().mockResolvedValue('/test/path')
  })

  // Use mocks in your test
})
```

## Mock Data Factories

### Creating Test Data

```typescript
import { createMockNote, createMockCategory } from '../__tests__/test-utils'

test('should work with mock data', () => {
  // Default mock note
  const note = createMockNote()
  expect(note.title).toBe('Test Note')

  // Custom mock note
  const customNote = createMockNote({
    title: 'My Custom Note',
    is_pinned: true,
    category_id: 'work-category'
  })

  // Mock category
  const category = createMockCategory({
    name: 'Work',
    color: '#ff0000'
  })
})
```

### Storage Adapter Mocking

```typescript
import { createMockStorageAdapter } from '../__tests__/test-utils'

test('should test storage operations', async () => {
  const mockAdapter = createMockStorageAdapter()

  // Override specific methods
  mockAdapter.getAllNotes.mockResolvedValue({
    data: [createMockNote()],
    error: null
  })

  const result = await mockAdapter.getAllNotes()
  expect(result.data).toHaveLength(1)
})
```

## Testing Patterns

### Async Operations

```typescript
import { render, screen, waitFor } from '../__tests__/test-utils'

test('should handle async loading', async () => {
  render(<AsyncComponent />)

  expect(screen.getByText('Loading...')).toBeInTheDocument()

  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument()
  })
})
```

### Error Handling

```typescript
import { render, screen, ErrorBoundary } from '../__tests__/test-utils'

test('should handle errors gracefully', () => {
  const ThrowingComponent = () => {
    throw new Error('Test error')
  }

  const onError = vi.fn()

  render(
    <ErrorBoundary onError={onError}>
      <ThrowingComponent />
    </ErrorBoundary>
  )

  expect(screen.getByTestId('error-boundary')).toBeInTheDocument()
  expect(onError).toHaveBeenCalledWith(expect.any(Error))
})
```

### CSS Class Testing

```typescript
import { render, screen, expectElementToHaveClasses } from '../__tests__/test-utils'

test('should have correct CSS classes', () => {
  render(<Button variant="primary" size="lg">Button</Button>)

  const button = screen.getByRole('button')
  expectElementToHaveClasses(button, [
    'bg-blue-600',
    'text-white',
    'px-6',
    'py-3'
  ])
})
```

## Performance Testing

### Measuring Render Time

```typescript
import { measureRenderTime } from '../__tests__/test-utils'

test('should render quickly', async () => {
  const renderTime = await measureRenderTime(() => {
    render(<LargeComponent />)
  })

  expect(renderTime).toBeLessThan(100) // Should render in less than 100ms
})
```

### Memory Leak Testing

```typescript
test('should not leak memory', () => {
  const { unmount } = render(<ComponentWithEventListeners />)

  // Component should clean up event listeners
  unmount()

  // Check for memory leaks if needed
})
```

## Integration Testing

### Full Workflow Testing

```typescript
import { renderWithJotai, setupTauriMocks } from '../__tests__/test-utils'

describe('Note Creation Workflow', () => {
  beforeEach(() => {
    setupTauriMocks({
      fs: {
        writeTextFile: vi.fn().mockResolvedValue(undefined)
      }
    })
  })

  test('should create and save note', async () => {
    const user = userEvent.setup()

    renderWithJotai(<NoteEditor />, [
      [notesAtom, []],
      [currentNoteAtom, null]
    ])

    // User creates new note
    await user.click(screen.getByText('New Note'))
    await user.type(screen.getByLabelText('Title'), 'My New Note')
    await user.type(screen.getByLabelText('Content'), 'Note content')

    // Save note
    await user.click(screen.getByText('Save'))

    // Verify note was saved
    await waitFor(() => {
      expect(screen.getByText('Note saved successfully')).toBeInTheDocument()
    })
  })
})
```

## Best Practices

### 1. Test Isolation
- Use `createTestStore()` for Jotai state isolation
- Reset mocks between tests with `resetTauriMocks()`
- Clear all mocks with `vi.clearAllMocks()`

### 2. Realistic Test Data
- Use mock factories for consistent test data
- Override specific properties for test scenarios
- Create hierarchical test data when needed

### 3. User-Centric Testing
- Test user interactions, not implementation details
- Use `screen.getByRole()` over `getByTestId()` when possible
- Test accessibility features

### 4. Async Operations
- Always await async operations
- Use `waitFor()` for conditions that change over time
- Test loading and error states

### 5. Performance Awareness
- Keep tests fast with minimal setup
- Mock external dependencies
- Use in-memory databases for storage tests

## Common Patterns

### Hook Testing with Jotai

```typescript
import { renderHook } from '@testing-library/react'
import { Provider } from 'jotai'

const TestWrapper = ({ children }) => <Provider>{children}</Provider>

test('should test custom hook', () => {
  const { result } = renderHook(() => useMyHook(), {
    wrapper: TestWrapper
  })

  expect(result.current.value).toBe(expectedValue)
})
```

### Component with External Dependencies

```typescript
test('should work with external dependencies', async () => {
  setupTauriMocks({
    fs: { readTextFile: vi.fn().mockResolvedValue('{}') }
  })

  renderWithJotai(<ConfigComponent />, [
    [configAtom, defaultConfig]
  ])

  await waitFor(() => {
    expect(screen.getByText('Config loaded')).toBeInTheDocument()
  })
})
```

This test utilities setup provides a solid foundation for testing React components with Jotai state management and Tauri API integration, following testing best practices and ensuring reliable, maintainable tests.