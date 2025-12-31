import { useEffect } from "react";
import { useConfig } from "./use-config";

/**
 * Theme hook - VS Code style implementation
 *
 * Source of truth: config.json (theme field)
 * localStorage: Used only as a hint for flash prevention on initial load
 *
 * Flow:
 * 1. index.html reads localStorage hint to set initial .dark class (prevents flash)
 * 2. React loads, useConfig reads config.json
 * 3. useTheme applies config theme and syncs localStorage hint
 * 4. Toggle writes to config.json via updateConfig
 * 5. File watcher triggers reload, UI updates
 */
export function useTheme() {
	const { config, loading, updateConfig } = useConfig();

	// Derive darkMode from config (source of truth)
	const darkMode = config?.theme !== "light";

	// Apply theme class and sync localStorage hint whenever config changes
	useEffect(() => {
		if (loading) return;

		const isDark = config?.theme !== "light";

		// Sync localStorage hint for flash prevention on next load
		localStorage.setItem("darkMode", JSON.stringify(isDark));

		// Apply theme class
		if (isDark) {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
	}, [config?.theme, loading]);

	const toggleDarkMode = async () => {
		const newTheme = darkMode ? "light" : "dark";
		// Write to config file - file watcher will trigger reload
		await updateConfig({ theme: newTheme });
	};

	return {
		darkMode,
		toggleDarkMode,
	};
}
