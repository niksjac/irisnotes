import React from 'react';

// Layout hooks
import {
  useSidebarState,
  useSidebarActions,
  usePaneState,
  usePaneActions,
  useViewState,
  useViewActions,
  useEditorLayout
} from '../features/layout';

// Notes hooks
import {
  useNotesData,
  useNotesSelection,
  useNotesActions,
  useNotesNavigation,
  useNotesInitialization
} from '../features/notes/hooks';

// Editor hooks
import { useEditorState, useEditorActions } from '../features/editor';

// Theme hooks
import { useThemeState, useThemeActions } from '../features/theme';

/**
 * Example component demonstrating focused hooks usage
 *
 * BEFORE (God Hook):
 * const {
 *   sidebarCollapsed, toggleSidebar, notes, selectedNote,
 *   createNote, updateNote, fontSize, toggleLineWrapping,
 *   darkMode, toggleDarkMode, ...
 * } = useAppState(); // 20+ values from one hook!
 *
 * AFTER (Focused Hooks):
 * Each hook only provides what you need for that specific concern
 */
export const FocusedHooksExample: React.FC = () => {
  // Layout state - only subscribe to what you need
  const { sidebarCollapsed } = useSidebarState();
  const { isDualPaneMode, activePaneId } = usePaneState();
  const { configViewActive } = useViewState();

  // Layout actions - only import the actions you'll use
  const { toggleSidebar } = useSidebarActions();
  const { toggleDualPaneMode } = usePaneActions();
  const { toggleConfigView } = useViewActions();
  const { toggleToolbar } = useEditorLayout();

  // Notes data - only subscribe to notes data changes
  const { notes, isLoading, error } = useNotesData();

  // Notes selection - only subscribe to selection changes
  const { selectedNoteId } = useNotesSelection();

  // Notes actions - only the actions you need
  const { createNewNote, updateNoteTitle } = useNotesActions();

  // Notes navigation - helper methods for finding notes
  const { getSelectedNote, getNotesForPane } = useNotesNavigation();

  // Initialize notes when storage is ready
  useNotesInitialization();

  // Editor state - only font size and wrapping for this component
  const { fontSize, isWrapping } = useEditorState();

  // Editor actions - only the actions we need
  const { toggleLineWrapping, increaseFontSize } = useEditorActions();

  // Theme state - only dark mode for this component
  const { darkMode } = useThemeState();

  // Theme actions - only the actions we need
  const { toggleDarkMode } = useThemeActions();

  // Get the currently selected note
  const selectedNote = getSelectedNote();
  const panesNotes = getNotesForPane();

  return (
    <div className="focused-hooks-example">
      <h2>Focused Hooks Example</h2>

      {/* Layout Controls */}
      <div className="layout-controls">
        <h3>Layout Controls</h3>
        <button onClick={toggleSidebar}>
          {sidebarCollapsed ? 'Show' : 'Hide'} Sidebar
        </button>
        <button onClick={toggleDualPaneMode}>
          {isDualPaneMode ? 'Single' : 'Dual'} Pane Mode
        </button>
        <button onClick={toggleConfigView}>
          {configViewActive ? 'Hide' : 'Show'} Config View
        </button>
        <button onClick={toggleToolbar}>
          Toggle Toolbar
        </button>
        <p>Active Pane: {activePaneId}</p>
      </div>

      {/* Notes Controls */}
      <div className="notes-controls">
        <h3>Notes Controls</h3>
        <button onClick={() => createNewNote()}>
          Create New Note
        </button>
        <p>Notes Count: {notes.length}</p>
        <p>Selected Note ID: {selectedNoteId || 'None'}</p>
        <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
        {error && <p className="error">Error: {error}</p>}

        {selectedNote && (
          <div>
            <h4>Selected Note: {selectedNote.title}</h4>
            <button onClick={() => updateNoteTitle(selectedNote.id, 'Updated Title')}>
              Update Title
            </button>
          </div>
        )}

        {isDualPaneMode && (
          <div>
            <h4>Dual Pane Notes</h4>
            <p>Left Pane: {panesNotes.left?.title || 'None'}</p>
            <p>Right Pane: {panesNotes.right?.title || 'None'}</p>
          </div>
        )}
      </div>

      {/* Editor Controls */}
      <div className="editor-controls">
        <h3>Editor Controls</h3>
        <button onClick={toggleLineWrapping}>
          {isWrapping ? 'Disable' : 'Enable'} Line Wrapping
        </button>
        <button onClick={increaseFontSize}>
          Increase Font Size
        </button>
        <p>Font Size: {fontSize}px</p>
        <p>Line Wrapping: {isWrapping ? 'On' : 'Off'}</p>
      </div>

      {/* Theme Controls */}
      <div className="theme-controls">
        <h3>Theme Controls</h3>
        <button onClick={toggleDarkMode}>
          {darkMode ? 'Light' : 'Dark'} Mode
        </button>
        <p>Current Mode: {darkMode ? 'Dark' : 'Light'}</p>
      </div>

      {/* Benefits Display */}
      <div className="benefits">
        <h3>Benefits of Focused Hooks</h3>
        <ul>
          <li>✅ <strong>Selective Re-rendering:</strong> Only re-renders when specific atoms change</li>
          <li>✅ <strong>Clear Dependencies:</strong> Easy to see what state each component uses</li>
          <li>✅ <strong>Better Performance:</strong> No unnecessary re-renders from unrelated state changes</li>
          <li>✅ <strong>Easier Testing:</strong> Test individual concerns in isolation</li>
          <li>✅ <strong>Better IntelliSense:</strong> Focused hooks have better autocomplete</li>
          <li>✅ <strong>Maintainable:</strong> Changes in one area don't affect others</li>
        </ul>
      </div>
    </div>
  );
};

/**
 * Migration Guide:
 *
 * 1. Replace god hooks with focused hooks:
 *    - useAppState() → useSidebarState(), useNotesData(), etc.
 *    - useLayout() → useSidebarState(), usePaneState(), useViewState()
 *    - useSingleStorageNotes() → useNotesData(), useNotesActions(), etc.
 *
 * 2. Import only what you need:
 *    - Before: const { a, b, c, d, e, f, g } = useAppState();
 *    - After: const { a, b } = useNotesData(); const { c } = useEditorState();
 *
 * 3. Use action hooks for state changes:
 *    - Before: toggleSidebar() // from god hook
 *    - After: const { toggleSidebar } = useSidebarActions();
 *
 * 4. Initialize hooks properly:
 *    - Add useNotesInitialization() to components that need notes
 *    - Add useThemeActions().loadUserTheme() for theme setup
 */