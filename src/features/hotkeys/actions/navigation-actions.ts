/**
 * Focus the main editor
 */
export async function focusEditor(): Promise<void> {
	if (typeof window !== 'undefined') {
		// Try to find editor element by data attribute or class
		const editorElement =
			document.querySelector('[data-editor="true"]') ||
			document.querySelector('.ProseMirror') ||
			document.querySelector('[contenteditable="true"]') ||
			document.querySelector('textarea[data-editor]');

		if (editorElement && typeof (editorElement as HTMLElement).focus === 'function') {
			(editorElement as HTMLElement).focus();
		} else {
			// Emit custom event for components to handle
			const event = new CustomEvent('hotkey-focus-editor', {
				detail: { timestamp: Date.now() },
			});
			window.dispatchEvent(event);
		}
	}
}

/**
 * Focus the sidebar
 */
export async function focusSidebar(): Promise<void> {
	if (typeof window !== 'undefined') {
		// Try to find sidebar element
		const sidebarElement =
			document.querySelector('[data-sidebar="true"]') ||
			document.querySelector('.sidebar') ||
			document.querySelector('[role="complementary"]');

		if (sidebarElement) {
			// Try to focus first focusable element in sidebar
			const focusableElement = sidebarElement.querySelector('button, input, [tabindex="0"], [tabindex="-1"]');
			if (focusableElement && typeof (focusableElement as HTMLElement).focus === 'function') {
				(focusableElement as HTMLElement).focus();
			} else if (typeof (sidebarElement as HTMLElement).focus === 'function') {
				(sidebarElement as HTMLElement).focus();
			}
		} else {
			// Emit custom event for components to handle
			const event = new CustomEvent('hotkey-focus-sidebar', {
				detail: { timestamp: Date.now() },
			});
			window.dispatchEvent(event);
		}
	}
}

/**
 * Focus the activity bar
 */
export async function focusActivityBar(): Promise<void> {
	if (typeof window !== 'undefined') {
		// Try to find activity bar element
		const activityBarElement =
			document.querySelector('[data-activity-bar="true"]') ||
			document.querySelector('.activity-bar') ||
			document.querySelector('[role="toolbar"]');

		if (activityBarElement) {
			// Try to focus first button in activity bar
			const focusableElement = activityBarElement.querySelector('button, [tabindex="0"]');
			if (focusableElement && typeof (focusableElement as HTMLElement).focus === 'function') {
				(focusableElement as HTMLElement).focus();
			} else if (typeof (activityBarElement as HTMLElement).focus === 'function') {
				(activityBarElement as HTMLElement).focus();
			}
		} else {
			// Emit custom event for components to handle
			const event = new CustomEvent('hotkey-focus-activity-bar', {
				detail: { timestamp: Date.now() },
			});
			window.dispatchEvent(event);
		}
	}
}
