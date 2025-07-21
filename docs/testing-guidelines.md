# Testing Guidelines

## Overview

This document outlines testing patterns, conventions, and best practices for the IrisNotes project. We use a comprehensive testing stack with Vitest, React Testing Library, Playwright, and Storybook.

## Testing Stack

- **Unit/Integration Tests**: Vitest + React Testing Library
- **E2E Tests**: Playwright (configured for Tauri desktop apps)
- **Component Documentation**: Storybook with accessibility testing
- **Coverage**: Vitest with 80% minimum threshold

## Project Structure

```
src/
├── __tests__/
│   ├── setup.ts              # Global test configuration
│   ├── test-utils.tsx        # Custom render utilities
│   └── mocks/               # Mock implementations
├── features/
│   └── [feature]/
│       ├── components/
│       │   └── component.test.tsx
│       └── hooks/
│           └── hook.test.ts
└── shared/
    └── components/
        ├── button.test.tsx
        └── button.stories.tsx
tests/                        # E2E tests (Playwright)
```

## Testing Patterns

### 1. Component Testing

```tsx
import { render, screen, fireEvent } from '../__tests__/test-utils';
import { Button } from './button';

describe('Button', () => {
  it('renders with correct variant', () => {
    render(<Button variant='primary'>Click me</Button>);

    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toHaveClass('bg-blue-600');
  });

  it('handles loading state', () => {
    render(<Button loading>Loading</Button>);

    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument(); // Loading spinner
  });
});
```

### 2. Hook Testing with Jotai

```tsx
import { renderHook, act } from '../__tests__/test-utils';
import { useTheme } from './use-theme';
import { themeAtom } from '../atoms';

describe('useTheme', () => {
  it('toggles theme correctly', () => {
    const { result } = renderHook(() => useTheme(), {
      initialValues: [[themeAtom, 'light']],
    });

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('dark');
  });
});
```

### 3. Storage Layer Testing

```tsx
import { createMockStorageAdapter, createMockNote } from '../__tests__/test-utils';

describe('NotesStorage', () => {
  it('creates note successfully', async () => {
    const mockStorage = createMockStorageAdapter();
    const mockNote = createMockNote({ title: 'Test Note' });

    mockStorage.createNote.mockResolvedValue({ data: mockNote, error: null });

    const result = await mockStorage.createNote({
      title: 'Test Note',
      content: '<p>Content</p>',
    });

    expect(result.data).toEqual(mockNote);
    expect(mockStorage.createNote).toHaveBeenCalledWith({
      title: 'Test Note',
      content: '<p>Content</p>',
    });
  });
});
```

### 4. Tauri API Testing

```tsx
import { mockTauriAPIs } from '../__tests__/test-utils';

describe('FileManager', () => {
  beforeEach(() => {
    mockTauriAPIs();
  });

  it('reads file content', async () => {
    const { readTextFile } = await import('@tauri-apps/plugin-fs');
    (readTextFile as any).mockResolvedValue('file content');

    const content = await readTextFile('/path/to/file');
    expect(content).toBe('file content');
  });
});
```

## E2E Testing with Playwright

### Basic App Testing

```typescript
import { test, expect } from '@playwright/test';

test('app launches successfully', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Tauri \+ React \+ Typescript/);

  // Wait for app initialization
  await page.waitForTimeout(1000);
  expect(page.locator('body')).toBeVisible();
});
```

### User Workflow Testing

```typescript
test('note creation workflow', async ({ page }) => {
  await page.goto('/');

  // Click new note button
  await page.getByRole('button', { name: /new note/i }).click();

  // Fill in note details
  await page.fill('[data-testid="note-title"]', 'My Test Note');
  await page.fill('[data-testid="note-content"]', 'This is test content');

  // Save note
  await page.getByRole('button', { name: /save/i }).click();

  // Verify note appears in list
  await expect(page.getByText('My Test Note')).toBeVisible();
});
```

## Storybook Component Documentation

### Basic Story Structure

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta = {
  title: 'Shared/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A flexible button component with multiple variants and sizes.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Button',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className='flex gap-4'>
      <Button variant='primary'>Primary</Button>
      <Button variant='secondary'>Secondary</Button>
      <Button variant='danger'>Danger</Button>
      <Button variant='ghost'>Ghost</Button>
    </div>
  ),
};
```

## Testing Conventions

### 1. File Naming

- Unit tests: `component.test.tsx` or `hook.test.ts`
- E2E tests: `feature.spec.ts`
- Stories: `component.stories.tsx`

### 2. Test Organization

```typescript
describe('ComponentName', () => {
  describe('rendering', () => {
    // Tests for different render scenarios
  });

  describe('interactions', () => {
    // Tests for user interactions
  });

  describe('edge cases', () => {
    // Tests for error states, empty states, etc.
  });
});
```

### 3. Test Data

- Use mock factories from `test-utils.tsx`
- Prefer realistic test data over minimal examples
- Keep test data isolated between tests

### 4. Assertions

- Use semantic queries (`getByRole`, `getByLabelText`, etc.)
- Prefer user-centric assertions over implementation details
- Test accessibility (screen readers, keyboard navigation)

## Coverage Requirements

- **Overall**: 80% line coverage minimum
- **Core Logic**: 90% coverage (storage, state management)
- **Critical Paths**: 95% coverage (note CRUD operations)
- **UI Components**: 70% coverage (focus on user interactions)

### Running Coverage

```bash
# Generate coverage report
pnpm test:coverage

# View HTML coverage report
open coverage/index.html
```

## Accessibility Testing

### In Storybook

- Install: `@storybook/addon-a11y` (already configured)
- Review accessibility panel for each story
- Test keyboard navigation and screen reader compatibility

### In Tests

```tsx
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('has no accessibility violations', async () => {
  const { container } = render(<Button>Click me</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Performance Testing

### Component Performance

```tsx
import { measureRenderTime } from '../__tests__/test-utils';

test('renders within acceptable time', async () => {
  const renderTime = await measureRenderTime(() => {
    render(<LargeComponentTree />);
  });

  expect(renderTime).toBeLessThan(100); // 100ms threshold
});
```

### E2E Performance

```typescript
test('app loads within 5 seconds', async ({ page }) => {
  const start = Date.now();
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const loadTime = Date.now() - start;

  expect(loadTime).toBeLessThan(5000);
});
```

## Common Testing Utilities

### Custom Matchers

```typescript
// In test-utils.tsx
export const expectElementToHaveClasses = (element: Element, classes: string[]) => {
  classes.forEach(className => {
    expect(element).toHaveClass(className);
  });
};
```

### Async Testing

```typescript
import { waitFor, waitForElementToBeRemoved } from '@testing-library/react';

// Wait for async operations
await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});

// Wait for element removal
await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));
```

## Debugging Tests

### Jest/Vitest Debugging

```bash
# Run specific test
pnpm test Button.test.tsx

# Debug mode
pnpm test:ui

# Watch mode
pnpm test:watch
```

### Playwright Debugging

```bash
# Debug mode (opens browser)
pnpm test:e2e:debug

# Headed mode (visible browser)
pnpm test:e2e:headed

# View test report
pnpm test:e2e:report
```

### Console Debugging in Tests

```tsx
import { screen } from '@testing-library/react';

// Debug rendered DOM
screen.debug();

// Debug specific element
screen.debug(screen.getByRole('button'));
```

## Best Practices

### ✅ Do

- Test user behavior, not implementation details
- Use semantic queries (`getByRole`, `getByLabelText`)
- Keep tests isolated and independent
- Use descriptive test names
- Test error states and edge cases
- Mock external dependencies (Tauri APIs, file system)
- Use factories for test data generation

### ❌ Don't

- Test implementation details (internal state, private methods)
- Write overly complex setup code
- Share state between tests
- Use `setTimeout` in tests (use `waitFor` instead)
- Ignore accessibility in component tests
- Skip error boundary testing
- Forget to clean up side effects

## Commands Reference

```bash
# Unit tests
pnpm test                    # Run all unit tests
pnpm test:coverage          # Run with coverage
pnpm test:ui               # Run with UI
pnpm test:watch            # Watch mode

# E2E tests
pnpm test:e2e              # Run E2E tests
pnpm test:e2e:ui           # Interactive UI mode
pnpm test:e2e:debug        # Debug mode
pnpm test:e2e:headed       # Visible browser

# Storybook
pnpm storybook             # Start Storybook dev server
pnpm build-storybook       # Build static Storybook
```

This testing strategy ensures high code quality, maintainability, and user experience across the entire application.
