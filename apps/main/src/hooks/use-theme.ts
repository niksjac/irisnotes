import { useEffect } from "react";
import { useConfig } from "./use-config";
import { type ThemeName, getTheme, DEFAULT_THEME } from "@/config/themes";

/**
 * Theme hook — VS Code-grade instant switching
 *
 * How it's fast:
 *   1. `document.documentElement.setAttribute("data-theme", name)`
 *      → browser sees ONE element ("html") with a changed attribute.
 *      → triggers a single O(1) selector re-match + style-recalc for the root.
 *      → all descendant var() references resolve lazily at paint time (zero loop).
 *   2. `.dark` class toggle for Tailwind `dark:` variants.
 *   3. `color-scheme` CSS property → browser instantly switches native controls.
 *   4. All three happen synchronously BEFORE the async config persist, so the
 *      visual update lands on the very next animation frame.
 *
 * The useEffect below only runs on initial config load and external file changes
 * (config file watcher). It is a no-op on user-triggered toggles because the
 * DOM is already updated synchronously above.
 */

export function applyThemeToDOM(themeName: ThemeName) {
	const def = getTheme(themeName);
	const root = document.documentElement;
	root.setAttribute("data-theme", themeName);
	root.classList.toggle("dark", def.isDark);
	root.style.colorScheme = def.isDark ? "dark" : "light";
	localStorage.setItem("theme", themeName);
}

export function useTheme() {
	const { config, loading, updateConfig } = useConfig();

	const themeName: ThemeName = (config?.theme as ThemeName) ?? DEFAULT_THEME;
	const themeDefinition = getTheme(themeName);
	const darkMode = themeDefinition.isDark;

	// Initialization / external-change guard
	useEffect(() => {
		if (loading) return;
		applyThemeToDOM((config?.theme as ThemeName) ?? DEFAULT_THEME);
	}, [config?.theme, loading]);

	const setTheme = async (name: ThemeName) => {
		// Synchronous DOM update — visible this frame
		applyThemeToDOM(name);
		// Persist asynchronously
		await updateConfig({ theme: name });
	};

	// Convenience alias used by activity bar (old dark/light toggle keeps working)
	const toggleDarkMode = async () => {
		const nextTheme: ThemeName = darkMode ? "default-light" : "default-dark";
		await setTheme(nextTheme);
	};

	return {
		darkMode,
		toggleDarkMode,
		themeName,
		themeDefinition,
		setTheme,
	};
}
