# Prop Drilling Elimination Checklist

## Phase 1: ActivityBar Direct Hook Access

### 1.1 ActivityBar Component Refactoring

- [x] Back up current ActivityBar component
- [x] Remove all state/action props from ActivityBarProps interface
- [x] Add direct hook calls inside ActivityBar component for sidebar state
- [x] Add direct hook calls inside ActivityBar component for view state
- [x] Add direct hook calls inside ActivityBar component for pane state
- [x] Add direct hook calls inside ActivityBar component for editor state
- [x] Add direct hook calls inside ActivityBar component for all action hooks
- [x] Test ActivityBar renders correctly with hooks
- [x] Verify all button functionalities work

### 1.2 MainLayout Simplification

- [x] Remove sidebarCollapsed state access from MainLayout
- [x] Remove toggleSidebar action from MainLayout
- [x] Delete useActivityBarProps hook entirely
- [x] Remove activityBarProps variable
- [x] Remove activityBarPropsWithFocus variable
- [x] Simplify ActivityBar JSX to only pass focus management props
- [x] Remove unused imports from MainLayout
- [x] Test MainLayout still renders correctly

## Phase 2: Focus Management Optimization

### 2.1 ActivityBar Focus Hook

- [x] Create new file: src/features/activity-bar/hooks/use-activity-bar-focus.ts
- [x] Implement useActivityBarFocus hook with focus management
- [x] Export hook from activity-bar index
- [x] Test hook works independently

### 2.2 ActivityBar Focus Integration

- [x] Import useActivityBarFocus in ActivityBar component
- [x] Replace focus props with hook usage
- [x] Remove focus management props from ActivityBarProps interface
- [x] Test focus management still works correctly

### 2.3 MainLayout ActivityBar Simplification

- [x] Remove focus management prop passing to ActivityBar
- [x] Simplify ActivityBar JSX to have no props
- [x] Test ActivityBar focus behavior

## Phase 3: Sidebar Focus Management

### 3.1 Sidebar Focus Hook Creation

- [x] Create new file: src/features/sidebar/hooks/use-sidebar-focus.ts
- [x] Implement useSidebarFocus hook
- [x] Export hook from sidebar hooks index
- [x] Test sidebar focus hook

### 3.2 AppSidebar Focus Integration

- [x] Remove focus management props from AppSidebarProps interface
- [x] Import useSidebarFocus in AppSidebar component
- [x] Replace focus props with hook usage
- [x] Test AppSidebar focus behavior

### 3.3 MainLayout Sidebar Simplification

- [x] Remove focusManagement prop from MemoizedSidebar
- [x] Update MemoizedSidebar to not accept focus props
- [x] Test sidebar functionality

## Phase 4: Clean Up and Testing

### 4.1 Code Cleanup

- [x] Remove useActivityBarProps hook file if separate
- [x] Clean up unused imports in main-layout.tsx
- [x] Remove unused focus management variables in MainLayout
- [x] Update component prop interfaces documentation

### 4.2 Final Testing

- [x] Test all ActivityBar buttons work correctly
- [x] Test sidebar toggle functionality
- [x] Test focus management keyboard navigation
- [x] Test dual pane toggle
- [x] Test config/hotkeys view toggles
- [x] Test editor toolbar toggle
- [x] Test line wrapping toggle
- [x] Verify no console errors
- [x] Check performance impact

### 4.3 Verification

- [x] Confirm no prop drilling in MainLayout
- [x] Confirm ActivityBar has zero props
- [x] Confirm AppSidebar has minimal props
- [x] Run TypeScript compilation check
- [x] Run any existing tests

## Summary

- [x] All components use direct hook access instead of prop drilling
- [x] MainLayout is simplified and no longer acts as prop aggregator
- [x] Focus management is handled locally by components
- [x] All functionality preserved
- [x] Code is cleaner and more maintainable
