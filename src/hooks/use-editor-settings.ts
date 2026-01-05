/**
 * useEditorSettings Hook
 *
 * Manages editor appearance settings with automatic CSS custom property updates.
 * Settings are persisted to SQLite and cached in localStorage for fast startup.
 */

import { useEffect, useCallback, useMemo } from "react";
import { useAtom } from "jotai";
import { editorSettingsAtom } from "@/atoms/settings";
import {
	applyEditorSettings,
	DEFAULT_EDITOR_SETTINGS,
	EDITOR_SETTINGS_CONSTRAINTS,
	type EditorSettings,
	type EditorFontFamily,
} from "@/types/editor-settings";

/**
 * Hook return type
 */
export interface UseEditorSettingsReturn {
	/** Current settings */
	settings: EditorSettings;

	/** Update entire settings object */
	setSettings: (settings: EditorSettings) => void;

	/** Update a single setting */
	updateSetting: <K extends keyof EditorSettings>(
		key: K,
		value: EditorSettings[K],
	) => void;

	/** Reset all settings to defaults */
	resetSettings: () => void;

	/** Setting constraints for UI controls */
	constraints: typeof EDITOR_SETTINGS_CONSTRAINTS;
}

/**
 * Hook to manage editor appearance settings
 *
 * Automatically:
 * - Loads settings from SQLite on mount (via atom)
 * - Applies settings to CSS custom properties
 * - Persists changes to SQLite
 * - Caches in localStorage for fast startup
 */
export function useEditorSettings(): UseEditorSettingsReturn {
	const [settings, setSettings] = useAtom(editorSettingsAtom);

	// Apply settings to CSS custom properties whenever they change
	useEffect(() => {
		// Handle both promise and direct value (jotai async atoms can return either)
		if (settings && typeof settings === "object") {
			applyEditorSettings(settings as EditorSettings);
		}
	}, [settings]);

	// Update a single setting
	const updateSetting = useCallback(
		<K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) => {
			setSettings((prev) => {
				const current = prev || DEFAULT_EDITOR_SETTINGS;
				return { ...current, [key]: value };
			});
		},
		[setSettings],
	);

	// Reset to defaults
	const resetSettings = useCallback(() => {
		setSettings(DEFAULT_EDITOR_SETTINGS);
	}, [setSettings]);

	// Memoize return object
	return useMemo(
		() => ({
			settings: (settings as EditorSettings) || DEFAULT_EDITOR_SETTINGS,
			setSettings,
			updateSetting,
			resetSettings,
			constraints: EDITOR_SETTINGS_CONSTRAINTS,
		}),
		[settings, setSettings, updateSetting, resetSettings],
	);
}

// ============ Individual Setting Hooks ============

/**
 * Hook for just the font size setting
 */
export function useEditorFontSize(): [number, (size: number) => void] {
	const { settings, updateSetting } = useEditorSettings();

	const setFontSize = useCallback(
		(size: number) => {
			const { min, max } = EDITOR_SETTINGS_CONSTRAINTS.fontSize;
			const clamped = Math.max(min, Math.min(max, size));
			updateSetting("fontSize", clamped);
		},
		[updateSetting],
	);

	return [settings.fontSize, setFontSize];
}

/**
 * Hook for just the font family setting
 */
export function useEditorFontFamily(): [
	EditorFontFamily,
	(family: EditorFontFamily) => void,
] {
	const { settings, updateSetting } = useEditorSettings();

	const setFontFamily = useCallback(
		(family: EditorFontFamily) => {
			updateSetting("fontFamily", family);
		},
		[updateSetting],
	);

	return [settings.fontFamily, setFontFamily];
}

/**
 * Hook for just the line height setting
 */
export function useEditorLineHeight(): [number, (height: number) => void] {
	const { settings, updateSetting } = useEditorSettings();

	const setLineHeight = useCallback(
		(height: number) => {
			const { min, max } = EDITOR_SETTINGS_CONSTRAINTS.lineHeight;
			const clamped = Math.max(min, Math.min(max, height));
			updateSetting("lineHeight", clamped);
		},
		[updateSetting],
	);

	return [settings.lineHeight, setLineHeight];
}

/**
 * Hook for just the line wrapping setting
 */
export function useEditorLineWrapping(): [boolean, (wrap: boolean) => void] {
	const { settings, updateSetting } = useEditorSettings();

	const setLineWrapping = useCallback(
		(wrap: boolean) => {
			updateSetting("lineWrapping", wrap);
		},
		[updateSetting],
	);

	return [settings.lineWrapping, setLineWrapping];
}
