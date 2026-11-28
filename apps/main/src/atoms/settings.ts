/**
 * Settings Atoms with SQLite Persistence
 *
 * These atoms provide reactive state management with automatic persistence
 * to SQLite. Uses localStorage as a fast cache, with async sync to SQLite.
 */

import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { getSetting, setSetting } from "@/storage/settings";
import {
	DEFAULT_EDITOR_SETTINGS,
	type EditorSettings,
} from "@/types/editor-settings";

// ============ Background mode ============

/**
 * Keep the app running when its window is closed: closing hides the window,
 * Ctrl+Q quits. Opening a note from the quick launcher is then instant. The
 * backend reads it through `set_keep_running` (see useKeepRunning).
 */
export const keepRunningInBackgroundAtom = atomWithStorage<boolean>("setting:keepRunningInBackground", false);

// ============ Atom Factory ============

/**
 * Create an atom that persists to both localStorage (fast) and SQLite (durable)
 * - Reads from localStorage
 * - Writes to both localStorage and SQLite on updates
 * - Reads SQLite only when `initAtom` runs. Nothing calls it yet, so SQLite is
 *   effectively a write-only mirror and imported settings never reach the UI
 *   (see Known issues in docs/guides/configuration.md).
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

// ============ Editor Settings ============

const editorStorage = atomWithPersistence<EditorSettings>(
	"editor",
	DEFAULT_EDITOR_SETTINGS,
);
export const editorSettingsAtom = editorStorage.valueAtom;
export const editorSettingsInitAtom = editorStorage.initAtom;

// ============ Branding Settings ============

export type LogoVariant =
	| "logo-purple"
	| "logo-white"
	| "logo-transparent"
	| "iris-detailed-blue"
	| "iris-detailed-purple"
	| "iris-detailed-periwinkle"
	| "iris-detailed-mono-dark"
	| "iris-detailed-mono-light";

export interface BrandingSettings {
	/** app logo: window title bar and the quick app's tray icon */
	logo: LogoVariant;
	/** earlier name of `logo`, still read from settings saved before the rename */
	activityBarLogo?: LogoVariant;
}

export const LOGO_OPTIONS: { id: LogoVariant; label: string; file: string }[] = [
	{ id: "logo-purple", label: "Purple", file: "/logo-purple.png" },
	{ id: "logo-white", label: "White", file: "/logo-white.png" },
	{ id: "logo-transparent", label: "Transparent SVG", file: "/logo-transparent.svg" },
	{ id: "iris-detailed-blue", label: "Detailed Blue", file: "/iris-detailed-blue.svg" },
	{ id: "iris-detailed-purple", label: "Detailed Purple", file: "/iris-detailed-purple.svg" },
	{ id: "iris-detailed-periwinkle", label: "Detailed Periwinkle", file: "/iris-detailed-periwinkle.svg" },
	{ id: "iris-detailed-mono-dark", label: "Mono Dark", file: "/iris-detailed-mono-dark.svg" },
	{ id: "iris-detailed-mono-light", label: "Mono Light", file: "/iris-detailed-mono-light.svg" },
];

const DEFAULT_BRANDING_SETTINGS: BrandingSettings = {
	logo: "logo-purple",
};

/** The logo option in effect, falling back to the legacy field and then the default */
export function getBrandingLogo(branding: BrandingSettings) {
	const id = branding.logo ?? branding.activityBarLogo;
	return LOGO_OPTIONS.find((o) => o.id === id) ?? LOGO_OPTIONS[0]!;
}

const brandingStorage = atomWithPersistence<BrandingSettings>(
	"branding",
	DEFAULT_BRANDING_SETTINGS,
);
export const brandingSettingsAtom = brandingStorage.valueAtom;
export const brandingSettingsInitAtom = brandingStorage.initAtom;
