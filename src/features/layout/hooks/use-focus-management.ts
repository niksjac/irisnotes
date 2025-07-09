import { useState, useEffect, useCallback, useRef } from 'react';

export type FocusableElement =
  | 'activity-bar'
  | 'sidebar-buttons'
  | 'sidebar-search'
  | 'sidebar-tree'
  | 'editor';

interface FocusManagementOptions {
  onFocusChange?: (element: FocusableElement) => void;
  onToggleSidebar?: () => void;
  onToggleActivityBar?: () => void;
}

export const useFocusManagement = (options: FocusManagementOptions = {}) => {
  const [currentFocus, setCurrentFocus] = useState<FocusableElement>('editor');
  const [isTabNavigating, setIsTabNavigating] = useState(false);

  // Refs to track element references
  const elementRefs = useRef<Map<FocusableElement, HTMLElement | null>>(new Map());

  // Define the tab order
  const tabOrder: FocusableElement[] = [
    'activity-bar',
    'sidebar-buttons',
    'sidebar-search',
    'sidebar-tree',
    'editor'
  ];

  // Register an element for focus management
  const registerElement = useCallback((element: FocusableElement, ref: HTMLElement | null) => {
    elementRefs.current.set(element, ref);
  }, []);

  // Focus a specific element
  const focusElement = useCallback((element: FocusableElement, byTab: boolean = false, autoShow: boolean = true) => {
    // Ensure the element is visible before focusing (only if autoShow is true)
    if (autoShow && !byTab) {
      // Only auto-show when using dedicated hotkeys, not tab navigation or clicks
      if ((element === 'sidebar-buttons' || element === 'sidebar-search' || element === 'sidebar-tree') && options.onToggleSidebar) {
        // Show sidebar if focusing any sidebar element
        options.onToggleSidebar();
      } else if (element === 'activity-bar' && options.onToggleActivityBar) {
        // Show activity bar if focusing it
        options.onToggleActivityBar();
      }
    }

    const targetElement = elementRefs.current.get(element);
    if (targetElement) {
      // Add visual focus indicator immediately
      setCurrentFocus(element);
      setIsTabNavigating(byTab);

      // Focus the element immediately
      requestAnimationFrame(() => {
        if (targetElement.focus) {
          targetElement.focus();
        }
      });

      // Call the focus change callback
      options.onFocusChange?.(element);

      // Remove tab navigation flag immediately after next frame
      if (byTab) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setIsTabNavigating(false));
        });
      }
    }
  }, [options]);

  // Set focus from mouse click (no auto-show, no DOM focus)
  const setFocusFromClick = useCallback((element: FocusableElement) => {
    // Update visual focus indicator
    setCurrentFocus(element);
    setIsTabNavigating(false);

    // Call the focus change callback
    options.onFocusChange?.(element);
  }, [options]);

  // Navigate to next/previous element in tab order
  const navigateTab = useCallback((direction: 'forward' | 'backward') => {
    const currentIndex = tabOrder.indexOf(currentFocus);
    let nextIndex: number;

    if (direction === 'forward') {
      nextIndex = (currentIndex + 1) % tabOrder.length;
    } else {
      nextIndex = currentIndex === 0 ? tabOrder.length - 1 : currentIndex - 1;
    }

    const nextElement = tabOrder[nextIndex];

    if (!nextElement) return;

    // Skip elements that aren't registered (collapsed/hidden)
    const targetElement = elementRefs.current.get(nextElement);

    if (targetElement && targetElement.offsetParent !== null) {
      focusElement(nextElement, true);
    } else {
      // Skip to next available element
      const skippedCurrent = currentFocus;
      setCurrentFocus(nextElement);
      if (nextElement !== skippedCurrent) {
        navigateTab(direction);
      }
    }
  }, [currentFocus, focusElement]);

  // Handle global keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Tab navigation (including Shift+Tab which shows as "Unidentified")
      if (e.key === 'Tab' || (e.key === 'Unidentified' && e.shiftKey)) {
        e.preventDefault();
        e.stopPropagation();
        navigateTab(e.shiftKey ? 'backward' : 'forward');
        return;
      }

      // Handle dedicated hotkeys
      if (e.ctrlKey && e.shiftKey) {
        switch (e.key) {
          case 'E':
            e.preventDefault();
            focusElement('sidebar-tree');
            break;
          case 'P':
            e.preventDefault();
            focusElement('sidebar-search');
            break;
          case 'A':
            e.preventDefault();
            focusElement('activity-bar');
            break;
          case 'M':
            e.preventDefault();
            focusElement('editor');
            break;
        }
      }

      // Handle Escape to focus editor (common pattern)
      if (e.key === 'Escape' && currentFocus !== 'editor') {
        focusElement('editor');
      }
    };

    // Main handler with capture phase for priority
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [navigateTab, focusElement, currentFocus]);

  // Helper to check if an element is currently focused
  const isFocused = useCallback((element: FocusableElement) => {
    return currentFocus === element;
  }, [currentFocus]);

  // Get focus indicator classes
  const getFocusClasses = useCallback((element: FocusableElement) => {
    const isCurrent = currentFocus === element;
    return {
      'focus-managed': true,
      'focus-current': isCurrent,
      'focus-tab-navigating': isCurrent && isTabNavigating,
    };
  }, [currentFocus, isTabNavigating]);

  return {
    currentFocus,
    isTabNavigating,
    registerElement,
    focusElement,
    setFocusFromClick,
    navigateTab,
    isFocused,
    getFocusClasses,
  };
};