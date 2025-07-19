# IrisNotes - Testing Strategy & Implementation

## Overview

• **Current Status**: No testing infrastructure exists
• **Goal**: Implement comprehensive test coverage across all application layers
• **Priority**: Critical for reliability, maintainability, and user confidence
• **Approach**: Progressive implementation starting with core functionality

## Testing Philosophy

• **Test Pyramid**: Unit tests (70%) → Integration tests (20%) → E2E tests (10%)
• **Test-Driven Development**: Write tests for new features before implementation
• **Confidence-Driven Testing**: Focus on high-value, high-risk areas first
• **Maintainable Tests**: Clear, readable tests that document expected behavior

## Testing Frameworks & Tools

### Unit & Integration Testing
• **Vitest** - Fast Vite-native test runner with TypeScript support
• **React Testing Library** - Component testing with user-centric queries
• **jsdom** - DOM environment for React component testing
• **MSW (Mock Service Worker)** - API mocking for integration tests

### End-to-End Testing
• **Playwright** - Cross-browser E2E testing for Tauri desktop apps
• **Tauri Testing** - Native app testing with Tauri's testing utilities

### Additional Tools
• **@testing-library/jest-dom** - Custom Jest matchers for DOM nodes
• **@testing-library/user-event** - Advanced user interaction simulation
• **@vitest/coverage-v8** - Code coverage reporting
• **@storybook/react** - Component development and visual testing (future)

## Test Structure & Organization

### Directory Structure
```
src/
├── __tests__/                 # Global test utilities and setup
│   ├── setup.ts              # Test environment configuration
│   ├── test-utils.tsx        # Custom render functions with providers
│   └── mocks/                # Global mocks and fixtures
├── features/
│   ├── notes/
│   │   ├── hooks/
│   │   │   ├── use-notes-data.test.ts
│   │   │   └── use-notes-actions.test.ts
│   │   ├── storage/
│   │   │   ├── adapters/
│   │   │   │   └── sqlite-storage.test.ts
│   │   │   └── single-storage-manager.test.ts
│   │   └── components/
│   ├── editor/
│   │   ├── components/
│   │   │   ├── rich-editor/
│   │   │   │   ├── rich-editor.test.tsx
│   │   │   │   └── utils/
│   │   │   │       └── content-parser.test.ts
│   │   │   └── source-editor/
│   │   └── hooks/
│   └── ...
└── shared/
    ├── components/
    │   ├── button.test.tsx
    │   ├── input.test.tsx
    │   └── modal.test.tsx
    └── utils/
        ├── cn.test.ts
        └── text-parser.test.ts
```

### Test File Naming
• **Unit Tests**: `[module].test.ts` or `[component].test.tsx`
• **Integration Tests**: `[feature].integration.test.ts`
• **E2E Tests**: `[workflow].e2e.test.ts`

## Testing Coverage Areas

### Core Infrastructure (Priority 1)
• **Storage Layer**
  - SQLite adapter CRUD operations
  - Storage manager configuration switching
  - Database migration and initialization
  - Error handling and fallback mechanisms
• **State Management**
  - Jotai atoms for notes, categories, layout
  - Action atoms for mutations
  - State synchronization between components
• **Configuration System**
  - Environment detection (dev/prod)
  - Storage backend configuration
  - Settings persistence and validation

### Business Logic (Priority 2)
• **Note Management**
  - Note creation, editing, deletion
  - Content format conversion (HTML, Markdown, Custom)
  - Note relationships and categorization
  - Search and filtering functionality
• **Text Editing**
  - ProseMirror editor functionality
  - Custom markup parsing and rendering
  - Rich text formatting commands
  - Source/rich mode switching
• **Organization Features**
  - Category hierarchy management
  - Tag creation and assignment
  - Note relationships (references, children)

### User Interface (Priority 3)
• **Component Library**
  - Button, Input, Modal components
  - Form validation and submission
  - Accessibility compliance (ARIA, keyboard navigation)
• **Layout Components**
  - Sidebar collapse/expand
  - Dual-pane editor switching
  - Responsive behavior
• **Editor Components**
  - Rich editor toolbar functionality
  - Source editor syntax highlighting
  - Font size and line wrapping controls

### Integration Points (Priority 4)
• **Tauri Integration**
  - File system operations
  - Window state persistence
  - Global shortcuts and hotkeys
  - Clipboard operations
• **Performance**
  - Bundle size optimization
  - Memory usage and leak detection
  - Render performance monitoring

## Test Implementation Plan

### Phase 1: Foundation Setup (Week 1)
• **Testing Infrastructure**
  - Install and configure Vitest + React Testing Library
  - Set up test environment with jsdom
  - Create test utilities and custom render functions
  - Configure coverage reporting
• **Basic Unit Tests**
  - Shared utility functions (`cn`, `text-parser`, `id-generation`)
  - Basic component tests (Button, Input)
  - Simple hook tests (theme, config)

### Phase 2: Core Functionality (Week 2-3)
• **Storage Layer Tests**
  - SQLite adapter comprehensive testing
  - Storage manager configuration tests
  - Database operation error handling
• **State Management Tests**
  - Jotai atom behavior verification
  - Action atom side effects
  - State persistence and hydration
• **Note Management Tests**
  - CRUD operations with various content types
  - Custom markup parsing and rendering
  - Content format conversion accuracy

### Phase 3: User Interface (Week 4)
• **Component Integration Tests**
  - Editor components with real content
  - Layout state management
  - User interaction flows
• **Navigation Tests**
  - Note selection and opening
  - Dual-pane mode switching
  - Category and tag navigation

### Phase 4: End-to-End Workflows (Week 5)
• **Critical User Journeys**
  - Complete note creation and editing workflow
  - Storage backend switching
  - Configuration changes and persistence
• **Cross-Platform Testing**
  - Windows, macOS, Linux compatibility
  - Different screen sizes and resolutions

## Testing Patterns & Best Practices

### Unit Testing Patterns

#### Hook Testing
```typescript
// Example: Testing custom hooks with Jotai
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'jotai';
import { useNotesData } from './use-notes-data';

const TestProvider = ({ children }: { children: React.ReactNode }) => (
  <Provider>{children}</Provider>
);

test('should load notes on initialization', async () => {
  const { result } = renderHook(() => useNotesData(), {
    wrapper: TestProvider,
  });

  expect(result.current.isLoading).toBe(true);

  await act(async () => {
    // Wait for async operations
  });

  expect(result.current.notes).toHaveLength(0);
  expect(result.current.isLoading).toBe(false);
});
```

#### Component Testing
```typescript
// Example: Testing components with user interactions
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RichEditor } from './rich-editor';

test('should format text as bold when toolbar button clicked', async () => {
  const user = userEvent.setup();
  const onContentChange = vi.fn();

  render(<RichEditor content="" onContentChange={onContentChange} />);

  const editor = screen.getByRole('textbox');
  const boldButton = screen.getByRole('button', { name: /bold/i });

  await user.type(editor, 'Hello world');
  await user.selectAll();
  await user.click(boldButton);

  expect(onContentChange).toHaveBeenCalledWith(
    expect.stringContaining('<strong>Hello world</strong>')
  );
});
```

### Integration Testing Patterns

#### Storage Integration
```typescript
// Example: Testing storage operations with real database
import { createSQLiteStorage } from '../adapters/sqlite-storage';
import Database from 'tauri-plugin-sql-api';

describe('SQLite Storage Integration', () => {
  let storage: SQLiteStorageAdapter;
  let db: Database;

  beforeEach(async () => {
    db = await Database.load(':memory:');
    storage = createSQLiteStorage({ database_path: ':memory:' });
    await storage.init();
  });

  afterEach(async () => {
    await db.close();
  });

  test('should persist notes across sessions', async () => {
    const note = await storage.createNote({
      title: 'Test Note',
      content: 'Test content'
    });

    const retrieved = await storage.getNote(note.data!.id);
    expect(retrieved.data).toEqual(note.data);
  });
});
```

### E2E Testing Patterns

#### User Workflow Testing
```typescript
// Example: Playwright E2E test for note creation
import { test, expect } from '@playwright/test';

test('complete note creation workflow', async ({ page }) => {
  await page.goto('tauri://localhost');

  // Create new note
  await page.click('[data-testid="create-note-button"]');
  await page.fill('[data-testid="note-title"]', 'My Test Note');
  await page.fill('[data-testid="note-content"]', 'This is test content');

  // Apply formatting
  await page.selectText('[data-testid="note-content"]');
  await page.click('[data-testid="bold-button"]');

  // Save and verify
  await page.click('[data-testid="save-note"]');

  await expect(page.locator('[data-testid="note-list"]')).toContainText('My Test Note');
  await expect(page.locator('[data-testid="note-content"]')).toContainText('This is test content');
});
```

## Test Data & Fixtures

### Test Database
• **In-Memory SQLite**: Use `:memory:` database for fast test execution
• **Test Migrations**: Apply full schema for realistic testing
• **Seed Data**: Consistent test data for repeatable tests

### Mock Data
• **Note Fixtures**: Various content types and formats
• **Category/Tag Fixtures**: Hierarchical and relationship data
• **Configuration Fixtures**: Different storage configurations

### Factory Functions
```typescript
// Example: Test data factories
export const createMockNote = (overrides: Partial<Note> = {}): Note => ({
  id: generateId(),
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
  ...overrides,
});
```

## Coverage Requirements

### Target Coverage Metrics
• **Overall**: 80% line coverage minimum
• **Core Logic**: 90% coverage for storage, state management
• **Critical Paths**: 95% coverage for note CRUD operations
• **UI Components**: 70% coverage (focus on user interactions)

### Coverage Areas
• **Functions**: All public APIs and critical private functions
• **Branches**: All conditional logic and error paths
• **Statements**: All executable code paths
• **Integration**: All feature interactions and data flows

## Continuous Integration

### Test Automation
• **Pre-commit**: Unit tests on staged files
• **Pull Request**: Full test suite + coverage report
• **Main Branch**: E2E tests + performance benchmarks
• **Release**: Complete test suite + cross-platform validation

### Quality Gates
• **Test Passing**: All tests must pass before merge
• **Coverage Threshold**: Maintain minimum coverage levels
• **Performance**: No regression in bundle size or speed
• **Accessibility**: All components meet WCAG 2.1 AA standards

## Performance Testing

### Bundle Size Monitoring
• **Bundle Analysis**: Track size changes in CI
• **Tree Shaking**: Verify unused code elimination
• **Code Splitting**: Test lazy loading functionality

### Runtime Performance
• **Memory Usage**: Monitor memory leaks in long-running tests
• **Render Performance**: Measure component render times
• **Database Performance**: Test query execution times

## Accessibility Testing

### Automated Testing
• **axe-core**: Automated accessibility rule checking
• **ARIA Validation**: Proper ARIA attributes and roles
• **Keyboard Navigation**: Tab order and focus management

### Manual Testing
• **Screen Reader**: Test with NVDA/JAWS/VoiceOver
• **Keyboard Only**: Complete workflows without mouse
• **High Contrast**: Visual accessibility compliance

## Security Testing

### Data Protection
• **Input Sanitization**: XSS prevention in rich text editor
• **SQL Injection**: Parameterized queries in storage layer
• **File System**: Safe file operations and path validation

### Configuration Security
• **Sensitive Data**: No secrets in test files or logs
• **Database Security**: Proper access controls and encryption
• **Cross-Origin**: Tauri security policy compliance

## Documentation & Maintenance

### Test Documentation
• **README**: Setup and running instructions
• **Pattern Guide**: Testing patterns and examples
• **Coverage Reports**: Automated coverage documentation

### Test Maintenance
• **Regular Review**: Monthly test suite review and cleanup
• **Flaky Test Tracking**: Monitor and fix unstable tests
• **Performance Monitoring**: Track test execution times

## Future Enhancements

### Advanced Testing
• **Visual Regression**: Screenshot testing for UI consistency
• **Property-Based Testing**: Fuzz testing for edge cases
• **Contract Testing**: API contract validation

### Testing Tools Evolution
• **Storybook Integration**: Component documentation and testing
• **Mutation Testing**: Test quality verification
• **Parallel Testing**: Faster test execution with parallelization

## Success Metrics

### Quality Indicators
• **Bug Reduction**: 80% reduction in production bugs
• **Development Speed**: Faster feature development with confidence
• **Refactoring Safety**: Safe code changes with test coverage
• **Team Confidence**: Developer confidence in making changes

### Technical Metrics
• **Test Execution Time**: < 30 seconds for unit tests
• **Coverage Percentage**: 80%+ overall, 90%+ for core logic
• **Test Reliability**: < 1% flaky test rate
• **Maintenance Overhead**: < 20% of development time on test maintenance