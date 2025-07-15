# Open Props Removal & Tailwind Migration Plan

## Phase 1: Remove Open Props Dependencies

- [x] Remove `@import "open-props/style"` from `src/styles/tailwind.css`
- [x] Remove `@import "open-props/normalize"` from `src/styles/tailwind.css`
- [x] Remove `"open-props": "^1.7.15"` from `package.json`
- [x] Run `pnpm install` to clean up dependencies

## Phase 2: Replace Open Props Variables in Theme

### Color Variables Replacement in `src/styles/theme.css`
- [x] Replace `--blue-6` references with explicit color values
- [x] Replace `--blue-7` references with explicit color values
- [x] Replace `--blue-8` references with explicit color values
- [x] Replace `--blue-2` references with explicit color values
- [x] Replace `--gray-0` through `--gray-9` references with explicit values
- [x] Replace `--green-6`, `--yellow-6`, `--red-6` with explicit values

### Size Variables Replacement in `src/styles/theme.css`
- [x] Replace `--size-1` through `--size-5` with explicit rem values
- [x] Replace `--font-size-00` through `--font-size-3` with explicit values
- [x] Replace `--radius-2` through `--radius-4` with explicit values
- [x] Replace `--shadow-2` through `--shadow-4` with explicit values

### Font Variables Replacement
- [x] Replace `--font-sans` and `--font-mono` with explicit font stacks

## Phase 3: Component CSS Migration to Tailwind

### Rich Editor Components
- [x] Migrate `src/features/editor/components/rich-editor/rich-editor.css` to Tailwind classes
- [x] Migrate `src/features/editor/components/rich-editor/rich-editor-toolbar.css` to Tailwind classes
- [x] Update rich editor component files to use Tailwind classes instead of CSS classes

### Notes Tree View Components
- [x] Migrate `src/features/notes-tree-view/components/notes-tree-view.css` to Tailwind classes
- [x] Update notes tree view component files to use Tailwind classes

### Editor Components
- [x] Migrate `src/features/editor/components/dual-pane-editor.css` to Tailwind classes
- [x] Migrate `src/features/editor/components/config-view.css` to Tailwind classes
- [x] Migrate `src/features/editor/components/welcome-screen.css` to Tailwind classes
- [x] Migrate `src/features/editor/components/source-editor/source-editor.css` to Tailwind classes
- [x] Update all editor component files to use Tailwind classes

### Activity Bar Components
- [x] Migrate `src/features/activity-bar/components/activity-bar.css` to Tailwind classes
- [x] Update activity bar component files to use Tailwind classes

### Sidebar Components
- [x] Migrate sidebar CSS in notes-tree-view.css to Tailwind classes
- [x] Update sidebar component files to use Tailwind classes

### Folder Content Components
- [x] Migrate `src/features/editor/components/folder-content-view.css` to Tailwind classes
- [x] Update folder content component files to use Tailwind classes

## Phase 4: Update Component Files

### Replace Inline Styles with Tailwind Classes
- [ ] Update `src/features/editor/components/single-pane-content.tsx` inline styles
- [ ] Update `src/features/editor/components/editor-container.tsx` inline styles
- [ ] Update `src/features/editor/components/database-status-view.tsx` inline styles
- [ ] Update `src/features/layout/components/main-layout.tsx` inline styles
- [ ] Update `src/features/editor/components/dual-pane-editor.tsx` inline styles

### Replace CSS Variable References
- [ ] Replace `var(--iris-*)` references in all component files with Tailwind classes
- [ ] Replace CSS custom property usage in `src/features/editor/hooks/use-font-size.ts`
- [ ] Update theme-related files to use Tailwind dark mode classes

## Phase 5: Update Global Styles

### Focus Management Styles
- [ ] Migrate `src/styles/focus-management.css` to use Tailwind classes where possible
- [ ] Keep only essential CSS that cannot be replaced by Tailwind utilities

### Component Styles
- [ ] Migrate `src/styles/components.css` to use Tailwind classes where possible
- [ ] Keep only scrollbar styles and other browser-specific CSS

### Theme File Cleanup
- [ ] Remove or consolidate `src/styles/theme.css` after migrating variables
- [ ] Update theme-related imports in main files

## Phase 6: Tailwind Configuration Updates

### Extend Tailwind Theme
- [ ] Add any missing color values to Tailwind theme configuration
- [ ] Add any missing spacing values to Tailwind theme configuration
- [ ] Add any missing typography values to Tailwind theme configuration
- [ ] Ensure dark mode variants are properly configured

### Custom Utilities
- [ ] Add any necessary custom utilities for editor-specific functionality
- [ ] Add utilities for focus management that cannot be handled by standard classes

## Phase 7: Testing & Cleanup

### Visual Testing
- [ ] Test light mode appearance matches previous design
- [ ] Test dark mode appearance matches previous design
- [ ] Test responsive behavior on different screen sizes
- [ ] Test editor functionality (font sizing, line wrapping, etc.)

### Component Testing
- [ ] Test notes tree view functionality
- [ ] Test dual-pane editor functionality
- [ ] Test activity bar interactions
- [ ] Test sidebar collapse/expand behavior
- [ ] Test focus management system

### Performance Testing
- [ ] Verify CSS bundle size reduction after Open Props removal
- [ ] Test application startup performance
- [ ] Verify no console errors or warnings

### Code Cleanup
- [ ] Remove unused CSS files that have been fully migrated
- [ ] Remove unused CSS classes and selectors
- [ ] Clean up any remaining references to Open Props variables
- [ ] Update any documentation references to CSS classes

## Phase 8: Final Verification

### Dependency Cleanup
- [ ] Verify Open Props is completely removed from package.json
- [ ] Verify pnpm-lock.yaml has been updated
- [ ] Run `pnpm install` to ensure clean dependency state

### Build Testing
- [ ] Run `pnpm run build` to ensure production build works
- [ ] Test production build in browser
- [ ] Verify all functionality works in production mode

### Documentation Updates
- [ ] Update any component documentation to reflect Tailwind usage
- [ ] Update development guides to mention Tailwind-first approach
- [ ] Update any style guides or design system documentation

## Notes

- Maintain all current functionality during migration
- Preserve exact visual appearance where possible
- Keep editor-specific CSS variables that are dynamically updated via JavaScript
- Focus on incremental migration to avoid breaking changes
- Test each phase before proceeding to the next
- Keep essential browser-specific CSS (scrollbars, focus outlines, etc.)