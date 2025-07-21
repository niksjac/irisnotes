import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '../../../__tests__/test-utils';
import { useLayout } from './use-layout';

// Mock the useConfig hook
const mockUpdateConfig = vi.fn();
const mockConfig = {
  editor: {
    toolbarVisible: true,
  },
};

vi.mock('../../../hooks/use-config', () => ({
  useConfig: () => ({
    config: mockConfig,
    updateConfig: mockUpdateConfig,
  }),
}));

describe('useLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('initializes with correct default values', () => {
      const { result } = renderHook(() => useLayout());

      expect(result.current.sidebarCollapsed).toBe(true);
      expect(result.current.activityBarVisible).toBe(true);
      expect(result.current.configViewActive).toBe(false);
      expect(result.current.hotkeysViewActive).toBe(false);
      expect(result.current.databaseStatusVisible).toBe(false);
      expect(result.current.isDualPaneMode).toBe(false);
      expect(result.current.activePaneId).toBe('left');
      expect(result.current.toolbarVisible).toBe(true);
    });

    it('provides all expected functions', () => {
      const { result } = renderHook(() => useLayout());

      expect(typeof result.current.toggleSidebar).toBe('function');
      expect(typeof result.current.handleSidebarCollapsedChange).toBe('function');
      expect(typeof result.current.toggleActivityBar).toBe('function');
      expect(typeof result.current.toggleConfigView).toBe('function');
      expect(typeof result.current.toggleHotkeysView).toBe('function');
      expect(typeof result.current.toggleDatabaseStatus).toBe('function');
      expect(typeof result.current.toggleDualPaneMode).toBe('function');
      expect(typeof result.current.setActivePane).toBe('function');
      expect(typeof result.current.toggleToolbar).toBe('function');
    });
  });

  describe('sidebar functionality', () => {
    it('toggles sidebar state', () => {
      const { result } = renderHook(() => useLayout());

      expect(result.current.sidebarCollapsed).toBe(true);

      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.sidebarCollapsed).toBe(false);

      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.sidebarCollapsed).toBe(true);
    });

    it('handles sidebar collapsed change', () => {
      const { result } = renderHook(() => useLayout());

      act(() => {
        result.current.handleSidebarCollapsedChange(false);
      });

      expect(result.current.sidebarCollapsed).toBe(false);

      act(() => {
        result.current.handleSidebarCollapsedChange(true);
      });

      expect(result.current.sidebarCollapsed).toBe(true);
    });
  });

  describe('activity bar functionality', () => {
    it('toggles activity bar visibility', () => {
      const { result } = renderHook(() => useLayout());

      expect(result.current.activityBarVisible).toBe(true);

      act(() => {
        result.current.toggleActivityBar();
      });

      expect(result.current.activityBarVisible).toBe(false);

      act(() => {
        result.current.toggleActivityBar();
      });

      expect(result.current.activityBarVisible).toBe(true);
    });
  });

  describe('view management', () => {
    it('toggles config view', () => {
      const { result } = renderHook(() => useLayout());

      expect(result.current.configViewActive).toBe(false);

      act(() => {
        result.current.toggleConfigView();
      });

      expect(result.current.configViewActive).toBe(true);

      act(() => {
        result.current.toggleConfigView();
      });

      expect(result.current.configViewActive).toBe(false);
    });

    it('toggles hotkeys view', () => {
      const { result } = renderHook(() => useLayout());

      expect(result.current.hotkeysViewActive).toBe(false);

      act(() => {
        result.current.toggleHotkeysView();
      });

      expect(result.current.hotkeysViewActive).toBe(true);

      act(() => {
        result.current.toggleHotkeysView();
      });

      expect(result.current.hotkeysViewActive).toBe(false);
    });

    it('deactivates config view when activating hotkeys view', () => {
      const { result } = renderHook(() => useLayout());

      // Activate config view first
      act(() => {
        result.current.toggleConfigView();
      });

      expect(result.current.configViewActive).toBe(true);
      expect(result.current.hotkeysViewActive).toBe(false);

      // Activate hotkeys view - should deactivate config view
      act(() => {
        result.current.toggleHotkeysView();
      });

      expect(result.current.configViewActive).toBe(false);
      expect(result.current.hotkeysViewActive).toBe(true);
    });

    it('deactivates hotkeys view when activating config view', () => {
      const { result } = renderHook(() => useLayout());

      // Activate hotkeys view first
      act(() => {
        result.current.toggleHotkeysView();
      });

      expect(result.current.hotkeysViewActive).toBe(true);
      expect(result.current.configViewActive).toBe(false);

      // Activate config view - should deactivate hotkeys view
      act(() => {
        result.current.toggleConfigView();
      });

      expect(result.current.hotkeysViewActive).toBe(false);
      expect(result.current.configViewActive).toBe(true);
    });
  });

  describe('database status functionality', () => {
    it('toggles database status visibility', () => {
      const { result } = renderHook(() => useLayout());

      expect(result.current.databaseStatusVisible).toBe(false);

      act(() => {
        result.current.toggleDatabaseStatus();
      });

      expect(result.current.databaseStatusVisible).toBe(true);

      act(() => {
        result.current.toggleDatabaseStatus();
      });

      expect(result.current.databaseStatusVisible).toBe(false);
    });
  });

  describe('dual pane functionality', () => {
    it('toggles dual pane mode', () => {
      const { result } = renderHook(() => useLayout());

      expect(result.current.isDualPaneMode).toBe(false);

      act(() => {
        result.current.toggleDualPaneMode();
      });

      expect(result.current.isDualPaneMode).toBe(true);

      act(() => {
        result.current.toggleDualPaneMode();
      });

      expect(result.current.isDualPaneMode).toBe(false);
    });

    it('sets active pane', () => {
      const { result } = renderHook(() => useLayout());

      expect(result.current.activePaneId).toBe('left');

      act(() => {
        result.current.setActivePane('right');
      });

      expect(result.current.activePaneId).toBe('right');

      act(() => {
        result.current.setActivePane('left');
      });

      expect(result.current.activePaneId).toBe('left');
    });
  });

  describe('toolbar functionality', () => {
    it('toggles toolbar visibility', () => {
      const { result } = renderHook(() => useLayout());

      expect(result.current.toolbarVisible).toBe(true);

      act(() => {
        result.current.toggleToolbar();
      });

      expect(mockUpdateConfig).toHaveBeenCalledWith({
        editor: {
          ...mockConfig.editor,
          toolbarVisible: false,
        },
      });
    });

    it('reflects toolbar visibility from config', () => {
      // Test with toolbar initially hidden
      mockConfig.editor.toolbarVisible = false;

      const { result } = renderHook(() => useLayout());

      expect(result.current.toolbarVisible).toBe(false);

      act(() => {
        result.current.toggleToolbar();
      });

      expect(mockUpdateConfig).toHaveBeenCalledWith({
        editor: {
          ...mockConfig.editor,
          toolbarVisible: true,
        },
      });

      // Reset for other tests
      mockConfig.editor.toolbarVisible = true;
    });
  });

  describe('complex interactions', () => {
    it('maintains state consistency when toggling multiple features', () => {
      const { result } = renderHook(() => useLayout());

      // Toggle multiple features
      act(() => {
        result.current.toggleSidebar();
        result.current.toggleActivityBar();
        result.current.toggleDualPaneMode();
        result.current.setActivePane('right');
      });

      expect(result.current.sidebarCollapsed).toBe(false);
      expect(result.current.activityBarVisible).toBe(false);
      expect(result.current.isDualPaneMode).toBe(true);
      expect(result.current.activePaneId).toBe('right');
    });

    it('handles rapid state changes correctly', () => {
      const { result } = renderHook(() => useLayout());

      // Rapid toggles of sidebar
      act(() => {
        result.current.toggleSidebar();
        result.current.toggleSidebar();
        result.current.toggleSidebar();
      });

      expect(result.current.sidebarCollapsed).toBe(false);

      // Test individual view toggles work properly
      act(() => {
        result.current.toggleConfigView();
      });

      expect(result.current.configViewActive).toBe(true);
      expect(result.current.hotkeysViewActive).toBe(false);

      act(() => {
        result.current.toggleHotkeysView();
      });

      expect(result.current.configViewActive).toBe(false);
      expect(result.current.hotkeysViewActive).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles setting same pane ID', () => {
      const { result } = renderHook(() => useLayout());

      expect(result.current.activePaneId).toBe('left');

      act(() => {
        result.current.setActivePane('left');
      });

      expect(result.current.activePaneId).toBe('left');
    });

    it('handles config changes during component lifecycle', () => {
      const { result, rerender } = renderHook(() => useLayout());

      // Change config externally
      mockConfig.editor.toolbarVisible = false;
      rerender();

      expect(result.current.toolbarVisible).toBe(false);
    });
  });
});
