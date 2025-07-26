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
	sidebarCollapsed?: boolean;
	activityBarVisible?: boolean;
}

export const useFocusManagement = (options: FocusManagementOptions = {}) => {
	const [currentFocus, setCurrentFocus] = useState<FocusableElement>('editor');
	const [isTabNavigating, setIsTabNavigating] = useState(false);

	// Refs to track element references
	const elementRefs = useRef<Map<FocusableElement, HTMLElement | null>>(
		new Map()
	);

	// Check if an element is visible and should be focusable
	const isElementVisible = useCallback(
		(element: FocusableElement): boolean => {
			const targetElement = elementRefs.current.get(element);
			if (!targetElement) return false;

			// Check if element exists in DOM and is visible
			if (targetElement.offsetParent === null) return false;

			// Special checks for sidebar elements
			if (
				element === 'sidebar-buttons' ||
				element === 'sidebar-search' ||
				element === 'sidebar-tree'
			) {
				return !options.sidebarCollapsed;
			}

			// Special check for activity bar
			if (element === 'activity-bar') {
				return options.activityBarVisible !== false;
			}

			return true;
		},
		[options.sidebarCollapsed, options.activityBarVisible]
	);

	// Register an element for focus management
	const registerElement = useCallback(
		(element: FocusableElement, ref: HTMLElement | null) => {
			elementRefs.current.set(element, ref);
		},
		[]
	);

	// Focus a specific element
	const focusElement = useCallback(
		(
			element: FocusableElement,
			byTab: boolean = false,
			autoShow: boolean = true
		) => {
			// Ensure the element is visible before focusing (only if autoShow is true)
			if (autoShow && !byTab) {
				// Only auto-show when using dedicated hotkeys, not tab navigation or clicks
				if (
					(element === 'sidebar-buttons' ||
						element === 'sidebar-search' ||
						element === 'sidebar-tree') &&
					options.onToggleSidebar
				) {
					// Show sidebar if focusing any sidebar element
					options.onToggleSidebar();
				} else if (element === 'activity-bar' && options.onToggleActivityBar) {
					// Show activity bar if focusing it
					options.onToggleActivityBar();
				}
			}

			const targetElement = elementRefs.current.get(element);
			if (targetElement) {
				// Update focus state immediately
				setCurrentFocus(element);
				setIsTabNavigating(byTab);

				// Only focus DOM element for non-editor elements to avoid disrupting editor internals
				if (element !== 'editor') {
					requestAnimationFrame(() => {
						if (targetElement.focus) {
							targetElement.focus();
						}
					});
				}

				// Call the focus change callback
				options.onFocusChange?.(element);

				// Clear tab navigation flag after a short delay
				if (byTab) {
					setTimeout(() => setIsTabNavigating(false), 100);
				}
			}
		},
		[options]
	);

	// Set focus from mouse click (no auto-show, no DOM focus)
	const setFocusFromClick = useCallback(
		(element: FocusableElement) => {
			// Clear any pending tab navigation state
			setIsTabNavigating(false);

			// Update visual focus indicator
			setCurrentFocus(element);

			// Call the focus change callback
			options.onFocusChange?.(element);
		},
		[options]
	);

	// Navigate to next/previous element in tab order
	const navigateTab = useCallback(
		(direction: 'forward' | 'backward') => {
			// Define the tab order inside the callback
			const tabOrder: FocusableElement[] = [
				'activity-bar',
				'sidebar-buttons',
				'sidebar-search',
				'sidebar-tree',
				'editor',
			];

			const currentIndex = tabOrder.indexOf(currentFocus);
			let attempts = 0;
			const maxAttempts = tabOrder.length;

			const findNextFocusableElement = (
				startIndex: number
			): FocusableElement | null => {
				let nextIndex: number;

				if (direction === 'forward') {
					nextIndex = (startIndex + 1) % tabOrder.length;
				} else {
					nextIndex = startIndex === 0 ? tabOrder.length - 1 : startIndex - 1;
				}

				const nextElement = tabOrder[nextIndex];
				attempts++;

				// Prevent infinite loop or invalid index
				if (attempts >= maxAttempts || !nextElement) return null;

				// Check if element is visible and focusable
				if (isElementVisible(nextElement)) {
					return nextElement;
				} else {
					// Skip to next element
					return findNextFocusableElement(nextIndex);
				}
			};

			const nextElement = findNextFocusableElement(currentIndex);
			if (nextElement && nextElement !== currentFocus) {
				focusElement(nextElement, true);
			}
		},
		[currentFocus, focusElement, isElementVisible]
	);

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
	const isFocused = useCallback(
		(element: FocusableElement) => {
			return currentFocus === element;
		},
		[currentFocus]
	);

	// Get focus indicator classes
	const getFocusClasses = useCallback(
		(element: FocusableElement) => {
			const isCurrent = currentFocus === element;
			return {
				'focus-managed': true,
				'focus-current': isCurrent,
				'focus-tab-navigating': isCurrent && isTabNavigating,
			};
		},
		[currentFocus, isTabNavigating]
	);

	return {
		currentFocus,
		isTabNavigating,
		registerElement,
		focusElement,
		setFocusFromClick,
		navigateTab,
		isFocused,
		getFocusClasses,
		isElementVisible,
	};
};
