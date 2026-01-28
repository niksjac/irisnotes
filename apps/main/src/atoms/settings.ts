/**
 * Settings Atoms with SQLite Persistence
 *
 * These atoms provide reactive state management with automatic persistence
 * to SQLite. Uses localStorage as a fast cache, with async sync to SQLite.
 */

import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import {
	getSetting,
	setSetting,
	getMultipleSettings,
	setMultipleSettings,
} from "@/storage/settings";
import {
	DEFAULT_EDITOR_SETTINGS,
	type EditorSettings,
} from "@/types/editor-settings";

// ============ Atom Factory ============

/**
 * Create an atom that persists to both localStorage (fast) and SQLite (durable)
 * - Reads from localStorage first for instant load
 * - Syncs from SQLite on mount to ensure consistency
 * - Writes to both localStorage and SQLite on updates
 *
 * @param key - Storage key (used in both localStorage and SQLite)
 * @param defaultValue - Default value if nothing stored
 */
export function atomWithPersistence<T>(key: string, defaultValue: T) {
	// Base atom with localStorage for instant hydration
	const baseAtom = atomWithStorage<T>(`setting:${key}`, defaultValue);

	// Track if we've synced from SQLite
	const syncedAtom = atom(false);

	// Derived atom that handles SQLite sync
	const persistedAtom = atom(
		(get) => get(baseAtom),
		async (get, set, update: T | ((prev: T) => T)) => {
			const currentValue = get(baseAtom);
			const newValue =
				typeof update === "function"
					? (update as (prev: T) => T)(currentValue)
					: update;

			// Update localStorage immediately via base atom
			set(baseAtom, newValue);

			// Sync to SQLite asynchronously
			try {
				await setSetting(key, newValue);
			} catch (error) {
				console.error(`Failed to persist setting ${key}:`, error);
			}
		},
	);

	// Initialization atom - loads from SQLite once
	const initializedAtom = atom(
		(get) => {
			const synced = get(syncedAtom);
			return { value: get(baseAtom), synced };
		},
		async (get, set) => {
			if (get(syncedAtom)) return; // Already synced

			try {
				const dbValue = await getSetting(key, defaultValue);
				set(baseAtom, dbValue);
				set(syncedAtom, true);
			} catch (error) {
				console.error(`Failed to load setting ${key} from SQLite:`, error);
				set(syncedAtom, true); // Mark as synced to prevent retry
			}
		},
	);

	return {
		valueAtom: persistedAtom,
		initAtom: initializedAtom,
	};
}

// ============ Theme Settings ============

export type ThemeMode = "dark" | "light" | "system";

const themeStorage = atomWithPersistence<ThemeMode>("theme", "dark");
export const themeAtom = themeStorage.valueAtom;
export const themeInitAtom = themeStorage.initAtom;

// ============ Editor Settings ============

const editorStorage = atomWithPersistence<EditorSettings>(
	"editor",
	DEFAULT_EDITOR_SETTINGS,
);
export const editorSettingsAtom = editorStorage.valueAtom;
export const editorSettingsInitAtom = editorStorage.initAtom;

// ============ Layout Settings ============

export interface LayoutSettings {
	sidebarWidth: number;
	sidebarCollapsed: boolean;
	activityBarVisible: boolean;
}

const DEFAULT_LAYOUT_SETTINGS: LayoutSettings = {
	sidebarWidth: 300,
	sidebarCollapsed: false,
	activityBarVisible: true,
};

const layoutStorage = atomWithPersistence<LayoutSettings>(
	"layout",
	DEFAULT_LAYOUT_SETTINGS,
);
export const layoutSettingsAtom = layoutStorage.valueAtom;
export const layoutSettingsInitAtom = layoutStorage.initAtom;

// ============ Bulk Operations ============

/**
 * Load all settings from SQLite at once (efficient startup)
 */
export async function loadAllSettings(): Promise<{
	theme: ThemeMode;
	editor: EditorSettings;
	layout: LayoutSettings;
}> {
	const defaults = {
		theme: "dark" as ThemeMode,
		editor: DEFAULT_EDITOR_SETTINGS,
		layout: DEFAULT_LAYOUT_SETTINGS,
	};

	return getMultipleSettings(defaults);
}

/**
 * Save all settings to SQLite at once
 */
export async function saveAllSettings(settings: {
	theme?: ThemeMode;
	editor?: EditorSettings;
	layout?: LayoutSettings;
}): Promise<void> {
	await setMultipleSettings(settings);
}
