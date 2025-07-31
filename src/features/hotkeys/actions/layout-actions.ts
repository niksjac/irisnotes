import { getDefaultStore } from 'jotai';
import {
	activityBarVisibleAtom,
	fontSizeAtom,
	isDualPaneModeAtom,
	isWrappingAtom,
	sidebarCollapsedAtom,
} from '../../../atoms';

const store = getDefaultStore();

/**
 * Toggle sidebar visibility
 */
export async function toggleSidebar(): Promise<void> {
	const currentValue = store.get(sidebarCollapsedAtom);
	store.set(sidebarCollapsedAtom, !currentValue);
}

/**
 * Toggle activity bar visibility
 */
export async function toggleActivityBar(): Promise<void> {
	const currentValue = store.get(activityBarVisibleAtom);
	store.set(activityBarVisibleAtom, !currentValue);
}

/**
 * Toggle dual pane mode
 */
export async function toggleDualPane(): Promise<void> {
	const currentValue = store.get(isDualPaneModeAtom);
	store.set(isDualPaneModeAtom, !currentValue);
}

/**
 * Reload current note
 */
export async function reloadNote(): Promise<void> {
	// Emit a custom event that can be listened to by the editor
	if (typeof window !== 'undefined') {
		const event = new CustomEvent('hotkey-reload-note', {
			detail: { timestamp: Date.now() },
		});
		window.dispatchEvent(event);
	}
}

/**
 * Toggle line wrapping in editor
 */
export async function toggleLineWrapping(): Promise<void> {
	const currentValue = store.get(isWrappingAtom);
	store.set(isWrappingAtom, !currentValue);
}

/**
 * Increase editor font size
 */
export async function increaseFontSize(): Promise<void> {
	const currentSize = store.get(fontSizeAtom);
	const newSize = Math.min(currentSize + 1, 32); // Max size of 32px
	store.set(fontSizeAtom, newSize);
}

/**
 * Decrease editor font size
 */
export async function decreaseFontSize(): Promise<void> {
	const currentSize = store.get(fontSizeAtom);
	const newSize = Math.max(currentSize - 1, 8); // Min size of 8px
	store.set(fontSizeAtom, newSize);
}
