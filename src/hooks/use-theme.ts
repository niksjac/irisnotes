import { useEffect, useState } from "react";

export function useTheme() {
	const [darkMode, setDarkMode] = useState<boolean>(() => {
		// Check for saved theme preference or default to system preference
		const saved = localStorage.getItem("darkMode");
		if (saved !== null) {
			return JSON.parse(saved);
		}
		// Default to system preference
		return window.matchMedia("(prefers-color-scheme: dark)").matches;
	});

	useEffect(() => {
		// Save preference
		localStorage.setItem("darkMode", JSON.stringify(darkMode));

		// Apply theme
		if (darkMode) {
			document.documentElement.classList.add("dark");
		} else {
			document.documentElement.classList.remove("dark");
		}
	}, [darkMode]);

	const toggleDarkMode = () => {
		setDarkMode(!darkMode);
	};

	return {
		darkMode,
		toggleDarkMode,
	};
}
